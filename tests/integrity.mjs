import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("app.js", "utf8");
const index = readFileSync("index.html", "utf8");
const serviceWorker = readFileSync("sw.js", "utf8");
const energyCalculations = readFileSync("energy-calculations.js", "utf8");
const styles = readFileSync("styles.css", "utf8");
const firestoreRules = readFileSync("firestore.rules", "utf8");

assert.doesNotThrow(() => new Function(app), "app.js precisa manter sintaxe válida");
assert.doesNotThrow(() => new Function(energyCalculations), "energy-calculations.js precisa manter sintaxe válida");
assert.match(app, /previousReading:/, "Sincronização deve preservar a leitura anterior");
assert.match(app, /meterReading:/, "Sincronização deve preservar a leitura atual");
assert.match(app, /Consumo total por mês/, "Rateio deve exibir a evolução mensal do consumo total");
assert.match(app, /monthTotals[\s\S]*reading\.kwh/, "Evolução total deve somar o consumo das unidades");
assert.match(app, /dueDate: isValidDateValue\(item\.dueDate\)/, "Sincronização deve preservar o vencimento da energia");
assert.match(app, /Auth\.Persistence\.LOCAL/, "Autenticação deve persistir após atualizações");
assert.match(app, /rememberPwaUpdateSession\(\)/, "Atualização deve preservar a sessão desbloqueada");
assert.match(
    app,
    /var monthIndex = month - 1;[\s\S]{0,160}return new Date\(year, monthIndex,/,
    "Primeiro vencimento deve usar o mês local informado, sem avançar um mês"
);

const ids = [...index.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id, position) => ids.indexOf(id) !== position))];
assert.deepEqual(duplicateIds, [], "IDs do HTML devem ser únicos");

const buttonsWithoutType = [...index.matchAll(/<button\b[^>]*>/gi)]
    .filter((match) => !/\btype\s*=/.test(match[0]));
assert.deepEqual(buttonsWithoutType, [], "Todo botão deve declarar type para evitar envio implícito de formulário");

const unsafeBlankLinks = [...index.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)]
    .filter((match) => !/\brel="[^"]*noopener[^"]*"/i.test(match[0]));
assert.deepEqual(unsafeBlankLinks, [], "Links externos em nova aba devem usar noopener");

assert.match(styles, /\.account-gate-actions \.btn\s*\{[^}]*min-height:\s*44px/s, "Ações de acesso devem ter alvo de toque adequado");
assert.match(styles, /\.account-gate-link\s*\{[^}]*min-height:\s*44px/s, "Recuperação de senha deve ter alvo de toque adequado");

assert.doesNotMatch(
    firestoreRules,
    /function\s+canWrite[^}]*viewer/s,
    "O perfil somente leitura não pode receber permissão de escrita"
);
assert.match(firestoreRules, /request\.auth\s*!=\s*null/, "Regras devem exigir autenticação");
assert.match(firestoreRules, /subscriptionStatus|subscription/, "Regras devem proteger o estado da assinatura");
const invalidViewBoxes = [...index.matchAll(/viewBox="([^"]+)"/g)]
    .filter((match) => match[1].trim().split(/\s+/).length !== 4);
assert.deepEqual(invalidViewBoxes, [], "Todo SVG deve declarar quatro valores no viewBox");

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
