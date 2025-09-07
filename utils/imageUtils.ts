
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function makePlaceholder(w: number, h: number, label = 'Not generated'): string {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  if (!x) return '';
  x.fillStyle = '#f6f6f7';
  x.fillRect(0, 0, w, h);
  x.strokeStyle = '#e2e2e6';
  for (let i = -h; i < w + h; i += 24) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i + h, h);
    x.stroke();
  }
  x.fillStyle = '#111';
  x.font = '600 20px ui-sans-serif, system-ui, sans-serif';
  x.textAlign = 'center';
  x.fillText(label, w / 2, h / 2);
  return c.toDataURL('image/png');
}

export function downloadDataURL(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = url;
  });
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const chars = text.split("");
  const lines: string[] = [];
  let line = "";
  for (const ch of chars) {
    const t = line + ch;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = ch;
    } else {
      line = t;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export function calcSpeechMetrics(containerW: number) {
  const base = Math.max(16, Math.round(containerW * 0.022)); // 1024px -> ~22px
  const fontSize = Math.min(36, base);
  const lineHeight = Math.round(fontSize * 1.25);
  const pad = Math.round(fontSize * 0.9);
  return { fontSize, lineHeight, pad };
}
