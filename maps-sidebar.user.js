// ==UserScript==
// @name         weather.maps-sidebar
// @namespace    weather
// @description  adds a fast map selector toolbar on the right side
// @author       xrmb
// @version      5
// @updateURL    https://raw.githubusercontent.com/xrmb/betterweather/main/maps-sidebar.user.js
// @downloadURL  https://raw.githubusercontent.com/xrmb/betterweather/main/maps-sidebar.user.js
// @match        https://weather.com/weather/radar/interactive/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const SIDEBAR_ID = 'weather-classic-sidebar';
    const TOOLBAR_SEL = '[role="toolbar"][aria-label="Map layer selector"]';

    const classicMaps = ['radar', 'clouds', 'temperatures', 'feelsLike', 'dewPoint', 'precipPast24', 'snowPast24', 'windSpeed'];
    const imgname = { temperatures: 'temps', dewPoint: 'dewpoint' };
    const labelToMap = {
        'High-Res 6-Hr Radar': 'radar',
        'Long Range 24-Hr Radar': 'radar',
        'Radar and Clouds': 'radar',
        'Clouds': 'clouds',
        'Temperatures': 'temperatures',
        'Feels Like': 'feelsLike',
        'Dew Point': 'dewPoint',
        'Past 24-Hour Precipitation': 'precipPast24',
        'Past 24-Hour Snowfall': 'snowPast24',
        'Wind Speed': 'windSpeed'
    };

    let iv = 0;
    let attempts = 200;

    let isPremium = function(btn) {
        let text = (btn.innerText || btn.textContent || '').trim();
        if (/premium|locked/i.test(text)) return true;
        if (btn.querySelector('svg[class*="text-amber-600"]')) return true;
        let svgTitle = btn.querySelector('svg title');
        if (svgTitle && /locked|premium/i.test(svgTitle.textContent)) return true;
        return false;
    };

    let isNav = function(btn) {
        let text = (btn.innerText || btn.textContent || '').trim();
        return text === 'Map menu' || text === 'Chevron Left' || text === 'Chevron Right';
    };

    let shortLabel = function(text) {
        return text.replace(/\s*\(.*?\)/g, '').split(/\s+/).map(function(w) { return w[0]; }).join('').slice(0, 4).toUpperCase();
    };

    let findOldIcon = function(mapKey) {
        if (!mapKey) return null;
        let name = imgname[mapKey] || mapKey;
        return document.querySelector('img[src*="/' + name + '."]');
    };

    let findThumbnailForLabel = function(label) {
        let thumbs = Array.from(document.querySelectorAll('span[aria-hidden="true"].rounded-full.bg-cover.bg-center'));
        for (let i = 0; i < thumbs.length; i++) {
            let btn = thumbs[i].closest('button');
            let t = btn ? (btn.innerText || btn.textContent || '').trim() : '';
            if (t.indexOf(label) !== 0) continue;
            let bg = window.getComputedStyle(thumbs[i]).backgroundImage;
            let m = bg.match(/url\(["']?([^"')]+)["']?\)/);
            if (m) return m[1];
            let style = thumbs[i].getAttribute('style') || '';
            m = style.match(/url\(&quot;([^&]+)&quot;\)/);
            if (m) return m[1].replace(/&amp;/g, '&');
        }
        return null;
    };

    let findToolbarContainer = function(toolbar) {
        return toolbar.closest('.items-center.gap-2.w-max') || toolbar.parentElement;
    };

    let openMapMenu = function(toolbar) {
        let container = findToolbarContainer(toolbar);
        if (!container) return false;
        let menuBtn = Array.from(container.querySelectorAll('button')).filter(function(b) {
            let t = (b.innerText || b.textContent || '').trim();
            return t === 'Map menu';
        })[0];
        if (!menuBtn) return false;
        let pressed = menuBtn.getAttribute('aria-pressed');
        let label = menuBtn.getAttribute('aria-label') || '';
        if (pressed === 'true' || label.indexOf('Close') >= 0) return true;
        menuBtn.click();
        return false;
    };

    let buildSidebar = function() {
        let toolbar = document.querySelector(TOOLBAR_SEL);
        if (!toolbar) return false;

        if (!openMapMenu(toolbar)) return false;
        if (document.querySelectorAll('span[aria-hidden="true"].rounded-full.bg-cover.bg-center').length === 0) return false;

        let buttons = Array.from(toolbar.querySelectorAll('button'));
        if (buttons.length === 0) return false;

        let mapButtons = buttons.filter(function(b) {
            if (isNav(b) || isPremium(b)) return false;
            let text = (b.innerText || b.textContent || '').trim();
            return labelToMap[text] && classicMaps.indexOf(labelToMap[text]) >= 0;
        });
        if (mapButtons.length === 0) return false;

        let seen = {};
        mapButtons = mapButtons.filter(function(b) {
            let key = labelToMap[(b.innerText || b.textContent || '').trim()];
            if (seen[key]) return false;
            seen[key] = true;
            return true;
        });

        let oldSidebar = document.getElementById(SIDEBAR_ID);
        if (oldSidebar) oldSidebar.remove();

        let container = findToolbarContainer(toolbar);
        let menuBtn = container ? Array.from(container.querySelectorAll('button')).filter(function(b) {
            let t = (b.innerText || b.textContent || '').trim();
            return t === 'Map menu';
        })[0] : null;
        let menuLabel = menuBtn ? (menuBtn.getAttribute('aria-label') || '') : '';
        if (menuBtn && menuLabel.indexOf('Close') >= 0) menuBtn.click();

        let nativeContainer = toolbar.closest('.items-center.gap-2.w-max') || toolbar.parentElement;
        if (nativeContainer) nativeContainer.style.display = 'none';

        let sidebar = document.createElement('div');
        sidebar.id = SIDEBAR_ID;
        Object.assign(sidebar.style, {
            position: 'fixed',
            right: '0px',
            top: '56px',
            width: '48px',
            zIndex: '2147483647',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        });

        // remove native zoom/fullscreen/find-my-location controls and move search up to make room
        ['Zoom In', 'Zoom Out', 'Enter fullscreen', 'Find my location'].forEach(function(label) {
            let btn = document.querySelector('button[aria-label="' + label + '"]');
            if (btn) btn.style.display = 'none';
        });

        // move search button to the top-right corner and align sidebar beneath it
        let searchBtn = document.querySelector('button[aria-label="Search location"]');
        if (searchBtn) {
            let rect = searchBtn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                let searchContainer = searchBtn.closest('div.absolute');
                if (searchContainer) {
                    searchContainer.style.top = '70px';
                    searchContainer.style.paddingRight = '12px';
                    searchContainer.style.justifyContent = 'flex-end';
                    rect = searchBtn.getBoundingClientRect();
                }
                sidebar.style.right = (window.innerWidth - rect.right) + 'px';
                sidebar.style.top = (rect.bottom + window.scrollY + 8) + 'px';
            }
        }

        mapButtons.forEach(function(btn) {
            let text = (btn.innerText || btn.textContent || '').trim();
            let mapKey = labelToMap[text];
            let iconImg = findOldIcon(mapKey);
            let thumbUrl = findThumbnailForLabel(text);

            let item = document.createElement('div');
            Object.assign(item.style, {
                cursor: 'pointer',
                width: '48px',
                height: '48px',
                boxSizing: 'border-box',
                borderRadius: '50%',
                border: '2px solid #555',
                background: '#252422',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                textAlign: 'center',
                lineHeight: '1',
                overflow: 'hidden'
            });
            item.title = text;

            if (iconImg && iconImg.src) {
                let img = document.createElement('img');
                img.src = iconImg.src;
                Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' });
                item.appendChild(img);
            } else if (thumbUrl) {
                let img = document.createElement('img');
                img.src = thumbUrl;
                Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' });
                item.appendChild(img);
            } else {
                item.textContent = shortLabel(text);
            }

            item.onclick = function() { btn.click(); };
            sidebar.appendChild(item);
        });

        document.body.appendChild(sidebar);
        return true;
    };

    let work = function() {
        attempts--;
        if (buildSidebar() || attempts <= 0) {
            clearInterval(iv);
            iv = 0;
        }
    };

    iv = setInterval(work, 200);
})();
