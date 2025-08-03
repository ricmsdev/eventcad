import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Download,
  Share2,
  Trash2,
  Eye,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileIcon,
  ExternalLink,
  Copy,
  Calendar,
  HardDrive,
  Tag,
  AlertTriangle,
  CheckCircle,
  Link as LinkIcon
} from 'lucide-react';
import { apiService } from '@/services/api';
import { FileType } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { LucideIcon } from 'lucide-react';

const fileTypeIcons = {
  [FileType.DOCUMENT]: FileText,
  [FileType.IMAGE]: FileImage,
  [FileType.SPREADSHEET]: FileSpreadsheet,
  [FileType.PDF]: FileText,
  [FileType.CAD]: FileIcon,
  [FileType.DWG]: FileIcon,
  [FileType.OTHER]: FileIcon
} as const;

const fileTypeLabels = {
  [FileType.DOCUMENT]: 'Documento',
  [FileType.IMAGE]: 'Imagem',
  [FileType.SPREADSHEET]: 'Planilha',
  [FileType.PDF]: 'PDF',
  [FileType.CAD]: 'CAD',
  [FileType.DWG]: 'DWG',
  [FileType.OTHER]: 'Outro'
} as const;

const entityTypeLabels = {
  evento: 'Evento',
  planta: 'Planta',
  infra_object: 'Objeto de Infraestrutura',
  ai_job: 'Job de IA',
  user: 'Usuário'
} as const;

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FileDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');

  const { data: file, isLoading, error } = useQuery({
    queryKey: ['file', id],
    queryFn: () => apiService.getFile(id!),
    enabled: !!id
  });

  const { data: downloadUrl } = useQuery({
    queryKey: ['file-download-url', id],
    queryFn: () => apiService.getDownloadUrl(id!),
    enabled: !!id
  });

  const deleteFileMutation = useMutation({
    mutationFn: () => apiService.deleteFile(id!),
    onSuccess: () => {
      toast.success('Arquivo excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['files'] });
      navigate('/files');
    },
    onError: () => {
      toast.error('Erro ao excluir arquivo');
    }
  });

  const shareFileMutation = useMutation({
    mutationFn: (shareData: any) => apiService.shareFile(id!, shareData),
    onSuccess: (response) => {
      setShareLink(response.data.shareUrl);
      setShowShareModal(true);
      toast.success('Link de compartilhamento gerado!');
    },
    onError: () => {
      toast.error('Erro ao gerar link de compartilhamento');
    }
  });

  const handleDelete = () => {
    deleteFileMutation.mutate();
    setShowDeleteModal(false);
  };

  const handleDownload = async () => {
    try {
      if (downloadUrl?.data?.url) {
        window.open(downloadUrl.data.url, '_blank');
      } else {
        const response = await apiService.downloadFile(id!);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file?.data?.filename || 'arquivo');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao baixar arquivo');
    }
  };

  const handleShare = () => {
    shareFileMutation.mutate({
      expiresIn: 7 * 24 * 60 * 60 * 1000, // 7 dias
      allowDownload: true
    });
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Link copiado para a área de transferência!');
  };

  const getFileIcon = (): LucideIcon => {
    if (!file?.data?.fileType) return FileIcon;
    return fileTypeIcons[file.data.fileType] || FileIcon;
  };

  const FileIcon: LucideIcon = getFileIcon();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !file?.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Arquivo não encontrado</h3>
          <p className="text-gray-600 mb-4">O arquivo solicitado não existe ou foi removido.</p>
          <Link to="/files" className="btn-primary">
            Voltar para Arquivos
          </Link>
        </div>
      </div>
    );
  }

  const fileData = file.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/files"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{fileData.filename}</h1>
            <p className="text-gray-600">Detalhes do arquivo</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Download
          </button>

          <button
            onClick={handleShare}
            disabled={shareFileMutation.isPending}
            className="flex items-center gap-2 px-3 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Compartilhar
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview/Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview do Arquivo */}
          <div className="card-eventcad">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visualização
            </h3>

            <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center">
              {fileData.fileType === FileType.IMAGE ? (
                fileData.thumbnail ? (
                  <img
                    src={fileData.thumbnail}
                    alt={fileData.originalName}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <FileImage className="mx-auto h-16 w-16 text-gray-400 mb-2" />
                    <p className="text-gray-500">Prévia não disponível</p>
                  </div>
                )
              ) : (
                <div className="text-center">
                  <FileIcon className="mx-auto h-16 w-16 text-gray-400 mb-2" />
                  <p className="text-gray-500">
                    {fileTypeLabels[fileData.fileType || FileType.OTHER]} - {formatFileSize(fileData.size)}
                  </p>
                  <button
                    onClick={handleDownload}
                    className="mt-3 flex items-center gap-2 mx-auto px-4 py-2 text-sm bg-eventcad-600 text-white rounded-lg hover:bg-eventcad-700"
                  >
                    <Download className="h-4 w-4" />
                    Baixar para Visualizar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Informações Detalhadas */}
          <div className="card-eventcad">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações Detalhadas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nome do Arquivo</label>
                <p className="text-gray-900">{fileData.filename}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Tipo</label>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {fileTypeLabels[fileData.fileType || FileType.OTHER]}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Tamanho</label>
                <p className="text-gray-900">{formatFileSize(fileData.size)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">MIME Type</label>
                <p className="text-gray-900 font-mono text-sm">{fileData.mimetype || 'N/A'}</p>
              </div>

              {fileData.description && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Descrição</label>
                  <p className="text-gray-900">{fileData.description}</p>
                </div>
              )}

              {fileData.tags && fileData.tags.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {fileData.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-eventcad-100 text-eventcad-800">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ações Rápidas */}
          <div className="card-eventcad">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Ações Rápidas
            </h4>

            <div className="space-y-2">
              <button
                onClick={handleDownload}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                Baixar Arquivo
              </button>

              <button
                onClick={handleShare}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Gerar Link de Compartilhamento
              </button>

              {downloadUrl?.data?.url && (
                <a
                  href={downloadUrl.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir em Nova Aba
                </a>
              )}
            </div>
          </div>

          {/* Informações da Entidade */}
          {fileData.entityType && fileData.entityId && (
            <div className="card-eventcad">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-purple-500" />
                Entidade Associada
              </h4>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Tipo:</span>
                  <span className="ml-2 text-gray-900">
                    {entityTypeLabels[fileData.entityType as keyof typeof entityTypeLabels] || fileData.entityType}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">ID:</span>
                  <span className="ml-2 text-gray-900 font-mono text-xs">{fileData.entityId}</span>
                </div>
                
                <Link
                  to={`/${fileData.entityType}s/${fileData.entityId}`}
                  className="text-eventcad-600 hover:text-eventcad-700 text-xs inline-flex items-center gap-1"
                >
                  Ver detalhes da entidade
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Metadados */}
          <div className="card-eventcad">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              Metadados
            </h4>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">ID do Arquivo:</span>
                <span className="ml-2 text-gray-900 font-mono text-xs">{fileData.id}</span>
              </div>
              
              <div>
                <span className="text-gray-500">Criado em:</span>
                <span className="ml-2 text-gray-900">
                  {format(new Date(fileData.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              
              <div>
                <span className="text-gray-500">Atualizado em:</span>
                <span className="ml-2 text-gray-900">
                  {fileData.updatedAt && format(new Date(fileData.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>

              {fileData.uploadedBy && (
                <div>
                  <span className="text-gray-500">Enviado por:</span>
                  <span className="ml-2 text-gray-900">{fileData.uploadedBy}</span>
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas de Uso */}
          <div className="card-eventcad">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-blue-500" />
              Estatísticas
            </h4>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Downloads:</span>
                <span className="text-gray-900">{fileData.downloadCount || 0}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Visualizações:</span>
                <span className="text-gray-900">{fileData.viewCount || 0}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Compartilhamentos:</span>
                <span className="text-gray-900">{fileData.shareCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
                <p className="text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Tem certeza que deseja excluir o arquivo "<strong>{fileData.filename}</strong>"?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteFileMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteFileMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Compartilhamento */}
      {showShareModal && shareLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Share2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Link de Compartilhamento</h3>
                <p className="text-sm text-gray-600">Compartilhe este arquivo com outras pessoas.</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">URL de Compartilhamento</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={copyShareLink}
                  className="px-3 py-2 bg-eventcad-600 text-white rounded-lg hover:bg-eventcad-700 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Fechar
              </button>
              <a
                href={shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-eventcad-600 text-white rounded-lg hover:bg-eventcad-700 transition-colors"
              >
                Abrir Link
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}