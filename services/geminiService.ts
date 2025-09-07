
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { type Character, type Panel } from '../types';

type InlineImage = {
  inlineData: { mimeType: string; data: string }
}

export type GeneratePanelInput = {
  model?: string
  canvas?: InlineImage
  references?: InlineImage[]
  guidance?: {
    desc?: string
    layoutHint?: string
    shot?: string
    styleTone?: string
    negative?: string[]
    charA?: { name?: string; prompt?: string; stylePreset?: string }
    charB?: { name?: string; prompt?: string; stylePreset?: string }
  }
  size?: { width: number; height: number }
}

function getApiKey() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API_KEY environment variable not set');
  }
  return apiKey;
}

export async function generatePanelImage({
  model = 'gemini-2.5-flash-image-preview',
  canvas,
  references = [],
  guidance = {},
  size = { width: 1024, height: 1024 },
}: GeneratePanelInput): Promise<{ base64: string; mimeType: string }> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const negatives = guidance.negative?.length
    ? guidance.negative
    : ['Do not render any text or speech balloons', 'Ignore and remove any existing text in the input'];

  const textParts: Array<{ text: string }> = [
    { text: 'Task: Generate a manga-style panel image. If a rough sketch is provided, use it only as a loose composition hint; otherwise compose naturally. Maintain character/style consistency from reference images. Do not draw any text.' }
  ];

  if (guidance.desc) textParts.push({ text: `Scene: ${guidance.desc}` });
  if (guidance.layoutHint) textParts.push({ text: `Layout hint: ${guidance.layoutHint}` });
  if (guidance.shot) {
    const shotMap: Record<string, string> = {
      wide: 'wide establishing shot, show setting and positions',
      waist: 'medium waist-up framing',
      two_shot: 'two-shot with both characters A and B in frame',
      closeup_A: 'close-up framing on character A',
      closeup_B: 'close-up framing on character B',
      reaction_A: 'reaction shot focusing on character A',
      reaction_B: 'reaction shot focusing on character B',
      ots_A: "over-the-shoulder shot from A's viewpoint",
      ots_B: "over-the-shoulder shot from B's viewpoint",
    };
    textParts.push({ text: `Shot: ${shotMap[guidance.shot] || guidance.shot}` });
  }
  if (guidance.styleTone) {
    const toneMap: Record<string, string> = {
        'mono-screen': 'manga monochrome with screentone (halftone dots), clean ink lines, no color',
        'line-bold': 'bold black-and-white line art, high contrast, minimal shading, no color',
        'soft-mono': 'soft grayscale manga tones, smooth shading, gentle contrast, no color',
        'shonen-ink': 'shonen manga style: dynamic action, speed lines and impact frames, strong blacks, crisp inking, no color',
        'shojo-mono': 'shojo manga style: delicate thin lines, large expressive eyes, sparkles/flowers motifs, light screentones, no color',
        'seinen-real': 'seinen manga style: realistic proportions, detailed backgrounds, fine cross-hatching, heavy shadows, no color',
        'gekiga': 'gekiga style: gritty realistic storytelling, dense hatching and heavy shadows, serious tone, no color',
        'retro-90s': '1990s manga style: retro halftone textures, hair shine shapes, clean ink lines, screentone gradients, no color',
        'horror-ink': 'horror manga style: scratchy ink textures, heavy blacks, high contrast, eerie atmosphere, no color',
        'sumi-brush': 'sumi-e brush pen look: expressive brush strokes, ink wash textures, rough paper feel, no color',
        'hatch': 'pen cross‑hatching shading, fine linework, monochrome, no color',
        'chibi-gag': 'super‑deformed chibi comedic style: round proportions, simple shapes, bold clean lines, minimal shading, no color',
        'flat-color': 'flat cel-shaded comic coloring, limited palette, crisp edges',
        'pastel-color': 'soft pastel colors, light tones, gentle gradients',
        'webtoon-color': 'color webtoon look, soft gradients and clean flat shading, modern vertical-comic aesthetic',
    };
    textParts.push({ text: `Style tone: ${toneMap[guidance.styleTone] || guidance.styleTone}` });
    const monoKeys = new Set(['mono-screen','line-bold','soft-mono','shonen-ink','shojo-mono','seinen-real','gekiga','retro-90s','horror-ink','sumi-brush','hatch','chibi-gag']);
    if (monoKeys.has(guidance.styleTone) || /mono|screen/.test(guidance.styleTone)) {
      textParts.push({ text: 'Color: monochrome only' });
    }
  }
  
  const presetText = (k?: string) => {
    if (!k) return '';
    const map: Record<string, string> = {
      'line-bold': 'bold line art, clean manga ink, minimal shading, no color',
      'soft-mono': 'soft grayscale manga tones, gentle contrast, no color',
      'shonen-ink': 'shonen manga style: dynamic, strong blacks, crisp inking, speed lines, no color',
      'shojo-mono': 'shojo manga style: delicate thin lines, large expressive eyes, sparkles/flowers motifs, no color',
      'seinen-real': 'seinen manga style: realistic, fine cross‑hatching, heavy shadows, no color',
      'gekiga': 'gekiga style: gritty realistic, dense hatching, hard shadows, no color',
      'retro-90s': '1990s manga style: retro halftone textures, hair shine shapes, clean ink, no color',
      'horror-ink': 'horror manga style: scratchy ink, heavy blacks, eerie mood, no color',
      'sumi-brush': 'sumi‑e brush look: expressive brush strokes, ink wash, no color',
      'hatch': 'pen cross‑hatching shading, monochrome, no color',
      'chibi-gag': 'super‑deformed chibi comedic style: round proportions, simple shapes, bold clean lines, no color',
      'flat-color': 'flat cel-shaded comic coloring, limited palette',
      'pastel-color': 'soft pastel colors, gentle gradients',
      'webtoon-color': 'color webtoon look, soft gradients and clean edges',
    };
    return map[k] || k;
  };
  
  if (guidance.charA) {
    const a = guidance.charA;
    const parts: string[] = [];
    if (a.stylePreset) parts.push(`preset: ${presetText(a.stylePreset)}`);
    if (a.prompt) parts.push(`traits: ${a.prompt}`);
    if (parts.length) textParts.push({ text: `Character A style: ${parts.join('; ')}` });
  }
  if (guidance.charB) {
    const b = guidance.charB;
    const parts: string[] = [];
    if (b.stylePreset) parts.push(`preset: ${presetText(b.stylePreset)}`);
    if (b.prompt) parts.push(`traits: ${b.prompt}`);
    if (parts.length) textParts.push({ text: `Character B style: ${parts.join('; ')}` });
  }

  textParts.push({ text: `Output size: ${size.width}x${size.height} (1:1)` });
  negatives.forEach((n) => textParts.push({ text: `Negative: ${n}` }));

  const contents = { parts: [ ...textParts, ...(canvas ? [canvas] : []), ...references ] };

  const resp = await ai.models.generateContent({
    model,
    contents,
    config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
    }
  });

  const cand = resp.candidates?.[0];
  if (!cand) throw new Error('No candidates returned from Gemini');

  for (const part of cand.content.parts ?? []) {
    if (part.inlineData) {
      return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
    }
  }

  throw new Error('No image part in Gemini response');
}

