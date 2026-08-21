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

// Extract left nav labels from <p> tags with the current text-xxs/text-white + font-semibold/font-bold classes.
const labelPs = [];
const pRe = /<p[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/p>/g;
const navClassRe = /text-(?:xxs|white|inherit).*font-(?:semibold|bold)|font-(?:semibold|bold).*text-(?:xxs|white|inherit)/;
let m;
while ((m = pRe.exec(html)) !== null) {
    const cls = m[1];
    if (!navClassRe.test(cls)) continue;
    const text = m[2]
        .replace(/<[^>]*\bhidden\b[^>]*>[\s\S]*?<\/[^>]+>/g, '')
        .replace(/<[^>]+>/g, '')
        .trim();
    labelPs.push({ text: text, start: m.index, cls: cls });
}

const markers = ['The Weather Channel', 'Forecasts', 'Radar', 'Video', 'Explore', 'More', 'Sign in', 'Upgrade'];
markers.forEach(marker => {
    let match = labelPs.find(x => x.text === marker);
    if (!match) match = labelPs.find(x => x.text.indexOf(marker) === 0);
    if (match) {
        const snippet = html.slice(Math.max(0, match.start - 200), match.start + 200);
        console.log('\n---', marker, '---');
        console.log(snippet.slice(0, 400));
    } else if (marker === 'The Weather Channel') {
        // The logo is an SVG image, not text.
        console.log('\n---', marker, '---');
        console.log('(logo / SVG image, no text label)');
    }
});
