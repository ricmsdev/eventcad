import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw, Download, Upload, Layers, Box, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

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

interface PlantaViewerProps {
  plantaUrl?: string;
  onObjectAdd?: (object: PlantaObject) => void;
  onObjectUpdate?: (object: PlantaObject) => void;
  onObjectDelete?: (objectId: string) => void;
  onSave?: (objects: PlantaObject[]) => void;
}

const PlantaViewer: React.FC<PlantaViewerProps> = ({
  plantaUrl,
  onObjectAdd,
  onObjectUpdate,
  onSave
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  // const [selectedObject] = useState<string | null>(null);
  const [objects, setObjects] = useState<PlantaObject[]>([]);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [showGrid, setShowGrid] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Pan controls
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true);
      dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && dragRef.current) {
      setPan({
        x: e.clientX - dragRef.current.x,
        y: e.clientY - dragRef.current.y
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

  // Object management
  const addObject = useCallback((type: PlantaObject['type'], x: number, y: number) => {
    const newObject: PlantaObject = {
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      x: (x - pan.x) / zoom,
      y: (y - pan.y) / zoom,
      width: 50,
      height: 50,
      rotation: 0,
      properties: {},
      isSelected: false
    };

    setObjects(prev => [...prev, newObject]);
    onObjectAdd?.(newObject);
    toast.success(`${type} adicionado!`);
  }, [pan, zoom, onObjectAdd]);

  const updateObject = useCallback((objectId: string, updates: Partial<PlantaObject>) => {
    setObjects(prev => prev.map(obj => 
      obj.id === objectId ? { ...obj, ...updates } : obj
    ));
    onObjectUpdate?.(objects.find(obj => obj.id === objectId)!);
  }, [onObjectUpdate, objects]);

  // const deleteObject = useCallback((objectId: string) => {
  //   setObjects(prev => prev.filter(obj => obj.id !== objectId));
  //   onObjectDelete?.(objectId);
  //   toast.success('Objeto removido!');
  // }, [onObjectDelete]);

  // File upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Planta carregada com sucesso!');
    } catch (error) {
      toast.error('Erro ao carregar planta');
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Save functionality
  const handleSave = useCallback(() => {
    onSave?.(objects);
    toast.success('Planta salva com sucesso!');
  }, [objects, onSave]);

  // Object types for toolbar
  const objectTypes = [
    { type: 'mesa', label: 'Mesa', icon: '🍽️' },
    { type: 'cadeira', label: 'Cadeira', icon: '🪑' },
    { type: 'palco', label: 'Palco', icon: '🎭' },
    { type: 'bar', label: 'Bar', icon: '🍸' },
    { type: 'banheiro', label: 'Banheiro', icon: '🚻' },
    { type: 'entrada', label: 'Entrada', icon: '🚪' },
    { type: 'saida', label: 'Saída', icon: '🚪' },
    { type: 'extintor', label: 'Extintor', icon: '🧯' },
  ];

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4 space-y-4">
        {/* Zoom Controls */}
        <div className="flex flex-col space-y-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomIn}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            <ZoomIn size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomOut}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            <ZoomOut size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleReset}
            className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
          >
            <RotateCcw size={20} />
          </motion.button>
        </div>

        {/* View Mode */}
        <div className="flex flex-col space-y-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewMode('2d')}
            className={`p-2 rounded-lg text-white ${viewMode === '2d' ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            <Layers size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewMode('3d')}
            className={`p-2 rounded-lg text-white ${viewMode === '3d' ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            <Box size={20} />
          </motion.button>
        </div>

        {/* Grid Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded-lg text-white ${showGrid ? 'bg-green-600' : 'bg-gray-600'}`}
        >
          {showGrid ? <Eye size={20} /> : <EyeOff size={20} />}
        </motion.button>
      </div>

      {/* Object Toolbar */}
      <div className="absolute top-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4">
        <div className="grid grid-cols-2 gap-2">
          {objectTypes.map(({ type, label, icon }) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => addObject(type as PlantaObject['type'], 100, 100)}
              className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-center"
            >
              <div className="text-2xl">{icon}</div>
              <div className="text-xs mt-1">{label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <div className="absolute bottom-4 left-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={isUploading}
          className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg text-white"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Upload size={20} />
          )}
        </motion.button>
        <input
          id="file-upload"
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,.dwg"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Save Button */}
      <div className="absolute bottom-4 right-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
        >
          <Download size={20} />
        </motion.button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              transform: `translate(${pan.x}px, ${pan.y}px)`
            }}
          />
        )}

        {/* Planta Background */}
        {plantaUrl && (
          <motion.img
            src={plantaUrl}
            alt="Planta"
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}

        {/* Objects */}
        <AnimatePresence>
          {objects.map((object) => (
            <motion.div
              key={object.id}
                             className="absolute cursor-move"
              style={{
                left: object.x * zoom + pan.x,
                top: object.y * zoom + pan.y,
                width: object.width * zoom,
                height: object.height * zoom,
                transform: `rotate(${object.rotation}deg)`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
                             onClick={() => {}}
              drag
              dragMomentum={false}
              onDragEnd={(_, info) => {
                updateObject(object.id, {
                  x: (info.point.x - pan.x) / zoom,
                  y: (info.point.y - pan.y) / zoom
                });
              }}
            >
              <div className="w-full h-full bg-blue-500/80 rounded-lg flex items-center justify-center text-white font-bold">
                {objectTypes.find(t => t.type === object.type)?.icon || '📦'}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Zoom Level Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* 3D View Overlay */}
      {viewMode === '3d' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 pointer-events-none"
        />
      )}
    </div>
  );
};

export default PlantaViewer; 