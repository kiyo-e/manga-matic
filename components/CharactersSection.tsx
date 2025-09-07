
import React from 'react';
import { Card, CardHeader } from './ui/Card';
import { CharacterCard } from './CharacterCard';
import { useI18n } from '../hooks/useI18n';
import { type Character } from '../types';

interface CharactersSectionProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  useCharacterB: boolean;
  setUseCharacterB: (value: boolean) => void;
  onUploadCharacterRefs: (idx: number, files: FileList | null) => void;
  onGenerateCharacter: (idx: number) => void;
}

export const CharactersSection: React.FC<CharactersSectionProps> = ({
  characters, setCharacters, useCharacterB, setUseCharacterB, onUploadCharacterRefs, onGenerateCharacter
}) => {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader title={t('card.characters.title')} subtitle={t('card.characters.subtitle')}/>
      <div className="space-y-4">
        <CharacterCard
          character={characters[0]}
          onUpdate={(next) => setCharacters(prev => [next, prev[1]])}
          onUpload={(files) => onUploadCharacterRefs(0, files)}
          onGenerate={() => onGenerateCharacter(0)}
        />
        <div className="flex items-center gap-2">
          <input id="toggleB" type="checkbox" checked={useCharacterB} onChange={(e) => setUseCharacterB(e.target.checked)} title={t('tooltip.useCharacterB')}/>
          <label htmlFor="toggleB" className="text-sm" title={t('tooltip.useCharacterB')}>{t('label.useCharacterB')}</label>
        </div>
        {useCharacterB && (
          <CharacterCard
            character={characters[1]}
            onUpdate={(next) => setCharacters(prev => [prev[0], next])}
            onUpload={(files) => onUploadCharacterRefs(1, files)}
            onGenerate={() => onGenerateCharacter(1)}
          />
        )}
      </div>
    </Card>
  );
};
