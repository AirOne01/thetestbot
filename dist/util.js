"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKey = exports.ok = exports.warn = exports.err = exports.log = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
function log(message) {
    console.log(chalk_1.default.blue("📜 ") + message);
}
exports.log = log;
function err(message) {
    console.error(chalk_1.default.red("❌ " + message));
}
exports.err = err;
function warn(message) {
    console.warn(chalk_1.default.hex('#FFA500')("⚠️ " + message));
}
exports.warn = warn;
function ok(message) {
    console.log(chalk_1.default.green("✅ " + message));
}
exports.ok = ok;
function getKey(file, key) {
    const buff = fs_1.default.readFileSync(file);
    const doc = js_yaml_1.default.load(buff.toString());
    if (doc.hasOwnProperty(key)) {
        return doc[key];
    }
    else
        return null;
}
exports.getKey = getKey;
//# sourceMappingURL=util.js.map