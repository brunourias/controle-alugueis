import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootApp, click, makeState, makeUnit, setValue, storedState } from "./helpers/app.js";

const NOW = new Date(2024, 5, 15, 12, 0, 0);

function statusButtons() {
  return Array.from(document.querySelectorAll("#grid tbody .status-btn"));
}

function rowNames() {
  return Array.from(document.querySelectorAll("#grid tbody .unit-name")).map((cell) => cell.textContent);
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(NOW);
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("boot", () => {
  it("shows the empty state when there is nothing stored", async () => {
    await bootApp();
    expect(document.getElementById("empty").hidden).toBe(false);
    expect(document.getElementById("grid").hidden).toBe(true);
    expect(document.getElementById("yearLabel").textContent).toBe("2024");
  });

  it("recovers from a corrupted payload instead of crashing", async () => {
    localStorage.setItem("controle-alugueis-v1", "{not json");
    await bootApp();
    expect(document.getElementById("empty").hidden).toBe(false);
  });

  it("normalizes stored units while loading", async () => {
    await bootApp(makeState({ units: [makeUnit({ rent: -10, startYm: "2024-99", tenantName: "  Ana  " })] }));
    click("addUnit");
    document.querySelector(".unit-cell").click();
    expect(document.getElementById("unitRent").value).toBe("0");
    expect(document.getElementById("unitStartYm").value).toBe("");
    expect(document.getElementById("tenantName").value).toBe("Ana");
  });
});

describe("units", () => {
  it("creates a unit and persists it", async () => {
    await bootApp();
    click("addUnit");
    setValue("unitName", "Apto 42");
    setValue("unitRent", "1500");
    setValue("unitDueDay", "5");
    setValue("tenantPhone", "(11) 98888-7777");
    click("saveUnit");

    expect(rowNames()).toEqual(["Apto 42"]);
    expect(document.getElementById("modal").hidden).toBe(true);
    const saved = storedState();
    expect(saved.units).toHaveLength(1);
    expect(saved.units[0]).toMatchObject({ name: "Apto 42", rent: 1500, dueDay: 5 });
    expect(document.querySelector(".tenant-action").getAttribute("href")).toBe("https://wa.me/5511988887777");
  });

  it("refuses to save an invalid due day", async () => {
    await bootApp();
    click("addUnit");
    setValue("unitName", "Apto 1");
    setValue("unitRent", "1000");
    setValue("unitDueDay", "45");
    click("saveUnit");

    expect(document.getElementById("modal").hidden).toBe(false);
    expect(document.getElementById("unitDueDay").validationMessage).toBe("Informe um dia inteiro entre 1 e 31.");
    expect(storedState()).toBeNull();
  });

  it("refuses a lease that ends before it starts", async () => {
    await bootApp();
    click("addUnit");
    setValue("unitName", "Apto 1");
    setValue("unitRent", "1000");
    setValue("unitStartYm", "2024-06");
    setValue("unitEndYm", "2024-03");
    click("saveUnit");

    expect(document.getElementById("modal").hidden).toBe(false);
    expect(document.getElementById("unitEndYm").validationMessage).toBe("O fim da locação deve ser igual ou posterior ao início.");
  });

  it("edits an existing unit", async () => {
    await bootApp(makeState({ units: [makeUnit()] }));
    document.querySelector(".unit-cell").click();
    expect(document.getElementById("modalTitle").textContent).toBe("Editar unidade");
    setValue("unitName", "Apto 1 renomeado");
    click("saveUnit");

    expect(rowNames()).toEqual(["Apto 1 renomeado"]);
    expect(storedState().units).toHaveLength(1);
  });

  it("deletes a unit after confirmation", async () => {
    await bootApp(makeState({ units: [makeUnit()] }));
    document.querySelector(".unit-cell").click();
    click("deleteUnit");
    expect(storedState().units).toEqual([]);
    expect(document.getElementById("empty").hidden).toBe(false);
  });

  it("marks months outside the lease period as inactive", async () => {
    await bootApp(makeState({ units: [makeUnit({ startYm: "2024-03", endYm: "2024-05" })] }));
    const cells = Array.from(document.querySelectorAll("#grid tbody td"));
    expect(cells.filter((cell) => cell.querySelector(".status-inactive"))).toHaveLength(9);
    expect(statusButtons()).toHaveLength(3);
  });
});

describe("rent changes", () => {
  it("adds a percentage change on top of the previous rent", async () => {
    await bootApp();
    click("addUnit");
    setValue("unitName", "Apto 1");
    setValue("unitRent", "1000");
    setValue("rentChangeYm", "2024-07");
    setValue("rentChangePercent", "10");
    click("addRentChange");
    click("saveUnit");

    expect(storedState().units[0].rentChanges).toEqual([{ fromYm: "2024-07", rent: 1100 }]);
  });

  it("adds an absolute change and lets it be removed again", async () => {
    await bootApp();
    click("addUnit");
    setValue("unitName", "Apto 1");
    setValue("unitRent", "1000");
    setValue("rentChangeYm", "2024-07");
    setValue("rentChangeAbsolute", "1234.567");
    click("addRentChange");
    expect(document.querySelectorAll("#rentChangesList .rent-change-row")).toHaveLength(1);

    document.querySelector("[data-rent-change]").click();
    expect(document.querySelector(".rent-changes-empty")).not.toBeNull();
  });

  it("rejects a change without a percentage or a value", async () => {
    await bootApp();
    click("addUnit");
    setValue("unitRent", "1000");
    setValue("rentChangeYm", "2024-07");
    click("addRentChange");
    expect(document.getElementById("rentChangeAbsolute").validationMessage).toBe("Informe um percentual ou um novo valor.");
    expect(document.querySelector(".rent-changes-empty")).not.toBeNull();
  });

  it("rejects a change without a valid month", async () => {
    await bootApp();
    click("addUnit");
    setValue("unitRent", "1000");
    setValue("rentChangeAbsolute", "1200");
    click("addRentChange");
    expect(document.getElementById("rentChangeYm").validationMessage).toBe("Informe um mês de reajuste válido.");
  });
});

describe("payment status", () => {
  it("cycles pendente, pago, pago com atraso and back", async () => {
    await bootApp(makeState({ units: [makeUnit({ dueDay: null })] }));
    const january = statusButtons()[0];
    expect(january.className).toContain("chip-pendente");

    january.click();
    expect(statusButtons()[0].className).toContain("chip-pago");
    expect(storedState().units[0].status["2024-01"]).toBe("pago");

    statusButtons()[0].click();
    expect(statusButtons()[0].className).toContain("chip-pago-atrasado");
    expect(storedState().units[0].paidLate["2024-01"]).toBe(true);

    statusButtons()[0].click();
    expect(statusButtons()[0].className).toContain("chip-pendente");
    expect(storedState().units[0].paidLate["2024-01"]).toBeUndefined();
  });

  it("flags past due months as overdue with fine and interest", async () => {
    await bootApp(makeState({ units: [makeUnit({ dueDay: 10 })] }));
    const june = statusButtons()[5];
    expect(june.className).toContain("chip-atrasado");
    expect(june.querySelector(".status-days").textContent).toBe("5 dias");
    // 1000 + 10% fine + 5 days x 0.3% interest
    expect(june.querySelector(".status-amount").textContent.replace(/\u00a0/g, " ")).toBe("R$ 1.115,00");
  });

  it("uses the singular form for a single day of delay", async () => {
    vi.setSystemTime(new Date(2024, 5, 11, 12, 0, 0));
    await bootApp(makeState({ units: [makeUnit({ dueDay: 10 })] }));
    expect(statusButtons()[5].querySelector(".status-days").textContent).toBe("1 dia");
  });

  it("keeps months without a due day pending", async () => {
    await bootApp(makeState({ units: [makeUnit({ dueDay: null })] }));
    expect(statusButtons().every((button) => button.className.includes("chip-pendente"))).toBe(true);
  });
});

describe("filters", () => {
  const state = makeState({
    units: [
      makeUnit({ id: "u1", name: "Apto 1", dueDay: null, status: { "2024-01": "pago" } }),
      makeUnit({ id: "u2", name: "Loja Térrea", dueDay: null })
    ]
  });

  it("filters by unit name ignoring accents", async () => {
    await bootApp(state);
    setValue("unitSearch", "terrea");
    expect(rowNames()).toEqual(["Loja Térrea"]);
  });

  it("shows the empty filter message when nothing matches", async () => {
    await bootApp(state);
    setValue("unitSearch", "inexistente");
    expect(document.getElementById("filterEmpty").hidden).toBe(false);
    expect(document.getElementById("grid").hidden).toBe(true);
  });

  it("filters by payment status", async () => {
    await bootApp(state);
    setValue("statusFilter", "pagos");
    expect(rowNames()).toEqual(["Apto 1"]);
    setValue("statusFilter", "pendentes");
    expect(rowNames()).toEqual(["Apto 1", "Loja Térrea"]);
    setValue("statusFilter", "atrasados");
    expect(rowNames()).toEqual([]);
  });
});

describe("summary", () => {
  it("totals rents, expenses and the resulting balance", async () => {
    await bootApp(makeState({
      units: [makeUnit({ dueDay: null, status: { "2024-01": "pago", "2024-06": "pago" } })],
      expenses: [
        { id: "e1", ym: "2024-01", category: "Luz", description: "", amount: 200, recurrenceId: null },
        { id: "e2", ym: "2023-01", category: "Luz", description: "", amount: 999, recurrenceId: null }
      ]
    }));
    const values = Array.from(document.querySelectorAll("#summary .summary-value")).map((node) => node.textContent.replace(/\u00a0/g, " "));
    // recebido no ano, gastos no ano, líquido no ano, recebido no mês, gastos no mês, líquido no mês, pendente
    expect(values).toEqual(["R$ 2.000,00", "R$ 200,00", "R$ 1.800,00", "R$ 1.000,00", "R$ 0,00", "R$ 1.000,00", "R$ 0,00"]);
  });

  it("highlights overdue payments and lists them per unit", async () => {
    await bootApp(makeState({ units: [makeUnit({ dueDay: 10 })] }));
    expect(document.querySelector(".summary-alert").textContent).toContain("6 pagamentos em atraso");
    expect(document.querySelector(".late-row").textContent).toContain("6 em atraso");
  });

  it("zeroes the monthly cards when browsing another year", async () => {
    await bootApp(makeState({ units: [makeUnit({ dueDay: null, status: { "2024-01": "pago" } })] }));
    click("nextYear");
    expect(document.getElementById("yearLabel").textContent).toBe("2025");
    expect(document.querySelectorAll("#summary .summary-detail")[3].textContent).toBe("Visualizando outro ano");
    click("prevYear");
    expect(document.getElementById("yearLabel").textContent).toBe("2024");
  });
});

describe("expenses", () => {
  it("creates a recurring expense series", async () => {
    await bootApp();
    click("addExpense");
    setValue("expenseYm", "2024-06");
    setValue("expenseAmount", "150");
    setValue("expenseDescription", "Conta de luz");
    document.getElementById("expenseRepeat").checked = true;
    setValue("expenseRepeatCount", "3");
    click("saveExpense");

    const expenses = storedState().expenses;
    expect(expenses.map((expense) => expense.ym)).toEqual(["2024-06", "2024-07", "2024-08"]);
    expect(new Set(expenses.map((expense) => expense.recurrenceId)).size).toBe(1);
    expect(document.getElementById("expensesTotal").textContent.replace(/\u00a0/g, " ")).toBe("R$ 450,00");
    expect(document.querySelectorAll(".expense-month")).toHaveLength(3);
  });

  it("rejects an out of range repeat count", async () => {
    await bootApp();
    click("addExpense");
    setValue("expenseYm", "2024-06");
    setValue("expenseAmount", "150");
    document.getElementById("expenseRepeat").checked = true;
    setValue("expenseRepeatCount", "99");
    click("saveExpense");

    expect(document.getElementById("expenseModal").hidden).toBe(false);
    expect(document.getElementById("expenseRepeatCount").validationMessage).toBe("Informe uma quantidade inteira entre 1 e 60.");
  });

  it("edits an existing expense", async () => {
    await bootApp(makeState({ expenses: [{ id: "e1", ym: "2024-06", category: "Luz", description: "", amount: 100, recurrenceId: null }] }));
    document.querySelector(".expense-edit").click();
    setValue("expenseAmount", "250");
    click("saveExpense");
    expect(storedState().expenses[0].amount).toBe(250);
  });

  it("deletes a whole recurring series when confirmed", async () => {
    await bootApp(makeState({
      expenses: [
        { id: "e1", ym: "2024-06", category: "Luz", description: "", amount: 100, recurrenceId: "r1" },
        { id: "e2", ym: "2024-07", category: "Luz", description: "", amount: 100, recurrenceId: "r1" }
      ]
    }));
    document.querySelector(".expense-edit").click();
    click("deleteExpense");
    expect(storedState().expenses).toEqual([]);
  });

  it("deletes a single expense of a series when the series is declined", async () => {
    window.confirm.mockReturnValueOnce(false).mockReturnValueOnce(true);
    await bootApp(makeState({
      expenses: [
        { id: "e1", ym: "2024-06", category: "Luz", description: "", amount: 100, recurrenceId: "r1" },
        { id: "e2", ym: "2024-07", category: "Luz", description: "", amount: 100, recurrenceId: "r1" }
      ]
    }));
    document.querySelector(".expense-edit").click();
    click("deleteExpense");
    expect(storedState().expenses.map((expense) => expense.id)).toEqual(["e2"]);
  });

  it("shows the empty message for a year without expenses", async () => {
    await bootApp(makeState({ expenses: [{ id: "e1", ym: "2023-06", category: "Luz", description: "", amount: 100, recurrenceId: null }] }));
    expect(document.querySelector(".expenses-empty").textContent).toBe("Nenhum gasto registrado em 2024.");
  });
});

describe("categories", () => {
  it("adds, renames and removes categories", async () => {
    await bootApp(makeState({
      expenseCategories: ["Luz", "Outros"],
      expenses: [{ id: "e1", ym: "2024-06", category: "Luz", description: "", amount: 100, recurrenceId: null }]
    }));
    click("settingsButton");

    setValue("newCategory", "Jardim");
    click("addCategory");
    expect(storedState().expenseCategories).toEqual(["Luz", "Jardim", "Outros"]);

    const luzInput = document.querySelector("[data-category-input='Luz']");
    luzInput.value = "Energia";
    document.querySelector("[data-category-save='Luz']").click();
    expect(storedState().expenseCategories).toContain("Energia");
    expect(storedState().expenses[0].category).toBe("Energia");

    document.querySelector("[data-category-remove='Energia']").click();
    expect(storedState().expenseCategories).not.toContain("Energia");
    expect(storedState().expenses[0].category).toBe("Outros");
  });

  it("refuses duplicated or empty category names", async () => {
    await bootApp(makeState({ expenseCategories: ["Luz", "Outros"] }));
    click("settingsButton");

    click("addCategory");
    expect(document.getElementById("categoryStatus").textContent).toBe("Digite um nome para a categoria.");

    setValue("newCategory", "luz");
    click("addCategory");
    expect(document.getElementById("categoryStatus").textContent).toBe("Esta categoria já existe.");
  });

  it("protects the Outros category", async () => {
    await bootApp(makeState({ expenseCategories: ["Luz", "Outros"] }));
    click("settingsButton");
    expect(document.querySelector("[data-category-remove='Outros']")).toBeNull();

    document.querySelector("[data-category-input='Outros']").value = "Diversos";
    document.querySelector("[data-category-save='Outros']").click();
    expect(document.getElementById("categoryStatus").textContent).toBe("A categoria Outros não pode ser renomeada.");
  });
});

describe("settings", () => {
  it("saves fine, interest and receiver name", async () => {
    await bootApp(makeState({ units: [makeUnit({ dueDay: 10 })] }));
    click("settingsButton");
    setValue("finePercent", "5");
    setValue("dailyInterestPercent", "1");
    setValue("receiverName", "  Bruno  ");
    click("saveSettings");

    expect(storedState().settings).toEqual({ finePercent: 5, dailyInterestPercent: 1, receiverName: "Bruno" });
    // 1000 + 5% fine + 5 days x 1% interest
    expect(statusButtons()[5].querySelector(".status-amount").textContent.replace(/\u00a0/g, " ")).toBe("R$ 1.100,00");
  });

  it("rejects a negative fine", async () => {
    await bootApp();
    click("settingsButton");
    setValue("finePercent", "-1");
    click("saveSettings");
    expect(document.getElementById("settingsModal").hidden).toBe(false);
    expect(document.getElementById("finePercent").validationMessage).toBe("Informe um percentual válido igual ou maior que zero.");
  });
});

describe("receipts", () => {
  it("only offers a receipt for paid months", async () => {
    await bootApp(makeState({ units: [makeUnit({ dueDay: null, status: { "2024-02": "pago" } })] }));
    const buttons = document.querySelectorAll(".receipt-btn");
    expect(buttons).toHaveLength(1);
    expect(buttons[0].dataset.receiptMonth).toBe("1");
  });

  it("renders the receipt with the amount of the month", async () => {
    await bootApp(makeState({
      units: [makeUnit({ dueDay: null, status: { "2024-09": "pago" }, rentChanges: [{ fromYm: "2024-09", rent: 1300 }] })],
      settings: { finePercent: 10, dailyInterestPercent: 0.3, receiverName: "Bruno" }
    }));
    document.querySelector(".receipt-btn").click();

    const receipt = document.getElementById("receiptPreview").textContent.replace(/\u00a0/g, " ");
    expect(document.getElementById("receiptModal").hidden).toBe(false);
    expect(receipt).toContain("R$ 1.300,00");
    expect(receipt).toContain("Setembro de 2024");
    expect(receipt).toContain("Bruno");
  });

  it("notes payments made after the due date", async () => {
    await bootApp(makeState({ units: [makeUnit({ dueDay: null, status: { "2024-02": "pago" }, paidLate: { "2024-02": true } })] }));
    document.querySelector(".receipt-btn").click();
    expect(document.querySelector(".receipt-note").textContent).toBe("Pagamento efetuado em atraso.");
  });

  it("downloads the receipt as a png drawn on a canvas", async () => {
    const drawn = [];
    const context = {
      measureText: (text) => ({ width: text.length * 15 }),
      fillText: (text) => drawn.push(text),
      fillRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {}
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,x");
    const clicked = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () { clicked.push(this.download); });

    await bootApp(makeState({
      units: [makeUnit({ name: "Casa dos Fundos", dueDay: null, status: { "2024-02": "pago" }, paidLate: { "2024-02": true } })],
      settings: { finePercent: 10, dailyInterestPercent: 0.3, receiverName: "Bruno" }
    }));
    document.querySelector(".receipt-btn").click();
    click("downloadReceipt");

    expect(clicked).toEqual(["recibo-casa-dos-fundos-2024-02.png"]);
    expect(drawn).toContain("Recibo de Aluguel");
    expect(drawn).toContain("Bruno");
    expect(drawn).toContain("Pagamento efetuado em atraso.");
    expect(drawn.join(" ")).toContain("Fevereiro");
  });

  it("prints the receipt and clears the print area afterwards", async () => {
    vi.spyOn(window, "print").mockImplementation(() => {});
    await bootApp(makeState({ units: [makeUnit({ dueDay: null, status: { "2024-02": "pago" } })] }));
    document.querySelector(".receipt-btn").click();
    click("printReceiptButton");

    await vi.advanceTimersByTimeAsync(300);
    expect(window.print).toHaveBeenCalledOnce();
    expect(document.getElementById("printReceipt").innerHTML).not.toBe("");

    await vi.advanceTimersByTimeAsync(1000);
    expect(document.getElementById("printReceipt").innerHTML).toBe("");
  });

  it("closes on Escape and clears the preview", async () => {
    await bootApp(makeState({ units: [makeUnit({ dueDay: null, status: { "2024-02": "pago" } })] }));
    document.querySelector(".receipt-btn").click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(document.getElementById("receiptModal").hidden).toBe(true);
    expect(document.getElementById("receiptPreview").innerHTML).toBe("");
  });
});

describe("backup", () => {
  it("exports the current state as a json download", async () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:state");
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const clicked = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () { clicked.push(this.download); });

    await bootApp(makeState({ units: [makeUnit()] }));
    click("exportBackup");

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:state");
    expect(clicked).toEqual(["controle-alugueis-backup-2024-06-15.json"]);
    delete URL.createObjectURL;
    delete URL.revokeObjectURL;
  });

  it("replaces the state with a valid backup file", async () => {
    await bootApp();
    const backup = makeState({ units: [makeUnit({ name: "Importada" })] });
    const input = document.getElementById("backupFile");
    Object.defineProperty(input, "files", { value: [new File([JSON.stringify(backup)], "backup.json", { type: "application/json" })] });
    input.dispatchEvent(new Event("change"));
    await vi.waitFor(() => expect(rowNames()).toEqual(["Importada"]));
    expect(storedState().units[0].name).toBe("Importada");
  });

  it("rejects a file that is not a recognizable backup", async () => {
    await bootApp();
    const input = document.getElementById("backupFile");
    Object.defineProperty(input, "files", { value: [new File(["{\"units\":\"nope\"}"], "backup.json", { type: "application/json" })] });
    input.dispatchEvent(new Event("change"));
    await vi.waitFor(() => expect(window.alert).toHaveBeenCalledWith("Não foi possível importar: o backup não tem um formato reconhecido."));
    expect(storedState()).toBeNull();
  });

  it("rejects a file that is not valid json", async () => {
    await bootApp();
    const input = document.getElementById("backupFile");
    Object.defineProperty(input, "files", { value: [new File(["not json"], "backup.json", { type: "application/json" })] });
    input.dispatchEvent(new Event("change"));
    await vi.waitFor(() => expect(window.alert).toHaveBeenCalledWith("Não foi possível importar: o arquivo não contém um JSON válido."));
  });
});

describe("modals", () => {
  it("closes on Escape and on a click outside", async () => {
    await bootApp();
    click("addUnit");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(document.getElementById("modal").hidden).toBe(true);

    click("addExpense");
    document.getElementById("expenseModal").click();
    expect(document.getElementById("expenseModal").hidden).toBe(true);

    click("settingsButton");
    document.getElementById("settingsModal").click();
    expect(document.getElementById("settingsModal").hidden).toBe(true);
  });
});
