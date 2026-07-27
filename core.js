(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.RentCore = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var DEFAULT_SETTINGS = { finePercent: 10, dailyInterestPercent: 0.3, receiverName: "" };
  var DEFAULT_EXPENSE_CATEGORIES = ["Manutenção", "Mão de obra", "IPTU", "Água", "Luz", "Outros"];

  function normalizeText(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[character];
    });
  }

  function money(value) {
    return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function slugify(value) {
    return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unidade";
  }

  function formatDate(date) {
    return String(date.getDate()).padStart(2, "0") + "/" + String(date.getMonth() + 1).padStart(2, "0") + "/" + date.getFullYear();
  }

  function isValidStartYm(value) {
    return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
  }

  function isValidPin(pin) {
    return /^\d{4,}$/.test(pin);
  }

  function previousYm(ym) {
    var parts = ym.split("-").map(Number);
    var date = new Date(parts[0], parts[1] - 2, 1);
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
  }

  function addMonthsYm(ym, offset) {
    var parts = ym.split("-").map(Number);
    var date = new Date(parts[0], parts[1] - 1 + offset, 1);
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
  }

  function whatsappUrl(phone) {
    var digits = String(phone || "").replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 11) digits = "55" + digits;
    return digits ? "https://wa.me/" + digits : "";
  }

  function bytesToBase64Url(bytes) {
    var binary = "";
    bytes.forEach(function (byte) { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function base64UrlToBytes(value) {
    var binary = atob(value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4));
    return Uint8Array.from(binary, function (character) { return character.charCodeAt(0); });
  }

  function newExpenseId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function normalizeSettings(settings) {
    return {
      finePercent: settings && Number.isFinite(Number(settings.finePercent)) && Number(settings.finePercent) >= 0 ? Number(settings.finePercent) : DEFAULT_SETTINGS.finePercent,
      dailyInterestPercent: settings && Number.isFinite(Number(settings.dailyInterestPercent)) && Number(settings.dailyInterestPercent) >= 0 ? Number(settings.dailyInterestPercent) : DEFAULT_SETTINGS.dailyInterestPercent,
      receiverName: settings && typeof settings.receiverName === "string" ? settings.receiverName.trim() : DEFAULT_SETTINGS.receiverName
    };
  }

  function normalizeCategories(categories) {
    if (!Array.isArray(categories)) return DEFAULT_EXPENSE_CATEGORIES.slice();
    var result = [];
    categories.forEach(function (category) {
      if (typeof category !== "string") return;
      var value = category.trim();
      if (value && !result.some(function (item) { return normalizeText(item) === normalizeText(value); })) result.push(value);
    });
    if (!result.length) return DEFAULT_EXPENSE_CATEGORIES.slice();
    if (!result.some(function (item) { return normalizeText(item) === "outros"; })) result.push("Outros");
    return result;
  }

  function normalizeExpense(expense) {
    if (!expense || typeof expense !== "object" || Array.isArray(expense) || !isValidStartYm(expense.ym)) return null;
    var amount = Number(expense.amount);
    return {
      id: typeof expense.id === "string" && expense.id.trim() ? expense.id : newExpenseId(),
      ym: expense.ym,
      category: typeof expense.category === "string" && expense.category.trim() ? expense.category.trim() : "Outros",
      description: typeof expense.description === "string" ? expense.description.trim() : "",
      amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
      recurrenceId: typeof expense.recurrenceId === "string" && expense.recurrenceId.trim() ? expense.recurrenceId : null
    };
  }

  function normalizeExpenses(expenses) {
    if (!Array.isArray(expenses)) return [];
    return expenses.map(normalizeExpense).filter(function (expense) { return expense !== null; });
  }

  function normalizeRentChanges(changes) {
    if (!Array.isArray(changes)) return [];
    return changes.map(function (change) {
      if (!change || typeof change !== "object" || Array.isArray(change) || !isValidStartYm(change.fromYm)) return null;
      var rent = Number(change.rent);
      return Number.isFinite(rent) && rent >= 0 ? { fromYm: change.fromYm, rent: Math.round(rent * 100) / 100 } : null;
    }).filter(function (change) { return change !== null; }).sort(function (a, b) {
      return a.fromYm.localeCompare(b.fromYm);
    }).filter(function (change, index, list) {
      return index === 0 || change.fromYm !== list[index - 1].fromYm;
    });
  }

  function normalizeUnit(unit) {
    unit.status = unit.status && typeof unit.status === "object" && !Array.isArray(unit.status) ? unit.status : {};
    unit.paidLate = unit.paidLate && typeof unit.paidLate === "object" && !Array.isArray(unit.paidLate) ? unit.paidLate : {};
    unit.startYm = isValidStartYm(unit.startYm) ? unit.startYm : null;
    unit.endYm = isValidStartYm(unit.endYm) ? unit.endYm : null;
    unit.rent = Number.isFinite(Number(unit.rent)) && Number(unit.rent) >= 0 ? Number(unit.rent) : 0;
    unit.rentChanges = normalizeRentChanges(unit.rentChanges);
    if (unit.startYm && unit.endYm && unit.endYm < unit.startYm) unit.endYm = null;
    unit.tenantName = typeof unit.tenantName === "string" ? unit.tenantName.trim() : "";
    unit.tenantPhone = typeof unit.tenantPhone === "string" ? unit.tenantPhone.trim() : "";
    unit.tenantEmail = typeof unit.tenantEmail === "string" ? unit.tenantEmail.trim() : "";
    unit.tenantNotes = typeof unit.tenantNotes === "string" ? unit.tenantNotes.trim() : "";
  }

  function rentForMonth(unit, year, month) {
    var key = String(year) + "-" + String(month + 1).padStart(2, "0");
    var rent = Number(unit.rent) || 0;
    (unit.rentChanges || []).forEach(function (change) {
      if (change.fromYm <= key) rent = Number(change.rent) || 0;
    });
    return rent;
  }

  function rentForYm(unit, ym) {
    var parts = ym.split("-").map(Number);
    return rentForMonth(unit, parts[0], parts[1] - 1);
  }

  function overdueAmount(rent, days, settings) {
    return rent * (1 + settings.finePercent / 100 + settings.dailyInterestPercent / 100 * days);
  }

  function wrapCanvasText(context, text, x, y, maxWidth, lineHeight) {
    var words = text.split(" ");
    var line = "";
    words.forEach(function (word) {
      var test = line ? line + " " + word : word;
      if (context.measureText(test).width > maxWidth && line) {
        context.fillText(line, x, y);
        y += lineHeight;
        line = word;
      } else {
        line = test;
      }
    });
    if (line) context.fillText(line, x, y);
    return y + lineHeight;
  }

  return {
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    DEFAULT_EXPENSE_CATEGORIES: DEFAULT_EXPENSE_CATEGORIES,
    normalizeText: normalizeText,
    escapeHtml: escapeHtml,
    money: money,
    slugify: slugify,
    formatDate: formatDate,
    isValidStartYm: isValidStartYm,
    isValidPin: isValidPin,
    previousYm: previousYm,
    addMonthsYm: addMonthsYm,
    whatsappUrl: whatsappUrl,
    bytesToBase64Url: bytesToBase64Url,
    base64UrlToBytes: base64UrlToBytes,
    newExpenseId: newExpenseId,
    normalizeSettings: normalizeSettings,
    normalizeCategories: normalizeCategories,
    normalizeExpense: normalizeExpense,
    normalizeExpenses: normalizeExpenses,
    normalizeRentChanges: normalizeRentChanges,
    normalizeUnit: normalizeUnit,
    rentForMonth: rentForMonth,
    rentForYm: rentForYm,
    overdueAmount: overdueAmount,
    wrapCanvasText: wrapCanvasText
  };
});
