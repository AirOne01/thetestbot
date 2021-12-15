import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import {log, ok} from './util';
import {connectWebClient} from './webClient';

puppeteer.use(StealthPlugin());

(async () => {
    log("Starting browser... (this is where shit happens)");
    const browser = await puppeteer.launch({
        // running in headless won't allow plugins, thus we can't use the captcha plugin
        headless: false,
        ignoreDefaultArgs: [
            "--disable-extensions",
            "--enable-automation"
        ],
        args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--allow-running-insecure-content',
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--mute-audio',
            '--no-zygote',
            '--no-xshm',
            '--window-size=1920,1080',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--enable-webgl',
            '--ignore-certificate-errors',
            '--lang=en-US,en;q=0.9',
            '--password-store=basic',
            '--disable-gpu-sandbox',
            '--disable-software-rasterizer',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-infobars',
            '--disable-breakpad',
            '--disable-canvas-aa',
            '--disable-2d-canvas-clip-aa',
            '--disable-gl-drawing-for-tests',
            '--enable-low-end-device-mode',
            '--disable-extensions-except=./plugin',
            '--load-extension=./plugin'
        ]
    });
    ok("Browser started");

    await connectWebClient(browser);
})();