
import React from 'react';
import { Play, RotateCw, Download, Brush, ImageUp } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { type Panel } from '../types';
import { shotOptions } from '../constants';
import { makePlaceholder } from '../utils/imageUtils';
import { StatusBadge } from './ui/StatusBadge';
import { CanvasEditorModal } from './modals/CanvasEditorModal';
import { ConfirmModal } from './modals/ConfirmModal';
import { RATIO_W, RATIO_H } from '../constants';

interface PanelCardProps {
  panel: Panel;
  width: number;
  height: number;
  useCharacterB: boolean;
  onChange: (patch: Partial<Panel>) => void;
  onOpenCanvas: () => void;
  onCloseCanvas: () => void;
  onSaveSketch: (url: string) => void;
  onUploadReplace: (files: FileList | null) => void;
  onConfirmOverwrite: () => void;
  onCancelOverwrite: () => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  onDownload: () => void;
  onDownloadWithSpeech: () => void;
}

export const PanelCard: React.FC<PanelCardProps> = ({
  panel, width, height, useCharacterB, onChange, onOpenCanvas, onCloseCanvas, onSaveSketch,
  onUploadReplace, onConfirmOverwrite, onCancelOverwrite, onGenerate, onRegenerate, onDownload, onDownloadWithSpeech
}) => {
  const { t } = useI18n();
  const allowedShots = shotOptions.filter(s => {
    if (useCharacterB) return true;
    return s.value !== 'two_shot' && !/_B$/.test(s.value);
  });

  return (
    <div className="relative rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      {panel.status === 'generating' && (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-white/70">
          <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow"><RotateCw className="h-4 w-4 animate-spin"/><span className="text-xs">{t('status.generating')}…</span></div>
        </div>
      )}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-neutral-900 px-2.5 py-0.5 text-xs font-semibold text-white">{panel.index + 1}</span>
          <span className="text-sm font-medium">{t('panel.edit')}</span>
          <StatusBadge status={panel.status}/>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onGenerate} disabled={panel.status === 'generating'} className={`inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs hover:bg-neutral-100 ${panel.status === 'generating' ? 'opacity-60 cursor-not-allowed' : ''}`}><Play className="h-4 w-4"/> {t('button.generate')}</button>
          <button onClick={onRegenerate} disabled={panel.status === 'generating'} className={`inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs hover:bg-neutral-100 ${panel.status === 'generating' ? 'opacity-60 cursor-not-allowed' : ''}`}><RotateCw className="h-4 w-4"/> {t('button.regenerate')}</button>
          <button onClick={onDownload} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs hover:bg-neutral-100"><Download className="h-4 w-4"/> {t('button.savePng')}</button>
          <button onClick={onDownloadWithSpeech} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs hover:bg-neutral-100"><Download className="h-4 w-4"/> {t('button.savePngWithSpeech')}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
            <img src={panel.generatedImage || makePlaceholder(width, height, `Panel ${panel.index + 1}`)} alt={`panel-${panel.index + 1}`} className="h-auto w-full"/>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="text-sm font-medium">{t('panel.script')}</div>
              <select value={panel.shot} onChange={(e) => onChange({ shot: e.target.value })} className="ml-auto rounded-md border border-neutral-300 p-1.5 text-xs">
                <option value="">{t('panel.noShot')}</option>
                {allowedShots.map(s => <option key={s.value} value={s.value} title={t(s.titleKey)}>{t(s.labelKey)}</option>)}
              </select>
            </div>
            <label className="block text-xs font-medium">{t('label.description')}</label>
            <textarea value={panel.desc} onChange={(e) => onChange({ desc: e.target.value.slice(0, 120) })} className="mb-2 h-14 w-full rounded-md border border-neutral-300 p-2 text-xs" placeholder={t('placeholder.descriptionExample')}/>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium">{t('label.lineA')}</label>
                <textarea value={panel.lineA} onChange={(e) => onChange({ lineA: e.target.value.slice(0, 80) })} className="h-14 w-full rounded-md border border-neutral-300 p-2 text-xs" placeholder={t('placeholder.lineA')}/>
              </div>
              {useCharacterB && (
                <div>
                  <label className="block text-xs font-medium">{t('label.lineB')}</label>
                  <textarea value={panel.lineB} onChange={(e) => onChange({ lineB: e.target.value.slice(0, 80) })} className="h-14 w-full rounded-md border border-neutral-300 p-2 text-xs" placeholder={t('placeholder.lineB')}/>
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input value={panel.layoutHint} onChange={(e) => onChange({ layoutHint: e.target.value })} placeholder={t('placeholder.layoutHint')} className="w-48 rounded-md border border-neutral-300 p-1.5 text-xs"/>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{t('label.rough')}</div>
                <label className="inline-flex items-center gap-1 text-xs text-neutral-700">
                  <input type="checkbox" checked={!!panel._refsOpen} onChange={(e) => onChange({ _refsOpen: e.target.checked })}/>
                  {t('label.showTools')}
                </label>
              </div>
              {panel._refsOpen && (
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={onOpenCanvas} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs hover:bg-neutral-100"><Brush className="h-4 w-4"/> {t('button.drawRough')}</button>
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs hover:bg-neutral-100 cursor-pointer">
                    <ImageUp className="h-4 w-4"/> {t('button.loadImage')}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onUploadReplace(e.target.files)}/>
                  </label>
                </div>
              )}
            </div>
            {panel._refsOpen && (
              <div className="rounded-md border border-neutral-200 bg-white p-2">
                {panel.drawingDataURL ? (
                  <img src={panel.drawingDataURL} alt="canvas-preview" className="mx-auto max-h-60 w-full object-contain"/>
                ) : (
                  <p className="text-center text-xs text-neutral-500">{t('message.noRough')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {panel._pendingOverwrite && (
        <ConfirmModal message={t('confirm.replaceCanvas')} onCancel={onCancelOverwrite} onConfirm={onConfirmOverwrite} />
      )}
      {panel._editingCanvas && (
        <CanvasEditorModal initial={panel.drawingDataURL} ratio={{ w: RATIO_W, h: RATIO_H }} onClose={onCloseCanvas} onSave={onSaveSketch} />
      )}
    </div>
  );
};
