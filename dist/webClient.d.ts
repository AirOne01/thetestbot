import pptr from 'puppeteer';
declare function connectWebClient(browser: pptr.Browser): Promise<pptr.Page>;
export { connectWebClient };
