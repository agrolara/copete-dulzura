'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onSaveCrop: (croppedDataUrl: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageUrl,
  onClose,
  onSaveCrop,
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (isOpen && imageUrl) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(false);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imgRef.current = img;
        setImageLoaded(true);
      };
      img.src = imageUrl;
    }
  }, [isOpen, imageUrl]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleApplyCrop = () => {
    if (!imgRef.current) return;
    const canvas = document.createElement('canvas');
    const size = 600;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#09080d';
    ctx.fillRect(0, 0, size, size);

    const img = imgRef.current;
    const minDim = Math.min(img.width, img.height);
    const scale = (size / minDim) * zoom;
    const renderWidth = img.width * scale;
    const renderHeight = img.height * scale;

    const centerX = size / 2 + position.x;
    const centerY = size / 2 + position.y;

    ctx.drawImage(
      img,
      centerX - renderWidth / 2,
      centerY - renderHeight / 2,
      renderWidth,
      renderHeight
    );

    const cropped = canvas.toDataURL('image/jpeg', 0.9);
    onSaveCrop(cropped);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-brand-pink/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="text-base font-extrabold text-white">Ajustar Imagen Cuadrada (1:1)</h3>
          <button onClick={onClose} className="p-1 rounded-xl text-zinc-400 hover:text-white bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport de recorte */}
        <div
          className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border-2 border-dashed border-brand-pink/60 cursor-grab active:cursor-grabbing flex items-center justify-center select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Recorte"
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                maxWidth: '100%',
                maxHeight: '100%',
              }}
              className="pointer-events-none select-none"
            />
          )}
          <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-xl" />
        </div>

        {/* Controles de Zoom */}
        <div className="flex items-center justify-between gap-3 text-xs text-zinc-300">
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.2))}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center gap-1"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-semibold">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(3, prev + 0.2))}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center gap-1"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center gap-1 ml-auto"
            title="Centrar"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white text-xs font-bold shadow-neon-pink flex items-center gap-1.5 hover:opacity-95"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Recorte</span>
          </button>
        </div>
      </div>
    </div>
  );
};
