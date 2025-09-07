
import React from 'react';
import { useI18n } from '../../hooks/useI18n';

interface GuideModalProps {
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl">
        <h3 className="mb-2 text-base font-semibold">{t('guide.title')}</h3>
        <p className="mb-4 text-sm">{t('guide.message')}</p>
        <div className="text-right">
          <button onClick={onClose} className="rounded-xl bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white">{t('guide.close')}</button>
        </div>
      </div>
    </div>
  );
};
