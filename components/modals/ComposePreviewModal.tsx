
import React from 'react';
import { Download, X } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

interface ComposePreviewModalProps {
  url: string;
  onClose: () => void;
  onDownload: () => void;
}

export const ComposePreviewModal: React.FC<ComposePreviewModalProps> = ({ url, onClose, onDownload }) => {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">{t('preview.title')}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-neutral-100"><X className="h-5 w-5"/></button>
        </div>
        <div className="max-h-[70vh] overflow-auto rounded-xl border border-neutral-200 bg-neutral-50 p-2">
          <img src={url} alt="composed-preview" className="mx-auto h-auto w-full max-w-full"/>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button onClick={onDownload} className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white"><Download className="h-4 w-4"/> {t('preview.download')}</button>
          <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-100">{t('preview.close')}</button>
        </div>
      </div>
    </div>
  );
};
