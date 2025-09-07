
import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { type Panel } from '../../types';

interface StatusBadgeProps {
  status: Panel['status'];
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useI18n();
  const map = {
    draft: { text: t('status.draft'), cls: 'bg-neutral-200 text-neutral-700' },
    generating: { text: t('status.generating'), cls: 'bg-amber-200 text-amber-900' },
    done: { text: t('status.done'), cls: 'bg-emerald-200 text-emerald-900' },
    error: { text: t('status.failed'), cls: 'bg-rose-200 text-rose-900' },
  };
  const it = map[status] || map.draft;
  return <span className={`rounded-full px-2 py-0.5 text-xs ${it.cls}`}>{it.text}</span>;
};
