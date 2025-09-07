
import React from 'react';
import { Wand2 } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { type AutoPlan } from '../types';
import { Card, CardHeader } from './ui/Card';
import { toneOptions, artToneOptions } from '../constants';

interface AutoScriptCardProps {
  overallDesc: string;
  setOverallDesc: (value: string) => void;
  tone: string;
  setTone: (value: string) => void;
  artTone: string;
  setArtTone: (value: string) => void;
  autoPlan: AutoPlan;
  setAutoPlan: (value: AutoPlan) => void;
  onAutoScript: () => void;
}

export const AutoScriptCard: React.FC<AutoScriptCardProps> = ({
  overallDesc, setOverallDesc, tone, setTone, artTone, setArtTone, autoPlan, setAutoPlan, onAutoScript
}) => {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader title={t('card.autoScript.title')} subtitle={t('card.autoScript.subtitle')}/>
      <div className="space-y-3">
        <label className="block text-sm font-medium" title={t('tooltip.overview')}>{t('form.overview')}</label>
        <textarea
          value={overallDesc}
          onChange={(e) => setOverallDesc(e.target.value)}
          placeholder={t('placeholder.overviewExample')}
          className="h-24 w-full rounded-xl border border-neutral-300 p-3 text-sm"
          title={t('tooltip.overview')}
        />
        <div className="flex items-center gap-2">
          <label className="text-sm" title={t('tooltip.tone')}>{t('form.tone')}:</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)} className="rounded-lg border border-neutral-300 p-1.5 text-sm" title={t('tooltip.tone')}>
            {toneOptions.map(o => <option key={o.value} value={o.value}>{t(o.value)}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm" title={t('tooltip.artStyle')}>{t('form.artStyle')}:</label>
          <select value={artTone} onChange={(e) => setArtTone(e.target.value)} className="rounded-lg border border-neutral-300 p-1.5 text-sm" title={t('tooltip.artStyle')}>
            {artToneOptions.map(o => <option key={o.value} value={o.value}>{t(o.labelKey)}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between gap-2">
          <select value={autoPlan} onChange={(e) => setAutoPlan(e.target.value as AutoPlan)} className="rounded-lg border border-neutral-300 p-1.5 text-sm" title={t('tooltip.autoPlan')}>
            <option value="script">{t('option.autoPlan.script')}</option>
            <option value="script+characters">{t('option.autoPlan.scriptCharacters')}</option>
            <option value="full">{t('option.autoPlan.full')}</option>
          </select>
          <button onClick={onAutoScript} className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100">
            <Wand2 className="h-4 w-4"/> {t('button.create')}
          </button>
        </div>
      </div>
    </Card>
  );
};
