import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from './hooks/useI18n';
import { type Character, type Panel, type AutoPlan, type ShotOption } from './types';
import { generateCharacterImage, generatePanelImage, generateScriptPanels } from './services/geminiService';
import { fileToDataURL, makePlaceholder, downloadDataURL, loadImage, roundRect, wrapText, calcSpeechMetrics } from './utils/imageUtils';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AutoScriptCard } from './components/AutoScriptCard';
import { CharactersSection } from './components/CharactersSection';
import { PanelCard } from './components/PanelCard';
import { LoadingOverlay } from './components/ui/LoadingOverlay';
import { GuideModal } from './components/modals/GuideModal';
import { ComposePreviewModal } from './components/modals/ComposePreviewModal';

import { PANEL_COUNT, DEFAULT_WIDTH, RATIO_W, RATIO_H, SEP, MARGIN, FILE_BASENAME, shotOptions } from './constants';

function emptyCharacter(id: 'A' | 'B', defaultName: string): Character {
  return { id, name: defaultName, prompt: '', stylePreset: 'chibi-gag', refs: [], generated: null };
}
function emptyPanel(idx: number): Panel {
  return { index: idx, desc: "", lineA: "", lineB: "", layoutHint: "", shot: "", drawingDataURL: null, generatedImage: null, status: "draft" };
}

function parseDataUrl(dataUrl: string): [mime: string, base64: string] {
    const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
    if (!m) throw new Error('invalid data URL');
    return [m[1], m[2]];
}

