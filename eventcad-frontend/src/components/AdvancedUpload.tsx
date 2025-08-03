import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, File, Image, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  preview?: string;
}

interface AdvancedUploadProps {
  onUpload?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
}

const AdvancedUpload: React.FC<AdvancedUploadProps> = ({
  onUpload,
  accept = '.jpg,.jpeg,.png,.pdf,.dwg,.dxf',
  multiple = true,
  maxSize = 50
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image size={24} />;
    if (file.type === 'application/pdf') return <FileText size={24} />;
    return <File size={24} />;
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo: ${maxSize}MB`);
      return false;
    }

    // Check file type
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!acceptedTypes.some(type => 
      type.startsWith('.') ? fileExtension === type : file.type.match(type)
    )) {
      toast.error('Tipo de arquivo não suportado');
      return false;
    }

    return true;
  };

  const processFiles = useCallback((files: FileList) => {
    const validFiles = Array.from(files).filter(validateFile);
    
    if (validFiles.length === 0) return;

    const newUploadFiles: UploadFile[] = validFiles.map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploadFiles(prev => [...prev, ...newUploadFiles]);

    // Simulate upload progress
    newUploadFiles.forEach((uploadFile) => {
      const interval = setInterval(() => {
        setUploadFiles(prev => prev.map(uf => {
          if (uf.id === uploadFile.id) {
            const newProgress = uf.progress + Math.random() * 20;
            if (newProgress >= 100) {
              clearInterval(interval);
              return { ...uf, progress: 100, status: 'success' as const };
            }
            return { ...uf, progress: newProgress };
          }
          return uf;
        }));
      }, 200);

      // Generate preview for images
      if (uploadFile.file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadFiles(prev => prev.map(uf => 
            uf.id === uploadFile.id 
              ? { ...uf, preview: e.target?.result as string }
              : uf
          ));
        };
        reader.readAsDataURL(uploadFile.file);
      }
    });

    onUpload?.(validFiles);
    toast.success(`${validFiles.length} arquivo(s) selecionado(s)`);
  }, [accept, maxSize, onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
  }, [processFiles]);

  const removeFile = useCallback((fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <motion.div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Upload size={48} className="mx-auto text-gray-400" />
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Suporta: {accept} (máx. {maxSize}MB)
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Selecionar Arquivos
          </motion.button>
        </motion.div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />
      </motion.div>

      {/* Upload List */}
      <AnimatePresence>
        {uploadFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-3"
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Arquivos ({uploadFiles.length})
            </h3>
            
            {uploadFiles.map((uploadFile) => (
              <motion.div
                key={uploadFile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                {/* Preview */}
                {uploadFile.preview ? (
                  <img
                    src={uploadFile.preview}
                    alt={uploadFile.file.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    {getFileIcon(uploadFile.file)}
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {/* Progress */}
                <div className="flex items-center space-x-2">
                  {uploadFile.status === 'uploading' && (
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        className="bg-blue-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadFile.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                  {getStatusIcon(uploadFile.status)}
                </div>

                {/* Remove Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeFile(uploadFile.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedUpload; 