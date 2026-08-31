import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const energy = require("../energy-calculations.js");

const allocation = energy.calculateAllocation([
    { unitId: "u1", previousReading: 100, meterReading: 150 },
    { unitId: "u2", previousReading: 200, meterReading: 250 },
    { unitId: "u3", previousReading: 300, meterReading: 400 }
], 638.50);

assert.equal(allocation.totalKwh, 200, "Consumo deve ser a diferença entre as leituras");
assert.equal(allocation.readings[0].kwh, 50);
assert.equal(allocation.readings[2].kwh, 100);
assert.equal(allocation.distributedAmount, 638.50, "Rateio deve fechar exatamente com a fatura");
assert.equal(allocation.readings.reduce((sum, row) => sum + row.amount, 0), 638.50);

const tinyAllocation = energy.calculateAllocation([
    { unitId: "u1", previousReading: 0, meterReading: 1 },
    { unitId: "u2", previousReading: 0, meterReading: 1 },
    { unitId: "u3", previousReading: 0, meterReading: 1 },
    { unitId: "u4", previousReading: 0, meterReading: 1 },
    { unitId: "u5", previousReading: 0, meterReading: 1 }
], 0.03);
assert.equal(tinyAllocation.distributedAmount, 0.03, "Rateio mínimo deve fechar em centavos");
assert.equal(tinyAllocation.readings.reduce((sum, row) => sum + row.amount, 0), 0.03);
assert.ok(tinyAllocation.readings.every((row) => row.amount >= 0), "Nenhuma unidade pode receber valor negativo");

const roundedInvoice = energy.calculateAllocation([
    { unitId: "u1", previousReading: 10, meterReading: 11 },
    { unitId: "u2", previousReading: 20, meterReading: 22 }
], 10.005);
assert.equal(roundedInvoice.invoiceAmount, 10.01, "Fatura deve ser normalizada para duas casas decimais");
assert.equal(roundedInvoice.distributedAmount, 10.01);

const invalid = energy.calculateAllocation([
    { unitId: "u1", previousReading: 150, meterReading: 140 }
], 100);
assert.equal(invalid.errors.length, 1, "Leitura atual menor deve ser rejeitada");

const incomplete = energy.calculateAllocation([
    { unitId: "u1", previousReading: "", meterReading: 140 }
], 100);
assert.equal(incomplete.errors.length, 1, "As duas leituras devem ser obrigatórias");

assert.equal(energy.anomaly([100, 110, 90], 150).direction, "above");
assert.equal(energy.anomaly([100, 110, 90], 105), null);

const billing = energy.billingSummary([
    { dueDate: "2026-08-10", readings: [
        { amount: 100, paid: true },
        { amount: 80, paid: false }
    ] },
    { dueDate: "2026-09-10", readings: [{ amount: 60, paid: false }] }
], "2026-08-28");
assert.deepEqual(billing, {
    paid: 100, pending: 60, overdue: 80,
    paidCount: 1, pendingCount: 1, overdueCount: 1
});

console.log("Testes do rateio de energia concluídos.");
