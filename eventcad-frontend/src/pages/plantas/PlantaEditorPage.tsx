import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Upload, Layers, Box, Settings, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PlantaViewer from '../../components/PlantaViewer';
import AdvancedUpload from '../../components/AdvancedUpload';
import ThreeDViewer from '../../components/ThreeDViewer';

interface PlantaObject {
  id: string;
  type: 'mesa' | 'cadeira' | 'palco' | 'bar' | 'banheiro' | 'entrada' | 'saida' | 'extintor' | 'custom';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  properties: Record<string, any>;
  isSelected: boolean;
}

interface ThreeDObject {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  color: string;
  geometry: 'box' | 'sphere' | 'cylinder' | 'cone';
}

const PlantaEditorPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [showUpload, setShowUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [plantaUrl, setPlantaUrl] = useState<string>('');
  const [objects, setObjects] = useState<PlantaObject[]>([]);
  const [threeDObjects, setThreeDObjects] = useState<ThreeDObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);

  // Handle file upload
  const handleFileUpload = useCallback((files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      setPlantaUrl(url);
      toast.success('Planta carregada com sucesso!');
      setShowUpload(false);
    }
  }, []);

  // Handle object operations
  const handleObjectAdd = useCallback((object: PlantaObject) => {
    setObjects(prev => [...prev, object]);
    
    // Also add to 3D objects
    const threeDObject: ThreeDObject = {
      id: object.id,
      type: object.type,
      position: { x: object.x / 100, y: object.y / 100, z: 0 },
      rotation: { x: 0, y: 0, z: object.rotation },
      scale: { x: object.width / 50, y: object.height / 50, z: 1 },
      color: '#3b82f6',
      geometry: 'box'
    };
    setThreeDObjects(prev => [...prev, threeDObject]);
  }, []);

  const handleObjectUpdate = useCallback((object: PlantaObject) => {
    setObjects(prev => prev.map(obj => obj.id === object.id ? object : obj));
    
    // Update 3D object
    setThreeDObjects(prev => prev.map(obj => 
      obj.id === object.id 
        ? {
            ...obj,
            position: { x: object.x / 100, y: object.y / 100, z: 0 },
            rotation: { x: 0, y: 0, z: object.rotation },
            scale: { x: object.width / 50, y: object.height / 50, z: 1 }
          }
        : obj
    ));
  }, []);

  const handleObjectDelete = useCallback((objectId: string) => {
    setObjects(prev => prev.filter(obj => obj.id !== objectId));
    setThreeDObjects(prev => prev.filter(obj => obj.id !== objectId));
  }, []);

  const handleSave = useCallback((objects: PlantaObject[]) => {
    // Save to backend
    console.log('Saving objects:', objects);
    toast.success('Planta salva com sucesso!');
  }, []);

  // Handle 3D object selection
  const handleThreeDObjectSelect = useCallback((objectId: string) => {
    setSelectedObject(objectId);
  }, []);

  // Handle 3D object update
  const handleThreeDObjectUpdate = useCallback((object: ThreeDObject) => {
    setThreeDObjects(prev => prev.map(obj => obj.id === object.id ? object : obj));
    
    // Update 2D object
    setObjects(prev => prev.map(obj => 
      obj.id === object.id 
        ? {
            ...obj,
            x: object.position.x * 100,
            y: object.position.y * 100,
            rotation: object.rotation.z,
            width: object.scale.x * 50,
            height: object.scale.y * 50
          }
        : obj
    ));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                EventCAD+ Planta Editor
              </h1>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('2d')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    viewMode === '2d' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Layers className="inline mr-2" size={16} />
                  2D
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('3d')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    viewMode === '3d' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Box className="inline mr-2" size={16} />
                  3D
                </motion.button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUpload(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium"
              >
                <Upload className="inline mr-2" size={16} />
                Upload Planta
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
              >
                <Settings className="inline mr-2" size={16} />
                Configurações
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSave(objects)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
              >
                <Save className="inline mr-2" size={16} />
                Salvar
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-4">
          <div className="space-y-6">
            {/* Object Library */}
            <div>
              <h3 className="text-lg font-medium mb-4">Biblioteca de Objetos</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'mesa', label: 'Mesa', icon: '🍽️', color: '#ef4444' },
                  { type: 'cadeira', label: 'Cadeira', icon: '🪑', color: '#f59e0b' },
                  { type: 'palco', label: 'Palco', icon: '🎭', color: '#10b981' },
                  { type: 'bar', label: 'Bar', icon: '🍸', color: '#3b82f6' },
                  { type: 'banheiro', label: 'Banheiro', icon: '🚻', color: '#8b5cf6' },
                  { type: 'entrada', label: 'Entrada', icon: '🚪', color: '#06b6d4' },
                  { type: 'saida', label: 'Saída', icon: '🚪', color: '#84cc16' },
                  { type: 'extintor', label: 'Extintor', icon: '🧯', color: '#f97316' },
                ].map(({ type, label, icon }) => (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const newObject: PlantaObject = {
                        id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        type: type as PlantaObject['type'],
                        x: Math.random() * 400 + 100,
                        y: Math.random() * 300 + 100,
                        width: 50,
                        height: 50,
                        rotation: 0,
                        properties: {},
                        isSelected: false
                      };
                      handleObjectAdd(newObject);
                    }}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-center transition-colors"
                  >
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-xs text-gray-300">{label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Object Properties */}
            {selectedObject && (
              <div>
                <h3 className="text-lg font-medium mb-4">Propriedades</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      value={objects.find(obj => obj.id === selectedObject)?.type || ''}
                      readOnly
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">X</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        value={objects.find(obj => obj.id === selectedObject)?.x || 0}
                        onChange={(e) => {
                          const object = objects.find(obj => obj.id === selectedObject);
                          if (object) {
                            handleObjectUpdate({ ...object, x: parseFloat(e.target.value) });
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Y</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        value={objects.find(obj => obj.id === selectedObject)?.y || 0}
                        onChange={(e) => {
                          const object = objects.find(obj => obj.id === selectedObject);
                          if (object) {
                            handleObjectUpdate({ ...object, y: parseFloat(e.target.value) });
                          }
                        }}
                      />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      handleObjectDelete(selectedObject);
                      setSelectedObject(null);
                    }}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium"
                  >
                    <Trash2 className="inline mr-2" size={16} />
                    Remover
                  </motion.button>
                </div>
              </div>
            )}

            {/* Statistics */}
            <div>
              <h3 className="text-lg font-medium mb-4">Estatísticas</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Objetos:</span>
                  <span className="font-medium">{objects.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Modo:</span>
                  <span className="font-medium">{viewMode.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Planta:</span>
                  <span className="font-medium">{plantaUrl ? 'Carregada' : 'Não carregada'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Viewer */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            {viewMode === '2d' ? (
              <motion.div
                key="2d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <PlantaViewer
                  plantaUrl={plantaUrl}
                  onObjectAdd={handleObjectAdd}
                  onObjectUpdate={handleObjectUpdate}
                  onObjectDelete={handleObjectDelete}
                  onSave={handleSave}
                />
              </motion.div>
            ) : (
              <motion.div
                key="3d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <ThreeDViewer
                  objects={threeDObjects}
                  onObjectSelect={handleThreeDObjectSelect}
                  onObjectUpdate={handleThreeDObjectUpdate}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Upload de Planta</h2>
              <AdvancedUpload
                onUpload={handleFileUpload}
                accept=".jpg,.jpeg,.png,.pdf,.dwg,.dxf"
                multiple={false}
                maxSize={50}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Configurações</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tema</label>
                  <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                    <option>Escuro</option>
                    <option>Claro</option>
                    <option>Automático</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Idioma</label>
                  <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                    <option>Português</option>
                    <option>English</option>
                    <option>Español</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Unidade</label>
                  <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                    <option>Metros</option>
                    <option>Pés</option>
                    <option>Polegadas</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlantaEditorPage; 