import chalk from 'chalk';
import fs from 'fs';
import yaml from 'js-yaml';

function log(message) {
    console.log(chalk.blue("📜 ") + message);
}

function err(message) {
    console.error(chalk.red("❌ " + message));
}

function warn(message) {
    console.warn(chalk.hex('#FFA500')("⚠️ " + message));
}

function ok(message) {
    console.log(chalk.green("✅ " + message));
}

function getKey(file: string, key: string): string {
    const buff = fs.readFileSync(file);
    const doc: any = yaml.load(buff.toString());
    if (doc.hasOwnProperty(key)) {
        return doc[key];
    } else return null;
}

export {log, err, warn, ok, getKey};