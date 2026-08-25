const fs = require('fs');
const path = require('path');

const vaultDir = path.resolve(__dirname, '../../Aptis-AI-Brain');
const outDir = path.resolve(__dirname, '../data/knowledge');
const outFile = path.join(outDir, 'vault-compiled.json');

function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return { meta: {}, body: raw };
  const parts = raw.split('---', 3);
  if (parts.length < 3) return { meta: {}, body: raw };
  const yaml = parts[1];
  const body = parts[2].trim();
  const meta = {};
  for (const line of yaml.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0) {
      const k = trimmed.slice(0, colonIdx).trim();
      let v = trimmed.slice(colonIdx + 1).trim();
      const commentIdx = v.indexOf('#');
      if (commentIdx >= 0) v = v.slice(0, commentIdx).trim();
      v = v.replace(/^["']|["']$/g, '');
      if (v.toLowerCase() === 'true') meta[k] = true;
      else if (v.toLowerCase() === 'false') meta[k] = false;
      else if (/^\d+$/.test(v)) meta[k] = parseInt(v, 10);
      else if (v.startsWith('[') && v.endsWith(']')) {
        meta[k] = v.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      } else {
        meta[k] = v;
      }
    }
  }
  return { meta, body };
}

function mapSkill(rawSkill, folderPath) {
  const s = (rawSkill || '').toLowerCase();
  const f = (folderPath || '').toLowerCase();
  if (s.includes('grammar') || f.includes('02_grammar')) return 'Grammar';
  if (s.includes('vocab') || f.includes('03_vocabulary')) return 'Vocabulary';
  if (s.includes('read') || f.includes('06_reading')) return 'Reading';
  if (s.includes('listen') || f.includes('07_listening')) return 'Listening';
  if (s.includes('writ') || f.includes('04_writing')) return 'Writing';
  if (s.includes('speak') || f.includes('05_speaking')) return 'Speaking';
  return 'General';
}

function mapCategory(meta, folderPath) {
  const f = folderPath.toLowerCase();
  const t = (meta.type || '').toLowerCase();
  if (f.includes('02_grammar') || t.includes('grammar')) return 'Grammar';
  if (f.includes('03_vocabulary') || t.includes('vocab')) return 'Vocabulary';
  if (f.includes('06_reading') || f.includes('strategies/reading')) return 'Reading Strategy';
  if (f.includes('07_listening') || f.includes('strategies/listening')) return 'Listening Strategy';
  if (f.includes('04_writing') || f.includes('strategies/writing')) return 'Writing Strategy';
  if (f.includes('05_speaking') || f.includes('strategies/speaking')) return 'Speaking Strategy';
  if (f.includes('11_grading')) return 'Exam Strategy';
  if (f.includes('12_feedback')) return 'B2 Language Tips';
  if (f.includes('common error') || f.includes('common-error') || t.includes('error')) return 'Common Mistakes';
  if (f.includes('13_strategies') || t.includes('strategy')) return 'Exam Strategy';
  return 'B2 Language Tips';
}

const items = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.name.startsWith('.') || ent.name === 'node_modules') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full);
    } else if (ent.isFile() && ent.name.endsWith('.md')) {
      const raw = fs.readFileSync(full, 'utf-8');
      const rel = path.relative(vaultDir, full).replace(/\\/g, '/');
      const { meta, body } = parseFrontmatter(raw);

      const h1Match = body.match(/^#\s+(.+)$/m);
      const title = h1Match ? h1Match[1].replace(/^[^\w\s\u00C0-\u1EF9]+/, '').trim() : path.basename(ent.name, '.md');
      const cleanBody = body.replace(/^#+.*$/gm, '').replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1').trim();
      const summary = cleanBody.slice(0, 280).replace(/\r?\n+/g, ' ') + '...';

      const skill = mapSkill(meta.skill, rel);
      const category = mapCategory(meta, rel);
      const safeId = 'obs-' + rel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const tags = Array.isArray(meta.tags) ? meta.tags.map(t => String(t).toLowerCase()) : [];
      tags.push(skill.toLowerCase());
      tags.push(category.toLowerCase().replace(/\s+/g, '-'));
      if (meta.part) tags.push(`part${meta.part}`, `part-${meta.part}`);

      const wikiLinks = body.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g) || [];
      for (const wl of wikiLinks) {
        const link = wl.slice(2, -2).split('|')[0].split('/').pop()?.toLowerCase();
        if (link) tags.push(link);
      }

      items.push({
        id: safeId,
        skill,
        part: meta.part ? String(meta.part) : undefined,
        category,
        topic: title,
        summary,
        content: body,
        tags: Array.from(new Set(tags)),
        sourceFile: meta.source_file || path.basename(rel),
        sourceName: meta.provider ? `Edulife ${meta.provider}` : 'Edulife Knowledge Vault',
        sourceType: 'edulife',
        isOfficialBritishCouncil: false,
      });
    }
  }
}

if (fs.existsSync(vaultDir)) {
  walk(vaultDir);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ version: '1.0.0', compiledAt: new Date().toISOString(), totalNotes: items.length, items }, null, 2), 'utf-8');
  console.log(`Successfully compiled ${items.length} Obsidian notes to ${outFile}`);
} else {
  console.error(`Vault directory not found at ${vaultDir}`);
}