export default function App() {
  const { t } = useI18n();
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const height = useMemo(() => Math.round(width * (RATIO_H / RATIO_W)), [width]);

  const [characters, setCharacters] = useState<Character[]>(() => [emptyCharacter('A', t('character.A')), emptyCharacter('B', t('character.B'))]);
  const [useCharacterB, setUseCharacterB] = useState(false);
  const [tone, setTone] = useState('story.slice_of_life');
  const [overallDesc, setOverallDesc] = useState("");
  const [autoPlan, setAutoPlan] = useState<AutoPlan>('full');
  const [artTone, setArtTone] = useState('chibi-gag');
  const [panels, setPanels] = useState<Panel[]>(() => Array.from({ length: PANEL_COUNT }, (_, i) => emptyPanel(i)));
  const [showGuide, setShowGuide] = useState(false);
  const [overlayLabel, setOverlayLabel] = useState<string | null>(null);
  const [composePreview, setComposePreview] = useState<string | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('seenGuide')) {
      setShowGuide(true);
    }
  }, []);

  const closeGuide = () => {
    localStorage.setItem('seenGuide', '1');
    setShowGuide(false);
  };

  const uploadCharacterRefs = async (idx: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const url = await fileToDataURL(files[0]);
    setCharacters(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], refs: [url], generated: null };
      return next;
    });
  };

  const generateCharacter = async (idx: number, override?: Partial<Character>) => {
    const ch = { ...characters[idx], ...(override || {}) };
    setOverlayLabel(t('overlay.generatingCharacter'));
    let outUrl: string | null = null;
    try {
      const { base64, mimeType } = await generateCharacterImage({
        name: ch.name,
        stylePreset: ch.stylePreset,
        prompt: ch.prompt,
        refDataUrls: ch.refs?.slice(0, 1) || [],
      });
      const url = `data:${mimeType};base64,${base64}`;
      setCharacters(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], ...(override || {}), generated: url };
        return next;
      });
      outUrl = url;
    } catch (e: any) {
      console.error(e);
      alert(`${t('alert.characterGenFailed')}: ${e?.message || e}`);
    } finally {
      setOverlayLabel(null);
    }
    return outUrl;
  };

  const replaceCanvasWithUpload = async (i: number, files: FileList | null) => {
    if (!files || !files.length) return;
    const dataURL = await fileToDataURL(files[0]);
    setPanels(prev => prev.map(p => p.index === i ? { ...p, _pendingOverwrite: dataURL } : p));
  };
  const confirmOverwrite = (i: number) => setPanels(prev => prev.map(p => p.index === i ? { ...p, drawingDataURL: p._pendingOverwrite || p.drawingDataURL, _pendingOverwrite: undefined } : p));
  const cancelOverwrite = (i: number) => setPanels(prev => prev.map(p => p.index === i ? { ...p, _pendingOverwrite: undefined } : p));
  const saveSketch = (i: number, dataURL: string) => setPanels(prev => prev.map(p => p.index === i ? { ...p, drawingDataURL: dataURL } : p));

  const generateViaAPI = async (i: number, override?: { characters?: Character[]; useCharacterB?: boolean; panels?: Panel[] }): Promise<string | null> => {
    const localPanels = override?.panels || panels;
    const localCharacters = override?.characters || characters;
    const localUseB = typeof override?.useCharacterB === 'boolean' ? override.useCharacterB : useCharacterB;
    const p = localPanels[i];
    setPanels(prev => prev.map(x => x.index === i ? { ...x, status: 'generating' } : x));
    try {
      const refsA = [...(localCharacters[0].generated ? [localCharacters[0].generated] : []), ...(localCharacters[0].refs || [])];
      const refsB = localUseB ? [...(localCharacters[1].generated ? [localCharacters[1].generated] : []), ...(localCharacters[1].refs || [])] : [];
      
      const charA = localCharacters[0];
      const charB = localUseB ? localCharacters[1] : undefined;

      const references = [...refsA, ...refsB]
        .filter(u => typeof u === 'string' && u.startsWith('data:'))
        .map(u => {
          const [mimeType, data] = parseDataUrl(u);
          return { inlineData: { mimeType, data } };
        });

      let canvasRef;
      if(p.drawingDataURL) {
        const [mimeType, data] = parseDataUrl(p.drawingDataURL);
        canvasRef = { inlineData: { mimeType, data } };
      }

      const { base64, mimeType } = await generatePanelImage({
        references,
        canvas: canvasRef,
        guidance: {
            desc: p.desc,
            layoutHint: p.layoutHint,
            shot: p.shot,
            styleTone: artTone,
            negative: ['no text, subtitles, captions, or UI', ...(canvasRef ? ['clean background; remove any canvas scribble artifacts'] : [])],
            charA: { stylePreset: charA.stylePreset, prompt: charA.prompt },
            charB: charB ? { stylePreset: charB.stylePreset, prompt: charB.prompt } : undefined,
        },
        size: { width: 1024, height: 1024 },
      });

      const url = `data:${mimeType};base64,${base64}`;
      setPanels(prev => prev.map(pp => pp.index === i ? { ...pp, status: 'done', generatedImage: url } : pp));
      return url;
    } catch (e: any) {
      console.error(e);
      setPanels(prev => prev.map(pp => pp.index === i ? { ...pp, status: 'error' } : pp));
      alert(`${t('alert.panelGenFailed')}: ${e?.message || e}`);
      return null;
    }
  };
  
  const composeToDataURL = async (urlsOverride?: (string | null | undefined)[], infoOverride?: Partial<Panel>[]) => {
    const c = document.createElement('canvas');
    const totalH = (height * PANEL_COUNT) + (MARGIN * (PANEL_COUNT - 1)) + (SEP * (PANEL_COUNT + 1));
    c.width = width;
    c.height = totalH;
    const ctx = c.getContext('2d');
    if(!ctx) return "";
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    let y = 0;
    for (let i = 0; i < PANEL_COUNT; i++) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, y, width, SEP);
      y += SEP;
      const url = (urlsOverride ? urlsOverride[i] : panels[i].generatedImage) || makePlaceholder(width, height, `Panel ${i + 1}`);
      const img = await loadImage(url);
      const panelTop = y;
      ctx.drawImage(img, 0, panelTop, width, height);
      const info = infoOverride ? infoOverride[i] : panels[i];
      const maxW = Math.floor(width * 0.5);
      const topY = panelTop + Math.round(Math.max(24, height * 0.04));
      if (info?.lineA) {
        const { fontSize, lineHeight: lh, pad } = calcSpeechMetrics(width);
        ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
        const linesA = wrapText(ctx, String(info.lineA), maxW - pad * 2);
        const rawWA = Math.max(Math.max(120, Math.round(fontSize*6)), ...linesA.map(l=> ctx.measureText(l).width));
        const wA = Math.min(maxW, rawWA + pad * 2);
        const hA = linesA.length * lh + pad * 2;
        ctx.save(); ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.shadowColor='rgba(0,0,0,0.15)'; ctx.shadowBlur=8; ctx.shadowOffsetY=1; roundRect(ctx, 12, topY, wA, hA, 12); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#111'; ctx.textBaseline='alphabetic'
        linesA.forEach((l,ix)=> ctx.fillText(l, 12 + pad, topY + pad + (ix + 1) * lh - Math.round(fontSize*0.25)))
      }
      if (useCharacterB && info?.lineB) {
        const { fontSize, lineHeight: lh, pad } = calcSpeechMetrics(width);
        ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
        const linesB = wrapText(ctx, String(info.lineB), maxW - pad * 2);
        const rawWB = Math.max(Math.max(120, Math.round(fontSize*6)), ...linesB.map(l=> ctx.measureText(l).width));
        const wB = Math.min(maxW, rawWB + pad * 2);
        const hB = linesB.length * lh + pad * 2;
        const xRight = width - wB - 12;
        ctx.save(); ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.shadowColor='rgba(0,0,0,0.15)'; ctx.shadowBlur=8; ctx.shadowOffsetY=1; roundRect(ctx, xRight, topY, wB, hB, 12); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#111'; ctx.textBaseline='alphabetic'
        linesB.forEach((l,ix)=> ctx.fillText(l, xRight + pad, topY + pad + (ix + 1) * lh - Math.round(fontSize*0.25)))
      }
      y += height;
      if (i < PANEL_COUNT - 1) { y += MARGIN; }
    }
    ctx.fillStyle = '#000';
    ctx.fillRect(0, y, width, SEP);
    return c.toDataURL('image/png');
  };

  const composePanelToDataURL = async (panel: Panel, w: number, h: number)=>{
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    if(!ctx) return "";
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,w,h);
    const url = panel.generatedImage || makePlaceholder(w, h, `Panel ${panel.index+1}`);
    const img = await loadImage(url);
    ctx.drawImage(img,0,0,w,h);
    const info = panel;
    const maxW = Math.floor(w * 0.5);
    const topY = Math.round(Math.max(24, h * 0.04));
    if (info?.lineA){
      const { fontSize, lineHeight: lh, pad } = calcSpeechMetrics(w);
      ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
      const linesA = wrapText(ctx, String(info.lineA), maxW - pad*2);
      const rawWA = Math.max(Math.max(120, Math.round(fontSize*6)), ...linesA.map(l=> ctx.measureText(l).width));
      const wA = Math.min(maxW, rawWA + pad * 2);
      const hA = linesA.length * lh + pad * 2;
      ctx.save(); ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.shadowColor='rgba(0,0,0,0.15)'; ctx.shadowBlur=8; ctx.shadowOffsetY=1; roundRect(ctx, 12, topY, wA, hA, 12); ctx.fill(); ctx.restore();
      ctx.fillStyle='#111'; ctx.textBaseline='alphabetic';
      linesA.forEach((l,ix)=> ctx.fillText(l, 12 + pad, topY + pad + (ix + 1) * lh - Math.round(fontSize*0.25)));
    }
    if (useCharacterB && info?.lineB){
      const { fontSize, lineHeight: lh, pad } = calcSpeechMetrics(w);
      ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
      const linesB = wrapText(ctx, String(info.lineB), maxW - pad*2);
      const rawWB = Math.max(Math.max(120, Math.round(fontSize*6)), ...linesB.map(l=> ctx.measureText(l).width));
      const wB = Math.min(maxW, rawWB + pad * 2);
      const hB = linesB.length * lh + pad * 2;
      const xRight = w - wB - 12;
      ctx.save(); ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.shadowColor='rgba(0,0,0,0.15)'; ctx.shadowBlur=8; ctx.shadowOffsetY=1; roundRect(ctx, xRight, topY, wB, hB, 12); ctx.fill(); ctx.restore();
      ctx.fillStyle='#111'; ctx.textBaseline='alphabetic';
      linesB.forEach((l,ix)=> ctx.fillText(l, xRight + pad, topY + pad + (ix + 1) * lh - Math.round(fontSize*0.25)));
    }
    return c.toDataURL('image/png');
  };

  const openComposePreview = async () => {
    setOverlayLabel(t('overlay.composingImages'));
    try {
      const url = await composeToDataURL();
      setComposePreview(url);
      setShowComposeModal(true);
    } catch (e: any) {
      alert(`${t('alert.mergeFailed')}: ${e?.message || e}`);
    } finally {
      setOverlayLabel(null);
    }
  };

  const resetAll = () => {
    if (!confirm(t('confirm.resetAll'))) return;
    setCharacters([emptyCharacter('A', t('character.A')), emptyCharacter('B', t('character.B'))]);
    setUseCharacterB(false);
    setTone('story.boke_tsukkomi');
    setOverallDesc('');
    setPanels(Array.from({ length: PANEL_COUNT }, (_, i) => emptyPanel(i)));
    setWidth(DEFAULT_WIDTH);
  };

  const guessBFromText = (s: string) => {
    if (!s) return false;
    return /\u4E8C\u4EBA|\uFF12\u4EBA|2\u4EBA|\u3075\u305F\u308A|two\s+(girls|people|characters)|2\s*(girls|people|characters)|A\u3068B/.test(s);
  };

  const autoScript = async () => {
    setOverlayLabel(t('overlay.generatingScript'));
    try {
      const wantB = useCharacterB || guessBFromText(overallDesc);
      // FIX: Changed snake_case properties to camelCase to match function definition.
      const scriptData = await generateScriptPanels({ overallDesc: overallDesc, tone: t(tone), useCharacterB: wantB });
      
      const scriptPanels = scriptData.panels || [];
      const needB = scriptPanels.some(p => !!(p?.lineB && String(p.lineB).trim())) || !!scriptData.characters?.B;
      const newUseB = useCharacterB || wantB || needB;
      setUseCharacterB(newUseB);

      const shotValues = new Set(shotOptions.map(s => s.value));
      const isAllowedShot = (s?: string) => {
        if (!s || !shotValues.has(s)) return false;
        if (!newUseB && (/_B$/.test(s) || s === 'two_shot')) return false;
        return true;
      };

      // FIX: Add explicit Panel return type to map callback to ensure correct type inference for 'status'.
      const newPanels: Panel[] = panels.map((p, idx) => ({
        ...p,
        desc: scriptPanels[idx]?.desc || '',
        lineA: scriptPanels[idx]?.lineA || '',
        lineB: newUseB ? (scriptPanels[idx]?.lineB || '') : '',
        shot: isAllowedShot(scriptPanels[idx]?.shot as string) ? (scriptPanels[idx]?.shot as string) : p.shot,
        drawingDataURL: null, generatedImage: null, status: 'draft',
      }));
      setPanels(newPanels);

      const charA = scriptData.characters?.A || {};
      const charB = scriptData.characters?.B || {};
      const newCharacters = [
        { ...emptyCharacter('A', t('character.A')), name: charA.name || 'Character A', prompt: charA.prompt || '', stylePreset: artTone },
        newUseB
          ? { ...emptyCharacter('B', t('character.B')), name: charB.name || 'Character B', prompt: charB.prompt || '', stylePreset: artTone }
          : { ...emptyCharacter('B', t('character.B')), stylePreset: artTone }
      ];
      setCharacters(newCharacters);

      let urlA: string | null = null;
      let urlB: string | null = null;
      if (autoPlan !== 'script') {
        urlA = await generateCharacter(0, { name: charA.name, prompt: charA.prompt, stylePreset: artTone, refs: [] });
        if (newUseB) {
          urlB = await generateCharacter(1, { name: charB.name, prompt: charB.prompt, stylePreset: artTone, refs: [] });
        }
      }

      if (autoPlan === 'full') {
        setOverlayLabel(t('overlay.generatingPanels'));
        const charactersForGen = [...newCharacters];
        if(urlA) charactersForGen[0].generated = urlA;
        if(urlB) charactersForGen[1].generated = urlB;

        const genUrls: (string | null)[] = [];
        for (let i = 0; i < PANEL_COUNT; i++) {
          genUrls[i] = await generateViaAPI(i, { characters: charactersForGen, useCharacterB: newUseB, panels: newPanels });
        }
        setOverlayLabel(t('overlay.composingImages'));
        const url = await composeToDataURL(genUrls, newPanels);
        setComposePreview(url);
        setShowComposeModal(true);
      }
    } catch (e: any) {
      alert(`${t('alert.scriptGenFailed')}: ${e?.message || e}`);
    } finally {
      setOverlayLabel(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {showGuide && <GuideModal onClose={closeGuide} />}
      {overlayLabel && <LoadingOverlay label={overlayLabel} />}
      {showComposeModal && composePreview && (
        <ComposePreviewModal
          url={composePreview}
          onClose={() => { setShowComposeModal(false); setComposePreview(null); }}
          onDownload={() => { downloadDataURL(composePreview, `${FILE_BASENAME}_vertical.png`); }}
        />
      )}
      <Header onPreview={openComposePreview} onReset={resetAll} />

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-3">
        <section className="lg:col-span-1 space-y-6">
          <AutoScriptCard {...{ overallDesc, setOverallDesc, tone, setTone, artTone, setArtTone, autoPlan, setAutoPlan, onAutoScript: autoScript }}/>
          <CharactersSection {...{ characters, setCharacters, useCharacterB, setUseCharacterB, onUploadCharacterRefs: uploadCharacterRefs, onGenerateCharacter: generateCharacter }} />
        </section>

        <section className="lg:col-span-2 space-y-6">
          {panels.map((p, i) => (
            <PanelCard
              key={i} panel={p} width={width} height={height} useCharacterB={useCharacterB}
              onChange={(patch) => setPanels(prev => prev.map(pp => pp.index === i ? { ...pp, ...patch } : pp))}
              onOpenCanvas={() => setPanels(prev => prev.map(pp => pp.index === i ? { ...pp, _editingCanvas: true } : pp))}
              onCloseCanvas={() => setPanels(prev => prev.map(pp => pp.index === i ? { ...pp, _editingCanvas: false } : pp))}
              onSaveSketch={(url) => saveSketch(i, url)}
              onUploadReplace={(files) => replaceCanvasWithUpload(i, files)}
              onConfirmOverwrite={() => confirmOverwrite(i)}
              onCancelOverwrite={() => cancelOverwrite(i)}
              onGenerate={() => generateViaAPI(i)}
              onRegenerate={() => generateViaAPI(i)}
              onDownload={() => { const url = p.generatedImage || makePlaceholder(width, height, `Panel ${i + 1}`); downloadDataURL(url, `${FILE_BASENAME}_panel${i + 1}.png`); }}
              onDownloadWithSpeech={async () => { const url = await composePanelToDataURL(p, width, height); downloadDataURL(url, `${FILE_BASENAME}_panel${i + 1}_speech.png`); }}
            />
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}