import AdmZip from 'adm-zip';
import axios from 'axios';
import fs from 'fs';
import * as https from "https";
import path from 'path';
import pptr from 'puppeteer';
import prompts from 'prompts';

import {log, err, warn, ok, getKey} from './util';

let captchaKey: string = null;

async function connectWebClient(browser: pptr.Browser): Promise<pptr.Page> {
    const filePath = path.join(__dirname, '../creds.yml');

    let page = await browser.newPage();
    try {
        await page.goto('https://discord.com/login', {waitUntil: 'networkidle0'});
    } catch (e) {
        err('Could reach the login page' + e);
    }
    await page.setDefaultNavigationTimeout(0);  // disable navigation delay errors

    let username: string;
    let password: string;

    console.log();
    if (fs.existsSync(filePath)) {
        // if the file exists, load the username and password from it
        log(`Using credentials from ${filePath}`);
        username = getKey(filePath, 'username');
        password = getKey(filePath, 'password');
        captchaKey = getKey(filePath, 'captchaKey');
    } else {
        await (async () => {
            // else ask for the username and password in the terminal
            username = (await prompts({
                type: 'text',
                name: 'username',
                message: 'Discord username:'
            })).username;
            password = (await prompts({
                type: 'password',
                name: 'password',
                message: 'Discord password:'
            })).password;
        })();
    }

    // décompressez-le
    log('Extracting anti-captcha plugin...')
    const zip = new AdmZip("./plugin.zip");
    await zip.extractAllTo("./plugin/", true);

    // définissez la clé API dans le fichier de configuration
    await new Promise<void>((resolve, reject) => {
        log('Setting it up...');
        if (fs.existsSync('./plugin/js/config_ac_api_key.js')) {
            let confData = fs.readFileSync('./plugin/js/config_ac_api_key.js', 'utf8');
            confData = confData.replace(/antiCapthaPredefinedApiKey = ''/g, `antiCapthaPredefinedApiKey = '${captchaKey}'`);
            fs.writeFileSync('./plugin/js/config_ac_api_key.js', confData, 'utf8');
            resolve();
        } else {
            err('plugin configuration not found!')
            reject();
        }
    });

    // login
    log(`Logging in as "${username}"`);
    await page.type('input[name="email"]', username, {delay: 20});
    await page.type('input[name="password"]', password, {delay: 20});
    await page.click('button[type="submit"]');

    ////////////////////////////////////////////////////////////////////////////

    log('Solving captcha (waiting for selector)... This could take up to a minute.');
    await page.waitForSelector('div[href="/channels/@me"', {timeout: 120000}).catch(() => {
        err('Timed out waiting for the selector (120s).');
        process.exit(1);
    });

    ok('Successfully logged in !');

    return page;
}

class Captcha {
    public id: string = 'f5561ba9-8f1e-40ca-9b5b-a0b3f719ef34';
    public key: string;
    public taskId: string;
    public solution: string;

    public constructor(key: string) {
        this.key = key;
    }

    async findId(page: pptr.Page) {
        this.id = await page.evaluate(() => {
            // wait for the captcha to appear
            const captcha = document.querySelector('iframe[title="widget containing checkbox for hCaptcha security challenge"]');
            // get captcha key (noted as id)
            return captcha['src'].match(/[0-9a-z]{8}-(?:[0-9a-z]{4}-){3}[0-9a-z]{12}/g)[0];
        });
        if (!this.id) {
            err('Could not find captcha ID');
            process.exit(1);
        }
    }

    async resolve() {
        let i = 1;

        while (i <= 5) {
            log(`Requesting captcha... (take ${i}/5)`);

            i++;
            const res = (await axios({
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
                ok(`Successfully requested captcha, got captcha ID "${res['taskId']}"`);
                return this.taskId = res['taskId'];  // success, return task id
            } else {
                if (i > 5) {
                    err('Could not solve captcha');
                    console.log(res);
                    process.exit(1);
                } else warn('Solving failed');
            }
        }
        ok('Request accepted');
    }

    async getSolution(): Promise<string> {
        const res = (await axios({
            method: 'GET',
            url: 'https://api.anti-captcha.com/getTaskResult',
            data: {
                'clientKey': this.key,
                'taskId': this.taskId
            }
        })).data;

        if (res.hasOwnProperty('status') && res['status'] == 'ready' && res.hasOwnProperty('solution')) {
            ok(`Found captcha solution: ${res['solution']['gRecaptchaResponse'].substring(0, 20)}...`);
            this.solution = res['solution']['gRecaptchaResponse'];
            return this.solution;
        } else if (res.hasOwnProperty('status') && res['status'] == 'processing') {
            log('Captcha is still processing...');
            return null;
        }
    }
}

export {connectWebClient};