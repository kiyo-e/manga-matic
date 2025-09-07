
import React from 'react';
import { useI18n } from '../../hooks/useI18n';

interface ConfirmModalProps {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ message, onCancel, onConfirm }) => {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl">
        <div className="mb-3 text-sm">{message}</div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onCancel} className="rounded-xl border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100">{t('confirm.cancel')}</button>
          <button onClick={onConfirm} className="rounded-xl bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white">{t('confirm.overwrite')}</button>
        </div>
      </div>
    </div>
  );
};
