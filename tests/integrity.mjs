import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("app.js", "utf8");
const index = readFileSync("index.html", "utf8");
const serviceWorker = readFileSync("sw.js", "utf8");
const energyCalculations = readFileSync("energy-calculations.js", "utf8");
const styles = readFileSync("styles.css", "utf8");
const firestoreRules = readFileSync("firestore.rules", "utf8");

assert.doesNotThrow(() => new Function(app), "app.js precisa manter sintaxe válida");
assert.match(
    app,
    /activeMobileShortcut === "charges"[\s\S]{0,100}closeMobileShortcut\(\)/,
    "Ocultar Cobranças no celular deve retornar ao menu, sem deixar painel vazio"
);
assert.match(app, /for \(var index = stack\.length - 1; index >= 0;/, "O último modal aberto deve ser tratado como o modal ativo");
assert.match(app, /modal\.style\.zIndex = String\(1000 \+ stack\.length \* 10\)/, "Modais encadeados devem ocupar camadas crescentes");
assert.match(app, /hasModalOpen\.removeAttribute\("aria-hidden"\)/, "Ao fechar um modal, o anterior deve voltar a ficar acessível");
assert.doesNotThrow(() => new Function(energyCalculations), "energy-calculations.js precisa manter sintaxe válida");
assert.doesNotMatch(index, /Juros \(% ao dia\)/, "A interface não deve apresentar a taxa mensal como juros ao dia");
assert.match(index, /Juros de mora \(% ao mês\)/, "A unidade da taxa de juros deve estar explícita");
assert.match(app, /previousReading:/, "Sincronização deve preservar a leitura anterior");
assert.match(
    app,
    /<output class="energy-reading-value"[\s\S]{0,300}data-energy-previous-unit/,
    "A leitura anterior automática deve ser exibida como informação, sem controle editável"
);
assert.match(app, /meterReading:/, "Sincronização deve preservar a leitura atual");
assert.match(app, /Consumo total por mês/, "Rateio deve exibir a evolução mensal do consumo total");
assert.match(app, /monthTotals[\s\S]*reading\.kwh/, "Evolução total deve somar o consumo das unidades");
assert.match(app, /dueDate: isValidDateValue\(item\.dueDate\)/, "Sincronização deve preservar o vencimento da energia");
assert.match(app, /persistEnergyAllocationNow\(savedAllocation\)/, "Salvamento do rateio deve aguardar confirmação dedicada");
assert.match(app, /\(!existing && !el\.dueDate\.value\)/, "Rateios antigos sem vencimento devem continuar editáveis");
assert.match(app, /ref\.doc\(allocation\.id\)\.set\(granularClone\(allocation\)\)/, "Rateio deve ser persistido diretamente na coleção granular");
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
assert.match(
    styles,
    /\.operations-row\.action-priority-row > div:first-child strong,[\s\S]{0,180}white-space:\s*normal/,
    "A central de ações deve permitir quebra de texto no celular"
);
assert.match(
    styles,
    /\.operations-row\.action-priority-row > div:first-child[\s\S]{0,80}display:\s*block/,
    "O conteúdo da ação deve ocupar uma linha própria no celular"
);

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

assert.match(app, /function partialPaymentInfo\(/, "O app deve calcular o saldo de pagamentos parciais");
assert.match(app, /partialPayments:\s*entries/, "Cada baixa parcial deve preservar o histórico de recebimentos");
assert.match(app, /unit\.status\[key\]\s*=\s*settled\s*\?\s*"pago"\s*:\s*"pendente"/, "A parcela só pode ser quitada quando o saldo chegar a zero");
assert.match(app, /metrics\.received \+= partialOpen\.received/, "O painel deve contabilizar o valor já recebido parcialmente");
assert.match(index, /id="paymentAdjustSummary"/, "O modal deve exibir valor da parcela, recebido e saldo");
assert.match(styles, /\.status-btn\.is-partial/, "A grade deve diferenciar visualmente pagamento parcial");

assert.match(app, /function openPartialPaymentReceipt\(/, "Cada baixa parcial deve gerar seu próprio comprovante");
assert.match(app, /Saldo principal restante:/, "O comprovante parcial deve informar o saldo após a baixa");
assert.match(app, /var balance = Math\.max\(0, originalRent - receivedPrincipal\)/, "Encargos devem usar o saldo principal, não o aluguel original");
assert.match(app, /var hasFinePayment = entries\.some/, "A multa não deve ser sugerida novamente após já ter sido recebida");
assert.match(index, /id="paymentAdjustPolicy"/, "A política de encargos após baixa parcial deve estar explícita");

assert.match(app, /function editPartialPayment\(/, "Baixas parciais devem permitir correção");
assert.match(app, /function deletePartialPayment\(/, "Baixas parciais devem permitir exclusão");
assert.match(app, /applyPartialPaymentEntries\(unit, month, key, entries\)/, "Excluir uma baixa deve recalcular saldo e status");
assert.match(app, /mode === "edit-partial"/, "A edição deve atualizar a baixa existente sem criar outra");
assert.match(app, /data-partial-delete/, "O histórico deve oferecer a ação Excluir");

const monetaryInputs = [...index.matchAll(/<input\b[^>]*data-money="true"[^>]*>/gi)].map((match) => match[0]);
assert.ok(monetaryInputs.length >= 10, "Campos monetários devem declarar a máscara brasileira");
assert.deepEqual(
    monetaryInputs.filter((tag) => /type="number"/i.test(tag)),
    [],
    "Campos monetários formatados não podem usar input number"
);
assert.match(app, /function parseMoneyValue\(/, "A máscara deve converter valores brasileiros com segurança");
assert.match(app, /function maskMoneyInput\(/, "A máscara monetária deve ser aplicada durante a digitação");
assert.match(app, /minimumFractionDigits:\s*2,[\s\S]{0,80}maximumFractionDigits:\s*2/, "Valores monetários devem manter duas casas decimais");
assert.match(app, /moneyInputValue\(expenseAmount\)/, "Gastos formatados devem ser convertidos antes de salvar");
assert.match(app, /moneyInputValue\(el\.invoice\)/, "A fatura de energia formatada deve ser convertida antes do rateio");

assert.match(index, /Juros de mora[\s\S]{0,160}id="paymentAdjustInterest"/, "O campo deve identificar claramente os juros de mora");
assert.match(index, /id="paymentAdjustChargeCalculation"/, "O modal deve reservar espaço para a memória de cálculo");
assert.match(app, /function recalculatePaymentCharges\(/, "Alterar a data deve recalcular os encargos");
assert.match(app, /paymentAdjustDate"[\s\S]{0,100}addEventListener\("change", recalculatePaymentCharges\)/, "A data real deve acionar o recálculo");
assert.match(app, /Saldo após esta baixa<strong id="paymentAdjustBalanceAfter"/, "O resumo deve antecipar o saldo restante");
assert.match(app, /Juros: "[\s\S]{0,220}" ÷ 30 = "/, "A memória deve explicar a fórmula diária dos juros");


assert.doesNotMatch(index, /Pendente[\s\S]{0,80}Pago[\s\S]{0,80}Pago \(atraso\)/, "A interface não deve orientar alternância cíclica de estados");
assert.match(app, /function mergeCloudData\(/, "Conflitos devem oferecer mesclagem automática compatível");
assert.match(app, /Nuvem: "[\s\S]{0,180}versionDate/, "Conflitos devem informar data das versões");
assert.match(app, /var informed = !!/, "Leitura vazia deve permanecer neutra");
assert.match(app, /<output class="energy-reading-value"/, "Leitura anterior deve ser informação não editável");
assert.match(app, /className = "mobile-view-back"/, "Telas móveis devem ter retorno explícito");
assert.match(styles, /\.app-view \{ width: 100%; max-width: 1500px/, "Painéis analíticos devem aproveitar a largura");
assert.ok((index.match(/class="report-card"/g) || []).length >= 7, "Central de relatórios deve reunir as análises principais");
assert.match(styles, /\.modal-backdrop:has\(\.unit-modal\)/, "Edição extensa deve usar painel lateral no desktop");
assert.match(styles, /#mobileEnergyRateNav[\s\S]{0,180}grid-column: 1 \/ -1/, "Atalhos móveis devem possuir hierarquia visual");
assert.match(styles, /min-width: 44px !important;[\s\S]{0,80}min-height: 44px !important/, "Ações móveis pequenas devem possuir alvo de toque adequado");
assert.match(styles, /scroll-padding-bottom: calc\(110px/, "Modais móveis devem reservar espaço para rodapé e teclado");
assert.doesNotMatch(app, /\balert\(/, "Mensagens comuns não devem usar alertas nativos");
assert.match(app, /function notifyUser\(/, "Mensagens transitórias devem usar feedback unificado");
assert.match(app, /Salvo neste aparelho · sincronizando/, "O estado de salvamento deve ser visível");
assert.match(app, /data-empty-expense/, "Estados vazios devem oferecer uma próxima ação");

assert.doesNotMatch(index, /id="mobileToggleYear"/, "A grade móvel não deve alternar para uma visão mensal separada");
assert.match(styles, /overflow-x: auto !important/, "A grade anual deve permitir rolagem horizontal no celular");

console.log("Verificações de integridade concluídas.");
