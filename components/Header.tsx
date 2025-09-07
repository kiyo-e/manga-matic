
import React from 'react';
import { Play, Sparkles } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { SITE_NAME } from '../constants';
import { type Lang } from '../types';

interface HeaderProps {
    onPreview: () => void;
    onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onPreview, onReset }) => {
    const { t, lang, setLang } = useI18n();

    return (
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2 text-base font-semibold">
                    <Sparkles className="h-5 w-5"/> {SITE_NAME}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onPreview} className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
                        <Play className="h-4 w-4"/> {t('header.preview')}
                    </button>
                    <button onClick={onReset} className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100">
                        {t('header.reset')}
                    </button>
                    <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="rounded-lg border border-neutral-300 p-1.5 text-sm">
                        <option value="en">{t('lang.en')}</option>
                        <option value="ja">{t('lang.ja')}</option>
                    </select>
                </div>
            </div>
        </header>
    );
};
