const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const hideSidebar = fs.readFileSync(path.join(__dirname, '..', 'hide-sidebar.user.js'), 'utf8');
    const mapsSidebar = fs.readFileSync(path.join(__dirname, '..', 'maps-sidebar.user.js'), 'utf8');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.0 Edg/126.0.0.0'
    });
    const page = await context.newPage();
    await page.setViewportSize({ width: 1400, height: 1000 });
    await page.goto('https://weather.com/weather/radar/interactive/l/23150:4:US?layer=radar', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(8000);

    await page.addScriptTag({ content: hideSidebar });
    await page.addScriptTag({ content: mapsSidebar });
    await page.waitForTimeout(2000);

    const results = await page.evaluate(() => {
        const nativeSidebar = document.querySelector('body > div:nth-of-type(2) > main > div > div > div > div:nth-of-type(2) > div:nth-of-type(2)');
        const classicSidebar = document.getElementById('weather-classic-sidebar');
        const adAside = document.querySelector('aside[aria-label="Promotions"]');
        const thumbs = document.querySelectorAll('span[aria-hidden="true"].rounded-full.bg-cover.bg-center');
        let thumbInfo = { count: thumbs.length, sampleClass: thumbs.length ? thumbs[0].className : null, sampleStyle: thumbs.length ? thumbs[0].getAttribute('style') : null };
        let itemInfo = [];
        if (classicSidebar) {
            Array.from(classicSidebar.children).forEach(function(child) {
                let img = child.querySelector('img');
                itemInfo.push({ title: child.title, hasImg: !!img, imgSrc: img ? img.src : null, text: child.textContent });
            });
        }
        return {
            adAsideDisplay: adAside ? adAside.style.display : 'not-found',
            nativeSidebarDisplay: nativeSidebar ? nativeSidebar.style.display : 'not-found',
            classicSidebarExists: !!classicSidebar,
            classicSidebarItemCount: classicSidebar ? classicSidebar.children.length : 0,
            thumbInfo: thumbInfo,
            itemInfo: itemInfo
        };
    });

    const screenshotPath = path.join(__dirname, '..', 'snapshots', 'verify-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Screenshot:', screenshotPath);
    console.log(JSON.stringify(results, null, 2));
    await browser.close();
})();
