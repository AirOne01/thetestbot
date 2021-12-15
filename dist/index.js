"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const util_1 = require("./util");
const webClient_1 = require("./webClient");
(async () => {
    (0, util_1.log)("Starting browser... (this is where shit happens)");
    const browser = await puppeteer_1.default.launch({
        headless: true,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    (0, util_1.ok)("Browser started");
    await (0, webClient_1.connectWebClient)(browser);
})();
//# sourceMappingURL=index.js.map