
import React, { useState, useRef, useEffect } from 'react';
import { Brush, Eraser, Trash2, Check, X } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { loadImage } from '../../utils/imageUtils';

interface CanvasEditorModalProps {
  initial: string | null;
  ratio: { w: number; h: number };
  onClose: () => void;
  onSave: (url: string) => void;
}

export const CanvasEditorModal: React.FC<CanvasEditorModalProps> = ({ initial, ratio, onClose, onSave }) => {
  const { t } = useI18n();
  const baseW = 900;
  const baseH = Math.round(baseW * (ratio.h / ratio.w));
  const [brushSize, setBrushSize] = useState(6);
  const [mode, setMode] = useState<'draw' | 'erase'>('draw');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDownRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = '#111';
    ctx.globalCompositeOperation = 'source-over';
    if (initial) {
      loadImage(initial).then(img => {
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
      });
    } else {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if(ctx) ctx.lineWidth = brushSize;
  }, [brushSize]);

  const toLocal = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    const sx = c.width / r.width;
    const sy = c.height / r.height;
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };

  const down = (e: React.MouseEvent<HTMLCanvasElement>) => { isDownRef.current = true; lastRef.current = toLocal(e); };
  const move = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDownRef.current || !canvasRef.current) return;
    const p = toLocal(e);
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx || !lastRef.current) return;
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#111';
    ctx.globalCompositeOperation = (mode === 'erase') ? 'destination-out' : 'source-over';
    ctx.stroke();
    lastRef.current = p;
  };
  const up = () => { isDownRef.current = false; };

  const clearAll = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillRect(0, 0, c.width, c.height);
  };
  
  const handleSave = () => {
    if (canvasRef.current) {
        onSave(canvasRef.current.toDataURL('image/png'));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">{t('canvas.title')}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-neutral-100"><X className="h-5 w-5"/></button>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm">
            <button onClick={() => setMode('draw')} className={`inline-flex items-center gap-1 ${mode === 'draw' ? 'font-semibold' : ''}`}><Brush className="h-4 w-4"/> {t('canvas.draw')}</button>
            <span className="mx-2 h-4 w-px bg-neutral-300"/>
            <button onClick={() => setMode('erase')} className={`inline-flex items-center gap-1 ${mode === 'erase' ? 'font-semibold' : ''}`}><Eraser className="h-4 w-4"/> {t('canvas.erase')}</button>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm">
            <span>{t('canvas.thickness')}</span>
            <input type="range" min={2} max={36} step={1} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))}/>
            <span className="w-8 text-right text-xs text-neutral-600">{brushSize}</span>
          </div>
          <button onClick={clearAll} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs hover:bg-neutral-100"><Trash2 className="h-4 w-4"/> {t('canvas.clear')}</button>
          <button onClick={handleSave} className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white"><Check className="h-4 w-4"/> {t('canvas.save')}</button>
        </div>
        <div className="overflow-auto rounded-xl border border-neutral-200 bg-neutral-50 p-2">
          <canvas
            ref={canvasRef}
            width={baseW}
            height={baseH}
            onMouseDown={down}
            onMouseMove={move}
            onMouseUp={up}
            onMouseLeave={up}
            className="mx-auto block h-auto w-auto max-w-full max-h-[70vh] select-none rounded-lg bg-white"
          />
        </div>
      </div>
    </div>
  );
};
