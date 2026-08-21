// ==UserScript==
// @name         weather.hide-sidebar
// @namespace    weather
// @description  removes the useless right sidebar
// @author       xrmb
// @updateURL    https://raw.githubusercontent.com/xrmb/betterweather/main/hide-sidebar.user.js
// @downloadURL  https://raw.githubusercontent.com/xrmb/betterweather/main/hide-sidebar.user.js
// @version      4
// @match        https://weather.com/weather/radar/interactive/*
// @match        https://weather.com/*/radar*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let iv = 0;
    let done = 0;
    let attempts = 300;
    let check = function()
    {
        if((done & 1) === 0)
        {
            let el1 = document.querySelector('.region-contentTop.regionContentTop');
            let el2 = document.querySelector('.region-sidebar.regionSidebar');
            if(el1 && el2)
            {
                el1.style.maxWidth = '100%';
                el2.style.width = '0';
                done = done | 1;
            }
        }

        if((done & 2) === 0)
        {
            let el3 = document.querySelector('button[class*=ControlPanel--hideMenuButton]');
            if(el3)
            {
                el3.click();
                done = done | 2;
            }
        }

        if((done & 4) === 0)
        {
            let adAside = document.querySelector('aside[aria-label="Promotions"]') ||
                          document.querySelector('body > div:nth-of-type(2) > main > div > div > aside');
            if(adAside)
            {
                adAside.style.display = 'none';
                done = done | 4;
            }
        }

        attempts--;
        if((done & 4) || attempts <= 0)
        {
            clearInterval(iv); iv = 0;
        }
    };

    iv = setInterval(check, 100);
})();