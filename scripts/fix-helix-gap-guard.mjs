import fs from 'node:fs';

const enginePath = 'public/assets/js/mmengine.js';
let engine = fs.readFileSync(enginePath, 'utf8');

const updateNeedle = "const effectiveAngles = ring.gaps.map(g => ((g + this.rotation + (ring.moving ? Math.sin(this.time * 1.5 + ring.phase) * 0.5 : 0)) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));";
const updateReplacement = "const safeGaps = Array.isArray(ring.gaps) ? ring.gaps : [];\n        const effectiveAngles = safeGaps.map(g => ((g + this.rotation + (ring.moving ? Math.sin(this.time * 1.5 + ring.phase) * 0.5 : 0)) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));";

const renderNeedle = "const inGap = ring.gaps.some(g => {";
const renderReplacement = "const safeGaps = Array.isArray(ring.gaps) ? ring.gaps : [];\n        const inGap = safeGaps.some(g => {";

if (!engine.includes(updateNeedle)) throw new Error('Helix update gap expression not found');
if (!engine.includes(renderNeedle)) throw new Error('Helix render gap expression not found');
engine = engine.replace(updateNeedle, updateReplacement).replace(renderNeedle, renderReplacement);
fs.writeFileSync(enginePath, engine);

const smokePath = 'scripts/remediation-smoke.mjs';
let smoke = fs.readFileSync(smokePath, 'utf8');
if (!smoke.includes("'scanline-sprint'")) {
  smoke = smoke.replace("'pixel-panda-parkour-standalone','pixel-prawn-deep-sea-debugger-standalone','boom-bap-cannon',", "'scanline-sprint','pixel-panda-parkour-standalone','pixel-prawn-deep-sea-debugger-standalone','boom-bap-cannon',");
}
if (!smoke.includes("'scanline-sprint'")) throw new Error('Scanline Sprint smoke target insertion failed');
fs.writeFileSync(smokePath, smoke);

console.log('Guarded Helix ring gaps and added Scanline Sprint to permanent smoke coverage.');
