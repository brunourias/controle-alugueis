import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("app.js", "utf8");
const index = readFileSync("index.html", "utf8");
const serviceWorker = readFileSync("sw.js", "utf8");
const energyCalculations = readFileSync("energy-calculations.js", "utf8");

assert.doesNotThrow(() => new Function(app), "app.js precisa manter sintaxe válida");
assert.doesNotThrow(() => new Function(energyCalculations), "energy-calculations.js precisa manter sintaxe válida");

const appVersion = (index.match(/app\.js\?v=(\d+)/) || [])[1];
const styleVersion = (index.match(/styles\.css\?v=(\d+)/) || [])[1];
const cacheVersion = (serviceWorker.match(/controle-alugueis-v(\d+)/) || [])[1];

assert.ok(appVersion && styleVersion && cacheVersion, "Versões do cache devem estar declaradas");
assert.equal(appVersion, styleVersion, "app.js e styles.css devem usar a mesma versão");
assert.equal(appVersion, cacheVersion, "O cache do Service Worker deve acompanhar os arquivos publicados");
assert.match(serviceWorker, new RegExp('app\\.js\\?v=' + appVersion), "Service Worker deve precachear o app atual");
assert.match(serviceWorker, new RegExp('styles\\.css\\?v=' + styleVersion), "Service Worker deve precachear o CSS atual");
assert.match(index, new RegExp('energy-calculations\\.js\\?v=' + appVersion), "Motor do rateio deve acompanhar a versão do app");
assert.match(serviceWorker, new RegExp('energy-calculations\\.js\\?v=' + appVersion), "Service Worker deve precachear o motor do rateio");

console.log("Verificações de integridade concluídas.");
