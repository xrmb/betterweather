const fs = require('fs');
const path = require('path');

function latestRadarSnapshot() {
    const dir = path.join(__dirname, '..', 'snapshots');
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir)
        .filter(f => /^radar-.*\.html$/.test(f))
        .sort();
    return files.length ? path.join(dir, files[files.length - 1]) : null;
}

const html = fs.readFileSync(process.argv[2] || latestRadarSnapshot(), 'utf8');

const labels = ['Search location', 'Find my location', 'Zoom In', 'Zoom Out', 'Enter fullscreen'];
labels.forEach(label => {
    const idx = html.indexOf(`aria-label="${label}"`);
    if (idx < 0) { console.log(label, 'not found'); return; }
    const snippet = html.slice(Math.max(0, idx - 200), idx + 200);
    console.log('\n---', label, '---');
    console.log(snippet);
});
