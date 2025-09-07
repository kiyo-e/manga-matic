
import React, { useRef } from 'react';
import { Upload, Wand2 } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { type Character } from '../types';
import { artToneOptions } from '../constants';

interface CharacterCardProps {
  character: Character;
  onUpdate: (character: Character) => void;
  onUpload: (files: FileList | null) => void;
  onGenerate: () => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onUpdate, onUpload, onGenerate }) => {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white">{character.id}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onGenerate} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs hover:bg-neutral-100">
            <Wand2 className="h-4 w-4"/> {t('button.aiGenerate')}
          </button>
        </div>
      </div>
      <textarea
        value={character.prompt}
        onChange={(e) => onUpdate({ ...character, prompt: e.target.value })}
        className="mb-2 h-16 w-full rounded-md border border-neutral-300 p-2 text-xs"
        placeholder={t('placeholder.characterPrompt')}
      />
      <div className="mb-2">
        <label className="block text-xs font-medium">{t('form.artStyle')}</label>
        <select
          value={character.stylePreset}
          onChange={(e) => onUpdate({ ...character, stylePreset: e.target.value })}
          className="w-full rounded-md border border-neutral-300 p-1.5 text-xs"
        >
          {artToneOptions.map(o => (
            <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {character.generated || character.refs.length > 0 ? (
          <label className="relative block aspect-square w-full cursor-pointer">
            <img src={character.generated || character.refs[0]} alt="ref" className="h-full w-full rounded-md object-cover"/>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files)}/>
            <span className="absolute right-2 bottom-2 inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white/90 p-1 shadow">
              <Upload className="h-4 w-4 text-neutral-700"/>
            </span>
          </label>
        ) : (
          <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-neutral-300 text-xs text-neutral-500 hover:bg-neutral-100">
            <Upload className="h-4 w-4"/> {t('button.addReference')}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files)}/>
          </label>
        )}
      </div>
    </div>
  );
};
