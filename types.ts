
export type Character = {
  id: 'A' | 'B';
  name: string;
  prompt: string;
  stylePreset: string;
  refs: string[]; // data URLs
  generated: string | null; // data URL
};

export type Panel = {
  index: number;
  desc: string;
  lineA: string;
  lineB: string;
  layoutHint: string;
  shot: string;
  drawingDataURL: string | null;
  generatedImage: string | null;
  status: 'draft' | 'generating' | 'done' | 'error';
  _refsOpen?: boolean;
  _editingCanvas?: boolean;
  _pendingOverwrite?: string;
};

export type AutoPlan = 'script' | 'script+characters' | 'full';

export type Lang = 'en' | 'ja';

export type ShotOption = {
  value: string;
  labelKey: string;
  titleKey: string;
};

export type ToneOption = {
  value: string;
};

export type ArtToneOption = {
  value: string;
  labelKey: string;
};
