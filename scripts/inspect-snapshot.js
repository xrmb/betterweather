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

const thumbRe = /background-image: url\(&quot;([^&]+)&quot;\)/g;
const labelRe = /<span class="block text-sm font-semibold[^"]*">([^<]+)<\/span>/;
const premiumRe = /\b(?:premium|locked)\b|bg-blue-600|text-amber-600/;

let m, items = [];
while ((m = thumbRe.exec(html)) !== null) {
    const thumb = m[1];
    const idx = m.index;

    // find the containing button
    const btnStart = html.lastIndexOf('<button', idx);
    const btnEnd = html.indexOf('</button>', idx);
    const block = (btnStart >= 0 && btnEnd > btnStart)
        ? html.slice(btnStart, btnEnd + 9)
        : html.slice(Math.max(0, idx - 400), idx + 400);

    const labelMatch = block.match(labelRe);
    const premiumMatch = premiumRe.test(block);
    if (labelMatch) {
        items.push({ label: labelMatch[1], thumb: thumb, premium: premiumMatch });
    }
}
console.log('Found', items.length, 'menu items');
items.forEach(i => console.log(i.premium ? '[P]' : '[F]', i.label, '->', i.thumb));