export async function generateScriptPanels(args: {
  overallDesc: string;
  tone?: string;
  useCharacterB?: boolean;
}): Promise<{
  characters?: { A?: Partial<Character>; B?: Partial<Character>; };
  panels: Partial<Panel>[];
}> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const panelRequired = (args.useCharacterB ? ['desc', 'lineA', 'lineB'] : ['desc', 'lineA']);
  const shotEnum = ['wide', 'waist', 'closeup_A', 'closeup_B', 'two_shot', 'reaction_A', 'reaction_B', 'ots_A', 'ots_B'];

  const schema: any = {
    type: Type.OBJECT,
    properties: {
      characters: {
        type: Type.OBJECT,
        properties: {
          A: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: 'Short character A name' },
              prompt: { type: Type.STRING, description: 'Traits/style guidance for A' },
            },
          },
          B: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: 'Short character B name' },
              prompt: { type: Type.STRING, description: 'Traits/style guidance for B' },
            },
          },
        },
        required: args.useCharacterB ? ['A', 'B'] : ['A'],
      },
      panels: {
        type: Type.ARRAY,
        description: 'Exactly 4 panel entries in order 0..3',
        items: {
          type: Type.OBJECT,
          properties: {
            desc: { type: Type.STRING, description: 'Scene description' },
            lineA: { type: Type.STRING, description: 'Short line for character A' },
            lineB: { type: Type.STRING, description: 'Short line for character B' },
            shot: { type: Type.STRING, description: `Shot key for composition. One of: ${shotEnum.join(', ')}` },
          },
          required: panelRequired,
        },
      },
    },
    required: ['panels', 'characters'],
  };

  const sys = `You are a manga script assistant. Output exactly 4 panels. Also include a "characters" object with suggested short name and prompt for character A, and for B when used. Keep each field concise. If "Use character B" is true, include characters.B and include lineB for every panel; if false, omit both. When helpful, include a "shot" using one of: ${shotEnum.join(', ')}. If character B is not used, avoid closeup_B, reaction_B, two_shot, or ots_B. Two_shot is only valid when both A and B appear.`;
  const user = `Overall: ${args.overallDesc || ''}\nTone: ${args.tone || ''}\nUse character B: ${!!args.useCharacterB}`;

  const resp = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: user,
    config: {
        systemInstruction: sys,
        responseMimeType: 'application/json',
        responseSchema: schema,
    },
  });

  const text = resp.text;
  if (!text) throw new Error('Invalid response (empty text)');
  
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed?.panels)) throw new Error('Invalid JSON (no panels)');
    return parsed;
  } catch(e) {
    console.error("Failed to parse script JSON:", text, e);
    throw new Error('Failed to parse script JSON');
  }
}

