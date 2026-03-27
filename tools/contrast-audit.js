const fs = require('fs');
const path = require('path');

function hexToRgb(hex) {
  if (!hex) return null;
  const h = hex.replace(/\s/g, '');
  const m = h.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return null;
  let hexVal = m[1];
  if (hexVal.length === 3) {
    hexVal = hexVal.split('').map(ch => ch+ch).join('');
  }
  const intVal = parseInt(hexVal, 16);
  return [(intVal >> 16) & 255, (intVal >> 8) & 255, intVal & 255];
}

function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(rgb) {
  const [r,g,b] = rgb.map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(rgb1, rgb2) {
  const L1 = luminance(rgb1);
  const L2 = luminance(rgb2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseCssVars(filePath) {
  const css = fs.readFileSync(filePath, 'utf8');
  // Extract all :root { ... } blocks and merge them so we capture any later additions
  let rootBlock = '';
  let searchIndex = 0;
  while (true) {
    const rootIndex = css.indexOf(':root', searchIndex);
    if (rootIndex === -1) break;
    const start = css.indexOf('{', rootIndex);
    if (start === -1) break;
    let depth = 0;
    let end = -1;
    for (let i = start; i < css.length; i++) {
      const ch = css[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end !== -1) {
      rootBlock += css.slice(start + 1, end) + '\n';
      searchIndex = end + 1;
    } else break;
  }

  const vars = {};
  const re = /--([a-zA-Z0-9-_]+):\s*([^;\n\r]+)/g;
  let m;
  while ((m = re.exec(rootBlock))) {
    vars[m[1]] = m[2].trim();
  }
  return vars;
}

const cssPath = path.join(__dirname, '..', 'frontend', 'src', 'styles', 'colors.css');
if (!fs.existsSync(cssPath)) {
  console.error('colors.css not found at', cssPath);
  process.exit(2);
}

const vars = parseCssVars(cssPath);

// helper to resolve var references like var(--color-primary) or rgba(...) or hex
function resolveValue(val) {
  if (!val) return null;
  val = val.split(/\)\s*$/)[0];
  val = val.replace(/^var\(|^rgba?\(|\)$/g, '').trim();
  if (val.startsWith('--')) {
    const ref = val.replace(/^--/, '');
    return vars[ref] || null;
  }
  return val;
}

function toRgbFromToken(token) {
  const raw = vars[token] || null;
  if (!raw) return null;
  const v = raw.trim();
  // only accept hex for now
  const hexMatch = v.match(/#([0-9a-fA-F]{3,6})/);
  if (hexMatch) return hexToRgb(hexMatch[0]);
  // rgba() or rgb()
  const rgbMatch = v.match(/rgba?\(([^)]+)\)/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map(p => p.trim());
    return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])];
  }
  return null;
}

// pairs to check (light theme root values)
const checks = [
  { name: 'base-content on base-100', fg: 'color-base-content', bg: 'color-base-100', min: 4.5 },
  { name: 'primary on base-100', fg: 'color-primary', bg: 'color-base-100', min: 4.5 },
  { name: 'primary-600 on base-100', fg: 'color-primary-600', bg: 'color-base-100', min: 4.5 },
  { name: 'accent on base-100', fg: 'color-accent', bg: 'color-base-100', min: 4.5 },
  { name: 'secondary on base-100', fg: 'color-secondary', bg: 'color-base-100', min: 4.5 },
  { name: 'muted on base-100', fg: 'color-muted', bg: 'color-base-100', min: 4.5 },
  { name: 'info on base-100', fg: 'color-info', bg: 'color-base-100', min: 4.5 },
  { name: 'success on base-100', fg: 'color-success', bg: 'color-base-100', min: 4.5 },
  { name: 'warning on base-100', fg: 'color-warning', bg: 'color-base-100', min: 4.5 },
  { name: 'error on base-100', fg: 'color-error', bg: 'color-base-100', min: 4.5 },
  { name: 'on-primary contrast (primary-contrast on primary)', fg: 'color-primary-contrast', bg: 'color-primary', min: 4.5 },
  { name: 'on-accent contrast (accent-contrast on accent)', fg: 'color-accent-contrast', bg: 'color-accent', min: 4.5 },
];

function valToRgb(tokenOrVal) {
  if (!tokenOrVal) return null;
  // token name without var prefix
  if (vars[tokenOrVal]) return toRgbFromToken(tokenOrVal);
  // if direct hex
  const hexMatch = tokenOrVal.match(/#([0-9a-fA-F]{3,6})/);
  if (hexMatch) return hexToRgb(hexMatch[0]);
  return null;
}

console.log('Loaded CSS variables:', Object.keys(vars).length);

const results = [];
for (const c of checks) {
  const fgRgb = valToRgb(c.fg) || (()=>{ const v=vars[c.fg]; return v? valToRgb(c.fg): null;})();
  const bgRgb = valToRgb(c.bg) || (()=>{ const v=vars[c.bg]; return v? valToRgb(c.bg): null;})();
  if (!fgRgb || !bgRgb) {
    results.push({ name: c.name, ok: false, reason: 'missing token', fg: vars[c.fg], bg: vars[c.bg] });
    continue;
  }
  const r = contrast(fgRgb, bgRgb);
  results.push({ name: c.name, ratio: Number(r.toFixed(2)), ok: r >= c.min, fg: vars[c.fg], bg: vars[c.bg], min: c.min });
}

console.log('Contrast audit results:');
results.forEach((res) => {
  if (res.ok) {
    console.log(`✅ ${res.name}: ${res.ratio} (fg=${res.fg} bg=${res.bg})`);
  } else if (res.ratio) {
    console.log(`⚠️ ${res.name}: ${res.ratio} — BELOW ${res.min}:1 (fg=${res.fg} bg=${res.bg})`);
  } else {
    console.log(`❌ ${res.name}: MISSING TOKEN or unparsable (fg=${res.fg} bg=${res.bg})`);
  }
});

// Exit with non-zero if any below threshold
if (results.some(r => r.ok === false && r.ratio && r.ratio < r.min)) process.exit(3);
process.exit(0);
