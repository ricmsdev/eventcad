import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RotateCw, Move, ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react';

interface ThreeDObject {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  color: string;
  geometry: 'box' | 'sphere' | 'cylinder' | 'cone';
}

interface ThreeDViewerProps {
  objects: ThreeDObject[];
  onObjectSelect?: (objectId: string) => void;
  onObjectUpdate?: (object: ThreeDObject) => void;
}

const ThreeDViewer: React.FC<ThreeDViewerProps> = ({
  objects,
  onObjectSelect
}) => {
  const [camera, setCamera] = useState({
    position: { x: 0, y: 0, z: 5 },
    rotation: { x: 0, y: 0, z: 0 },
    zoom: 1
  });
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'perspective' | 'orthographic'>('perspective');
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Camera controls
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;

    setCamera(prev => ({
      ...prev,
      rotation: {
        x: prev.rotation.x + deltaY * 0.01,
        y: prev.rotation.y + deltaX * 0.01,
        z: prev.rotation.z
      }
    }));

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setCamera(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, prev.zoom - e.deltaY * 0.001))
    }));
  }, []);

  // Camera reset
  const resetCamera = useCallback(() => {
    setCamera({
      position: { x: 0, y: 0, z: 5 },
      rotation: { x: 0, y: 0, z: 0 },
      zoom: 1
    });
  }, []);

  // Object selection
  const handleObjectClick = useCallback((objectId: string) => {
    setSelectedObject(objectId);
    onObjectSelect?.(objectId);
  }, [onObjectSelect]);

  // Render 3D objects
  const renderObject = useCallback((object: ThreeDObject) => {
    const isSelected = selectedObject === object.id;
    
    return (
      <motion.div
        key={object.id}
        className={`absolute cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        style={{
          left: object.position.x * 50 + 50,
          top: object.position.y * 50 + 50,
          transform: `
            translateZ(${object.position.z * 50}px)
            rotateX(${object.rotation.x}deg)
            rotateY(${object.rotation.y}deg)
            rotateZ(${object.rotation.z}deg)
            scale(${object.scale.x}, ${object.scale.y}, ${object.scale.z})
          `,
          width: 50,
          height: 50,
          backgroundColor: object.color,
          borderRadius: object.geometry === 'sphere' ? '50%' : '4px'
        }}
        onClick={() => handleObjectClick(object.id)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
      >
        <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
          {object.type}
        </div>
      </motion.div>
    );
  }, [selectedObject, handleObjectClick]);

  // Grid rendering
  const renderGrid = useCallback(() => {
    if (!showGrid) return null;

    const gridSize = 10;
    const gridLines = [];

    for (let i = -gridSize; i <= gridSize; i++) {
      gridLines.push(
        <div
          key={`h-${i}`}
          className="absolute w-full h-px bg-gray-300/30"
          style={{ top: `${50 + i * 5}%` }}
        />,
        <div
          key={`v-${i}`}
          className="absolute w-px h-full bg-gray-300/30"
          style={{ left: `${50 + i * 5}%` }}
        />
      );
    }

    return gridLines;
  }, [showGrid]);

  // Axes rendering
  const renderAxes = useCallback(() => {
    if (!showAxes) return null;

    return (
      <>
        {/* X Axis */}
        <div className="absolute w-full h-px bg-red-500/50" style={{ top: '50%' }}>
          <div className="absolute right-0 top-0 text-red-500 text-xs">X</div>
        </div>
        {/* Y Axis */}
        <div className="absolute w-px h-full bg-green-500/50" style={{ left: '50%' }}>
          <div className="absolute bottom-0 left-0 text-green-500 text-xs">Y</div>
        </div>
        {/* Z Axis */}
        <div className="absolute w-px h-full bg-blue-500/50" style={{ left: '50%', transform: 'rotateX(45deg)' }}>
          <div className="absolute top-0 left-0 text-blue-500 text-xs">Z</div>
        </div>
      </>
    );
  }, [showAxes]);

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4 space-y-4">
        {/* Camera Controls */}
        <div className="flex flex-col space-y-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCamera(prev => ({ ...prev, zoom: Math.min(5, prev.zoom * 1.2) }))}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            <ZoomIn size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCamera(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.2) }))}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            <ZoomOut size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={resetCamera}
            className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
          >
            <Camera size={20} />
          </motion.button>
        </div>

        {/* View Mode */}
        <div className="flex flex-col space-y-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewMode('perspective')}
            className={`p-2 rounded-lg text-white ${viewMode === 'perspective' ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            <Eye size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewMode('orthographic')}
            className={`p-2 rounded-lg text-white ${viewMode === 'orthographic' ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            <EyeOff size={20} />
          </motion.button>
        </div>

        {/* Toggles */}
        <div className="flex flex-col space-y-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg text-white ${showGrid ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            <Move size={20} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAxes(!showAxes)}
            className={`p-2 rounded-lg text-white ${showAxes ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            <RotateCw size={20} />
          </motion.button>
        </div>
      </div>

      {/* 3D Scene */}
      <div
        ref={canvasRef}
        className="w-full h-full relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          perspective: viewMode === 'perspective' ? '1000px' : 'none',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* 3D Container */}
        <div
          className="absolute inset-0"
          style={{
            transform: `
              translateZ(${camera.position.z * 100}px)
              rotateX(${camera.rotation.x}rad)
              rotateY(${camera.rotation.y}rad)
              rotateZ(${camera.rotation.z}rad)
              scale(${camera.zoom})
            `,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Grid */}
          {renderGrid()}

          {/* Axes */}
          {renderAxes()}

          {/* Objects */}
          <AnimatePresence>
            {objects.map(renderObject)}
          </AnimatePresence>
        </div>
      </div>

      {/* Info Panel */}
      <div className="absolute bottom-4 left-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
        <div className="text-sm space-y-1">
          <div>Zoom: {Math.round(camera.zoom * 100)}%</div>
          <div>Objects: {objects.length}</div>
          <div>View: {viewMode}</div>
        </div>
      </div>

      {/* Object Info */}
      {selectedObject && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white"
        >
          <h3 className="font-medium mb-2">Selected Object</h3>
          <div className="text-sm space-y-1">
            <div>ID: {selectedObject}</div>
            <div>Type: {objects.find(obj => obj.id === selectedObject)?.type}</div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ThreeDViewer; 