function parseInlineData(dataUrl: string): [string, string] {
    const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
    if (!m) throw new Error('invalid data URL');
    return [m[1], m[2]];
}

export async function generateCharacterImage(args: {
  name?: string;
  stylePreset?: string;
  prompt?: string;
  refDataUrls?: string[];
}): Promise<{ base64: string; mimeType: string }> {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const styleMap: Record<string, string> = {
    'line-bold': 'bold line art, clean manga ink, minimal shading, no color',
    'soft-mono': 'soft grayscale manga tones, gentle contrast, no color',
    'shonen-ink': 'shonen manga portrait: dynamic, strong blacks, crisp inking, speed-line feel, no color',
    'shojo-mono': 'shojo manga portrait: delicate thin lines, large expressive eyes, sparkles/flowers motifs, no color',
    'seinen-real': 'seinen manga portrait: realistic features, fine hatching, heavy shadows, no color',
    'gekiga': 'gekiga portrait: gritty realistic, dense hatching, hard shadows, no color',
    'retro-90s': '1990s manga portrait: retro halftone textures, hair shine shapes, clean ink, no color',
    'horror-ink': 'horror manga portrait: scratchy ink, heavy blacks, eerie mood, no color',
    'sumi-brush': 'sumi-e brush style portrait: expressive brush strokes, ink wash texture, no color',
    'hatch': 'pen cross‑hatching shading portrait, monochrome, no color',
    'chibi-gag': 'super‑deformed chibi portrait: round proportions, simple shapes, bold clean lines, minimal shading, no color',
    'flat-color': 'flat cel shading, limited palette, comic style',
    'pastel-color': 'soft pastel coloring, gentle gradients',
    'webtoon-color': 'color webtoon portrait: soft gradients, clean flat shading',
  };

  const parts: any[] = [];
  parts.push({ text: `Create a square character reference portrait for manga production. 1024x1024, neutral background, no text.` });
  if (args.name) parts.push({ text: `Character: ${args.name}` });
  if (args.stylePreset) parts.push({ text: `Style preset: ${styleMap[args.stylePreset] || args.stylePreset}` });
  if (args.prompt) parts.push({ text: `Additional style/traits: ${args.prompt}` });
  parts.push({ text: 'Do not render any captions, speech balloons, or UI text.' });

  for (const u of args.refDataUrls || []) {
    if (typeof u === 'string' && u.startsWith('data:')) {
      const [mimeType, data] = parseInlineData(u);
      parts.push({ inlineData: { mimeType, data } });
    }
  }

  const resp = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    }
  });
  
  const cand = resp.candidates?.[0];
  for (const part of cand?.content?.parts || []) {
    if (part.inlineData) {
      return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
    }
  }
  throw new Error('No image part in Gemini response');
}
