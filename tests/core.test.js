import { describe, expect, it, vi, afterEach } from "vitest";
import * as core from "../core.js";

const {
  normalizeText,
  escapeHtml,
  money,
  slugify,
  formatDate,
  isValidStartYm,
  isValidPin,
  previousYm,
  addMonthsYm,
  whatsappUrl,
  bytesToBase64Url,
  base64UrlToBytes,
  newExpenseId,
  normalizeSettings,
  normalizeCategories,
  normalizeExpense,
  normalizeExpenses,
  normalizeRentChanges,
  normalizeUnit,
  rentForMonth,
  rentForYm,
  overdueAmount,
  wrapCanvasText
} = core;

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("normalizeText", () => {
  it("strips accents and lowercases", () => {
    expect(normalizeText("Manutenção")).toBe("manutencao");
    expect(normalizeText("ÁGUA")).toBe("agua");
  });

  it("returns an empty string for nullish values", () => {
    expect(normalizeText(null)).toBe("");
    expect(normalizeText(undefined)).toBe("");
    expect(normalizeText(0)).toBe("");
  });
});

describe("escapeHtml", () => {
  it("escapes every html sensitive character", () => {
    expect(escapeHtml("<a href=\"x\">'&'</a>")).toBe("&lt;a href=&quot;x&quot;&gt;&#039;&amp;&#039;&lt;/a&gt;");
  });

  it("stringifies non string values", () => {
    expect(escapeHtml(12)).toBe("12");
  });
});

describe("money", () => {
  it("formats numbers as BRL", () => {
    expect(money(1234.5).replace(/\u00a0/g, " ")).toBe("R$ 1.234,50");
  });

  it("treats nullish and invalid values as zero", () => {
    expect(money(null).replace(/\u00a0/g, " ")).toBe("R$ 0,00");
    expect(money(undefined).replace(/\u00a0/g, " ")).toBe("R$ 0,00");
  });
});

describe("slugify", () => {
  it("builds a filename friendly slug", () => {
    expect(slugify("Apartamento 12 — Fundos")).toBe("apartamento-12-fundos");
  });

  it("falls back to 'unidade' when nothing is left", () => {
    expect(slugify("###")).toBe("unidade");
    expect(slugify("")).toBe("unidade");
  });
});

describe("formatDate", () => {
  it("formats as dd/mm/yyyy with padding", () => {
    expect(formatDate(new Date(2024, 0, 5))).toBe("05/01/2024");
    expect(formatDate(new Date(2024, 11, 31))).toBe("31/12/2024");
  });
});

describe("isValidStartYm", () => {
  it("accepts yyyy-mm with a real month", () => {
    expect(isValidStartYm("2024-01")).toBe(true);
    expect(isValidStartYm("2024-12")).toBe(true);
  });

  it("rejects malformed values", () => {
    ["2024-00", "2024-13", "2024-1", "24-01", "2024/01", "", null, undefined, 202401].forEach((value) => {
      expect(isValidStartYm(value)).toBe(false);
    });
  });
});

describe("isValidPin", () => {
  it("requires at least four digits", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123456")).toBe(true);
  });

  it("rejects short or non numeric pins", () => {
    ["123", "12a4", "", "1234 "].forEach((pin) => expect(isValidPin(pin)).toBe(false));
  });
});

describe("previousYm", () => {
  it("returns the previous month", () => {
    expect(previousYm("2024-05")).toBe("2024-04");
  });

  it("rolls back over the year boundary", () => {
    expect(previousYm("2024-01")).toBe("2023-12");
  });
});

describe("addMonthsYm", () => {
  it("adds months across years", () => {
    expect(addMonthsYm("2024-01", 0)).toBe("2024-01");
    expect(addMonthsYm("2024-11", 2)).toBe("2025-01");
    expect(addMonthsYm("2024-03", 12)).toBe("2025-03");
  });

  it("supports negative offsets", () => {
    expect(addMonthsYm("2024-02", -3)).toBe("2023-11");
  });
});

describe("whatsappUrl", () => {
  it("prefixes the country code for local numbers", () => {
    expect(whatsappUrl("(11) 98888-7777")).toBe("https://wa.me/5511988887777");
    expect(whatsappUrl("1133334444")).toBe("https://wa.me/551133334444");
  });

  it("keeps numbers that already carry a country code", () => {
    expect(whatsappUrl("+55 11 98888-7777")).toBe("https://wa.me/5511988887777");
  });

  it("returns an empty string when there are no digits", () => {
    expect(whatsappUrl("")).toBe("");
    expect(whatsappUrl(null)).toBe("");
    expect(whatsappUrl("sem telefone")).toBe("");
  });
});

