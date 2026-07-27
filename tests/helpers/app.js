import fs from "node:fs";
import path from "node:path";
import { vi } from "vitest";

const rootDir = path.join(import.meta.dirname, "..", "..");
const indexHtml = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");

export const STORAGE_KEY = "controle-alugueis-v1";
export const LOCK_STORAGE_KEY = "controle-alugueis-lock";

export function makeUnit(overrides) {
  return Object.assign({
    id: "u1",
    name: "Apto 1",
    rent: 1000,
    rentChanges: [],
    dueDay: 10,
    startYm: null,
    endYm: null,
    tenantName: "",
    tenantPhone: "",
    tenantEmail: "",
    tenantNotes: "",
    status: {},
    paidLate: {}
  }, overrides);
}

export function makeState(overrides) {
  return Object.assign({
    units: [],
    settings: { finePercent: 10, dailyInterestPercent: 0.3, receiverName: "" },
    expenseCategories: ["Manutenção", "Outros"],
    expenses: []
  }, overrides);
}

export function storedState() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY));
}

// Renders index.html into the jsdom document and executes app.js against it,
// so the module level wiring (event listeners, initial render) is exercised.
export async function bootApp(initialState, lockConfig) {
  localStorage.clear();
  if (initialState) localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
  if (lockConfig) localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(lockConfig));
  const parsed = new DOMParser().parseFromString(indexHtml, "text/html");
  parsed.querySelectorAll("script").forEach((script) => script.remove());
  document.documentElement.innerHTML = parsed.documentElement.innerHTML;
  vi.resetModules();
  window.RentCore = await import("../../core.js");
  await import("../../app.js");
}

export function click(id) {
  document.getElementById(id).click();
}

export function setValue(id, value) {
  const field = document.getElementById(id);
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
}
