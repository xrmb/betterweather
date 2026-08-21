const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const outDir = path.join(__dirname, '..', 'snapshots');
    fs.mkdirSync(outDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const harPath = path.join(outDir, `radar-${ts}.har`);
    const domPath = path.join(outDir, `radar-${ts}.html`);
    const screenshotPath = path.join(outDir, `radar-${ts}.png`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.0 Edg/126.0.0.0',
        recordHar: { path: harPath, mode: 'full' }
    });
    const page = await context.newPage();
    await page.setViewportSize({ width: 1400, height: 1000 });
    await page.goto('https://weather.com/weather/radar/interactive/l/23150:4:US?layer=radar', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(8000);
    const html = await page.content();
    fs.writeFileSync(domPath, html);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await context.close();
    await browser.close();
    console.log('Saved:', domPath, harPath, screenshotPath);
})();