describe("base64url helpers", () => {
  it("round trips arbitrary bytes", () => {
    const bytes = new Uint8Array([0, 1, 62, 63, 128, 251, 255]);
    expect(Array.from(base64UrlToBytes(bytesToBase64Url(bytes)))).toEqual(Array.from(bytes));
  });

  it("produces url safe output without padding", () => {
    const encoded = bytesToBase64Url(new Uint8Array([251, 255, 190]));
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("round trips every payload length modulo 3", () => {
    [1, 2, 3, 4, 5].forEach((length) => {
      const bytes = new Uint8Array(Array.from({ length }, (_, index) => index * 40));
      expect(Array.from(base64UrlToBytes(bytesToBase64Url(bytes)))).toEqual(Array.from(bytes));
    });
  });
});

describe("newExpenseId", () => {
  it("returns unique ids", () => {
    const ids = new Set(Array.from({ length: 50 }, newExpenseId));
    expect(ids.size).toBe(50);
  });
});

describe("normalizeSettings", () => {
  it("falls back to the defaults", () => {
    expect(normalizeSettings()).toEqual({ finePercent: 10, dailyInterestPercent: 0.3, receiverName: "" });
    expect(normalizeSettings({ finePercent: -1, dailyInterestPercent: "abc", receiverName: 5 }))
      .toEqual({ finePercent: 10, dailyInterestPercent: 0.3, receiverName: "" });
  });

  it("keeps valid values and trims the receiver name", () => {
    expect(normalizeSettings({ finePercent: "2", dailyInterestPercent: 0, receiverName: "  Bruno  " }))
      .toEqual({ finePercent: 2, dailyInterestPercent: 0, receiverName: "Bruno" });
  });
});

describe("normalizeCategories", () => {
  it("returns the defaults for non arrays and empty results", () => {
    expect(normalizeCategories(null)).toEqual(core.DEFAULT_EXPENSE_CATEGORIES);
    expect(normalizeCategories([" ", 3, null])).toEqual(core.DEFAULT_EXPENSE_CATEGORIES);
  });

  it("drops accent/case duplicates and always keeps Outros", () => {
    expect(normalizeCategories(["IPTU", " iptu ", "Água", "agua"])).toEqual(["IPTU", "Água", "Outros"]);
  });

  it("does not duplicate an existing Outros entry", () => {
    expect(normalizeCategories(["Luz", "outros"])).toEqual(["Luz", "outros"]);
  });
});

describe("normalizeExpense", () => {
  it("rejects anything without a valid ym", () => {
    [null, undefined, "x", [], { ym: "2024-13" }].forEach((value) => {
      expect(normalizeExpense(value)).toBeNull();
    });
  });

  it("fills in defaults for missing fields", () => {
    const expense = normalizeExpense({ ym: "2024-02" });
    expect(expense).toMatchObject({ ym: "2024-02", category: "Outros", description: "", amount: 0, recurrenceId: null });
    expect(expense.id).toEqual(expect.any(String));
  });

  it("keeps provided values and trims text", () => {
    expect(normalizeExpense({ id: "e1", ym: "2024-02", category: "  Luz ", description: " conta ", amount: "12.5", recurrenceId: "r1" }))
      .toEqual({ id: "e1", ym: "2024-02", category: "Luz", description: "conta", amount: 12.5, recurrenceId: "r1" });
  });

  it("zeroes negative or non numeric amounts", () => {
    expect(normalizeExpense({ ym: "2024-02", amount: -5 }).amount).toBe(0);
    expect(normalizeExpense({ ym: "2024-02", amount: "abc" }).amount).toBe(0);
  });
});

describe("normalizeExpenses", () => {
  it("returns an empty list for non arrays", () => {
    expect(normalizeExpenses(undefined)).toEqual([]);
  });

  it("keeps only the valid entries", () => {
    expect(normalizeExpenses([{ ym: "2024-01", amount: 10 }, { ym: "bad" }, null]).map((item) => item.ym)).toEqual(["2024-01"]);
  });
});

describe("normalizeRentChanges", () => {
  it("returns an empty list for non arrays", () => {
    expect(normalizeRentChanges("nope")).toEqual([]);
  });

  it("sorts, rounds and drops invalid or duplicated months", () => {
    expect(normalizeRentChanges([
      { fromYm: "2024-06", rent: 1200.567 },
      { fromYm: "2024-01", rent: "1000" },
      { fromYm: "2024-06", rent: 9999 },
      { fromYm: "2024-13", rent: 100 },
      { fromYm: "2024-07", rent: -1 },
      null
    ])).toEqual([
      { fromYm: "2024-01", rent: 1000 },
      { fromYm: "2024-06", rent: 1200.57 }
    ]);
  });
});

describe("normalizeUnit", () => {
  it("repairs every field in place", () => {
    const unit = { name: "Apto", rent: "-3", status: [], paidLate: "x", startYm: "2024-99", endYm: 5, rentChanges: null, tenantName: "  Ana " };
    normalizeUnit(unit);
    expect(unit).toMatchObject({
      rent: 0,
      status: {},
      paidLate: {},
      startYm: null,
      endYm: null,
      rentChanges: [],
      tenantName: "Ana",
      tenantPhone: "",
      tenantEmail: "",
      tenantNotes: ""
    });
  });

  it("clears an end month that precedes the start month", () => {
    const unit = { startYm: "2024-06", endYm: "2024-03" };
    normalizeUnit(unit);
    expect(unit.endYm).toBeNull();
  });

  it("keeps a consistent period", () => {
    const unit = { startYm: "2024-03", endYm: "2024-06", rent: 900 };
    normalizeUnit(unit);
    expect(unit).toMatchObject({ startYm: "2024-03", endYm: "2024-06", rent: 900 });
  });
});

describe("rentForMonth / rentForYm", () => {
  const unit = {
    rent: 1000,
    rentChanges: [
      { fromYm: "2024-03", rent: 1100 },
      { fromYm: "2024-09", rent: 1250 }
    ]
  };

  it("uses the base rent before the first change", () => {
    expect(rentForMonth(unit, 2024, 0)).toBe(1000);
    expect(rentForYm(unit, "2024-02")).toBe(1000);
  });

  it("applies a change from its own month onwards", () => {
    expect(rentForYm(unit, "2024-03")).toBe(1100);
    expect(rentForYm(unit, "2024-08")).toBe(1100);
    expect(rentForYm(unit, "2024-09")).toBe(1250);
    expect(rentForYm(unit, "2025-01")).toBe(1250);
  });

  it("tolerates missing or invalid rent data", () => {
    expect(rentForMonth({}, 2024, 5)).toBe(0);
    expect(rentForMonth({ rent: "abc" }, 2024, 5)).toBe(0);
  });
});

describe("overdueAmount", () => {
  const settings = { finePercent: 10, dailyInterestPercent: 0.3 };

  it("adds the fine and the daily interest", () => {
    expect(overdueAmount(1000, 0, settings)).toBeCloseTo(1100, 6);
    expect(overdueAmount(1000, 10, settings)).toBeCloseTo(1130, 6);
  });

  it("returns the plain rent when there is no fine or interest", () => {
    expect(overdueAmount(1000, 30, { finePercent: 0, dailyInterestPercent: 0 })).toBe(1000);
  });
});

describe("wrapCanvasText", () => {
  function fakeContext(charWidth) {
    return {
      lines: [],
      measureText(text) { return { width: text.length * charWidth }; },
      fillText(text, x, y) { this.lines.push({ text, x, y }); }
    };
  }

  it("keeps short text on a single line", () => {
    const context = fakeContext(10);
    const next = wrapCanvasText(context, "linha curta", 5, 100, 1000, 20);
    expect(context.lines).toEqual([{ text: "linha curta", x: 5, y: 100 }]);
    expect(next).toBe(120);
  });

  it("breaks on word boundaries and advances the baseline", () => {
    const context = fakeContext(10);
    const next = wrapCanvasText(context, "um dois tres quatro", 0, 0, 100, 30);
    expect(context.lines.map((line) => line.text)).toEqual(["um dois", "tres", "quatro"]);
    expect(context.lines.map((line) => line.y)).toEqual([0, 30, 60]);
    expect(next).toBe(90);
  });

  it("never drops a word longer than the max width", () => {
    const context = fakeContext(10);
    wrapCanvasText(context, "curto palavraenormequenaocabe", 0, 0, 50, 10);
    expect(context.lines.map((line) => line.text)).toEqual(["curto", "palavraenormequenaocabe"]);
  });
});
