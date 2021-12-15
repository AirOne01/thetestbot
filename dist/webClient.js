"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectWebClient = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prompts_1 = __importDefault(require("prompts"));
const util_1 = require("./util");
let captchaKey = null;
async function connectWebClient(browser) {
    const filePath = path_1.default.join(__dirname, '../creds.yml');
    let page = await browser.newPage();
    await page.goto('https://discord.com/login', { waitUntil: 'networkidle2' });
    let username;
    let password;
    console.log();
    if (fs_1.default.existsSync(filePath)) {
        // if the file exists, load the username and password from it
        (0, util_1.log)(`Using credentials from ${filePath}`);
        username = (0, util_1.getKey)(filePath, 'username');
        password = (0, util_1.getKey)(filePath, 'password');
        captchaKey = (0, util_1.getKey)(filePath, 'captchaKey');
    }
    else {
        await (async () => {
            // else ask for the username and password in the terminal
            username = (await (0, prompts_1.default)({
                type: 'text',
                name: 'username',
                message: 'Discord username:'
            })).username;
            password = (await (0, prompts_1.default)({
                type: 'password',
                name: 'password',
                message: 'Discord password:'
            })).password;
        })();
    }
    // login
    (0, util_1.log)(`Logging in as "${username}"`);
    await page.type('input[name="email"]', username, { delay: 20 });
    await page.type('input[name="password"]', password, { delay: 20 });
    await page.click('button[type="submit"]');
    const captcha = new Captcha(captchaKey);
    //await setTimeout(captcha.findId, 2000, page)  // get captcha id
    (0, util_1.ok)(`Found hCaptcha API site id: "${captcha.id}"`);
    await captcha.resolve(); // send the infos to the captcha solver
    // then get the response
    let i = 1;
    while (i <= 10) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const res = await captcha.getSolution();
        if (i == 10 && !res) {
            (0, util_1.err)('Could not find captcha solution');
            process.exit(1);
        }
        if (res)
            i = 11;
        i++;
    }
    (0, util_1.ok)(`Captcha solved successfully !`);
    return page;
}
exports.connectWebClient = connectWebClient;
class Captcha {
    id = 'f5561ba9-8f1e-40ca-9b5b-a0b3f719ef34';
    key;
    taskId;
    solution;
    constructor(key) {
        this.key = key;
    }
    async findId(page) {
        this.id = await page.evaluate(() => {
            // wait for the captcha to appear
            const captcha = document.querySelector('iframe[title="widget containing checkbox for hCaptcha security challenge"]');
            // get captcha key (noted as id)
            return captcha['src'].match(/[0-9a-z]{8}-(?:[0-9a-z]{4}-){3}[0-9a-z]{12}/g)[0];
        });
        if (!this.id) {
            (0, util_1.err)('Could not find captcha ID');
            process.exit(1);
        }
    }
    async resolve() {
        let i = 1;
        while (i <= 5) {
            (0, util_1.log)(`Requesting captcha... (take ${i}/5)`);
            i++;
            const res = (await (0, axios_1.default)({
                method: 'POST',
                url: 'https://api.anti-captcha.com/createTask',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                data: {
                    'clientKey': this.key,
                    'task': {
                        'type': 'HCaptchaTaskProxyless',
                        'websiteURL': 'https://discord.com/',
                        'websiteKey': this.id
                    }
                }
            })).data;
            if (res.hasOwnProperty('errorId') && res.hasOwnProperty('taskId') && res['errorId'] == 0) {
                (0, util_1.ok)(`Successfully requested captcha, got captcha ID "${res['taskId']}"`);
                return this.taskId = res['taskId']; // success, return task id
            }
            else {
                if (i > 5) {
                    (0, util_1.err)('Could not solve captcha');
                    console.log(res);
                    process.exit(1);
                }
                else
                    (0, util_1.warn)('Solving failed');
            }
        }
        (0, util_1.ok)('Request accepted');
    }
    async getSolution() {
        const res = (await (0, axios_1.default)({
            method: 'GET',
            url: 'https://api.anti-captcha.com/getTaskResult',
            data: {
                'clientKey': this.key,
                'taskId': this.taskId
            }
        })).data;
        if (res.hasOwnProperty('status') && res['status'] == 'ready' && res.hasOwnProperty('solution')) {
            (0, util_1.ok)(`Found captcha solution: ${res['solution']['gRecaptchaResponse'].substring(0, 20)}...`);
            this.solution = res['solution']['gRecaptchaResponse'];
            return this.solution;
        }
        else if (res.hasOwnProperty('status') && res['status'] == 'processing') {
            (0, util_1.log)('Captcha is still processing...');
            return null;
        }
    }
}
//# sourceMappingURL=webClient.js.map