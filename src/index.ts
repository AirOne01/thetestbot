import pptr from 'puppeteer';

import {log, ok} from './util';
import {connectWebClient} from './webClient';

(async () => {
    log("Starting browser... (this is where shit happens)");
    const browser = await pptr.launch({
        headless: true,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    ok("Browser started");

    await connectWebClient(browser);
})();