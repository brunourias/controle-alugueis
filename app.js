(function () {
    "use strict";

// ===============================
// Gerenciador de Modais
// ===============================

const ModalManager = (() => {

    const stack = [];

    function getOpenModal() {
        return document.querySelector(".modal-backdrop:not([hidden])");
    }

    function open(modal) {
        if (!modal) return;

        modal.hidden = false;
        document.body.classList.add("modal-open");

        stack.push(modal);

        history.pushState({
            modal: true,
            id: modal.id || null
        }, "");
    }

    function close(modal = null) {

        const target = modal || stack.pop() || getOpenModal();

        if (!target) return false;

        target.hidden = true;

        const hasModalOpen =
            document.querySelector(".modal-backdrop:not([hidden])");

        if (!hasModalOpen) {
            document.body.classList.remove("modal-open");
        }

        return true;
    }

    window.addEventListener("popstate", () => {

        const opened = getOpenModal();

        if (!opened) return;

        close(opened);

    });

    return {
        open,
        close,
        getOpenModal
    };

})();

    var STORAGE_KEY = "controle-alugueis-v1";
    var LOCK_STORAGE_KEY = "controle-alugueis-lock";
    var SETUP_FLAG_KEY = "controle-alugueis-lock-setup";

    var ENTERPRISE_SELECTION_KEY = "controle-alugueis-empreendimento";

    var FIREBASE_CONFIG = {
        apiKey: "AIzaSyC9G72amaYJ4CiBgNcyMcNyi1MDva_8J1I",
        authDomain: "controle-alugueis-38871.firebaseapp.com",
        projectId: "controle-alugueis-38871",
        storageBucket: "controle-alugueis-38871.firebasestorage.app",
        messagingSenderId: "36592018809",
        appId: "1:36592018809:web:c4d7237fbfba0901487ba8",
    };

    var DEFAULT_ENTERPRISE_NAME = "Meu empreendimento";

    var DEFAULT_SETTINGS = {
        finePercent: 10,
        // Mantém o nome antigo do campo para compatibilidade com dados salvos.
        // O valor agora representa JUROS DE MORA AO MÊS, não ao dia.
        dailyInterestPercent: 1,
        receiverName: "",
        reminderDays: 5,
    };
    var months = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
    ];
    var fullMonths = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
    ];
    var DEFAULT_EXPENSE_CATEGORIES = [
        "Manutenção",
        "Mão de obra",
        "IPTU",
        "Água",
        "Luz",
        "Outros",
    ];
    var statusOrder = ["pendente", "pago", "atrasado"];
    var state = loadState();
    var expenseCategories = state.expenseCategories;
    var selectedEmpreendimentoId = loadSelectedEmpreendimento();
    var selectedYear = new Date().getFullYear();
    var editingId = null;
    var pendingRentChanges = [];
	var pendingContractHistory = [];
    var editingExpenseId = null;
    var expensesExpanded = false;
    var summaryCardsExpanded = false;
    var actionCenterExpanded = false;
    var didInitialScroll = false;
    var lastGridScrollLeft = 0;
    var receiptContext = null;
    var lockConfig = loadLockConfig();
    var appUnlocked = false;
    var authMode = "login";
    var autoLockTimer = null;
    var AUTO_LOCK_MS = 5 * 60 * 1000;
    var sensitiveAction = null;

    var grid = document.getElementById("grid");
    var tableWrap = grid.parentElement;
    var empty = document.getElementById("empty");
    var filterEmpty = document.getElementById("filterEmpty");
    var unitSearch = document.getElementById("unitSearch");
    var statusFilter = document.getElementById("statusFilter");
    var summary = document.getElementById("summary");
    var expensesList = document.getElementById("expensesList");
    var toggleExpensesButton = document.getElementById("toggleExpenses");
    var expensesTotal = document.getElementById("expensesTotal");
    var expensesYear = document.getElementById("expensesYear");
    var lockError = document.getElementById("lockError");
    var modal = document.getElementById("modal");
    var settingsModal = document.getElementById("settingsModal");
    var receiptModal = document.getElementById("receiptModal");
    var receiptPreview = document.getElementById("receiptPreview");
    var printReceipt = document.getElementById("printReceipt");
    var printReport = document.getElementById("printReport");
    var authModal = document.getElementById("authModal");
    var authTitle = document.getElementById("authTitle");
    var authMessage = document.getElementById("authMessage");
    var authForm = document.getElementById("authForm");
    var authNewLabel = document.getElementById("authNewLabel");
    var authNewPin = document.getElementById("authNewPin");
    var authConfirmLabel = document.getElementById("authConfirmLabel");
    var authConfirmPin = document.getElementById("authConfirmPin");
    var authPinLabel = document.getElementById("authPinLabel");
    var authPin = document.getElementById("authPin");
    var authError = document.getElementById("authError");
    var authSkip = document.getElementById("authSkip");
    var authSubmit = document.getElementById("authSubmit");
    var unitName = document.getElementById("unitName");
    var unitRent = document.getElementById("unitRent");
    var unitDueDay = document.getElementById("unitDueDay");
    var unitStartYm = document.getElementById("unitStartYm");
    var unitEndYm = document.getElementById("unitEndYm");
    var unitEmpreendimento = document.getElementById("unitEmpreendimento");
    var tenantName = document.getElementById("tenantName");
    var tenantPhone = document.getElementById("tenantPhone");
    var tenantEmail = document.getElementById("tenantEmail");
    var tenantNotes = document.getElementById("tenantNotes");
    var contractAttachment = document.getElementById("contractAttachment");
    var attachmentStatus = document.getElementById("attachmentStatus");
    var attachmentList = document.getElementById("attachmentList");
    var rentChangesList = document.getElementById("rentChangesList");
    var rentChangeYm = document.getElementById("rentChangeYm");
    var rentChangePercent = document.getElementById("rentChangePercent");
    var rentChangeAbsolute = document.getElementById("rentChangeAbsolute");
    var addRentChangeButton = document.getElementById("addRentChange");
	var contractHistoryList = document.getElementById("contractHistoryList");
var archiveContract = document.getElementById("archiveContract");
var historyTenant = document.getElementById("historyTenant");
var historyStart = document.getElementById("historyStart");
var historyEnd = document.getElementById("historyEnd");
var historyRent = document.getElementById("historyRent");
    var historyStatus = document.getElementById("historyStatus");
    var historyReason = document.getElementById("historyReason");
    var addContractHistory = document.getElementById("addContractHistory");
    var historyManual = document.getElementById("historyManual");
	
    var finePercent = document.getElementById("finePercent");

    //--------------------------------------------------------------------------------------------

    var dailyInterestPercent = document.getElementById("dailyInterestPercent");
    var receiverName = document.getElementById("receiverName");
    var reminderDays = document.getElementById("reminderDays");
    var securityStatus = document.getElementById("securityStatus");
    var currentPinLabel = document.getElementById("currentPinLabel");
    var currentPin = document.getElementById("currentPin");
    var newPin = document.getElementById("newPin");
    var confirmPin = document.getElementById("confirmPin");
    var savePinButton = document.getElementById("savePin");
    var removePinButton = document.getElementById("removePin");
    var backupFile = document.getElementById("backupFile");
    var expenseModal = document.getElementById("expenseModal");
    var expenseModalTitle = document.getElementById("expenseModalTitle");
    var expenseYm = document.getElementById("expenseYm");
    var expenseEmpreendimento = document.getElementById(
        "expenseEmpreendimento"
    );
    var expenseCategory = document.getElementById("expenseCategory");
    var expenseAmount = document.getElementById("expenseAmount");
    var expenseDescription = document.getElementById("expenseDescription");
    var recurrenceArea = document.getElementById("recurrenceArea");
    var expenseRepeat = document.getElementById("expenseRepeat");
    var expenseRepeatCount = document.getElementById("expenseRepeatCount");
    var deleteExpenseButton = document.getElementById("deleteExpense");
    var categoryList = document.getElementById("categoryList");
    var newCategory = document.getElementById("newCategory");
    var addCategoryButton = document.getElementById("addCategory");
    var categoryStatus = document.getElementById("categoryStatus");
    var appTitle = document.getElementById("appTitle");
    var empreendimentoFilter = document.getElementById("empreendimentoFilter");
    var enterpriseList = document.getElementById("enterpriseList");
    var newEnterprise = document.getElementById("newEnterprise");
    var addEnterpriseButton = document.getElementById("addEnterprise");
    var enterpriseStatus = document.getElementById("enterpriseStatus");

    var cloudStatus = document.getElementById("cloudStatus");
    var cloudSignedOut = document.getElementById("cloudSignedOut");
    var cloudSignedIn = document.getElementById("cloudSignedIn");
    var cloudUserEmail = document.getElementById("cloudUserEmail");
    var cloudEmail = document.getElementById("cloudEmail");
    var cloudPassword = document.getElementById("cloudPassword");
    var cloudGoogleSignIn = document.getElementById("cloudGoogleSignIn");
    var cloudResetPassword = document.getElementById("cloudResetPassword");
    var cloudVerification = document.getElementById("cloudVerification");
    var cloudResendVerification = document.getElementById("cloudResendVerification");
    var cloudError = document.getElementById("cloudError");
    var syncStatus = document.getElementById("syncStatus");
    var cloudReconcile = document.getElementById("cloudReconcile");
    var cloudReconcileText = document.getElementById("cloudReconcileText");
    var useCloudData = document.getElementById("useCloudData");
    var useLocalData = document.getElementById("useLocalData");
    var cloudBanner = document.getElementById("cloudBanner");
    var cloudBannerText = document.getElementById("cloudBannerText");
    var bannerUseCloud = document.getElementById("bannerUseCloud");
    var bannerUseLocal = document.getElementById("bannerUseLocal");
    var firebaseAuth = null;
    var firebaseDb = null;
    var firebaseStorage = null;
    var firebaseUser = null;
    var firebaseUnsubscribe = null;
    var cloudWriteTimer = null;
    var cloudWriteInFlight = false;
    var cloudWriteQueued = false;
    var cloudHasPendingWrite = false;
    var cloudWriteRevision = 0;
    var cloudUpdatedAt = 0;
    var cloudApplyingRemote = false;
    var cloudPendingRemote = null;
    var cloudInitialized = false;

    function newEnterpriseId() {
        return (
            "emp-" +
            Date.now().toString(36) +
            Math.random().toString(36).slice(2)
        );
    }

    function normalizeEmpreendimentos(empreendimentos) {
        var result = [];
        var ids = [];
        if (Array.isArray(empreendimentos))
            empreendimentos.forEach(function (item) {
                if (!item || typeof item !== "object" || Array.isArray(item))
                    return;
                var name =
                    typeof item.name === "string" ? item.name.trim() : "";
                if (
                    !name ||
                    result.some(function (existing) {
                        return (
                            normalizeText(existing.name) === normalizeText(name)
                        );
                    })
                )
                    return;
                var id =
                    typeof item.id === "string" &&
                    item.id.trim() &&
                    ids.indexOf(item.id) < 0
                        ? item.id
                        : newEnterpriseId();
                ids.push(id);
                result.push({ id: id, name: name });
            });
        if (!result.length)
            result.push({
                id: newEnterpriseId(),
                name: DEFAULT_ENTERPRISE_NAME,
            });
        return result;
    }

    function normalizeState(saved) {
        saved =
            saved && typeof saved === "object" && !Array.isArray(saved)
                ? saved
                : {};
        saved.empreendimentos = normalizeEmpreendimentos(saved.empreendimentos);
        var validIds = saved.empreendimentos.map(function (item) {
            return item.id;
        });
        saved.units = Array.isArray(saved.units)
            ? saved.units.filter(function (unit) {
                  return (
                      unit && typeof unit === "object" && !Array.isArray(unit)
                  );
              })
            : [];
        saved.units.forEach(function (unit) {
            normalizeUnit(unit);
            if (validIds.indexOf(unit.empreendimentoId) < 0)
                unit.empreendimentoId = validIds[0];
        });
        saved.settings = normalizeSettings(saved.settings);
        saved.expenseCategories = normalizeCategories(saved.expenseCategories);
        saved.expenses = normalizeExpenses(saved.expenses);
        saved.expenses.forEach(function (expense) {
            if (validIds.indexOf(expense.empreendimentoId) < 0)
                expense.empreendimentoId = validIds[0];
        });
        saved.tasks = Array.isArray(saved.tasks) ? saved.tasks.filter(function (task) {
            return task && typeof task === "object" && typeof task.title === "string";
        }).map(function (task) {
            return { id: typeof task.id === "string" ? task.id : "task-" + Date.now().toString(36),
                title: task.title.trim().slice(0, 140), unitId: typeof task.unitId === "string" ? task.unitId : "",
                dueDate: isValidDateValue(task.dueDate) ? task.dueDate : "", done: task.done === true,
                createdAt: typeof task.createdAt === "string" ? task.createdAt : new Date().toISOString() };
        }) : [];
        saved.renewalDecisions = saved.renewalDecisions && typeof saved.renewalDecisions === "object" ? saved.renewalDecisions : {};
        return saved;
    }

    function loadSelectedEmpreendimento() {
        var value = localStorage.getItem(ENTERPRISE_SELECTION_KEY);

        if (
            state.empreendimentos.some(function (item) {
                return item.id === value;
            })
        ) {
            return value;
        }

        return state.empreendimentos.length
            ? state.empreendimentos[0].id
            : null;
    }

    function saveSelectedEmpreendimento() {
        localStorage.setItem(
            ENTERPRISE_SELECTION_KEY,
            selectedEmpreendimentoId
        );
    }

    function scopedUnits() {
        return selectedEmpreendimentoId === "todos"
            ? state.units
            : state.units.filter(function (unit) {
                  return unit.empreendimentoId === selectedEmpreendimentoId;
              });
    }

    function scopedExpenses() {
        return selectedEmpreendimentoId === "todos"
            ? state.expenses
            : state.expenses.filter(function (expense) {
                  return expense.empreendimentoId === selectedEmpreendimentoId;
              });
    }

    function empreendimentoName(id) {
        var item = state.empreendimentos.find(function (enterprise) {
            return enterprise.id === id;
        });
        return item ? item.name : DEFAULT_ENTERPRISE_NAME;
    }

    function populateEmpreendimentoSelect(select, selected, allowTodos) {
        var options = allowTodos
            ? [{ id: "todos", name: "Todos" }]
            : selected
            ? []
            : [{ id: "", name: "Selecione um empreendimento" }];
        options = options.concat(state.empreendimentos);
        select.innerHTML = options
            .map(function (item) {
                return (
                    '<option value="' +
                    escapeHtml(item.id) +
                    '">' +
                    escapeHtml(item.name) +
                    "</option>"
                );
            })
            .join("");
        if (
            selected &&
            options.some(function (item) {
                return item.id === selected;
            })
        )
            select.value = selected;
        else if (allowTodos) select.value = "todos";
        else select.value = "";
    }

    function renderEmpreendimentoFilter() {
        populateEmpreendimentoSelect(
            empreendimentoFilter,
            selectedEmpreendimentoId,
            true
        );
    }

    function updateAppTitle() {
        var title =
            selectedEmpreendimentoId === "todos"
                ? "Todos"
                : empreendimentoName(selectedEmpreendimentoId);
        appTitle.textContent = title;
        document.title = title;
		updateHeaderMeta();
    }
	
	function updateHeaderMeta() {
		var now = new Date();
		var refMonth = selectedYear === now.getFullYear() ? now.getMonth() : 11;
		var units = scopedUnits();
		var total = units.reduce(function (sum, unit) {
		  return sum + (isActive(unit, refMonth) ? rentForMonth(unit, selectedYear, refMonth) : 0);
		}, 0);
		var enterpriseCount = state.empreendimentos.length;
		var unitLabel = units.length === 1 ? "unidade" : "unidades";
		var enterpriseLabel = enterpriseCount === 1 ? "empreendimento" : "empreendimentos";
		var parts = [];
		if (selectedEmpreendimentoId === "todos") {
		  parts.push("<span>🏙 " + enterpriseCount + " " + enterpriseLabel + "</span>");
		}
		parts.push("<span>🏢 " + units.length + " " + unitLabel + "</span>");
		parts.push("<span> -💲 " + money(total) + "/mês</span>");
		headerMeta.innerHTML = parts.join("");
	}

    function normalizeSettings(settings) {
        return {
            finePercent:
                settings &&
                Number.isFinite(Number(settings.finePercent)) &&
                Number(settings.finePercent) >= 0
                    ? Number(settings.finePercent)
                    : DEFAULT_SETTINGS.finePercent,
            dailyInterestPercent:
                settings &&
                Number.isFinite(Number(settings.dailyInterestPercent)) &&
                Number(settings.dailyInterestPercent) >= 0
                    ? (Number(settings.dailyInterestPercent) === 0.3
                        ? DEFAULT_SETTINGS.dailyInterestPercent
                        : Number(settings.dailyInterestPercent))
                    : DEFAULT_SETTINGS.dailyInterestPercent,
            receiverName:
                settings && typeof settings.receiverName === "string"
                    ? settings.receiverName.trim()
                    : DEFAULT_SETTINGS.receiverName,
            reminderDays:
                settings && Number.isInteger(Number(settings.reminderDays)) && Number(settings.reminderDays) >= 0 && Number(settings.reminderDays) <= 30
                    ? Number(settings.reminderDays)
                    : DEFAULT_SETTINGS.reminderDays,
        };
    }

    function newExpenseId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }

    function normalizeCategories(categories) {
        if (!Array.isArray(categories))
            return DEFAULT_EXPENSE_CATEGORIES.slice();
        var result = [];
        categories.forEach(function (category) {
            if (typeof category !== "string") return;
            var value = category.trim();
            if (
                value &&
                !result.some(function (item) {
                    return normalizeText(item) === normalizeText(value);
                })
            )
                result.push(value);
        });
        if (!result.length) return DEFAULT_EXPENSE_CATEGORIES.slice();
        if (
            !result.some(function (item) {
                return normalizeText(item) === "outros";
            })
        )
            result.push("Outros");
        return result;
    }

    function isValidDateValue(value) {
        if (
            typeof value !== "string" ||
            !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)
        )
            return false;
        var parts = value.split("-").map(Number);
        var date = new Date(parts[0], parts[1] - 1, parts[2]);
        return (
            date.getFullYear() === parts[0] &&
            date.getMonth() === parts[1] - 1 &&
            date.getDate() === parts[2]
        );
    }

    function localDateValue(date) {
        return (
            date.getFullYear() +
            "-" +
            String(date.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(date.getDate()).padStart(2, "0")
        );
    }

    function expenseDateForMonth(ym, day) {
        var parts = ym.split("-").map(Number);
        var lastDay = new Date(parts[0], parts[1], 0).getDate();

        return ym + "-" + String(Math.min(day, lastDay)).padStart(2, "0");
    }

    function normalizeExpense(expense) {
        if (!expense || typeof expense !== "object" || Array.isArray(expense))
            return null;
        var date = isValidDateValue(expense.date)
            ? expense.date
            : isValidStartYm(expense.ym)
            ? expense.ym + "-01"
            : localDateValue(new Date());
        var amount = Number(expense.amount);
        return {
            id:
                typeof expense.id === "string" && expense.id.trim()
                    ? expense.id
                    : newExpenseId(),
            date: date,
            ym: date.slice(0, 7),
            empreendimentoId:
                typeof expense.empreendimentoId === "string"
                    ? expense.empreendimentoId
                    : null,
            category:
                typeof expense.category === "string" && expense.category.trim()
                    ? expense.category.trim()
                    : "Outros",
            description:
                typeof expense.description === "string"
                    ? expense.description.trim()
                    : "",
            amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
            recurrenceId:
                typeof expense.recurrenceId === "string" &&
                expense.recurrenceId.trim()
                    ? expense.recurrenceId
                    : null,
        };
    }

    function normalizeExpenses(expenses) {
        if (!Array.isArray(expenses)) return [];
        return expenses.map(normalizeExpense).filter(function (expense) {
            return expense !== null;
        });
    }

    function normalizeRentChanges(changes) {
        if (!Array.isArray(changes)) return [];
        return changes
            .map(function (change) {
                if (
                    !change ||
                    typeof change !== "object" ||
                    Array.isArray(change) ||
                    !isValidStartYm(change.fromYm)
                )
                    return null;
                var rent = Number(change.rent);
                return Number.isFinite(rent) && rent >= 0
                    ? {
                          fromYm: change.fromYm,
                          rent: Math.round(rent * 100) / 100,
                      }
                    : null;
            })
            .filter(function (change) {
                return change !== null;
            })
            .sort(function (a, b) {
                return a.fromYm.localeCompare(b.fromYm);
            })
            .filter(function (change, index, list) {
                return index === 0 || change.fromYm !== list[index - 1].fromYm;
            });
    }
	
	function normalizeContractHistory(list) {
  if (!Array.isArray(list)) return [];
  return list.map(function (item) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    var tenantName = typeof item.tenantName === "string" ? item.tenantName.trim() : "";
    var startYm = isValidStartYm(item.startYm) ? item.startYm : null;
    var endYm = isValidStartYm(item.endYm) ? item.endYm : null;
    var rentValue = item.rent === null || item.rent ===
undefined || item.rent === "" ? null : Number(item.rent);
    var rent = rentValue !== null && Number.isFinite(rentValue)
&& rentValue >= 0 ? rentValue : null;
    if (!tenantName && !startYm && !endYm && rent === null) return null;
    return { tenantName: tenantName, startYm: startYm, endYm: endYm, rent: rent };
  }).filter(function (item) { return item !== null; });
}

    function contractDateValue(value, fallbackYm, isEnd) {
        if (isValidDateValue(value)) return value;
        if (!isValidStartYm(fallbackYm)) return null;
        if (!isEnd) return fallbackYm + "-01";
        var parts = fallbackYm.split("-").map(Number);
        return fallbackYm + "-" + String(new Date(parts[0], parts[1], 0).getDate()).padStart(2, "0");
    }

    function contractMonthValue(dateValue) {
        return isValidDateValue(dateValue) ? dateValue.slice(0, 7) : null;
    }

    function normalizeUnit(unit) {
        unit.status =
            unit.status &&
            typeof unit.status === "object" &&
            !Array.isArray(unit.status)
                ? unit.status
                : {};
        unit.paidLate =
            unit.paidLate &&
            typeof unit.paidLate === "object" &&
            !Array.isArray(unit.paidLate)
                ? unit.paidLate
                : {};
        unit.startDate = contractDateValue(unit.startDate, unit.startYm, false);
        unit.endDate = contractDateValue(unit.endDate, unit.endYm, true);
        unit.startYm = contractMonthValue(unit.startDate);
        unit.endYm = contractMonthValue(unit.endDate);
        unit.rent =
            Number.isFinite(Number(unit.rent)) && Number(unit.rent) >= 0
                ? Number(unit.rent)
                : 0;
        unit.rentChanges = normalizeRentChanges(unit.rentChanges);
        unit.contractHistory = normalizeContractHistory(unit.contractHistory);
        unit.attachments = Array.isArray(unit.attachments) ? unit.attachments.filter(function (item) {
            return item && typeof item === "object" && typeof item.name === "string" && typeof item.url === "string";
        }).slice(0, 30) : [];
        unit.chargeLog = Array.isArray(unit.chargeLog) ? unit.chargeLog.filter(function (entry) {
            return entry && typeof entry === "object" && typeof entry.createdAt === "string";
        }).slice(0, 40) : [];
        unit.lateLedger =
            unit.lateLedger &&
            typeof unit.lateLedger === "object" &&
            !Array.isArray(unit.lateLedger)
                ? unit.lateLedger
                : {};
        // Migra atrasos do contrato anterior quando uma nova locação começa depois dele.
        if (isValidDateValue(unit.startDate)) {
            unit.contractHistory.forEach(function (contract) {
                if (!isValidDateValue(contract.endDate) || contract.endDate >= unit.startDate) return;
                Object.keys(unit.status).forEach(function (key) {
                    if (key <= contract.endYm && unit.status[key] === "atrasado") {
                        unit.lateLedger[key] = "open";
                        delete unit.status[key];
                    }
                });
                Object.keys(unit.paidLate).forEach(function (key) {
                    if (key <= contract.endYm && unit.paidLate[key] === true) {
                        unit.lateLedger[key] = "paid";
                        delete unit.paidLate[key];
                    }
                });
            });
        }
		if (unit.startYm && unit.endYm && unit.endYm < unit.startYm)
            unit.endYm = null;
        unit.tenantName =
            typeof unit.tenantName === "string" ? unit.tenantName.trim() : "";
        unit.tenantPhone =
            typeof unit.tenantPhone === "string" ? unit.tenantPhone.trim() : "";
        unit.tenantEmail =
            typeof unit.tenantEmail === "string" ? unit.tenantEmail.trim() : "";
        unit.tenantNotes =
            typeof unit.tenantNotes === "string" ? unit.tenantNotes.trim() : "";
        unit.empreendimentoId =
            typeof unit.empreendimentoId === "string"
                ? unit.empreendimentoId
                : null;
    }

    function loadState() {
        try {
            var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

            if (saved && typeof saved === "object" && !Array.isArray(saved)) {
                return normalizeState(saved);
            }
        } catch (error) {
            // Usa um estado limpo quando o armazenamento estiver inválido
        }

        return normalizeState({
            units: [],
            empreendimentos: [],
            settings: DEFAULT_SETTINGS,
            expenseCategories: DEFAULT_EXPENSE_CATEGORIES.slice(),
            expenses: [],
        });
    }

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

        if (!cloudApplyingRemote) scheduleCloudWrite();
    }

    function setCloudError(message) {
        cloudError.textContent = message || "";
    }

    function setSyncStatus(message) {
        syncStatus.textContent = message;
    }

    function cloudErrorMessage(error) {
        console.error("Firebase:", error);
        console.error("Código:", error && error.code);
        console.error("Mensagem:", error && error.message);

        var code = error && error.code ? error.code : "";

        if (code === "auth/invalid-email") return "Informe um e-mail válido.";

        if (code === "auth/weak-password")
            return "A senha deve ter pelo menos 6 caracteres.";

        if (code === "auth/email-already-in-use")
            return "Este e-mail já está em uso.";

        if (code === "auth/operation-not-allowed")
            return "O login por e-mail e senha ainda não está habilitado no Firebase.";

        if (
            code === "auth/invalid-credential" ||
            code === "auth/wrong-password" ||
            code === "auth/user-not-found"
        )
            return "E-mail ou senha inválidos.";

        if (code === "auth/network-request-failed" || !navigator.onLine)
            return "Sem conexão. Tente novamente quando estiver online.";

        if (
            code === "permission-denied" ||
            code === "firestore/permission-denied"
        )
            return "A conta entrou, mas as regras da nuvem ainda não permitem acessar os dados.";

        return "Não foi possível conectar à nuvem agora. Os dados locais continuam disponíveis.";
    }

    function cloudCounts(value) {
        return (
            (value.units || []).length +
            " unidade" +
            ((value.units || []).length === 1 ? "" : "s") +
            " / " +
            (value.expenses || []).length +
            " gasto" +
            ((value.expenses || []).length === 1 ? "" : "s")
        );
    }

    function updateConnectionStatus() {
        if (!firebaseUser) return;

        if (!navigator.onLine) {
            setCloudStatus("Conta conectada. Trabalhando offline.");

            setSyncStatus("Offline — alterações salvas localmente");

            return;
        }

        setCloudStatus("Conta conectada. Sincronização automática ativa.");
    }

    function setCloudReconcilePrompt(remoteState) {
        var message =
            "Há dados diferentes entre a nuvem (" +
            cloudCounts(remoteState) +
            ") e este aparelho (" +
            cloudCounts(state) +
            "). Escolha qual versão deseja manter.";
        cloudReconcileText.textContent = message;
        cloudReconcile.hidden = false;
        cloudBannerText.textContent = message;
        cloudBanner.hidden = false;
    }

    function sortObject(value) {
        if (Array.isArray(value)) {
            return value.map(sortObject);
        }

        if (value && typeof value === "object") {
            var obj = {};

            Object.keys(value)
                .sort()
                .forEach(function (key) {
                    obj[key] = sortObject(value[key]);
                });

            return obj;
        }

        return value;
    }

    function cloudStatesEqual(left, right) {
        return (
            JSON.stringify(
                sortObject(normalizeState(JSON.parse(JSON.stringify(left))))
            ) ===
            JSON.stringify(
                sortObject(normalizeState(JSON.parse(JSON.stringify(right))))
            )
        );
    }

    function cloudDocRef() {
        return firebaseDb && firebaseUser
            ? firebaseDb.collection("users").doc(firebaseUser.uid)
            : null;
    }

    function scheduleCloudWrite() {
        if (!firebaseUser || !firebaseDb || cloudApplyingRemote) return;

        cloudHasPendingWrite = true;
        cloudWriteRevision += 1;
        updateConnectionStatus();

        if (!navigator.onLine) {
            setSyncStatus("Offline — alterações salvas localmente");
            return;
        }

        if (cloudWriteInFlight) {
            cloudWriteQueued = true;
            return;
        }

        clearTimeout(cloudWriteTimer);
        cloudWriteTimer = setTimeout(writeCloudState, 800);
    }

    function writeCloudState() {
        var ref = cloudDocRef();

        if (!ref || !cloudHasPendingWrite) return;

        if (!navigator.onLine) {
            setSyncStatus("Offline — alterações salvas localmente");
            return;
        }

        if (cloudWriteInFlight) {
            cloudWriteQueued = true;
            return;
        }

        var revision = cloudWriteRevision;
        var updatedAt = Date.now();
        var payload = JSON.parse(JSON.stringify(state));

        cloudWriteInFlight = true;
        cloudWriteQueued = false;
        cloudUpdatedAt = Math.max(cloudUpdatedAt, updatedAt);

        ref.set({
            payload: payload,
            updatedAt: updatedAt,
        })
            .then(function () {
                cloudUpdatedAt = updatedAt;
                cloudPendingRemote = null;
                cloudHasPendingWrite = revision < cloudWriteRevision;

                cloudReconcile.hidden = true;
                cloudBanner.hidden = true;

                setCloudStatus(
                    "Conta conectada. Sincronização automática ativa."
                );
                setSyncStatus(
                    cloudHasPendingWrite ? "Sincronizando..." : "Sincronizado"
                );
            })
            .catch(function (error) {
                // Mantém a alteração pendente para uma nova tentativa ao reconectar.
                cloudHasPendingWrite = true;
                setCloudError(cloudErrorMessage(error));

                setSyncStatus(
                    navigator.onLine
                        ? "Não sincronizado — salvo localmente"
                        : "Offline — alterações salvas localmente"
                );
            })
            .then(function () {
                cloudWriteInFlight = false;

                if (cloudWriteQueued || cloudWriteRevision > revision) {
                    cloudWriteQueued = false;
                    clearTimeout(cloudWriteTimer);
                    cloudWriteTimer = setTimeout(writeCloudState, 0);
                }
            });
    }

    function applyRemoteState(payload) {
        cloudApplyingRemote = true;

        state = normalizeState(payload);

        expenseCategories = state.expenseCategories;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

        renderEmpreendimentoFilter();

        render();

        cloudApplyingRemote = false;
    }

    function subscribeCloud() {
        if (firebaseUnsubscribe) firebaseUnsubscribe();

        var ref = cloudDocRef();

        if (!ref) return;

        firebaseUnsubscribe = ref.onSnapshot(
            function (snapshot) {
                if (!snapshot.exists) return;

                var data = snapshot.data() || {};

                var remoteUpdatedAt = Number(data.updatedAt) || 0;

                if (remoteUpdatedAt <= cloudUpdatedAt || !data.payload) return;

                /*
                 * Outra sessão/aparelho alterou a nuvem enquanto este ainda
                 * possui uma alteração local pendente. Não sobrescrevemos
                 * nada silenciosamente: o usuário escolhe qual versão manter.
                 */
                if (
                    cloudHasPendingWrite &&
                    !cloudStatesEqual(state, data.payload)
                ) {
                    cloudPendingRemote = normalizeState(data.payload);
                    setCloudReconcilePrompt(cloudPendingRemote);
                    setSyncStatus("Aguardando escolha");
                    return;
                }

                cloudUpdatedAt = remoteUpdatedAt;

                applyRemoteState(data.payload);

                setSyncStatus(
                    navigator.onLine
                        ? "Sincronizado"
                        : "Offline — alterações salvas localmente"
                );
            },
            function (error) {
                setCloudError(cloudErrorMessage(error));

                setSyncStatus("Não sincronizado — salvo localmente");
            }
        );
    }

    function finishCloudReconciliation() {
        cloudReconcile.hidden = true;
        cloudBanner.hidden = true;
        cloudPendingRemote = null;
        subscribeCloud();
    }

    function reconcileCloud() {
        var ref = cloudDocRef();
        if (!ref) return;
        updateConnectionStatus();
        ref.get()
            .then(function (snapshot) {
                var data = snapshot.exists ? snapshot.data() || {} : null;
                var remoteState =
                    data && data.payload ? normalizeState(data.payload) : null;
                cloudUpdatedAt = data ? Number(data.updatedAt) || 0 : 0;
                if (!remoteState) {
                    scheduleCloudWrite();
                    subscribeCloud();
                    return;
                }
                var localEmpty =
                    state.units.length === 0 && state.expenses.length === 0;
                if (localEmpty) {
                    applyRemoteState(remoteState);
                    finishCloudReconciliation();

                    updateConnectionStatus();

                    return;
                }
                if (cloudStatesEqual(state, remoteState)) {
                    finishCloudReconciliation();

                    updateConnectionStatus();

                    return;
                }
                cloudPendingRemote = remoteState;
                setCloudReconcilePrompt(remoteState);
                setSyncStatus("Aguardando escolha");
            })
            .catch(function (error) {
                setCloudError(cloudErrorMessage(error));
                setSyncStatus("Não sincronizado - salvo localmente");
            });
    }

    function chooseCloudData() {
        if (!cloudPendingRemote) return;

        // A escolha pela nuvem descarta somente a alteração local pendente.
        clearTimeout(cloudWriteTimer);
        cloudWriteQueued = false;
        cloudHasPendingWrite = false;

        applyRemoteState(cloudPendingRemote);

        finishCloudReconciliation();

        setSyncStatus("Sincronizado");
    }

    function chooseLocalData() {
        cloudReconcile.hidden = true;
        cloudPendingRemote = null;

        cloudUpdatedAt = Date.now();

        scheduleCloudWrite();

        subscribeCloud();
    }

    function updateCloudUi() {
        var signedIn = !!firebaseUser;

        cloudSignedOut.hidden = signedIn;

        cloudSignedIn.hidden = !signedIn;

        cloudUserEmail.textContent = signedIn ? firebaseUser.email || "" : "";
        if (cloudVerification) {
            var needsVerification = signedIn && firebaseUser.providerData.some(function (provider) {
                return provider.providerId === "password";
            }) && !firebaseUser.emailVerified;
            cloudVerification.hidden = !needsVerification;
            cloudVerification.textContent = needsVerification
                ? "Confirme seu e-mail para reforçar a segurança da conta."
                : "";
            cloudResendVerification.hidden = !needsVerification;
        }

        if (!signedIn) {
            setSyncStatus("Sincronização desativada");
            cloudReconcile.hidden = true;
        }
    }

    function handleCloudAuthState(user) {
        firebaseUser = user;

        setCloudError("");

        updateCloudUi();

        if (firebaseUnsubscribe) {
            firebaseUnsubscribe();

            firebaseUnsubscribe = null;
        }

        if (user) {
            setCloudStatus("Conta conectada. Preparando sincronização...");

            reconcileCloud();
        } else {
            setCloudStatus(
                "Sincronização opcional com Firebase. Seus dados locais permanecem disponíveis."
            );
        }
    }

    function setCloudStatus(message) {
        cloudStatus.textContent = message;
    }

    function initFirebase() {
        if (!window.firebase || !firebase.initializeApp) {
            setCloudStatus(
                "Nuvem indisponível neste carregamento. O modo local continua funcionando."
            );

            return;
        }

        try {
            if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);

            firebaseAuth = firebase.auth();

            firebaseDb = firebase.firestore();

            firebaseDb
                .enablePersistence({ synchronizeTabs: true })
                .catch(function () {});

            firebaseAuth.onAuthStateChanged(handleCloudAuthState);

            cloudInitialized = true;

            setCloudStatus(
                "Sincronização opcional com Firebase. Seus dados locais permanecem disponíveis."
            );
        } catch (error) {
            setCloudStatus(
                "Não foi possível iniciar a nuvem. O modo local continua funcionando."
            );
        }
    }

    function runCloudAuth(action) {
        setCloudError("");

        var email = cloudEmail.value.trim();

        var password = cloudPassword.value;

        if (!email || email.indexOf("@") < 1) {
            setCloudError("Informe um e-mail válido.");

            cloudEmail.focus();

            return;
        }

        if (password.length < 6) {
            setCloudError("A senha deve ter pelo menos 6 caracteres.");

            cloudPassword.focus();

            return;
        }

        if (!firebaseAuth) {
            setCloudError(
                "A nuvem ainda não está disponível. Tente novamente em instantes."
            );

            return;
        }

        var request =
            action === "signup"
                ? firebaseAuth.createUserWithEmailAndPassword(email, password)
                : firebaseAuth.signInWithEmailAndPassword(email, password);

        request
            .then(function (credential) {
                if (action === "signup" && credential.user && !credential.user.emailVerified) {
                    return credential.user.sendEmailVerification().then(function () {
                        setCloudError("Enviamos um link de confirmação para seu e-mail.");
                    });
                }
            })
            .catch(function (error) {
                setCloudError(cloudErrorMessage(error));
            });
    }

    function resetCloudPassword() {
        var email = cloudEmail.value.trim();
        if (!email || email.indexOf("@") < 1) {
            setCloudError("Informe seu e-mail para receber o link de recuperação.");
            cloudEmail.focus();
            return;
        }
        firebaseAuth.sendPasswordResetEmail(email).then(function () {
            setCloudError("Enviamos o link para redefinir sua senha.");
        }).catch(function (error) { setCloudError(cloudErrorMessage(error)); });
    }

    function signInWithGoogle() {
        if (!firebaseAuth || !window.firebase) return;
        var provider = new firebase.auth.GoogleAuthProvider();
        firebaseAuth.signInWithPopup(provider).catch(function (error) {
            setCloudError(cloudErrorMessage(error));
        });
    }

    function resendCloudVerification() {
        if (!firebaseUser) return;
        firebaseUser.sendEmailVerification().then(function () {
            setCloudError("Novo link de confirmação enviado.");
        }).catch(function (error) { setCloudError(cloudErrorMessage(error)); });
    }

    function hasSubtleCrypto() {
        return (
            window.crypto &&
            window.crypto.subtle &&
            window.crypto.getRandomValues &&
            window.TextEncoder
        );
    }

    function loadLockConfig() {
        try {
            var saved = JSON.parse(
                localStorage.getItem(LOCK_STORAGE_KEY) || "null"
            );
            if (
                saved &&
                typeof saved === "object" &&
                typeof saved.salt === "string" &&
                typeof saved.hash === "string"
            ) {
                return {
                    salt: saved.salt,
                    hash: saved.hash,
                    credentialId:
                        typeof saved.credentialId === "string"
                            ? saved.credentialId
                            : null,
                };
            }
        } catch (error) {}
        return null;
    }

    function bytesToBase64Url(bytes) {
        var binary = "";
        bytes.forEach(function (byte) {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    }

    function base64UrlToBytes(value) {
        var binary = atob(
            value.replace(/-/g, "+").replace(/_/g, "/") +
                "===".slice((value.length + 3) % 4)
        );
        return Uint8Array.from(binary, function (character) {
            return character.charCodeAt(0);
        });
    }

    async function hashPin(pin, salt) {
        var pinBytes = new TextEncoder().encode(pin);
        var saltBytes = base64UrlToBytes(salt);
        var combined = new Uint8Array(saltBytes.length + pinBytes.length);
        combined.set(saltBytes);
        combined.set(pinBytes, saltBytes.length);
        return bytesToBase64Url(
            new Uint8Array(await crypto.subtle.digest("SHA-256", combined))
        );
    }

    function isValidPin(pin) {
        return /^\d{4,}$/.test(pin);
    }

    async function verifyPin(pin, config) {
        if (!hasSubtleCrypto() || !config) return false;
        try {
            return (await hashPin(pin, config.salt)) === config.hash;
        } catch (error) {
            return false;
        }
    }

    function saveLockConfig(config) {
        lockConfig = config;
        if (config)
            localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(config));
        else localStorage.removeItem(LOCK_STORAGE_KEY);
    }

    function randomBytes(length) {
        var bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return bytes;
    }

    function showLockError(message) {
        lockError.textContent = message;
    }

    function showAuthError(message) {
        authError.textContent = message;
    }

    function focusAuthInput(input) {
        try {
            input.focus({ preventScroll: true });
        } catch (error) {
            input.focus();
        }
    }

    function openAuthCreate() {
        document.body.classList.add("app-loading");
        authMode = "create";

        authTitle.textContent = "Criar PIN de acesso";

        authMessage.textContent =
            "Defina um PIN (mín. 4 dígitos) para proteger o app neste aparelho.";

        authNewLabel.hidden = false;
        authConfirmLabel.hidden = false;
        authPinLabel.hidden = true;
        authSkip.hidden = false;

        authSubmit.textContent = "Criar PIN";

        authNewPin.value = "";
        authConfirmPin.value = "";
        authPin.value = "";
        showAuthError("");

        authModal.hidden = false;
        setTimeout(function () {
            focusAuthInput(authNewPin);
        }, 0);
    }

    function openAuthLogin() {
        document.body.classList.add("app-loading");
        authMode = "login";

        authTitle.textContent = "Entrar";

        authMessage.textContent = "Digite seu PIN para acessar.";

        authNewLabel.hidden = true;
        authConfirmLabel.hidden = true;
        authPinLabel.hidden = false;
        authSkip.hidden = true;

        authSubmit.textContent = "Entrar";

        authPin.value = "";
        showAuthError("");

        authModal.hidden = false;
        setTimeout(function () {
            focusAuthInput(authPin);
        }, 0);
    }

    function closeAuth() {
        authModal.hidden = true;
    }

    function scrollPageToTop() {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }

    function revealApp() {
        scrollPageToTop();
        document.body.classList.remove("app-loading");
        armAutoLock();

        // O teclado virtual pode reajustar a viewport após o login no Android.
        window.setTimeout(scrollPageToTop, 100);
        window.setTimeout(scrollPageToTop, 350);
    }

    async function submitAuth(event) {
        event.preventDefault();

        if (!hasSubtleCrypto()) {
            showAuthError(
                "Este navegador não oferece criptografia segura para usar PIN."
            );
            return;
        }

        if (authMode === "sensitive") {
            try {
                if (firebaseUser && firebaseAuth) {
                    var usesGoogle = firebaseUser.providerData.some(function (provider) {
                        return provider.providerId === "google.com";
                    });
                    if (usesGoogle) {
                        await firebaseUser.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider());
                    } else {
                        var credential = firebase.auth.EmailAuthProvider.credential(
                            firebaseUser.email,
                            authPin.value
                        );
                        await firebaseUser.reauthenticateWithCredential(credential);
                    }
                } else if (!(await verifyPin(authPin.value, lockConfig))) {
                    throw new Error("PIN incorreto.");
                }
            } catch (error) {
                showAuthError(error.message === "PIN incorreto." ? error.message : "Não foi possível confirmar sua identidade.");
                authPin.select();
                return;
            }
            var action = sensitiveAction;
            sensitiveAction = null;
            closeAuth();
            if (action) action();
            return;
        }

        if (authMode === "create") {
            if (!isValidPin(authNewPin.value)) {
                showAuthError("O PIN deve ter pelo menos 4 dígitos numéricos.");
                return;
            }

            if (authNewPin.value !== authConfirmPin.value) {
                showAuthError("A confirmação não confere.");
                return;
            }

            var salt = bytesToBase64Url(randomBytes(16));

            saveLockConfig({
                salt: salt,
                hash: await hashPin(authNewPin.value, salt),
            });

            localStorage.setItem(SETUP_FLAG_KEY, "1");
            appUnlocked = true;
            closeAuth();
            revealApp();
            render();
            return;
        }

        if (await verifyPin(authPin.value, lockConfig)) {
            appUnlocked = true;
            closeAuth();
            revealApp();
            render();
            return;
        }

        showAuthError("PIN incorreto.");
        authPin.select();
    }

    function initAuth() {
        
        if (lockConfig) {
            openAuthLogin();
            return;
        }
        if (localStorage.getItem(SETUP_FLAG_KEY) !== "1") {
            openAuthCreate();
            return;
        }
        appUnlocked = true;
        revealApp();
    }

    function armAutoLock() {
        clearTimeout(autoLockTimer);
        if (!lockConfig || !appUnlocked) return;
        autoLockTimer = setTimeout(function () {
            lockApp();
        }, AUTO_LOCK_MS);
    }

    function lockApp() {
        if (!lockConfig || !appUnlocked) return;
        appUnlocked = false;
        openAuthLogin();
    }

    function registerAppActivity() {
        if (appUnlocked) armAutoLock();
    }

    function requireSensitiveAccess(action, callback) {
        if (!lockConfig) {
            window.alert("Defina um PIN em Configurações > Segurança para confirmar " + action + ".");
            return;
        }
        sensitiveAction = callback;
        authMode = "sensitive";
        var usesGoogle = !!(firebaseUser && firebaseUser.providerData.some(function (provider) {
            return provider.providerId === "google.com";
        }));
        var requiresAccountPassword = !!(firebaseUser && firebaseAuth && !usesGoogle);
        authTitle.textContent = "Confirmar ação";
        authMessage.textContent = usesGoogle
            ? "Confirme sua conta Google para " + action + "."
            : (requiresAccountPassword
                ? "Digite a senha da sua conta para " + action + "."
                : "Digite seu PIN para " + action + ".");
        authNewLabel.hidden = true;
        authConfirmLabel.hidden = true;
        authPinLabel.hidden = false;
        authPinLabel.firstChild.textContent = requiresAccountPassword ? "Senha da conta" : "PIN";
        authPin.inputMode = requiresAccountPassword ? "text" : "numeric";
        authPin.removeAttribute("pattern");
        authSkip.hidden = true;
        authSubmit.textContent = "Confirmar";
        authPin.value = "";
        showAuthError("");
        authModal.hidden = false;
        setTimeout(function () { focusAuthInput(authPin); }, 0);
    }

    function exportBackupNow() {
        var date = new Date().toISOString().slice(0, 10);
        var blob = new Blob([JSON.stringify(state, null, 2)], {
            type: "application/json",
        });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "controle-alugueis-backup-" + date + ".json";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function importBackupNow(event) {
        //--------------------------------------------------------------------------------------------
        var file = event.target.files[0];
        event.target.value = "";
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
            var imported;
            try {
                imported = JSON.parse(reader.result);
            } catch (error) {
                window.alert(
                    "Não foi possível importar: o arquivo não contém um JSON válido."
                );
                return;
            }
            if (
                !imported ||
                typeof imported !== "object" ||
                Array.isArray(imported) ||
                !Array.isArray(imported.units) ||
                !imported.units.every(function (unit) {
                    return (
                        unit && typeof unit === "object" && !Array.isArray(unit)
                    );
                }) ||
                (imported.expenses !== undefined &&
                    (!Array.isArray(imported.expenses) ||
                        imported.expenses.some(function (expense) {
                            return (
                                !expense ||
                                typeof expense !== "object" ||
                                Array.isArray(expense) ||
                                !isValidStartYm(expense.ym)
                            );
                        }))) ||
                (imported.expenseCategories !== undefined &&
                    !Array.isArray(imported.expenseCategories))
            ) {
                window.alert(
                    "Não foi possível importar: o backup não tem um formato reconhecido."
                );
                return;
            }
            if (
                !window.confirm(
                    "Importar este backup substituirá todos os dados atuais. Deseja continuar?"
                )
            )
                return;
            imported.units.forEach(normalizeUnit);
            imported.settings = normalizeSettings(imported.settings);
            imported.expenseCategories = normalizeCategories(
                imported.expenseCategories
            );
            imported.expenses = normalizeExpenses(imported.expenses);
            state = normalizeState(imported);
            selectedEmpreendimentoId = loadSelectedEmpreendimento();
            saveState();
            renderEmpreendimentoFilter();
            render();
        };
        reader.onerror = function () {
            window.alert("Não foi possível ler o arquivo de backup.");
        };
        reader.readAsText(file);
    }

    function money(value) {
        return Number(value || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }

    function monthKey(month) {
        return selectedYear + "-" + String(month + 1).padStart(2, "0");
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
        //--------------------------------------------------------------------------------------------
    }

    function previousYm(ym) {
        var parts = ym.split("-").map(Number);
        var date = new Date(parts[0], parts[1] - 2, 1);
        return (
            date.getFullYear() +
            "-" +
            String(date.getMonth() + 1).padStart(2, "0")
        );
    }

    function isValidStartYm(value) {
        return (
            typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
        );
    }

    function ymLabel(ym) {
        if (!isValidStartYm(ym)) return "data inválida";

        var parts = ym.split("-").map(Number);
        var monthIndex = parts[1] - 1;

        return fullMonths[monthIndex] + " de " + parts[0];
    }

	function isActive(unit, month) {
		// Sem inquilino = não existe contrato ativo
		if (!unit || !String(unit.tenantName || "").trim()) {
			return false;
		}

		var key = monthKey(month);

		return (
			(!isValidStartYm(unit.startYm) || key >= unit.startYm) &&
			(!isValidStartYm(unit.endYm) || key <= unit.endYm)
		);
	}


    // ==========================================================
    // HISTÓRICO FINANCEIRO
    //
    // Os pagamentos pertencem ao mês em que foram recebidos,
    // e não ao contrato atualmente ativo da unidade.
    //
    // Quando um contrato é arquivado, os pagamentos já registrados
    // precisam continuar disponíveis para as somatórias anuais.
    // ==========================================================
    function getPaymentRecord(unit, year, month) {
        if (!unit) return null;

        var history =
            unit.paymentHistory &&
            typeof unit.paymentHistory === "object"
                ? unit.paymentHistory
                : {};

        return history[monthKey(month)] || null;
    }

    function historicalReceivedAmount(unit, year, month) {
        /*
         * REGRA DO TOTAL RECEBIDO:
         * somente "Pago" e "Pago atrasado" entram na soma.
         *
         * Internamente os dois usam status = "pago"; o segundo é
         * diferenciado por paidLate[key] = true.
         *
         * Portanto, um registro em paymentHistory sozinho NÃO significa
         * que houve recebimento. O status do mês continua sendo a fonte
         * de verdade para a soma.
         */
        var storedStatus = statusFor(unit, month);

        if (storedStatus !== "pago") {
            return 0;
        }

        var payment = getPaymentRecord(unit, year, month);

        // Pagamento já salvo: mantém exatamente o valor registrado.
        if (
            payment &&
            Number.isFinite(Number(payment.rentAmount))
        ) {
            return Math.max(0, Number(payment.rentAmount));
        }

        // Contrato ainda ativo, mas pagamento antigo sem paymentHistory.
        if (isActive(unit, month)) {
            return Math.max(
                0,
                Number(rentForMonth(unit, year, month)) || 0
            );
        }

        // Contrato já arquivado antes da criação do paymentHistory.
        var archived = archivedContractForMonth(unit, month);

        if (
            archived &&
            Number.isFinite(Number(archived.rent))
        ) {
            return Math.max(0, Number(archived.rent));
        }

        return 0;
    }

    function historicalInterestAmount(unit, year, month) {
        /*
         * Juros só existem para um pagamento que foi efetivamente
         * registrado como "Pago atrasado".
         *
         * É importante NÃO olhar apenas paymentHistory:
         * o histórico pode conter um valor salvo, mas isso não significa
         * que o mês tenha juros. O marcador paidLate é a confirmação de
         * que aquele pagamento foi feito com atraso.
         *
         * Também não usamos isPaidLate() aqui porque ela exige contrato
         * ativo. Contratos arquivados precisam continuar mostrando os
         * juros históricos.
         */
        var key = String(year) + "-" + String(month + 1).padStart(2, "0");

        if (
            statusFor(unit, month) !== "pago" ||
            !unit.paidLate ||
            unit.paidLate[key] !== true
        ) {
            return 0;
        }

        var payment = getPaymentRecord(unit, year, month);

        if (
            payment &&
            Number.isFinite(Number(payment.interestAmount))
        ) {
            return Math.max(0, Number(payment.interestAmount));
        }

        return 0;
    }

    function hasHistoricalPayment(unit, month) {
        var payment = getPaymentRecord(unit, selectedYear, month);

        if (payment) return true;

        return (
            isActive(unit, month) &&
            statusFor(unit, month) === "pago"
        );
    }

    function statusFor(unit, month) {
        return statusOrder.indexOf(unit.status[monthKey(month)]) >= 0
            ? unit.status[monthKey(month)]
            : "pendente";
    }

    function firstContractDueDate(unit) {
        if (!unit || !isValidDateValue(unit.startDate)) return null;
        var parts = unit.startDate.split("-").map(Number);
        var year = parts[0];
        var month = parts[1];
        var day = parts[2];
        var lastDay = new Date(year, month + 1, 0).getDate();
        return new Date(year, month, Math.min(day, lastDay));
    }

    function dueDateFor(unit, month) {
        var firstDueDate = firstContractDueDate(unit);
        if (firstDueDate && monthKey(month) === unit.startYm) return firstDueDate;
        if (
            !Number.isInteger(unit.dueDay) ||
            unit.dueDay < 1 ||
            unit.dueDay > 31
        )
            return null;
        var lastDay = new Date(selectedYear, month + 1, 0).getDate();
        return new Date(selectedYear, month, Math.min(unit.dueDay, lastDay));
    }

    var DUE_SOON_DAYS = 5;

    function dueReminder(unit) {
        if (selectedYear !== new Date().getFullYear()) return null;
        var m = new Date().getMonth();
        if (!isActive(unit, m) || statusFor(unit, m) !== "pendente")
            return null;
        if (daysOverdue(unit, m) !== null) return null;
        var due = dueDateFor(unit, m);
        if (!due) return null;
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var days = Math.round((due - today) / 86400000);
        if (days < 0 || days > Number(state.settings.reminderDays || DUE_SOON_DAYS)) return null;
        return days;
    }

    function daysOverdue(unit, month) {
        if (!isActive(unit, month)) return null;
        var dueDate = dueDateFor(unit, month);
        if (!dueDate) return null;
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        // O primeiro aluguel cobre o primeiro ciclo completo de moradia.
        // Nenhuma parcela pode virar atraso antes desse primeiro ciclo vencer.
        var firstDueDate = firstContractDueDate(unit);
        if (firstDueDate && today < firstDueDate) return null;
        var days = Math.floor((today - dueDate) / 86400000);
        return days > 0 ? days : null;
    }

    function lateChargeBreakdown(unit, month) {
        var days = daysOverdue(unit, month);
        if (days === null) return null;

        var rent = Number(rentForMonth(unit, selectedYear, month)) || 0;
        var fineRate = Number(state.settings.finePercent) / 100;
        var monthlyInterestRate = Number(state.settings.dailyInterestPercent) / 100;
        var dailyInterestRate = monthlyInterestRate / 30;

        var fineAmount = rent * fineRate;
        var interestAmount = rent * dailyInterestRate * days;
        var chargesAmount = fineAmount + interestAmount;
        var totalAmount = rent + chargesAmount;

        return {
            days: days,
            rentAmount: rent,
            fineAmount: fineAmount,
            interestAmount: interestAmount,
            chargesAmount: chargesAmount,
            totalAmount: totalAmount
        };
    }

    function updatedAmount(unit, month) {
        var days = daysOverdue(unit, month);
        if (days === null) return null;

        var rent = rentForMonth(unit, selectedYear, month);
        var fineRate = Number(state.settings.finePercent) / 100;
        var monthlyInterestRate = Number(state.settings.dailyInterestPercent) / 100;
        var dailyInterestRate = monthlyInterestRate / 30;

        // Contrato V2.5:
        // multa de 10% uma única vez + juros de mora de 1% a.m.
        // pro rata die, sem capitalização e sem juros sobre a multa.
        var multa = rent * fineRate;
        var juros = rent * dailyInterestRate * days;

        return rent + multa + juros;
    }

    function effectiveStatus(unit, month) {
        if (!isActive(unit, month)) return null;
        var storedStatus = statusFor(unit, month);
        if (storedStatus !== "pendente") return storedStatus;
        return daysOverdue(unit, month) !== null ? "atrasado" : "pendente";
    }

    function isPaidLate(unit, month) {
        return (
            isActive(unit, month) &&
            statusFor(unit, month) === "pago" &&
            unit.paidLate &&
            unit.paidLate[monthKey(month)] === true
        );
    }
    //--------------------------------------------------------------------------------------------
    function logicalStatus(unit, month) {
        var storedStatus = statusFor(unit, month);
        return storedStatus === "pago" && isPaidLate(unit, month)
            ? "pago-atrasado"
            : storedStatus;
    }

    function displayStatus(unit, month) {
        if (!isActive(unit, month)) return "inativo";
        return isPaidLate(unit, month)
            ? "pago-atrasado"
            : effectiveStatus(unit, month);
    }

    function normalizeText(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    function matchesStatusFilter(unit) {
        var filter = statusFilter.value;
        if (filter === "todos") return true;
        return months.some(function (_, i) {
            if (!isActive(unit, i)) return false;
            var status = displayStatus(unit, i);
            if (filter === "atrasados") return status === "atrasado";
            if (filter === "pendentes") return status === "pendente";
            if (filter === "pagos")
                return status === "pago" || status === "pago-atrasado";
            return false;
        });
    }

    function filteredUnits() {
        var query = normalizeText(unitSearch.value);

        return scopedUnits().filter(function (unit) {
            return (
                normalizeText(unit.name).includes(query) &&
                matchesStatusFilter(unit)
            );
        });
    }

    function whatsappUrl(phone) {
        var digits = String(phone || "").replace(/\D/g, "");
        if (digits.length === 10 || digits.length === 11)
            digits = "55" + digits;
        return digits ? "https://wa.me/" + digits : "";
    }

    function lateOccurrencesLast12Months(unit, referenceYear, referenceMonth) {
        if (!unit) return 0;

        var count = 0;
        var history = unit.paidLate && typeof unit.paidLate === "object" ? unit.paidLate : {};
        var statuses = unit.status && typeof unit.status === "object" ? unit.status : {};

        for (var offset = 0; offset < 12; offset++) {
            var absolute = referenceYear * 12 + referenceMonth - offset;
            var y = Math.floor(absolute / 12);
            var m = absolute % 12;
            if (m < 0) { m += 12; y -= 1; }
            var key = String(y) + "-" + String(m + 1).padStart(2, "0");

            if (history[key] === true) {
                count += 1;
                continue;
            }

            // Atraso atualmente em aberto também conta como uma ocorrência.
            // Para meses fora do ano selecionado, não tentamos recalcular a data;
            // usamos apenas o status persistido.
            if (y === selectedYear && statuses[key] === "atrasado") {
                count += 1;
            }
        }

        return count;
    }

    function lateRecurrenceStatus(unit, referenceYear, referenceMonth) {
        var count = lateOccurrencesLast12Months(unit, referenceYear, referenceMonth);
        return {
            count: count,
            reached: count >= 3,
            label: count >= 3
                ? "Limite de 3 atrasos em 12 meses atingido"
                : count + " atraso(s) registrado(s) nos últimos 12 meses"
        };
    }

    function chargeMessage(unit) {
        var overdueMonths = [];
        months.forEach(function (_, i) {
            if (!isActive(unit, i) || effectiveStatus(unit, i) !== "atrasado")
                return;
            var due = dueDateFor(unit, i);
            var updated = updatedAmount(unit, i);
            overdueMonths.push({
                i: i,
                due: due,
                amount:
                    updated === null
                        ? rentForMonth(unit, selectedYear, i)
                        : updated,
            });
        });
        var greeting =
            "Olá" + (unit.tenantName ? ", " + unit.tenantName : "") + "! ";
        if (overdueMonths.length) {
            var total = overdueMonths.reduce(function (sum, item) {
                return sum + item.amount;
            }, 0);
            var message = greeting + "Sobre o aluguel da " + unit.name + ":\n";
            message += overdueMonths
                .map(function (item) {
                    var dueLabel = item.due
                        ? " (venceu em " +
                          String(item.due.getDate()).padStart(2, "0") +
                          "/" +
                          String(item.due.getMonth() + 1).padStart(2, "0") +
                          ")"
                        : "";
                    return (
                        " • " +
                        fullMonths[item.i] +
                        dueLabel +
                        " - valor atualizado " +
                        money(item.amount) +
                        "\n"
                    );
                })
                .join("");
            if (overdueMonths.length > 1)
                message += "Total em aberto: " + money(total) + ".\n";
            return message + "Pode me confirmar o pagamento? Obrigado.";
        }
        if (dueReminder(unit) !== null) {
            var m = new Date().getMonth();
            var due = dueDateFor(unit, m);
            var dueLabel = due
                ? ", que vence em " +
                  String(due.getDate()).padStart(2, "0") +
                  "/" +
                  String(due.getMonth() + 1).padStart(2, "0")
                : "";
            return (
                greeting +
                "Passando para lembrar do aluguel da " +
                unit.name +
                dueLabel +
                ", no valor de " +
                money(rentForMonth(unit, selectedYear, m)) +
                ". Obrigado."
            );
        }
        return null;
    }

    function chargeUrl(unit) {
        var msg = chargeMessage(unit);
        if (!msg) return "";
        var base = whatsappUrl(unit.tenantPhone);
        return (
            (base ? base : "https://wa.me/") +
            "?text=" +
            encodeURIComponent(msg)
        );
    }

    function tenantActions(unit) {
        var actions = "";
        var charge = chargeUrl(unit);
        if (charge) {
            actions +=
                '<a class="tenant-action charge-btn" href="' +
                escapeHtml(charge) +
                '" target="_blank" rel="noopener noreferrer" aria-label="Cobrar ' +
                escapeHtml(unit.tenantName || "inquilino") +
                ' pelo WhatsApp" data-tenant-action data-charge-unit="' + escapeHtml(unit.id) + '">Cobrar</a>';
        }
        var whatsapp = whatsappUrl(unit.tenantPhone);
        if (whatsapp) {
            actions +=
                '<a class="tenant-action" href="' +
                escapeHtml(whatsapp) +
                '" target="_blank" rel="noopener noreferrer" aria-label="Falar com ' +
                escapeHtml(unit.tenantName || "inquilino") +
                ' pelo WhatsApp" data-tenant-action>💬</a>';
        }
        if (unit.tenantEmail) {
            actions +=
                '<a class="tenant-action" href="mailto:' +
                encodeURIComponent(unit.tenantEmail) +
                '" target="_blank" rel="noopener noreferrer" aria-label="Enviar e-mail para ' +
                escapeHtml(unit.tenantName || "inquilino") +
                '" data-tenant-action>✉️</a>';
        }
        return actions;
    }

    function render() {
        if (tableWrap.scrollLeft > 0) lastGridScrollLeft = tableWrap.scrollLeft;
        //--------------------------------------------------------------------------------------------
        document.getElementById("yearLabel").textContent = selectedYear;
        renderEmpreendimentoFilter();
        updateAppTitle();
        var hasUnits = scopedUnits().length > 0;
        var visibleUnits = filteredUnits();
        grid.hidden = !hasUnits || visibleUnits.length === 0;
        empty.hidden = hasUnits;
        filterEmpty.hidden = !hasUnits || visibleUnits.length > 0;
        renderActionCenter();
        renderGrid(visibleUnits);
        if (didInitialScroll && visibleUnits.length > 0)
            tableWrap.scrollLeft = lastGridScrollLeft;
        renderSummary();
        renderExpenses();
    }


    function renderActionCenter() {
        var container = document.getElementById("actionCenter");
        if (!container) return;
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var overdue = 0, dueSoon = 0, vacant = 0, renewals = [], calendar = [], enterprises = {};
        scopedUnits().forEach(function (unit) {
            var enterprise = empreendimentoName(unit.empreendimentoId);
            enterprises[enterprise] = enterprises[enterprise] || { units: 0, expected: 0, received: 0, late: 0 };
            enterprises[enterprise].units += 1;
            if (!String(unit.tenantName || "").trim()) vacant += 1;
            months.forEach(function (_, month) {
                var key = monthKey(month), ledger = unit.lateLedger && typeof unit.lateLedger === "object" ? unit.lateLedger : {};
                if (effectiveStatus(unit, month) === "atrasado" || statusFor(unit, month) === "atrasado" || ledger[key] === true || ledger[key] === "open") { overdue += 1; enterprises[enterprise].late += 1; }
            });
            var currentMonth = today.getMonth();
            if (isActive(unit, currentMonth)) {
                enterprises[enterprise].expected += Number(rentForMonth(unit, selectedYear, currentMonth)) || 0;
                enterprises[enterprise].received += historicalReceivedAmount(unit, selectedYear, currentMonth);
                var reminder = dueReminder(unit);
                if (reminder !== null) { dueSoon += 1; calendar.push({ date: dueDateFor(unit, currentMonth), label: unit.name + " · vence em " + reminder + " dia(s)" }); }
            }
            if (unit.endDate && String(unit.endDate).match(/^\d{4}-\d{2}-\d{2}$/) && String(unit.tenantName || "").trim()) {
                var endDate = new Date(unit.endDate + "T12:00:00"), days = Math.ceil((endDate - today) / 86400000);
                if (days >= 0 && days <= 60) { renewals.push({ unit: unit, days: days }); calendar.push({ date: endDate, label: unit.name + " · contrato termina" }); }
            }
        });
        var tasks = state.tasks.filter(function (task) { return !task.done; }).sort(function (a,b) { return String(a.dueDate).localeCompare(String(b.dueDate)); });
        var alerts = [];
        if (overdue) alerts.push('<div class="action-item is-danger"><strong>' + overdue + ' parcela' + (overdue === 1 ? '' : 's') + ' em atraso</strong><span>Prioridade: cobrar e dar baixa</span></div>');
        if (dueSoon) alerts.push('<div class="action-item is-warning"><strong>' + dueSoon + ' vencimento' + (dueSoon === 1 ? '' : 's') + ' próximo</strong><span>Antecedência configurada nas configurações</span></div>');
        if (vacant) alerts.push('<div class="action-item is-neutral"><strong>' + vacant + ' unidade' + (vacant === 1 ? '' : 's') + ' vaga</strong><span>Pronta para nova locação</span></div>');
        var renewalHtml = renewals.map(function (item) {
            var decision = state.renewalDecisions[item.unit.id] || "";
            return '<div class="operations-row"><div><strong>' + escapeHtml(item.unit.name) + '</strong><span>' + escapeHtml(item.unit.tenantName) + ' · termina em ' + item.days + ' dias' + (decision ? ' · ' + escapeHtml(decision) : '') + '</span></div><div><button class="btn btn-ghost" data-renewal-decision="renovar" data-unit-id="' + escapeHtml(item.unit.id) + '">Renovar</button><button class="btn btn-ghost" data-renewal-decision="decidir" data-unit-id="' + escapeHtml(item.unit.id) + '">A decidir</button></div></div>';
        }).join("") || '<p class="operations-empty">Nenhum contrato perto do fim.</p>';
        var tasksHtml = tasks.slice(0,5).map(function (task) {
            return '<div class="operations-row"><label><input type="checkbox" data-task-done="' + escapeHtml(task.id) + '"> <strong>' + escapeHtml(task.title) + '</strong><span>' + (task.dueDate ? 'Até ' + escapeHtml(formatTimelineDate(task.dueDate)) : 'Sem prazo') + '</span></label></div>';
        }).join("") || '<p class="operations-empty">Nenhuma tarefa pendente.</p>';
        var calendarHtml = calendar.filter(function (item) { return item.date && item.date >= today; }).sort(function(a,b){return a.date-b.date;}).slice(0,5).map(function(item) {
            return '<div class="calendar-event"><b>' + String(item.date.getDate()).padStart(2,"0") + '</b><span>' + escapeHtml(item.label) + '</span></div>';
        }).join("") || '<p class="operations-empty">Nenhum evento próximo.</p>';
        var enterpriseHtml = Object.keys(enterprises).map(function (name) { var item=enterprises[name]; return '<div class="enterprise-kpi"><strong>' + escapeHtml(name) + '</strong><span>' + item.units + ' unidades · ' + money(item.received) + ' recebido de ' + money(item.expected) + '</span>' + (item.late ? '<em>' + item.late + ' atraso(s)</em>' : '') + '</div>'; }).join("");
        var attentionCount = overdue + dueSoon + renewals.length + tasks.length;
        var alertBadge = attentionCount
            ? '<span class="action-alert-badge" aria-label="' + attentionCount + ' avisos">' + attentionCount + '</span>'
            : '<span class="action-ok-badge" aria-label="Sem avisos">✓</span>';
        var detail = (alerts.length ? '<div class="action-list">' + alerts.join("") + '</div>' : '<p class="action-empty">Tudo em dia no momento.</p>') +
            '<div class="operations-grid"><section><h3>Renovações</h3>' + renewalHtml + '</section><section><h3>Tarefas</h3>' + tasksHtml + '</section><section><h3>Próximos eventos</h3>' + calendarHtml + '</section><section><h3>Por empreendimento</h3>' + enterpriseHtml + '</section></div>';
        container.innerHTML = '<div class="action-center-heading"><div class="action-title"><h2>O que precisa de ação</h2><p>Decisões, cobranças e próximos passos.</p></div><div class="action-heading-controls">' + alertBadge + '<button class="btn btn-ghost" id="toggleActionCenter" type="button" aria-expanded="' + actionCenterExpanded + '">' + (actionCenterExpanded ? 'Ocultar' : 'Ver') + '</button></div></div>' +
            (actionCenterExpanded ? '<div class="action-center-detail">' + detail + '</div>' : '');
        document.getElementById("toggleActionCenter").addEventListener("click", function () {
            actionCenterExpanded = !actionCenterExpanded;
            renderActionCenter();
        });
        var add = document.getElementById("addOperationalTask");
        if (add) add.addEventListener("click", function () {
            var title = window.prompt("Qual tarefa você quer registrar?");
            if (!title || !title.trim()) return;
            var due = window.prompt("Prazo (DD/MM/AAAA, opcional):") || "";
            var parsed = due.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            state.tasks.push({ id:"task-"+Date.now().toString(36), title:title.trim(), dueDate:parsed ? parsed[3]+"-"+parsed[2]+"-"+parsed[1] : "", unitId:"", done:false, createdAt:new Date().toISOString() });
            saveState(); render();
        });
        container.querySelectorAll("[data-task-done]").forEach(function (input) { input.addEventListener("change", function () { var task=state.tasks.find(function(item){return item.id===input.dataset.taskDone;}); if(task){task.done=input.checked;saveState();render();} }); });
        container.querySelectorAll("[data-renewal-decision]").forEach(function (button) { button.addEventListener("click", function () { state.renewalDecisions[button.dataset.unitId] = button.dataset.renewalDecision === "renovar" ? "Renovar" : "A decidir"; saveState(); render(); }); });
        var exportButton = document.getElementById("exportOperationalCsv");
        if (exportButton) exportButton.addEventListener("click", exportOperationalCsv);
    }

    function exportOperationalCsv() {
        var rows = [["Unidade","Empreendimento","Inquilino","Aluguel atual","Status atual","Atrasos 12 meses","Decisão de renovação"]];
        scopedUnits().forEach(function (unit) {
            var current = new Date().getFullYear() === selectedYear ? new Date().getMonth() : 0;
            rows.push([unit.name, empreendimentoName(unit.empreendimentoId), unit.tenantName || "", String(rentForMonth(unit, selectedYear, current) || 0).replace(".",","), displayStatus(unit,current), lateRecurrenceStatus(unit,selectedYear,current).count, state.renewalDecisions[unit.id] || ""]);
        });
        var csv = "\ufeff" + rows.map(function(row){return row.map(function(cell){return '"' + String(cell).replace(/"/g,'""') + '"';}).join(";");}).join("\n");
        var url = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"})), link=document.createElement("a");
        link.href=url; link.download="controle-alugueis-"+selectedYear+".csv"; link.click(); URL.revokeObjectURL(url);
    }

    // Retorna o contrato encerrado que abrangia determinado mês.
    // É usado somente para a visualização histórica da grade; não
    // transforma o contrato arquivado em contrato ativo.
    function archivedContractForMonth(unit, month) {
        if (!unit || !Array.isArray(unit.contractHistory)) return null;

        var key = monthKey(month);

        /*
         * IMPORTANTE:
         * "Contrato arquivado" representa somente um contrato que já
         * terminou. Portanto ele NUNCA pode ocupar meses posteriores
         * ao mês em que o arquivamento foi feito.
         *
         * Contratos antigos podem ter sido salvos com endYm vazio ou até
         * com uma data futura. Como a unidade já está sem contrato ativo,
         * usamos o mês atual como limite máximo de segurança.
         */
        var now = new Date();
        var archiveCutoff =
            now.getFullYear() +
            "-" +
            String(now.getMonth() + 1).padStart(2, "0");

        for (var i = unit.contractHistory.length - 1; i >= 0; i--) {
            var contract = unit.contractHistory[i];
            if (!contract) continue;

            var startOk =
                !isValidStartYm(contract.startYm) ||
                key >= contract.startYm;

            /*
             * Se houver endYm, ele define o fim do contrato.
             * Porém, como este contrato está arquivado, nunca permitimos
             * que o histórico avance para um mês futuro em relação ao
             * arquivamento atual.
             */
            var contractEnd = isValidStartYm(contract.endYm)
                ? contract.endYm
                : archiveCutoff;

            if (contractEnd > archiveCutoff) {
                contractEnd = archiveCutoff;
            }

            var endOk = key <= contractEnd;

            if (startOk && endOk) return contract;
        }

        return null;
    }


    function archivedMonthCell(unit, month, currentMonth) {
        var contract = archivedContractForMonth(unit, month);
        if (!contract) return null;

        return (
            '<td class="' +
            (month === currentMonth ? "month-current" : "") +
            '">' +
            '<div class="status-inactive" aria-label="Contrato arquivado">' +
            '<span>Contrato arquivado</span>' +
            "</div>" +
            "</td>"
        );
    }

    function renderGrid(visibleUnits) {
    var currentMonth =
        new Date().getFullYear() === selectedYear
            ? new Date().getMonth()
            : -1;

    var head =
        '<tr><th scope="col">Unidade</th>' +
        months
            .map(function (month, i) {
                return (
                    '<th scope="col" class="' +
                    (i === currentMonth ? "month-current" : "") +
                    '">' +
                    month +
                    "</th>"
                );
            })
            .join("") +
        "</tr>";

    grid.querySelector("thead").innerHTML = head;

    grid.querySelector("tbody").innerHTML = visibleUnits
        .map(function (unit) {
            var cells = months
                .map(function (_, i) {
                    if (!String(unit.tenantName || "").trim()) {
                        var archivedCell = archivedMonthCell(
                            unit,
                            i,
                            currentMonth
                        );

                        if (archivedCell) return archivedCell;
                    }

					if (!String(unit.tenantName || "").trim()) {
						return (
							'<td class="' +
							(i === currentMonth ? "month-current" : "") +
							'"><div class="status-inactive" aria-label="Sem contrato"><span>Sem contrato</span></div></td>'
						);
					}

					if (!isActive(unit, i)) {
						return (
							'<td class="' +
							(i === currentMonth ? "month-current" : "") +
							'"><div class="status-inactive" aria-label="Fora do período"><span>Fora do período</span></div></td>'
						);
					}

                    var status = displayStatus(unit, i);

                    var icon =
                        status === "pago" || status === "pago-atrasado"
                            ? "✓"
                            : status === "atrasado"
                            ? "!"
                            : "-";

                    var label =
                        status === "pago-atrasado"
                            ? "Pago (atraso)"
                            : status === "pago"
                            ? "Pago"
                            : status === "atrasado"
                            ? "Atrasado"
                            : "Pendente";

                    var lateDays =
                        status === "atrasado"
                            ? daysOverdue(unit, i)
                            : null;

                    var dayLabel =
                        lateDays === null
                            ? ""
                            : lateDays +
                              (lateDays === 1 ? " dia" : " dias");

                    var statusDays = dayLabel
                        ? '<span class="status-days">' +
                          dayLabel +
                          "</span>"
                        : "";

                    var amount =
                        status === "atrasado"
                            ? updatedAmount(unit, i)
                            : null;

                    var statusAmount =
                        amount === null
                            ? ""
                            : '<span class="status-amount">' +
                              money(amount) +
                              "</span>";

                    var ariaLabel = dayLabel
                        ? label + ", " + dayLabel
                        : label;

                    // ==================================================
                    // RECIBO
                    // ==================================================

                    var receipt =
                        status === "pago" ||
                        status === "pago-atrasado"
                            ? '<button class="receipt-btn" type="button" data-receipt-unit="' +
                              escapeHtml(unit.id) +
                              '" data-receipt-month="' +
                              i +
                              '" aria-label="Gerar recibo">🧾</button>'
                            : "";

                    // ==================================================
                    // AJUSTE MANUAL DO PAGAMENTO
                    //
                    // O botão aparece para QUALQUER pagamento.
                    // Não depende mais de paymentHistory existir.
                    // ==================================================

                    var adjustPayment =
                        status === "pago" ||
                        status === "pago-atrasado"
                            ? '<button class="payment-adjust-btn" type="button" data-adjust-unit="' +
                              escapeHtml(unit.id) +
                              '" data-adjust-month="' +
                              i +
                              '" aria-label="Ajustar pagamento">✏️</button>'
                            : "";

                    return (
                        '<td class="' +
                        (i === currentMonth ? "month-current" : "") +
                        '">' +
                        '<div class="status-cell">' +

                        '<button class="status-btn chip-' +
                        status +
                        '" data-unit="' +
                        escapeHtml(unit.id) +
                        '" data-month="' +
                        i +
                        '" aria-label="' +
                        ariaLabel +
                        '">' +

                        icon +

                        '<span class="status-label">' +
                        label +
                        "</span>" +

                        statusDays +
                        statusAmount +

                        "</button>" +

                        receipt +
                        adjustPayment +

                        "</div>" +
                        "</td>"
                    );
                })
                .join("");

            var hasCurrentContract =
                !!String(unit.tenantName || "").trim();

            var dueDay =
                hasCurrentContract &&
                Number.isInteger(unit.dueDay) &&
                unit.dueDay >= 1 &&
                unit.dueDay <= 31
                    ? '<span class="due-day">Vence dia ' +
                      unit.dueDay +
                      "</span>"
                    : "";

			var recurrence = lateRecurrenceStatus(unit, selectedYear, currentMonth >= 0 ? currentMonth : 0);
            var recurrenceBadge = recurrence.count
                ? '<span class="tenant-recurrence ' + (recurrence.reached ? "is-alert" : "") + '">' + recurrence.count + ' atraso(s) / 12 meses</span>'
                : "";
			var tenant = unit.tenantName
				? '<span class="tenant-name">' + escapeHtml(unit.tenantName) + "</span>" + recurrenceBadge
				: '<span class="tenant-name tenant-no-contract">Sem contrato ativo</span>';

            var now = new Date();

			var currentRent = String(unit.tenantName || "").trim()
				? rentForMonth(
					  unit,
					  now.getFullYear(),
					  now.getMonth()
				  )
				: 0;

            var enterprise =
                '<span class="enterprise-name">' +
                escapeHtml(
                    empreendimentoName(unit.empreendimentoId)
                ) +
                "</span>";

            var reminderDays = dueReminder(unit);

            var dueSoon =
                reminderDays === null
                    ? ""
                    : '<span class="due-soon">' +
                      (reminderDays === 0
                          ? "Vence hoje"
                          : reminderDays === 1
                          ? "Vence amanhã"
                          : "Vence em " +
                            reminderDays +
                            " dias") +
                      "</span>";

            var compactActions = tenantActions(unit)
                ? '<details class="unit-context-menu" data-tenant-action><summary aria-label="Mais ações para ' +
                  escapeHtml(unit.name) +
                  '">⋯</summary><div class="unit-context-actions">' +
                  tenantActions(unit) +
                  '</div></details>'
                : "";

            return (
                '<tr><th scope="row">' +
                '<div class="unit-cell" data-edit="' +
                escapeHtml(unit.id) +
                '" role="button" tabindex="0">' +

                '<span class="unit-name">' +
                escapeHtml(unit.name) +
                "</span>" +

                tenant +

                '<span class="rent">' +
                money(currentRent) +
                "</span>" +

                dueDay +
                dueSoon +

                '<span class="tenant-actions">' +
                tenantActions(unit) +
                "</span>" +
                compactActions +

                "</div>" +
                "</th>" +

                cells +

                "</tr>"
            );
        })
        .join("");

    // ==========================================================
    // TOTAIS
    // ==========================================================

    grid.querySelector("tfoot").innerHTML =
        '<tr><th scope="row">Total recebido</th>' +
        months
            .map(function (_, i) {
                var total = scopedUnits().reduce(function (sum, unit) {
                    return (
                        sum +
                        historicalReceivedAmount(
                            unit,
                            selectedYear,
                            i
                        )
                    );
                }, 0);

                return "<td>" + money(total) + "</td>";
            })
            .join("") +
        "</tr>" +

        '<tr><th scope="row">Total juros</th>' +
        months
            .map(function (_, i) {
                var totalJuros = scopedUnits().reduce(
                    function (sum, unit) {
                        return (
                            sum +
                            historicalInterestAmount(
                                unit,
                                selectedYear,
                                i
                            )
                        );
                    },
                    0
                );

                return "<td>" + money(totalJuros) + "</td>";
            })
            .join("") +
        "</tr>";

    // ==========================================================
    // EVENTOS DAS UNIDADES
    // ==========================================================

    grid.querySelectorAll(".unit-cell").forEach(function (button) {
        button.addEventListener("click", function () {
            openModal(button.dataset.edit);
        });

        button.addEventListener("keydown", function (event) {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();
                openModal(button.dataset.edit);
            }
        });
    });

    // ==========================================================
    // AÇÕES DO INQUILINO
    // ==========================================================

    grid.querySelectorAll("[data-tenant-action]").forEach(function (link) {
        link.addEventListener("click", function (event) {
            event.stopPropagation();
            if (link.dataset.chargeUnit) {
                var unit = state.units.find(function (item) { return item.id === link.dataset.chargeUnit; });
                if (unit) {
                    unit.chargeLog = Array.isArray(unit.chargeLog) ? unit.chargeLog : [];
                    unit.chargeLog.unshift({ createdAt:new Date().toISOString(), channel:"WhatsApp", tenantName:unit.tenantName || "" });
                    unit.chargeLog = unit.chargeLog.slice(0,40);
                    recordOperation("Cobrança enviada", unit.name + " · WhatsApp");
                    saveState();
                }
            }
        });

        link.addEventListener("keydown", function (event) {
            event.stopPropagation();
        });
    });

    // ==========================================================
    // BOTÕES DE STATUS
    // ==========================================================

    grid.querySelectorAll(".status-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            toggleStatus(
                button.dataset.unit,
                Number(button.dataset.month)
            );
        });
    });

    // ==========================================================
    // BOTÕES DE RECIBO
    // ==========================================================

    grid.querySelectorAll(".receipt-btn").forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.stopPropagation();

            openReceipt(
                button.dataset.receiptUnit,
                Number(button.dataset.receiptMonth)
            );
        });
    });

    // ==========================================================
    // BOTÕES DE AJUSTE MANUAL
    // ==========================================================

    grid.querySelectorAll(".payment-adjust-btn").forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.stopPropagation();

            openPaymentAdjust(
                button.dataset.adjustUnit,
                Number(button.dataset.adjustMonth)
            );
        });
    });

    // ==========================================================
    // SCROLL INICIAL
    // ==========================================================

    if (!didInitialScroll) {
        didInitialScroll = true;

        window.requestAnimationFrame(function () {
            scrollToCurrentMonth(currentMonth);
        });
    }
}

    function scrollToCurrentMonth(currentMonth) {
        if (currentMonth < 0) {
            tableWrap.scrollLeft = 0;
            return;
        }
        var currentCell = grid.querySelector("thead th.month-current");
        var firstColumn = grid.querySelector("thead th:first-child");
        if (!currentCell || !firstColumn) return;
        var stickyWidth = firstColumn.offsetWidth;
        var visibleWidth = tableWrap.clientWidth - stickyWidth;
        var currentCenter =
            currentCell.offsetLeft + currentCell.offsetWidth / 2;
        var visibleCenter =
            firstColumn.offsetLeft + stickyWidth + visibleWidth / 2;
        var targetScroll = currentCenter - visibleCenter;
        var maxScroll = tableWrap.scrollWidth - tableWrap.clientWidth;
        tableWrap.scrollLeft = Math.max(0, Math.min(maxScroll, targetScroll));
        lastGridScrollLeft = tableWrap.scrollLeft;
    }

    function overdueTenantName(unit) {
        var history = Array.isArray(unit.contractHistory)
            ? unit.contractHistory.slice()
            : [];
        var lateLedger = unit.lateLedger && typeof unit.lateLedger === "object"
            ? unit.lateLedger
            : {};

        // Atrasos guardados no histórico pertencem ao contrato encerrado,
        // nunca ao inquilino que ocupa a unidade hoje.
        var historicalLateKeys = Object.keys(lateLedger).filter(function (key) {
            return lateLedger[key] === true ||
                lateLedger[key] === "open" ||
                lateLedger[key] === "paid";
        });
        if (historicalLateKeys.length && history.length) {
            var matchingContracts = history.filter(function (contract) {
                return historicalLateKeys.some(function (key) {
                    return (!contract.startYm || key >= contract.startYm) &&
                        (!contract.endYm || key <= contract.endYm);
                });
            });
            var candidates = matchingContracts.length ? matchingContracts : history;
            candidates.sort(function (left, right) {
                return String(right.endYm || right.startYm || "").localeCompare(
                    String(left.endYm || left.startYm || "")
                );
            });
            if (candidates[0] && candidates[0].tenantName)
                return candidates[0].tenantName;
        }

        if (unit.tenantName) return unit.tenantName;
        history.sort(function (left, right) {
            return String(right.endYm || right.startYm || "").localeCompare(
                String(left.endYm || left.startYm || "")
            );
        });
        return history.length ? history[0].tenantName : "";
    }

function renderSummary() {
    var annual = scopedUnits().reduce(function (sum, unit) {
        return (
            sum +
            months.reduce(function (monthSum, _, i) {
                return (
                    monthSum +
                    historicalReceivedAmount(unit, selectedYear, i)
                );
            }, 0)
        );
    }, 0);

    var now = new Date();
    var current = now.getFullYear() === selectedYear ? now.getMonth() : -1;

    // Usa a mesma fonte de verdade do total anual: pagamentos confirmados
    // de contratos ativos e encerrados, sem depender do inquilino atual.
    var received =
        current < 0
            ? 0
            : scopedUnits().reduce(function (sum, unit) {
                  return sum + historicalReceivedAmount(unit, selectedYear, current);
              }, 0);

    var pending =
        current < 0
            ? 0
            : scopedUnits().reduce(function (sum, unit) {
                  return (
                      sum +
                      (isActive(unit, current) &&
                      statusFor(unit, current) === "pendente"
                          ? rentForMonth(unit, selectedYear, current)
                          : 0)
                  );
              }, 0);

    var annualExpenses = scopedExpenses().reduce(function (sum, expense) {
        return (
            sum +
            (expense.ym.slice(0, 4) === String(selectedYear)
                ? expense.amount
                : 0)
        );
    }, 0);

    var currentExpenses =
        current < 0
            ? 0
            : scopedExpenses().reduce(function (sum, expense) {
                  return (
                      sum +
                      (expense.ym === monthKey(current)
                          ? expense.amount
                          : 0)
                  );
              }, 0);

    var annualNet = annual - annualExpenses;
    var currentNet = received - currentExpenses;

    var overdueCount = 0;
    var overdueTotal = 0;

    scopedUnits().forEach(function (unit) {
        var lateLedger = unit.lateLedger && typeof unit.lateLedger === "object"
            ? unit.lateLedger
            : {};
        months.forEach(function (_, i) {
            var key = monthKey(i);
            var isHistoricalOpenLate =
                lateLedger[key] === true || lateLedger[key] === "open";
            if (
                effectiveStatus(unit, i) === "atrasado" ||
                statusFor(unit, i) === "atrasado" ||
                isHistoricalOpenLate
            ) {
                overdueCount += 1;
                overdueTotal +=
                    isHistoricalOpenLate
                        ? historicLateRent(unit, key)
                        : (updatedAmount(unit, i) === null
                            ? rentForMonth(unit, selectedYear, i)
                            : updatedAmount(unit, i));
            }
        });
    });

    var overdueAlert = overdueCount
        ? '<div class="summary-card summary-alert"><div class="summary-label">⚠️ ' +
          overdueCount +
          " " +
          (overdueCount === 1 ? "pagamento" : "pagamentos") +
          ' em atraso</div><div class="summary-value">' +
          money(overdueTotal) +
          '</div><div class="summary-detail">Total em atraso no ano, com multa e juros</div></div>'
        : "";

    var reportRows = scopedUnits()
        .map(function (unit) {
            var openLate = 0;
            var paidLate = 0;
            months.forEach(function (_, i) {
                var lateLedger = unit.lateLedger && typeof unit.lateLedger === "object"
                    ? unit.lateLedger
                    : {};
                var recordedLate = lateLedger[monthKey(i)];
                if (
                    effectiveStatus(unit, i) === "atrasado" ||
                    statusFor(unit, i) === "atrasado" ||
                    recordedLate === true ||
                    recordedLate === "open"
                )
                    openLate += 1;
                if (isPaidLate(unit, i) || recordedLate === "paid") paidLate += 1;
            });
            return {
                name: unit.name,
                tenantName: overdueTenantName(unit),
                enterprise: empreendimentoName(unit.empreendimentoId),
                openLate: openLate,
                paidLate: paidLate,
                total: openLate + paidLate,
            };
        })
        .filter(function (row) {
            return row.total > 0;
        })
        .sort(function (a, b) {
            return (
                b.total - a.total || a.name.localeCompare(b.name, "pt-BR")
            );
        });

    // O resumo detalhado inicia recolhido; o alerta de atrasos fica fora dele.
    var report =
        '<section class="summary-report"><h3>Atrasos no ano</h3><p class="summary-report-intro">Acompanhe os atrasos em aberto e os pagamentos feitos depois do vencimento.</p>' +
        (reportRows.length
            ? '<div class="late-list">' +
              reportRows
                  .map(function (row) {
                      var detail = row.total
                          ? row.openLate +
                            " em atraso " +
                            row.paidLate +
                            " pago" +
                            (row.paidLate === 1 ? "" : "s") +
                            " com atraso"
                          : "Sempre em dia";
                      var rowEnterprise =
                          selectedEmpreendimentoId === "todos"
                              ? " <small>(" +
                                escapeHtml(row.enterprise) +
                                ")</small>"
                              : "";
                      return (
                          '<div class="late-row"><div><strong>' +
                          escapeHtml(row.name) +
                          rowEnterprise +
                          "</strong>" +
                          (row.tenantName
                              ? '<div class="tenant-name">' +
                                escapeHtml(row.tenantName) +
                                "</div>"
                              : "") +
                          "<span>" +
                          detail +
                          '</span></div><b class="' +
                          (row.total ? "late-count" : "on-time") +
                          '">' +
                          row.total +
                          "</b></div>"
                      );
                  })
                  .join("") +
              "</div>"
            : '<p class="summary-report-empty">Nenhum atraso no ano - todas as unidades em dia.</p>') +
        "</section>";

    var summaryContainer = document.getElementById("summary");
    if (summaryContainer) {
        summaryContainer.innerHTML =
            overdueAlert +
            '<div id="summaryCards" class="summary-cards">' +
            '<div class="summary-card"><div class="summary-label">Recebido neste mês</div><div class="summary-value">' +
            money(received) +
            '</div><div class="summary-detail">' +
            (current < 0
                ? "Visualizando outro ano"
                : months[current] + " de " + selectedYear) +
            "</div></div>" +
            '<div class="summary-card"><div class="summary-label">Gastos neste mês</div><div class="summary-value">' +
            money(currentExpenses) +
            '</div><div class="summary-detail">' +
            (current < 0
                ? "Visualizando outro ano"
                : months[current] + " de " + selectedYear) +
            "</div></div>" +
            '<div class="summary-card ' +
            (currentNet < 0 ? "summary-negative" : "") +
            '"><div class="summary-label">Líquido neste mês</div><div class="summary-value">' +
            money(currentNet) +
            '</div><div class="summary-detail">Recebido menos gastos</div></div>' +
            '<div class="summary-card"><div class="summary-label">Pendente neste mês</div><div class="summary-value">' +
            money(pending) +
            '</div><div class="summary-detail">Valores ainda não recebidos</div></div>' +
            '<div class="summary-card summary-year"><div class="summary-label">Total recebido em ' +
            selectedYear +
            '</div><div class="summary-value">' +
            money(annual) +
            '</div><div class="summary-detail">Soma dos pagamentos marcados como recebidos</div></div>' +
            '<div class="summary-card summary-year"><div class="summary-label">Total de gastos em ' +
            selectedYear +
            '</div><div class="summary-value">' +
            money(annualExpenses) +
            '</div><div class="summary-detail">Despesas gerais do portfólio</div></div>' +
            '<div class="summary-card summary-year ' +
            (annualNet < 0 ? "summary-negative" : "") +
            '"><div class="summary-label">Líquido no ano</div><div class="summary-value">' +
            money(annualNet) +
            '</div><div class="summary-detail">Recebido menos gastos</div></div></div>' +
            report;
    }

    var unitSummaryToggleBtn = document.getElementById("toggleUnitSummary");
    if (unitSummaryToggleBtn) {
        unitSummaryToggleBtn.addEventListener("click", function () {
            unitSummaryExpanded = !unitSummaryExpanded;
            var list = document.getElementById("unitSummaryList");
            if (list) list.hidden = !unitSummaryExpanded;
            unitSummaryToggleBtn.textContent = unitSummaryExpanded
                ? "Ocultar"
                : "Mostrar";
        });
    }

    applySummaryCardsVisibility();
}

    function applySummaryCardsVisibility() {
        var cards = document.getElementById("summaryCards");
        if (cards) cards.hidden = !summaryCardsExpanded;
        var btn = document.getElementById("toggleSummaryCards");
        if (btn) btn.textContent = summaryCardsExpanded ? "Ocultar" : "Mostrar";
    }

    function renderExpenses() {
        expensesYear.textContent = selectedYear;

        var yearExpenses = scopedExpenses().filter(function (expense) {
            return expense.ym.slice(0, 4) === String(selectedYear);
        });

        var annualTotal = yearExpenses.reduce(function (sum, expense) {
            return sum + expense.amount;
        }, 0);

        expensesTotal.textContent = money(annualTotal);

        if (!yearExpenses.length) {
            expensesList.innerHTML =
                '<p class="expenses-empty">Nenhum gasto registrado em ' +
                selectedYear +
                ".</p>";
            return;
        }

        var groups = [];

        yearExpenses.forEach(function (expense) {
            var month = Number(expense.ym.slice(5, 7)) - 1;

            var group = groups.find(function (item) {
                return item.month === month;
            });

            if (!group) {
                group = {
                    month: month,
                    items: [],
                };
                groups.push(group);
            }

            group.items.push(expense);
        });

        groups.sort(function (a, b) {
            return a.month - b.month;
        });

        expensesList.innerHTML = groups
            .map(function (group) {
                var subtotal = group.items.reduce(function (sum, expense) {
                    return sum + expense.amount;
                }, 0);

                var count =
                    group.items.length +
                    (group.items.length === 1 ? " lançamento" : " lançamentos");

                var rows = group.items
                    .map(function (expense) {
                        var description = expense.description
                            ? " <span>— " +
                              escapeHtml(expense.description) +
                              "</span>"
                            : "";

                        var dateLabel =
                            '<small class="expense-date">' +
                            escapeHtml(formatExpenseDate(expense.date)) +
                            "</small>";

                        var enterprise =
                            selectedEmpreendimentoId === "todos"
                                ? '<span class="enterprise-name">' +
                                  escapeHtml(
                                      empreendimentoName(
                                          expense.empreendimentoId
                                      )
                                  ) +
                                  "</span>"
                                : "";

                        return (
                            '<div class="expense-row">' +
                            "<div>" +
                            enterprise +
                            dateLabel +
                            " <strong>" +
                            escapeHtml(expense.category) +
                            "</strong>" +
                            description +
                            "</div>" +
                            "<b>" +
                            money(expense.amount) +
                            "</b>" +
                            '<button class="expense-edit" type="button" data-expense-edit="' +
                            escapeHtml(expense.id) +
                            '" aria-label="Editar gasto">✎</button>' +
                            "</div>"
                        );
                    })
                    .join("");
					
					var currentMonthClass =
					selectedYear === new Date().getFullYear() &&
					group.month === new Date().getMonth()
						? " month-current"
						: "";
						
                return (
                    '<details class="expense-month">' +
                    '<summary class="expense-month-header' + currentMonthClass + '">' +
                    '<div class="expense-month-title">' +
                    "<h3>" +
                    fullMonths[group.month] +
                    "</h3>" +
                    "<small>" +
                    count +
                    "</small>" +
                    "</div>" +
                    "<strong>" +
                    money(subtotal) +
                    "</strong>" +
                    "</summary>" +
                    rows +
                    "</details>"
                );
            })
            .join("");

        expensesList
            .querySelectorAll(".expense-edit")
            .forEach(function (button) {
                button.addEventListener("click", function () {
                    openExpenseModal(button.dataset.expenseEdit);
                });
            });
        applyExpensesVisibility();
    }

    function expenseMonths() {
        return expensesList.querySelectorAll("details.expense-month");
    }

    function applyExpensesVisibility() {
        var hasGroups = expenseMonths().length > 0;
        toggleExpensesButton.hidden = !hasGroups;
        toggleExpensesButton.textContent = expensesExpanded
            ? "Ocultar meses"
            : "Mostrar meses";
        expensesList.hidden = hasGroups && !expensesExpanded;
    }

    function toggleExpensesVisibility() {
        expensesExpanded = !expensesExpanded;
        if (!expensesExpanded) {
            expenseMonths().forEach(function (item) {
                item.open = false;
            });
        }
        applyExpensesVisibility();
    }
    function updateToggleExpensesButton() {
        var months = expenseMonths();
        toggleExpensesButton.hidden = months.length < 2;
        var allOpen =
            months.length > 0 &&
            Array.prototype.every.call(months, function (item) {
                return item.open;
            });
        toggleExpensesButton.textContent = allOpen
            ? "Recolher tudo"
            : "Expandir tudo";
    }

    function toggleAllExpenseMonths() {
        var months = expenseMonths();
        var allOpen =
            months.length > 0 &&
            Array.prototype.every.call(months, function (item) {
                return item.open;
            });
        months.forEach(function (item) {
            item.open = !allOpen;
        });
        updateToggleExpensesButton();
    }
	
	function ensurePaymentHistory(unit) {
		if (
			!unit.paymentHistory ||
			typeof unit.paymentHistory !== "object"
		) {
			unit.paymentHistory = {};
		}

		return unit.paymentHistory;
	}

    function toggleStatus(id, month) {
    var unit = state.units.find(function (item) {
        return item.id === id;
    });

    if (!unit || !isActive(unit, month)) return;

    var cycle = ["pendente", "pago", "pago-atrasado"];
    var current = logicalStatus(unit, month);
    var key = monthKey(month);
    var next = cycle[(cycle.indexOf(current) + 1) % cycle.length];

    // Garante que o histórico de pagamentos exista
    unit.paymentHistory =
        unit.paymentHistory &&
        typeof unit.paymentHistory === "object"
            ? unit.paymentHistory
            : {};

    // ==========================================================
    // PAGAMENTO COM ATRASO
    // ==========================================================
    if (next === "pago-atrasado") {
        var payment = unit.paymentHistory[key];

        // Se nunca houve registro desse pagamento, calcula agora
        if (!payment) {
            var aluguel = rentForMonth(unit, selectedYear, month);
            var breakdown = lateChargeBreakdown(unit, month);

            var totalAtualizado = breakdown
                ? breakdown.totalAmount
                : aluguel;

            var multa = breakdown ? breakdown.fineAmount : 0;
            var juros = breakdown ? breakdown.interestAmount : 0;

            unit.paymentHistory[key] = {
                paidAt: new Date().toISOString(),
                rentAmount: aluguel,
                fineAmount: multa,
                interestAmount: juros,
                chargesAmount: multa + juros,
                totalAmount: totalAtualizado
            };
        }

        // Marca como pago com atraso
        unit.status[key] = "pago";

        unit.paidLate =
            unit.paidLate &&
            typeof unit.paidLate === "object"
                ? unit.paidLate
                : {};

        unit.paidLate[key] = true;
    } else {
        unit.status[key] =
            next === "pago" ? "pago" : next;

        unit.paidLate =
            unit.paidLate &&
            typeof unit.paidLate === "object"
                ? unit.paidLate
                : {};

        if (next !== "pago-atrasado") {
            delete unit.paidLate[key];
        }
    }

    saveState();
    render();
}

    function collapseExpenseMonths() {
        expensesList
            .querySelectorAll("details.expense-month[open]")
            .forEach(function (item) {
                item.open = false;
            });
        applyExpensesVisibility();
    }
	
	var paymentAdjustContext = null;

function openPaymentAdjust(id, month) {
    var unit = state.units.find(function (item) {
        return item.id === id;
    });

    if (!unit || !isActive(unit, month)) return;

    var key = monthKey(month);

    unit.paymentHistory =
        unit.paymentHistory &&
        typeof unit.paymentHistory === "object"
            ? unit.paymentHistory
            : {};

    var payment = unit.paymentHistory[key];

    /*
     * Se o pagamento ainda não possui histórico,
     * criamos apenas os valores iniciais para permitir
     * o ajuste manual.
     *
     * O histórico só será efetivamente salvo quando
     * o usuário clicar em "Salvar ajuste".
     */
    if (!payment) {
        payment = {
            paidAt: new Date().toISOString(),
            rentAmount: rentForMonth(
                unit,
                selectedYear,
                month
            ),
            interestAmount: 0,
            totalAmount: rentForMonth(
                unit,
                selectedYear,
                month
            )
        };
    }

    paymentAdjustContext = {
        unitId: id,
        month: month,
        key: key
    };

    document.getElementById("paymentAdjustTitle").textContent =
        "Ajustar pagamento";

    document.getElementById("paymentAdjustInfo").textContent =
        unit.name +
        " — " +
        fullMonths[month] +
        " de " +
        selectedYear;

    /*
     * Data real do pagamento
     */
    var paidDate = payment.paidAt
        ? new Date(payment.paidAt)
        : new Date();

    var dateInput =
        document.getElementById("paymentAdjustDate");

    if (!isNaN(paidDate.getTime())) {
        dateInput.value =
            paidDate.getFullYear() +
            "-" +
            String(paidDate.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(paidDate.getDate()).padStart(2, "0");
    } else {
        dateInput.value = "";
    }

    /*
     * Valor do aluguel
     */
    document.getElementById("paymentAdjustRent").value =
        Number(payment.rentAmount) || 0;

    /*
     * Juros / encargos
     */
    document.getElementById("paymentAdjustInterest").value =
        Number(payment.interestAmount) || 0;

    /*
     * Total
     */
    updatePaymentAdjustTotal();

    ModalManager.open(
        document.getElementById("paymentAdjustModal")
    );
}

function updatePaymentAdjustTotal() {
    var rent =
        Number(document.getElementById("paymentAdjustRent").value) || 0;

    var interest =
        Number(
            document.getElementById("paymentAdjustInterest").value
        ) || 0;

    document.getElementById("paymentAdjustTotal").value =
        (rent + interest).toFixed(2);
}

function savePaymentAdjust() {
    if (!paymentAdjustContext) return;

    var unit = state.units.find(function (item) {
        return item.id === paymentAdjustContext.unitId;
    });

    if (!unit) return;

    var key = paymentAdjustContext.key;

    unit.paymentHistory =
        unit.paymentHistory &&
        typeof unit.paymentHistory === "object"
            ? unit.paymentHistory
            : {};

    var payment = unit.paymentHistory[key];

    if (!payment) {
        alert("Pagamento não encontrado.");
        return;
    }

    var dateValue =
        document.getElementById("paymentAdjustDate").value;

    var rent =
        Number(document.getElementById("paymentAdjustRent").value) || 0;

    var interest =
        Number(
            document.getElementById("paymentAdjustInterest").value
        ) || 0;

    if (!dateValue) {
        alert("Informe a data real do pagamento.");
        return;
    }

    if (rent < 0 || interest < 0) {
        alert("Os valores não podem ser negativos.");
        return;
    }

    // Converte a data escolhida para ISO sem alterar o dia
    var parts = dateValue.split("-");

    var paidAt = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2]),
        12,
        0,
        0
    ).toISOString();

    payment.paidAt = paidAt;
    payment.rentAmount = rent;
    payment.interestAmount = interest;
    payment.totalAmount = rent + interest;

    saveState();
    render();

    ModalManager.close(
        document.getElementById("paymentAdjustModal")
    );

    paymentAdjustContext = null;
}

document
    .getElementById("paymentAdjustRent")
    .addEventListener("input", updatePaymentAdjustTotal);

document
    .getElementById("paymentAdjustInterest")
    .addEventListener("input", updatePaymentAdjustTotal);

document
    .getElementById("savePaymentAdjust")
    .addEventListener("click", savePaymentAdjust);

document
    .getElementById("cancelPaymentAdjust")
    .addEventListener("click", function () {
        paymentAdjustContext = null;

        ModalManager.close(
            document.getElementById("paymentAdjustModal")
        );
    });

    function renderAttachmentList(unit) {
        if (!attachmentList) return;
        var files = unit && Array.isArray(unit.attachments) ? unit.attachments : [];
        attachmentList.innerHTML = files.length ? files.map(function (file) {
            return '<a class="attachment-row" href="' + escapeHtml(file.url) + '" target="_blank" rel="noopener noreferrer">📎 ' + escapeHtml(file.name) + '<span>' + escapeHtml(formatTimelineDate(String(file.createdAt || "").slice(0,10))) + '</span></a>';
        }).join("") : '<p class="rent-changes-empty">Nenhum documento anexado.</p>';
    }

    function uploadContractAttachment() {
        attachmentStatus.textContent = "Envio de documentos para a nuvem está desabilitado.";
    }

    function openModal(id) {
		editingId = id || null;

		var unit = state.units.find(function (item) {
			return item.id === editingId;
		});

		document.getElementById("modalTitle").textContent = unit
			? "Editar unidade"
			: "Nova unidade";

		unitName.value = unit ? unit.name : "";

		populateEmpreendimentoSelect(
			unitEmpreendimento,
			unit
				? unit.empreendimentoId
				: selectedEmpreendimentoId === "todos"
					? null
					: selectedEmpreendimentoId,
			false
		);

		attachmentStatus.textContent = "";
        renderAttachmentList(unit);
		var hasCurrentContract =
			!!(unit && String(unit.tenantName || "").trim());

		// Se a unidade não possui contrato atual, não reutiliza dados
		// antigos que possam ter ficado gravados após o arquivamento.
		unitRent.value = hasCurrentContract ? unit.rent : "";

		pendingRentChanges = hasCurrentContract
			? (unit.rentChanges || []).map(function (change) {
				  return {
					  fromYm: change.fromYm,
					  rent: change.rent
				  };
			  })
			: [];

		pendingContractHistory = unit
			? (unit.contractHistory || []).map(function (contract) {
				  return { id: contract.id, tenantName: contract.tenantName, tenantPhone: contract.tenantPhone, tenantEmail: contract.tenantEmail, tenantNotes: contract.tenantNotes, startDate: contract.startDate, endDate: contract.endDate, startYm: contract.startYm, endYm: contract.endYm, rent: contract.rent, dueDay: contract.dueDay, status: contract.status, reason: contract.reason };
			  })
			: [];

		unitDueDay.value =
			hasCurrentContract && Number.isInteger(unit.dueDay)
				? unit.dueDay
				: "";

		unitStartYm.value = hasCurrentContract && isValidDateValue(unit.startDate) ? unit.startDate : "";
		unitEndYm.value = hasCurrentContract && isValidDateValue(unit.endDate) ? unit.endDate : "";

		tenantName.value = hasCurrentContract ? unit.tenantName : "";
		tenantPhone.value = hasCurrentContract ? unit.tenantPhone : "";
		var savedTenantEmail = hasCurrentContract ? unit.tenantEmail : "";
		var isOwnerEmail = !!(
			firebaseUser &&
			firebaseUser.email &&
			savedTenantEmail &&
			savedTenantEmail.toLowerCase() === firebaseUser.email.toLowerCase()
		);
		if (isOwnerEmail) {
			unit.tenantEmail = "";
			savedTenantEmail = "";
			saveState();
		}
		tenantEmail.value = savedTenantEmail;
		tenantNotes.value = hasCurrentContract ? unit.tenantNotes : "";

		historyTenant.value = "";
		historyStart.value = "";
		historyEnd.value = "";
		historyRent.value = "";

		unitDueDay.setCustomValidity("");
		unitStartYm.setCustomValidity("");
		unitEndYm.setCustomValidity("");

		rentChangeYm.value = "";
		rentChangePercent.value = "";
		rentChangeAbsolute.value = "";

		rentChangeYm.setCustomValidity("");
		rentChangeAbsolute.setCustomValidity("");

		document.getElementById("rentChanges").open = false;
		renderRentChanges();
		renderContractHistory();

		document.getElementById("deleteUnit").hidden = !unit;
		document.getElementById("startNewContract").hidden = hasCurrentContract;

		// Abre o modal usando o ModalManager
		ModalManager.open(modal);

		
	}

    function exportBackup() {
        requireSensitiveAccess("exportar o backup", exportBackupNow);
    }

    function importBackup(event) {
        requireSensitiveAccess("importar um backup", function () {
            importBackupNow(event);
        });
    }

    function closeModal() {
        ModalManager.close(modal);
        editingId = null;
    }
    //--------------------------------------------------------------------------------------------
    function renderRentChanges() {
        if (!pendingRentChanges.length) {
            rentChangesList.innerHTML =
                '<p class="rent-changes-empty">Nenhum reajuste cadastrado.</p>';
            return;
        }
        rentChangesList.innerHTML = pendingRentChanges
            .map(function (change) {
                return (
                    '<div class="rent-change-row"><div><strong>' +
                    fullMonths[Number(change.fromYm.slice(5, 7)) - 1] +
                    " de " +
                    change.fromYm.slice(0, 4) +
                    "</strong><span>" +
                    money(change.rent) +
                    '</span></div><button class="btn btn-danger rent-change-remove" type="button" data-rent-change="' +
                    escapeHtml(change.fromYm) +
                    '">Remover</button></div>'
                );
            })
            .join("");
        rentChangesList
            .querySelectorAll("[data-rent-change]")
            .forEach(function (button) {
                button.addEventListener("click", function () {
                    pendingRentChanges = pendingRentChanges.filter(function (
                        change
                    ) {
                        return change.fromYm !== button.dataset.rentChange;
                    });
                    renderRentChanges();
                });
            });
    }

    function addRentChange() {
        var fromYm = rentChangeYm.value;
        var percentValue = rentChangePercent.value.trim();
        var absoluteValue = rentChangeAbsolute.value.trim();
        if (!isValidStartYm(fromYm)) {
            rentChangeYm.setCustomValidity(
                "Informe um mês de reajuste válido."
            );
            rentChangeYm.reportValidity();
            rentChangeYm.focus();
            return;
        }
        var hasPercent = percentValue !== "";
        var hasAbsolute = absoluteValue !== "";
        if (hasPercent === hasAbsolute) {
            rentChangeAbsolute.setCustomValidity(
                "Informe um percentual ou um novo valor."
            );
            rentChangeAbsolute.reportValidity();
            rentChangeAbsolute.focus();
            return;
        }
        var baseRent = Number(unitRent.value);
        if (!Number.isFinite(baseRent) || baseRent < 0) {
            unitRent.focus();
            return;
        }
        var previousRent = rentForYm(
            { rent: baseRent, rentChanges: pendingRentChanges },
            previousYm(fromYm)
        );
        var rent = hasPercent
            ? previousRent * (1 + Number(percentValue) / 100)
            : Number(absoluteValue);
        if (
            !Number.isFinite(rent) ||
            rent < 0 ||
            (hasPercent && !Number.isFinite(Number(percentValue)))
        ) {
            rentChangeAbsolute.setCustomValidity(
                "Informe um valor de reajuste válido."
            );
            rentChangeAbsolute.reportValidity();
            rentChangeAbsolute.focus();
            return;
        }
        rent = Math.round(rent * 100) / 100;
        var existing = pendingRentChanges.find(function (change) {
            return change.fromYm === fromYm;
        });
        if (existing) existing.rent = rent;
        else pendingRentChanges.push({ fromYm: fromYm, rent: rent });
        pendingRentChanges.sort(function (a, b) {
            return a.fromYm.localeCompare(b.fromYm);
        });
        rentChangeYm.value = "";
        rentChangePercent.value = "";
        rentChangeAbsolute.value = "";
        rentChangeAbsolute.setCustomValidity("");
        renderRentChanges();
    }
	
	function renderContractHistory() {

  if (!pendingContractHistory.length) {

    contractHistoryList.innerHTML = "<p class=\"rent-changes-empty\">Nenhum contrato encerrado registrado.</p>";

    return;

  }

  contractHistoryList.innerHTML = pendingContractHistory.map(function (contract, index) {

    var period = (contract.startYm ? ymLabel(contract.startYm) : "início?") +

      " até " + (contract.endYm ? ymLabel(contract.endYm) : "sem fim");

    if (contract.rent !== null) period += " · " + money(contract.rent);

    return "<div class=\"rent-change-row\"><div><strong>" +

      escapeHtml(contract.tenantName || "Sem nome") + "</strong><span>" +

      escapeHtml(period) + "</span></div><button class=\"btn btn-danger rent-change-remove\" type=\"button\" data-history-index=\"" +

      index + "\">Remover</button></div>";

  }).join("");

  contractHistoryList.querySelectorAll("[data-history-index]").forEach(function (button) {

    button.addEventListener("click", function () {

      pendingContractHistory.splice(Number(button.dataset.historyIndex), 1);

      renderContractHistory();

    });

  });

}

 

function archiveCurrentContract() {
    var archivedTenant = tenantName.value.trim();
    var archivedStart = unitStartYm.value || null;
    var archivedEnd = unitEndYm.value || null;
    var archivedRentValue = Number(unitRent.value);

    /*
     * Se o contrato estava aberto/sem fim e está sendo arquivado agora,
     * o mês atual é o último mês possível desse contrato.
     * Assim, meses futuros ficam como "Sem contrato".
     */
    if (!archivedEnd) {
        var now = new Date();
        archivedEnd =
            now.getFullYear() +
            "-" +
            String(now.getMonth() + 1).padStart(2, "0");
    }

    if (!archivedTenant && !archivedStart && !archivedEnd) {
        tenantName.focus();
        return;
    }

    /*
     * ==========================================================
     * PRESERVA O FINANCEIRO ANTES DE ENCERRAR O CONTRATO
     *
     * O contrato pode deixar de ser "ativo", mas pagamentos de
     * meses anteriores continuam sendo registros financeiros
     * daquele ano. Por isso, criamos paymentHistory para qualquer
     * mês já marcado como pago que ainda não tenha um registro.
     * ==========================================================
     */
    var existingUnit = editingId
        ? state.units.find(function (item) {
              return item.id === editingId;
          })
        : null;

    if (existingUnit) {
        existingUnit.paymentHistory =
            existingUnit.paymentHistory &&
            typeof existingUnit.paymentHistory === "object"
                ? existingUnit.paymentHistory
                : {};

        months.forEach(function (_, month) {
            var key = monthKey(month);
            var status = statusFor(existingUnit, month);

            // Converte atrasos calculados automaticamente em um status persistido
            // antes de limpar os dados do contrato. Sem isso, o vencimento some
            // ao encerrar a unidade e a dívida deixa de aparecer no resumo.
            if (effectiveStatus(existingUnit, month) === "atrasado") {
                existingUnit.status[key] = "atrasado";
                status = "atrasado";
            }

            if (status !== "pago") return;

            if (existingUnit.paymentHistory[key]) return;

            var rentAtPayment =
                rentForMonth(
                    existingUnit,
                    selectedYear,
                    month
                );

            existingUnit.paymentHistory[key] = {
                paidAt: null,
                rentAmount: rentAtPayment,
                fineAmount: 0,
                interestAmount: 0,
                chargesAmount: 0,
                totalAmount: rentAtPayment
            };
        });
    }

    // Guarda o contrato encerrado no histórico temporário.
    pendingContractHistory.push({
        tenantName: archivedTenant,
        startYm: archivedStart,
        endYm: archivedEnd,
        rent:
            Number.isFinite(archivedRentValue) && archivedRentValue >= 0
                ? archivedRentValue
                : null
    });

    // Limpa COMPLETAMENTE o contrato atual.
    tenantName.value = "";
    tenantPhone.value = "";
    tenantEmail.value = "";
    tenantNotes.value = "";

    unitRent.value = "";
    unitDueDay.value = "";
    unitStartYm.value = "";
    unitEndYm.value = "";

    // Reajustes pertencem ao contrato encerrado.
    pendingRentChanges = [];
    renderRentChanges();

    // Não cria automaticamente o início do próximo contrato.
    renderContractHistory();
    tenantName.focus();
}

 

function addContractHistoryEntry() {

  var name = historyTenant.value.trim();

  var startYm = historyStart.value || null;

  var endYm = historyEnd.value || null;

  var rentValue = Number(historyRent.value);

  if (!name && !startYm && !endYm) return;

  pendingContractHistory.push({

    tenantName: name,

    startYm: startYm,

    endYm: endYm,

    rent: Number.isFinite(rentValue) && rentValue >= 0 ? rentValue : null

  });

  historyTenant.value = "";

  historyStart.value = "";

  historyEnd.value = "";

  historyRent.value = "";

  renderContractHistory();

}
	
	
	

    /* Histórico de contratos: dados estruturados, linha do tempo e ações */
    var editingHistoryIndex = null;
    function newContractHistoryId(){return "contract-"+Date.now().toString(36)+Math.random().toString(36).slice(2)}
    function normalizeContractHistoryStatus(value){return ["encerrado","rescisao","pendente"].indexOf(value)>=0?value:"encerrado"}
    function normalizeContractHistory(list){if(!Array.isArray(list))return [];return list.map(function(item){if(!item||typeof item!=="object"||Array.isArray(item))return null;var name=typeof item.tenantName==="string"?item.tenantName.trim():"",start=isValidStartYm(item.startYm)?item.startYm:null,end=isValidStartYm(item.endYm)?item.endYm:null,amount=item.rent===null||item.rent===undefined||item.rent===""?null:Number(item.rent),rent=amount!==null&&Number.isFinite(amount)&&amount>=0?amount:null;if(!name&&!start&&!end&&rent===null)return null;return{id:typeof item.id==="string"&&item.id.trim()?item.id:newContractHistoryId(),tenantName:name,startYm:start,endYm:end,rent:rent,status:normalizeContractHistoryStatus(item.status),reason:typeof item.reason==="string"?item.reason.trim():""}}).filter(function(item){return item!==null})}
    function contractHistoryStatusInfo(value){return{encerrado:["Encerrado normalmente","is-closed"],rescisao:["Rescisão antecipada","is-ended"],pendente:["Encerrado com pendências","is-pending"]}[normalizeContractHistoryStatus(value)]}
    function contractHistoryPeriod(contract){return(contract.startYm?ymLabel(contract.startYm):"Início não informado")+" até "+(contract.endYm?ymLabel(contract.endYm):"fim não informado")}
    function resetHistoryForm(){editingHistoryIndex=null;historyTenant.value="";historyStart.value="";historyEnd.value="";historyRent.value="";historyStatus.value="encerrado";historyReason.value="";addContractHistory.textContent="Adicionar ao histórico"}
    function renderContractHistory(){var active=tenantName.value.trim(),current=active?'<article class="contract-timeline-card is-current"><div class="contract-timeline-heading"><strong>'+escapeHtml(active)+'</strong><span class="contract-status">Contrato atual</span></div><p>'+escapeHtml(contractHistoryPeriod({startYm:unitStartYm.value||null,endYm:unitEndYm.value||null}))+(unitRent.value!==""?" · "+money(Number(unitRent.value)):"")+"</p></article>":'<p class="rent-changes-empty">Nenhum contrato atual cadastrado.</p>',records=pendingContractHistory.map(function(contract,index){return{contract:contract,index:index}}).sort(function(a,b){return(b.contract.endYm||b.contract.startYm||"").localeCompare(a.contract.endYm||a.contract.startYm||"")}),cards=records.length?records.map(function(item){var c=item.contract,s=contractHistoryStatusInfo(c.status);return'<article class="contract-timeline-card '+s[1]+'"><div class="contract-timeline-heading"><strong>'+escapeHtml(c.tenantName||"Inquilino não informado")+'</strong><span class="contract-status">'+s[0]+"</span></div><p>"+escapeHtml(contractHistoryPeriod(c))+(c.rent!==null?" · "+money(c.rent):"")+"</p>"+(c.reason?'<p class="contract-history-reason">'+escapeHtml(c.reason)+"</p>":"")+'<div class="contract-history-actions"><button class="btn btn-ghost" type="button" data-history-edit="'+item.index+'">Editar</button><button class="btn btn-ghost" type="button" data-history-reactivate="'+item.index+'">Reativar</button><button class="btn btn-danger" type="button" data-history-remove="'+item.index+'">Remover</button></div></article>'}).join(""):'<p class="rent-changes-empty">Nenhum contrato encerrado registrado.</p>';contractHistoryList.innerHTML='<div class="contract-timeline">'+current+cards+"</div>";contractHistoryList.querySelectorAll("[data-history-edit]").forEach(function(button){button.addEventListener("click",function(){var i=Number(button.dataset.historyEdit),c=pendingContractHistory[i];if(!c)return;editingHistoryIndex=i;historyTenant.value=c.tenantName||"";historyStart.value=c.startYm||"";historyEnd.value=c.endYm||"";historyRent.value=c.rent===null?"":c.rent;historyStatus.value=normalizeContractHistoryStatus(c.status);historyReason.value=c.reason||"";addContractHistory.textContent="Salvar alterações";historyManual.open=true;historyTenant.focus()})});contractHistoryList.querySelectorAll("[data-history-reactivate]").forEach(function(button){button.addEventListener("click",function(){var i=Number(button.dataset.historyReactivate),c=pendingContractHistory[i];if(!c||(tenantName.value.trim()&&!window.confirm("Substituir os dados do contrato atual por este contrato?")))return;tenantName.value=c.tenantName||"";unitStartYm.value=c.startYm||"";unitEndYm.value="";unitRent.value=c.rent===null?"":c.rent;pendingContractHistory.splice(i,1);resetHistoryForm();renderRentChanges();renderContractHistory();tenantName.focus()})});contractHistoryList.querySelectorAll("[data-history-remove]").forEach(function(button){button.addEventListener("click",function(){var i=Number(button.dataset.historyRemove);if(!window.confirm("Remover este contrato do histórico?"))return;pendingContractHistory.splice(i,1);resetHistoryForm();renderContractHistory()})})}
    function addContractHistoryEntry(){var name=historyTenant.value.trim(),start=historyStart.value||null,end=historyEnd.value||null,amount=Number(historyRent.value);if(!name&&!start&&!end){historyTenant.focus();return}if(start&&end&&end<start){historyEnd.setCustomValidity("O fim deve ser igual ou posterior ao início.");historyEnd.reportValidity();historyEnd.focus();return}historyEnd.setCustomValidity("");var c={id:editingHistoryIndex!==null&&pendingContractHistory[editingHistoryIndex]?pendingContractHistory[editingHistoryIndex].id:newContractHistoryId(),tenantName:name,startYm:start,endYm:end,rent:Number.isFinite(amount)&&amount>=0?amount:null,status:normalizeContractHistoryStatus(historyStatus.value),reason:historyReason.value.trim()};if(editingHistoryIndex!==null)pendingContractHistory[editingHistoryIndex]=c;else pendingContractHistory.push(c);resetHistoryForm();historyManual.open=false;renderContractHistory()}
    //--------------------------------------------------------------------------------------------
    function setCategoryStatus(message, isError) {
        categoryStatus.textContent = message;
        categoryStatus.style.color = isError ? "#a52d3b" : "#0f766e";
    }

    function renderCategoryManager() {
        categoryList.innerHTML = expenseCategories
            .map(function (category) {
                var remove =
                    normalizeText(category) === "outros"
                        ? ""
                        : '<button class="category-remove btn btn-danger" type="button" data-category-remove="' +
                          escapeHtml(category) +
                          '">Remover</button>';
                return (
                    '<div class="category-row"><input type="text" value="' +
                    escapeHtml(category) +
                    '" data-category-input="' +
                    escapeHtml(category) +
                    '" maxlength="60" /><button class="category-save btn btn-ghost" type="button" data-category-save="' +
                    escapeHtml(category) +
                    '">Renomear</button>' +
                    remove +
                    "</div>"
                );
            })
            .join("");
        categoryList
            .querySelectorAll("[data-category-save]")
            .forEach(function (button) {
                button.addEventListener("click", function () {
                    var input = Array.from(
                        categoryList.querySelectorAll("[data-category-input]")
                    ).find(function (item) {
                        return (
                            item.dataset.categoryInput ===
                            button.dataset.categorySave
                        );
                    });
                    renameCategory(
                        button.dataset.categorySave,
                        input ? input.value : ""
                    );
                });
            });
        categoryList
            .querySelectorAll("[data-category-remove]")
            .forEach(function (button) {
                button.addEventListener("click", function () {
                    removeCategory(button.dataset.categoryRemove);
                });
            });
    }

    function saveCategoryList() {
        state.expenseCategories = expenseCategories.slice();
        saveState();
        populateExpenseCategories();
        renderExpenses();
    }

    function addCategory() {
        var value = newCategory.value.trim();
        if (!value) {
            setCategoryStatus("Digite um nome para a categoria.", true);
            newCategory.focus();
            return;
        }
        if (
            expenseCategories.some(function (category) {
                return normalizeText(category) === normalizeText(value);
            })
        ) {
            setCategoryStatus("Esta categoria já existe.", true);
            newCategory.focus();
            return;
        }
        expenseCategories.splice(
            Math.max(0, expenseCategories.length - 1),
            0,
            value
        );
        newCategory.value = "";
        saveCategoryList();
        renderCategoryManager();
        setCategoryStatus("Categoria adicionada.", false);
    }

    function renameCategory(oldName, newName) {
        newName = String(newName || "").trim();
        if (normalizeText(oldName) === "outros") {
            setCategoryStatus(
                "A categoria Outros não pode ser renomeada.",
                true
            );
            return;
        }
        if (!newName) {
            setCategoryStatus("Digite um nome para a categoria.", true);
            return;
        }
        if (
            expenseCategories.some(function (category) {
                return (
                    normalizeText(category) !== normalizeText(oldName) &&
                    normalizeText(category) === normalizeText(newName)
                );
            })
        ) {
            setCategoryStatus("Esta categoria já existe.", true);
            return;
        }
        var index = expenseCategories.indexOf(oldName);
        if (index < 0) return;
        //--------------------------------------------------------------------------------------------
        expenseCategories[index] = newName;
        state.expenses.forEach(function (expense) {
            if (expense.category === oldName) expense.category = newName;
        });
        saveCategoryList();
        renderCategoryManager();
        setCategoryStatus("Categoria renomeada.", false);
    }

    function removeCategory(category) {
        if (normalizeText(category) === "outros") {
            setCategoryStatus(
                "A categoria Outros não pode ser removida.",
                true
            );
            return;
        }
        if (
            !window.confirm(
                "Remover esta categoria? Os gastos serão movidos para Outros."
            )
        )
            return;

        // Garantir que "Outros" exista na lista
        if (
            !expenseCategories.some(function (item) {
                return normalizeText(item) === "outros";
            })
        ) {
            expenseCategories.push("Outros");
        }

        expenseCategories = expenseCategories.filter(function (item) {
            return item !== category;
        });
        state.expenses.forEach(function (expense) {
            if (expense.category === category) expense.category = "Outros";
        });
        saveCategoryList();
        renderCategoryManager();
        setCategoryStatus(
            "Categoria removida. Os gastos foram movidos para Outros.",
            false
        );
    }

    function populateExpenseCategories(selected) {
        var current = selected || expenseCategory.value;
        var options = expenseCategories.slice();
        if (current && !options.includes(current)) options.push(current);
        expenseCategory.innerHTML = options
            .map(function (category) {
                return (
                    '<option value="' +
                    escapeHtml(category) +
                    '">' +
                    escapeHtml(category) +
                    "</option>"
                );
            })
            .join("");
        if (current && options.includes(current))
            expenseCategory.value = current;
    }

    function setEnterpriseStatus(message, isError) {
        enterpriseStatus.textContent = message;
        enterpriseStatus.style.color = isError ? "#a52d3b" : "#0f766e";
    }

    function renderEnterpriseManager() {
        enterpriseList.innerHTML = state.empreendimentos
            .map(function (enterprise) {
                return (
                    '<div class="category-row"><input type="text" value="' +
                    escapeHtml(enterprise.name) +
                    '" data-enterprise-input="' +
                    escapeHtml(enterprise.id) +
                    '" maxlength="80" /><button class="category-save btn btn-ghost" type="button" data-enterprise-save="' +
                    escapeHtml(enterprise.id) +
                    '">Renomear</button><button class="category-remove btn btn-danger" type="button" data-enterprise-remove="' +
                    escapeHtml(enterprise.id) +
                    '">Remover</button></div>'
                );
            })
            .join("");
        enterpriseList
            .querySelectorAll("[data-enterprise-save]")
            .forEach(function (button) {
                button.addEventListener("click", function () {
                    var input = Array.from(
                        enterpriseList.querySelectorAll(
                            "[data-enterprise-input]"
                        )
                    ).find(function (item) {
                        return (
                            item.dataset.enterpriseInput ===
                            button.dataset.enterpriseSave
                        );
                    });
                    renameEnterprise(
                        button.dataset.enterpriseSave,
                        input ? input.value : ""
                    );
                });
            });
        enterpriseList
            .querySelectorAll("[data-enterprise-remove]")
            .forEach(function (button) {
                button.addEventListener("click", function () {
                    removeEnterprise(button.dataset.enterpriseRemove);
                });
            });
    }

    function addEnterprise() {
        var value = newEnterprise.value.trim();
        if (!value) {
            setEnterpriseStatus("Digite um nome para o empreendimento.", true);
            newEnterprise.focus();
            return;
        }
        if (
            state.empreendimentos.some(function (item) {
                return normalizeText(item.name) === normalizeText(value);
            })
        ) {
            setEnterpriseStatus("Este empreendimento já existe.", true);
            newEnterprise.focus();
            return;
        }
        state.empreendimentos.push({ id: newEnterpriseId(), name: value });
        newEnterprise.value = "";
        saveState();
        renderEnterpriseManager();
        renderEmpreendimentoFilter();
        setEnterpriseStatus("Empreendimento adicionado.", false);
    }
    function renameEnterprise(id, value) {
        value = String(value || "").trim();
        if (!value) {
            setEnterpriseStatus("Digite um nome para o empreendimento.", true);
            return;
        }
        if (
            state.empreendimentos.some(function (item) {
                return (
                    item.id !== id &&
                    normalizeText(item.name) === normalizeText(value)
                );
            })
        ) {
            setEnterpriseStatus("Este empreendimento já existe.", true);
            return;
        }
        var enterprise = state.empreendimentos.find(function (item) {
            return item.id === id;
        });
        if (!enterprise) return;
        enterprise.name = value;
        saveState();
        renderEnterpriseManager();
        renderEmpreendimentoFilter();
        updateAppTitle();
        setEnterpriseStatus("Empreendimento renomeado.", false);
    }

    function removeEnterprise(id) {
        if (state.empreendimentos.length <= 1) {
            setEnterpriseStatus(
                "Não é possível remover o último empreendimento.",
                true
            );
            return;
        }
        if (
            state.units.some(function (unit) {
                return unit.empreendimentoId === id;
            }) ||
            state.expenses.some(function (expense) {
                return expense.empreendimentoId === id;
            })
        ) {
            setEnterpriseStatus(
                "Mova ou remova as unidades e gastos antes de excluir este empreendimento.",
                true
            );
            return;
        }
        if (!window.confirm("Remover este empreendimento?")) return;
        state.empreendimentos = state.empreendimentos.filter(function (item) {
            return item.id !== id;
        });
        if (selectedEmpreendimentoId === id) {
            selectedEmpreendimentoId = "todos";
            saveSelectedEmpreendimento();
        }
        saveState();
        renderEnterpriseManager();
        render();
        setEnterpriseStatus("Empreendimento removido.", false);
    }

    function openExpenseModal(id) {
        editingExpenseId = id || null;
        var expense = state.expenses.find(function (item) {
            return item.id === editingExpenseId;
        });
        var currentMonth = new Date().getMonth() + 1;

        expenseModalTitle.textContent = expense ? "Editar gasto" : "Novo gasto";
        expenseYm.value = expense
            ? expense.ym
            : selectedYear +
              "-" +
              String(
                  selectedYear === new Date().getFullYear() ? currentMonth : 1
              ).padStart(2, "0");
        populateEmpreendimentoSelect(
            expenseEmpreendimento,
            expense
                ? expense.empreendimentoId
                : selectedEmpreendimentoId === "todos"
                ? null
                : selectedEmpreendimentoId,
            false
        );
        populateExpenseCategories(
            expense
                ? expense.category
                : expenseCategories[expenseCategories.length - 1]
        );
        expenseAmount.value = expense ? expense.amount : "";
        expenseDescription.value = expense ? expense.description : "";
        expenseRepeat.checked = false;
        expenseRepeatCount.value = 1;
        recurrenceArea.hidden = !!expense;
        deleteExpenseButton.hidden = !expense;
        ModalManager.open(expenseModal);
        setTimeout(function () {
            expenseYm.focus();
        }, 0);
    }

    function closeExpenseModal() {
        expenseModal.hidden = true;
        editingExpenseId = null;
    }

    function addMonthsYm(ym, offset) {
        var parts = ym.split("-").map(Number);
        var date = new Date(parts[0], parts[1] - 1 + offset, 1);
        //--------------------------------------------------------------------------------------------
        return (
            date.getFullYear() +
            "-" +
            String(date.getMonth() + 1).padStart(2, "0")
        );
    }

    function formatExpenseDate(date) {
        if (!date) return "";

        var parts = date.split("-");

        if (parts.length !== 3) return date;

        return parts[2] + "/" + parts[1] + "/" + parts[0];
    }

function saveExpense() {
    var ym = expenseYm.value;
    var amount = Number(expenseAmount.value);

    if (!isValidStartYm(ym)) {
        expenseYm.focus();
        return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
        expenseAmount.focus();
        return;
    }

    if (!expenseEmpreendimento.value) {
        expenseEmpreendimento.setCustomValidity(
            "Selecione um empreendimento."
        );
        expenseEmpreendimento.reportValidity();
        expenseEmpreendimento.focus();
        return;
    }
    expenseEmpreendimento.setCustomValidity("");

    var repeatCount = expenseRepeat.checked
        ? Number(expenseRepeatCount.value)
        : 1;

    if (
        !Number.isInteger(repeatCount) ||
        repeatCount < 1 ||
        repeatCount > 60
    ) {
        expenseRepeatCount.setCustomValidity(
            "Informe uma quantidade inteira entre 1 e 60."
        );
        expenseRepeatCount.reportValidity();
        expenseRepeatCount.focus();
        return;
    }
    expenseRepeatCount.setCustomValidity("");

    var categoryValue = expenseCategory.value ? expenseCategory.value.trim() : "";
    var expenseData = {
        ym: ym,
        empreendimentoId: expenseEmpreendimento.value,
        category: categoryValue !== "" ? categoryValue : "Outros",
        description: expenseDescription.value.trim(),
        amount: amount,
    };

    // Obtém o dia atual no momento do lançamento (ex: dia 15)
    var today = new Date();
    var currentDay = today.getDate();

    if (editingExpenseId) {
        var existingIndex = state.expenses.findIndex(function (expense) {
            return expense.id === editingExpenseId;
        });

        if (existingIndex !== -1) {
            state.expenses[existingIndex] = Object.assign(
                {},
                state.expenses[existingIndex],
                expenseData
            );
        }
    } else {
        var recurrenceId = repeatCount > 1 ? newExpenseId() : null;

        for (var i = 0; i < repeatCount; i += 1) {
            var currentYm = addMonthsYm(expenseData.ym, i);
            
            // Preserva o dia do lançamento sem criar datas inválidas, como 31/04.
            var fullDate = expenseDateForMonth(currentYm, currentDay);

            state.expenses.push({
                id: newExpenseId(),
                ym: currentYm,
                date: fullDate, // Salva o dia exato do lançamento
                createdAt: new Date().toISOString(), // Registro do timestamp da criacao
                empreendimentoId: expenseData.empreendimentoId,
                category: expenseData.category,
                description: expenseData.description,
                amount: expenseData.amount,
                recurrenceId: recurrenceId,
            });
        }
    }

    saveState();
    closeExpenseModal();
    render();
}

    function deleteExpense() {
        if (!editingExpenseId) return;
        var expense = state.expenses.find(function (item) {
            return item.id === editingExpenseId;
        });
        if (!expense) return;
        var series =
            expense.recurrenceId &&
            state.expenses.filter(function (item) {
                return item.recurrenceId === expense.recurrenceId;
            }).length > 1;
        var removeSeries = false;
        if (series) {
            removeSeries = window.confirm(
                "Este gasto faz parte de uma série. Excluir toda a série?"
            );
            if (!removeSeries && !window.confirm("Excluir somente este gasto?"))
                return;
        } else if (!window.confirm("Excluir este gasto?")) {
            return;
        }
        state.expenses = state.expenses.filter(function (item) {
            //--------------------------------------------------------------------------------------------
            return removeSeries
                ? item.recurrenceId !== expense.recurrenceId
                : item.id !== editingExpenseId;
        });
        saveState();
        closeExpenseModal();
        render();
    }

    function openSettings() {
        finePercent.value = state.settings.finePercent;
        dailyInterestPercent.value = state.settings.dailyInterestPercent;

        // O campo continua com o id antigo para preservar os dados salvos,
        // mas a interface deve deixar claro que 1 representa 1% AO MÊS.
        var interestLabel = document.querySelector('label[for="dailyInterestPercent"]');

        if (!interestLabel && settingsModal) {
            interestLabel = Array.from(
                settingsModal.querySelectorAll("label")
            ).find(function (label) {
                return /juros/i.test(label.textContent || "");
            });
        }

        // IMPORTANTE: o input pode estar dentro do próprio <label>.
        // Não usar label.textContent aqui, pois isso apaga o <input>.
        function setInterestLabelText(label) {
            if (!label) return;
            var textNode = Array.from(label.childNodes).find(function (node) {
                return node.nodeType === Node.TEXT_NODE;
            });
            if (textNode) {
                textNode.nodeValue = "Juros de mora (% ao mês)";
            } else {
                var span = document.createElement("span");
                span.textContent = "Juros de mora (% ao mês)";
                label.insertBefore(span, label.firstChild);
            }
        }

        if (interestLabel) {
            setInterestLabelText(interestLabel);
        }

        // Proteção extra caso o HTML tenha mais de um rótulo de juros.
        if (settingsModal) {
            settingsModal.querySelectorAll("label").forEach(function (label) {
                if (/juros/i.test(label.textContent || "")) {
                    setInterestLabelText(label);
                }
            });
        }

        // Garante que o campo não volte a exibir a unidade antiga.
        if (dailyInterestPercent) {
            dailyInterestPercent.title =
                "Taxa mensal de juros de mora. Ex.: 1 = 1% ao mês.";
            dailyInterestPercent.setAttribute(
                "aria-label",
                "Juros de mora, porcentagem ao mês"
            );
        }
        receiverName.value = state.settings.receiverName;
        currentPin.value = "";
        newPin.value = "";
        confirmPin.value = "";
        currentPinLabel.hidden = !lockConfig;
        removePinButton.hidden = !lockConfig;
        securityStatus.textContent = lockConfig
            ? "Um PIN protege o acesso neste dispositivo."
            : "Nenhum PIN configurado neste dispositivo.";
        securityStatus.style.color = "";
        renderCategoryManager();
        renderEnterpriseManager();
        setCategoryStatus("Edite as opções disponíveis para os gastos.", false);
        finePercent.setCustomValidity("");
        dailyInterestPercent.setCustomValidity("");
        renderBackupHistory();
        ModalManager.open(settingsModal);
    }

    function closeSettings() {
        ModalManager.close(settingsModal);
    }

    function saveSettings() {
        var fine = Number(finePercent.value);
        var interest = Number(dailyInterestPercent.value);
        var reminder = Number(reminderDays.value);
        if (!Number.isFinite(fine) || fine < 0) {
            finePercent.setCustomValidity(
                "Informe um percentual válido igual ou maior que zero."
            );
            finePercent.reportValidity();
            finePercent.focus();
            return;
        }
        if (!Number.isFinite(interest) || interest < 0) {
            dailyInterestPercent.setCustomValidity(
                "Informe um percentual válido igual ou maior que zero."
            );
            dailyInterestPercent.reportValidity();
            dailyInterestPercent.focus();
            return;
        }
        if (!Number.isInteger(reminder) || reminder < 0 || reminder > 30) {
            reminderDays.setCustomValidity("Informe de 0 a 30 dias."); reminderDays.reportValidity(); reminderDays.focus(); return;
        }
        finePercent.setCustomValidity("");
        dailyInterestPercent.setCustomValidity("");
        reminderDays.setCustomValidity("");
        state.settings = {
            finePercent: fine,
            // Este campo mantém o nome antigo, mas representa % ao mês.
            dailyInterestPercent: interest,
            receiverName: receiverName.value.trim(),
            reminderDays: reminder,
        };
        saveState();
        closeSettings();
        render();
    }

    async function savePin() {
        if (!hasSubtleCrypto()) {
            securityStatus.textContent =
                "Este navegador não oferece criptografia segura para usar PIN.";

            return;
        }

        if (lockConfig && !(await verifyPin(currentPin.value, lockConfig))) {
            securityStatus.textContent = "PIN atual incorreto.";

            securityStatus.style.color = "#a52d3b";

            currentPin.focus();

            return;
        }

        if (!isValidPin(newPin.value)) {
            securityStatus.textContent =
                "O novo PIN deve ter pelo menos 4 dígitos numéricos.";

            securityStatus.style.color = "#a52d3b";

            newPin.focus();

            return;
        }

        if (newPin.value !== confirmPin.value) {
            securityStatus.textContent =
                "A confirmação do novo PIN não confere.";

            securityStatus.style.color = "#a52d3b";

            confirmPin.focus();

            return;
        }

        var salt = bytesToBase64Url(randomBytes(16));

        saveLockConfig({ salt: salt, hash: await hashPin(newPin.value, salt) });

        localStorage.setItem(SETUP_FLAG_KEY, "1");

        appUnlocked = true;

        currentPin.value = "";

        newPin.value = "";

        confirmPin.value = "";

        currentPinLabel.hidden = false;

        removePinButton.hidden = false;

        securityStatus.textContent = "PIN salvo neste dispositivo.";

        securityStatus.style.color = "#0f766e";
    }

    async function removePin() {
        if (!lockConfig) return;

        if (!(await verifyPin(currentPin.value, lockConfig))) {
            securityStatus.textContent = "PIN atual incorreto.";

            securityStatus.style.color = "#a52d3b";

            currentPin.focus();

            return;
        }

        saveLockConfig(null);

        localStorage.setItem(SETUP_FLAG_KEY, "1");

        currentPin.value = "";

        newPin.value = "";

        confirmPin.value = "";

        currentPinLabel.hidden = true;

        removePinButton.hidden = true;

        securityStatus.textContent = "PIN removido. O app abrirá sem senha.";

        securityStatus.style.color = "#0f766e";
    }

    function saveUnit() {
        var name = unitName.value.trim();
        var rent = Number(unitRent.value);
        var dueDayValue = unitDueDay.value.trim();
        var dueDay = dueDayValue === "" ? null : Number(dueDayValue);
        var startDate = unitStartYm.value || null;
        var endDate = unitEndYm.value || null;
        var startYm = contractMonthValue(startDate);
        var endYm = contractMonthValue(endDate);
        if (!name) {
            unitName.focus();
            return;
        }
        var hasCurrentContract =
            !!tenantName.value.trim();

        if (
            hasCurrentContract &&
            (!Number.isFinite(rent) || rent < 0)
        ) {
            unitRent.focus();
            return;
        }

        if (hasCurrentContract && !tenantName.value.trim()) {
            tenantName.setCustomValidity("Informe o nome do inquilino.");
            tenantName.reportValidity();
            tenantName.focus();
            return;
        }
        tenantName.setCustomValidity("");

        if (hasCurrentContract && !tenantPhone.value.trim()) {
            tenantPhone.setCustomValidity("Informe o telefone do inquilino.");
            tenantPhone.reportValidity();
            tenantPhone.focus();
            return;
        }
        tenantPhone.setCustomValidity("");

        if (!hasCurrentContract) {
            rent = 0;
            dueDay = null;
            startYm = null;
            endYm = null;
        }

        if (!unitEmpreendimento.value) {
            unitEmpreendimento.setCustomValidity("Selecione um empreendimento");
            unitEmpreendimento.reportValidity();
            unitEmpreendimento.focus();
            return;
        }
        unitEmpreendimento.setCustomValidity("");
        if (
            dueDay !== null &&
            (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)
        ) {
            unitDueDay.setCustomValidity(
                "Informe um dia inteiro entre 1 e 31."
            );
            unitDueDay.reportValidity();
            unitDueDay.focus();
            return;
        }
        unitDueDay.setCustomValidity("");
        if (startDate !== null && !isValidDateValue(startDate)) {
            unitStartYm.setCustomValidity("Informe uma data de início válida.");
            unitStartYm.reportValidity();
            unitStartYm.focus();
            return;
        }
        unitStartYm.setCustomValidity("");
        if (endDate !== null && !isValidDateValue(endDate)) {
            unitEndYm.setCustomValidity("Informe uma data de fim válida.");
            unitEndYm.reportValidity();
            unitEndYm.focus();
            return;
        }
        if (startDate && endDate && endDate < startDate) {
            unitEndYm.setCustomValidity(
                "O fim da locação deve ser igual ou posterior ao início."
            );
            //--------------------------------------------------------------------------------------------
            unitEndYm.reportValidity();
            unitEndYm.focus();
            return;
        }
        unitEndYm.setCustomValidity("");
        if (editingId) {
            var existing = state.units.find(function (unit) {
                return unit.id === editingId;
            });
            if (existing) {
                var incomingTenantName = tenantName.value.trim();
                var contractChanged =
                    hasCurrentContract &&
                    (existing.tenantName !== incomingTenantName ||
                        existing.startDate !== startDate);

                if (contractChanged) {
                    var lateLedger =
                        existing.lateLedger &&
                        typeof existing.lateLedger === "object"
                            ? existing.lateLedger
                            : {};
                    Object.keys(existing.status || {}).forEach(function (key) {
                        if (existing.status[key] === "atrasado")
                            lateLedger[key] = "open";
                    });
                    Object.keys(existing.paidLate || {}).forEach(function (key) {
                        if (existing.paidLate[key] === true)
                            lateLedger[key] = "paid";
                    });
                    existing.lateLedger = lateLedger;
                    existing.status = {};
                    existing.paidLate = {};
                }

                existing.name = name;
                existing.empreendimentoId = unitEmpreendimento.value;
                existing.rent = rent;
                existing.rentChanges = normalizeRentChanges(pendingRentChanges);
				existing.contractHistory = normalizeContractHistory(pendingContractHistory); 
                existing.dueDay = dueDay;
                existing.startDate = startDate;
                existing.endDate = endDate;
                existing.startYm = startYm;
                existing.endYm = endYm;
                existing.tenantName = tenantName.value.trim();
                existing.tenantPhone = tenantPhone.value.trim();
                existing.tenantEmail = tenantEmail.value.trim();
                existing.tenantNotes = tenantNotes.value.trim();
            }
        } else {
            state.units.push({
                id:
                    Date.now().toString(36) +
                    Math.random().toString(36).slice(2),
                empreendimentoId: unitEmpreendimento.value,
                name: name,
                rent: rent,
                rentChanges: normalizeRentChanges(pendingRentChanges),
				contractHistory: normalizeContractHistory(pendingContractHistory),
                dueDay: dueDay,
                startDate: startDate,
                endDate: endDate,
                startYm: startYm,
                endYm: endYm,
                tenantName: tenantName.value.trim(),
                tenantPhone: tenantPhone.value.trim(),
                tenantEmail: tenantEmail.value.trim(),
                tenantNotes: tenantNotes.value.trim(),
                status: {},
                paidLate: {},
            });
        }
        saveState();
        closeModal();
        render();
    }

    function deleteUnit() {
        if (
            !editingId ||
            !window.confirm("Excluir esta unidade e seus registros?")
        )
            return;
        state.units = state.units.filter(function (unit) {
            return unit.id !== editingId;
        });
        saveState();
        closeModal();
        render();
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;",
            }[character];
        });
    }

    function formatDate(date) {
        //--------------------------------------------------------------------------------------------
        return (
            String(date.getDate()).padStart(2, "0") +
            "/" +
            String(date.getMonth() + 1).padStart(2, "0") +
            "/" +
            date.getFullYear()
        );
    }

	function receiptData(unit, month) {
		var status = displayStatus(unit, month);
		var aluguel = rentForMonth(unit, selectedYear, month);
		var key = monthKey(month);

		// Recupera o histórico do pagamento, se existir
		var payment =
			unit.paymentHistory &&
			typeof unit.paymentHistory === "object"
				? unit.paymentHistory[key]
				: null;

		var multa = 0;
		var juros = 0;
		var encargos = 0;
		var totalAtualizado = aluguel;

		// ==========================================================
		// PAGAMENTO COM ATRASO
		// ==========================================================
		if (status === "pago-atrasado") {
			if (payment) {
				// Usa os valores salvos no momento do pagamento.
				multa = Number(payment.fineAmount) || 0;
				juros = Number(payment.interestAmount) || 0;
				encargos = Number(payment.chargesAmount);

				// Compatibilidade com pagamentos antigos: interestAmount
				// antigo armazenava multa + juros juntos.
				if (!Number.isFinite(encargos)) {
					encargos = Number(payment.interestAmount) || 0;
				}

				totalAtualizado =
					Number(payment.totalAmount) ||
					(aluguel + encargos);
			} else {
				var calculado = lateChargeBreakdown(unit, month);

				if (calculado) {
					multa = calculado.fineAmount;
					juros = calculado.interestAmount;
					encargos = calculado.chargesAmount;
					totalAtualizado = calculado.totalAmount;
				}
			}
		}

		return {
			unit: unit,
			month: month,
			year: selectedYear,
			status: status,
			monthName: fullMonths[month],
			issuedAt: formatDate(new Date()),

			// Valor original do aluguel
			amount: aluguel,

			// Encargos registrados no momento do pagamento
			fineAmount: multa,
			interestAmount: juros,
			chargesAmount: encargos,

			// Total efetivamente pago
			totalAmount: totalAtualizado,

			// Data real em que o pagamento foi registrado
			paidAt: payment ? payment.paidAt : null,
		};
	}

    function receiptMarkup(data) {
		var receiver = state.settings.receiverName
			? '<div class="receipt-line"><strong>Recebedor</strong><span>' +
			  escapeHtml(state.settings.receiverName) +
			  "</span></div>"
			: "";

		var tenant =
			data.unit && data.unit.tenantName
				? '<div class="receipt-line"><strong>Inquilino</strong><span>' +
				  escapeHtml(data.unit.tenantName) +
				  "</span></div>"
				: "";

		var lateNote =
			data.status === "pago-atrasado"
				? '<p class="receipt-note">Pagamento efetuado em atraso.</p>'
				: "";

		var aluguel = Number(data.amount) || 0;
		var multa = Number(data.fineAmount) || 0;
		var juros = Number(data.interestAmount) || 0;
		var jurosEncargos = Number(data.chargesAmount);
		if (!Number.isFinite(jurosEncargos)) {
			jurosEncargos = multa + juros;
		}

		var totalRecebido =
			data.status === "pago-atrasado"
				? Number(data.totalAmount) || aluguel + jurosEncargos
				: aluguel;

		var valoresAtraso =
			data.status === "pago-atrasado"
				? '<div class="receipt-line"><strong>Multa (10%)</strong><span>' +
				  money(multa) +
				  "</span></div>" +
				  '<div class="receipt-line"><strong>Juros de mora (1% a.m.)</strong><span>' +
				  money(juros) +
				  "</span></div>" +
				  '<div class="receipt-line"><strong>Total de encargos</strong><span>' +
				  money(jurosEncargos) +
				  "</span></div>" +
				  '<div class="receipt-line"><strong>Total recebido</strong><span>' +
				  money(totalRecebido) +
				  "</span></div>"
				: "";

		var dataPagamento = data.paidAt
			? '<div class="receipt-line"><strong>Data do pagamento</strong><span>' +
			  formatDate(new Date(data.paidAt)) +
			  "</span></div>"
			: "";

		var receiptText =
			data.status === "pago-atrasado"
				? "Recebi de forma integral a importância de " +
				  money(totalRecebido) +
				  " referente ao aluguel da " +
				  escapeHtml(data.unit.name) +
				  " no mês de " +
				  data.monthName +
				  " de " +
				  data.year +
				  ", sendo " +
				  money(aluguel) +
				  " referentes ao aluguel e " +
				  money(jurosEncargos) +
				  " referentes aos encargos pelo pagamento em atraso (multa e juros de mora)."
				: "Recebi de forma integral a importância de " +
				  money(aluguel) +
				  " referente ao aluguel da " +
				  escapeHtml(data.unit.name) +
				  " no mês de " +
				  data.monthName +
				  " de " +
				  data.year +
				  ".";

		return (
			'<div class="receipt-paper"><h3>Recibo de Aluguel</h3>' +
			receiver +
			tenant +
			'<div class="receipt-line"><strong>Unidade</strong><span>' +
			escapeHtml(data.unit.name) +
			"</span></div>" +
			'<div class="receipt-line"><strong>Valor do aluguel</strong><span>' +
			money(aluguel) +
			"</span></div>" +
			valoresAtraso +
			'<div class="receipt-line"><strong>Referência</strong><span>' +
			data.monthName +
			" de " +
			data.year +
			"</span></div>" +
			dataPagamento +
			'<div class="receipt-line"><strong>Data de emissão</strong><span>' +
			data.issuedAt +
			"</span></div>" +
			'<p class="receipt-text">' +
			receiptText +
			"</p>" +
			lateNote +
			'<div class="receipt-signature">' +
			'<div class="signature-line">' +
			'<span class="signature-name">' +
			escapeHtml(state.settings.receiverName || "Recebedor") +
			"</span>" +
			"</div>" +
			'<span class="signature-label">Assinatura do recebedor</span>' +
			"</div>" +
			"</div>"
		);
	}

	function openReceipt(id, month) {
		var unit = state.units.find(function (item) {
			return item.id === id;
		});

		if (!unit || !isActive(unit, month)) return;

		var status = displayStatus(unit, month);

		if (status !== "pago" && status !== "pago-atrasado") return;

		receiptContext = receiptData(unit, month);

		// Define dinamicamente o nome do empreendimento
		var empreendimento = state.empreendimentos.find(function (e) {
			return e.id === unit.empreendimentoId;
		});

		document.getElementById("receiptTitle").textContent =
			empreendimento ? empreendimento.name : "Controle de Aluguéis";

		receiptPreview.innerHTML = receiptMarkup(receiptContext);

		ModalManager.open(receiptModal);
	}

    function closeReceipt() {
        ModalManager.close(receiptModal);
        receiptContext = null;
        receiptPreview.innerHTML = "";
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
        //--------------------------------------------------------------------------------------------
        if (line) context.fillText(line, x, y);
        return y + lineHeight;
    }

    // Função auxiliar para formatar em Reais (R$)
    function formatCurrency(value) {
        if (!value) return "0,00";
        // Se for string, troca vírgula por ponto para o parseFloat ler os centavos corretamente
        var normalizedValue =
            typeof value === "string" ? value.replace(",", ".") : value;
        var numberValue = parseFloat(normalizedValue) || 0;

        return numberValue.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    function drawReceiptCanvas(context) {
		var canvas = document.createElement("canvas");
		var ctx = canvas.getContext("2d");

		// Dimensões do Canvas
		canvas.width = 800;
		canvas.height = 950;

		// Fundo
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Cartão
		var margin = 30;
		var cardWidth = canvas.width - margin * 2;
		var cardHeight = canvas.height - margin * 2;

		ctx.strokeStyle = "#d1e2e0";
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.roundRect(margin, margin, cardWidth, cardHeight, 16);
		ctx.stroke();

		var contentMargin = margin + 40;
		var contentWidth = cardWidth - 80;

		// ==========================================================
		// VALORES
		// ==========================================================

		var aluguel = Number(context.amount) || 0;

		// Aceita diferentes nomes caso seu sistema já utilize algum deles
		var multa = Number(context.fineAmount) || Number(context.lateFee) || 0;
		var juros =
			Number(context.interestAmount) ||
			Number(context.juros) ||
			Number(context.lateInterest) ||
			0;
		var encargos = Number(context.chargesAmount);
		if (!Number.isFinite(encargos)) encargos = multa + juros;

		var totalRecebido =
			Number(context.totalAmount) ||
			(aluguel + encargos);

		// ==========================================================
		// TÍTULO
		// ==========================================================

		ctx.fillStyle = "#0d5c58";
		ctx.font = "bold 28px sans-serif";
		ctx.textAlign = "left";
		ctx.fillText("Recibo de Aluguel", contentMargin, margin + 60);

		// ==========================================================
		// DADOS
		// ==========================================================

		var startY = margin + 120;
		var rowHeight = 48;

		var details = [
			{
				label: "Recebedor",
				value: state.settings.receiverName || "-"
			},
			{
				label: "Inquilino",
				value:
					context.tenantName ||
					(context.unit ? context.unit.tenantName : "-")
			},
			{
				label: "Unidade",
				value:
					context.unitName ||
					(context.unit ? context.unit.name : "-")
			},
			{
				label: "Valor do aluguel",
				value:
					aluguel > 0
						? "R$ " + formatCurrency(aluguel)
						: "-"
			}
		];

		// Se estiver atrasado, evidencia multa, juros e total recebido
		if (context.status === "pago-atrasado") {
			details.push({
				label: "Multa (10%)",
				value: "R$ " + formatCurrency(multa)
			});

			details.push({
				label: "Juros de mora (1% a.m.)",
				value: "R$ " + formatCurrency(juros)
			});

			details.push({
				label: "Total de encargos",
				value: "R$ " + formatCurrency(encargos)
			});

			details.push({
				label: "Total recebido",
				value: "R$ " + formatCurrency(totalRecebido)
			});
		}

		details.push(
			{
				label: "Referência",
				value: context.monthName + " de " + context.year
			},
			{
				label: "Data de emissão",
				value: context.issuedAt || "-"
			}
		);

		details.forEach(function (item) {
			ctx.fillStyle = "#556b69";
			ctx.font = "bold 18px sans-serif";
			ctx.textAlign = "left";
			ctx.fillText(item.label, contentMargin, startY);

			// Destaca juros e total recebido
			if (
				item.label === "Multa (10%)" ||
				item.label === "Juros de mora (1% a.m.)" ||
				item.label === "Total de encargos" ||
				item.label === "Total recebido"
			) {
				ctx.fillStyle =
					item.label === "Total recebido"
						? "#0d5c58"
						: "#8a5a00";

				ctx.font = "bold 19px sans-serif";
			} else {
				ctx.fillStyle = "#223331";
				ctx.font = "18px sans-serif";
			}

			ctx.textAlign = "right";
			ctx.fillText(
				item.value,
				contentMargin + contentWidth,
				startY
			);

			ctx.strokeStyle = "#e8f0ef";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(contentMargin, startY + 15);
			ctx.lineTo(contentMargin + contentWidth, startY + 15);
			ctx.stroke();

			startY += rowHeight;
		});

		ctx.textAlign = "left";

		// ==========================================================
		// TEXTO DO RECIBO
		// ==========================================================

		var unitName =
			context.unitName ||
			(context.unit ? context.unit.name : "");

		var descriptionText;

		if (context.descriptionText) {
			descriptionText = context.descriptionText;
		} else if (context.status === "pago-atrasado") {
			descriptionText =
				"Recebi de forma integral a importância de R$ " +
				formatCurrency(totalRecebido) +
				" referente ao aluguel da " +
				unitName +
				" no mês de " +
				context.monthName +
				" de " +
				context.year +
				", sendo R$ " +
				formatCurrency(aluguel) +
				" referentes ao aluguel e R$ " +
				formatCurrency(juros) +
				" referentes aos encargos pelo pagamento em atraso (multa e juros de mora).";
		} else {
			descriptionText =
				"Recebi de forma integral a importância de R$ " +
				formatCurrency(aluguel) +
				" referente ao aluguel da " +
				unitName +
				" no mês de " +
				context.monthName +
				" de " +
				context.year +
				".";
		}

		ctx.fillStyle = "#223331";
		ctx.font = "18px sans-serif";

		function wrapText(text, x, y, maxWidth, lineHeight) {
			var words = text.split(" ");
			var line = "";

			for (var n = 0; n < words.length; n++) {
				var testLine = line + words[n] + " ";
				var width = ctx.measureText(testLine).width;

				if (width > maxWidth && n > 0) {
					ctx.fillText(line, x, y);
					line = words[n] + " ";
					y += lineHeight;
				} else {
					line = testLine;
				}
			}

			ctx.fillText(line, x, y);
			return y;
		}

		var textEndY = wrapText(
			descriptionText,
			contentMargin,
			startY + 30,
			contentWidth,
			28
		);

		// ==========================================================
		// AVISO DE PAGAMENTO EM ATRASO
		// ==========================================================

		if (context.status === "pago-atrasado") {
			var boxY = textEndY + 25;
			var boxHeight = 56;
			var borderRadius = 8;

			// Fundo
			ctx.fillStyle = "#FFF3CD";
			ctx.beginPath();
			ctx.roundRect(
				contentMargin,
				boxY,
				contentWidth,
				boxHeight,
				borderRadius
			);
			ctx.fill();

			// Borda
			ctx.strokeStyle = "#FFE69C";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.roundRect(
				contentMargin,
				boxY,
				contentWidth,
				boxHeight,
				borderRadius
			);
			ctx.stroke();

			// Texto
			ctx.fillStyle = "#664D03";
			ctx.font = "bold 20px Arial";
			ctx.textAlign = "left";

			ctx.fillText(
				"Pagamento efetuado em atraso.",
				contentMargin + 20,
				boxY + 35
			);

			textEndY = boxY + boxHeight;
		}

		// ==========================================================
		// ASSINATURA
		// ==========================================================

		var sigY = textEndY + 60;
		var centerX = canvas.width / 2;

		ctx.fillStyle = "#0d5c58";
		ctx.font =
			'30px "Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive';
		ctx.textAlign = "center";

		ctx.fillText(
			context.receiverName ||
				state.settings.receiverName ||
				"Recebedor",
			centerX,
			sigY
		);

		ctx.strokeStyle = "#a9c7c3";
		ctx.lineWidth = 1.5;

		ctx.beginPath();
		ctx.moveTo(centerX - 120, sigY + 12);
		ctx.lineTo(centerX + 120, sigY + 12);
		ctx.stroke();

		ctx.fillStyle = "#637d7a";
		ctx.font = "15px sans-serif";
		ctx.fillText(
			"Assinatura do recebedor",
			centerX,
			sigY + 35
		);

		return canvas;
	}

    function slugify(value) {
        return (
            String(value)
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "") || "unidade"
        );
    }

    function downloadReceipt() {
        if (!receiptContext) return;
        var canvas = drawReceiptCanvas(receiptContext);
        var link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download =
            "recibo-" +
            slugify(receiptContext.unit.name) +
            "-" +
            receiptContext.year +
            "-" +
            String(receiptContext.month + 1).padStart(2, "0") +
            ".png";
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    function dataUrlToFile(dataUrl, filename) {
        var parts = dataUrl.split(",");
        var mime = (parts[0].match(/:(.*?);/) || [])[1] || "image/png";
        var binary = atob(parts[1]);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new File([bytes], filename, { type: mime });
    }

    function shareReceipt() {
		if (!receiptContext) return;

		var text = "Segue comprovante de pagamento";

		var filename =
			"recibo-" +
			slugify(receiptContext.unit.name) +
			"-" +
			receiptContext.year +
			"-" +
			String(receiptContext.month + 1).padStart(2, "0") +
			".png";

		var canvas = drawReceiptCanvas(receiptContext);
		var file = dataUrlToFile(canvas.toDataURL("image/png"), filename);

		// Compartilhamento nativo (Android, iOS e navegadores compatíveis)
		if (
			navigator.share &&
			(!navigator.canShare || navigator.canShare({ files: [file] }))
		) {
			navigator
				.share({
					files: [file],
					text: text,
					title: "Recibo de Pagamento"
				})
				.catch(function () {});
			return;
		}

		// Fallback: baixa o arquivo e abre o WhatsApp
		downloadReceipt();

		var base = whatsappUrl(receiptContext.unit.tenantPhone);

		window.open(
			(base || "https://wa.me/") +
				"?text=" +
				encodeURIComponent(text),
			"_blank"
		);
	}

    function buildAnnualReportHtml() {
        var units = scopedUnits();

        var expenses = scopedExpenses();

        var yearText = String(selectedYear);

        var scope =
            selectedEmpreendimentoId === "todos"
                ? "Todos os empreendimentos"
                : empreendimentoName(selectedEmpreendimentoId);

        var annualReceived = 0;

        var annualOverdue = 0;

        units.forEach(function (unit) {
            months.forEach(function (_, i) {
                annualReceived += historicalReceivedAmount(
                    unit,
                    selectedYear,
                    i
                );

                // Atrasos em aberto continuam dependendo de contrato ativo.
                if (
                    isActive(unit, i) &&
                    effectiveStatus(unit, i) === "atrasado"
                ) {
                    var updated = updatedAmount(unit, i);

                    annualOverdue +=
                        updated === null
                            ? rentForMonth(unit, selectedYear, i)
                            : updated;
                }
            });
        });

        var annualExpenses = expenses.reduce(function (sum, expense) {
            return (
                sum + (expense.ym.slice(0, 4) === yearText ? expense.amount : 0)
            );
        }, 0);

        var annualNet = annualReceived - annualExpenses;

        var monthly = months.map(function (_, i) {
            var received = units.reduce(function (sum, unit) {
                return (
                    sum +
                    historicalReceivedAmount(
                        unit,
                        selectedYear,
                        i
                    )
                );
            }, 0);

            var spent = expenses.reduce(function (sum, expense) {
                return sum + (expense.ym === monthKey(i) ? expense.amount : 0);
            }, 0);

            return {
                received: received,
                expenses: spent,
                net: received - spent,
            };
        });

        var unitRows = units
            .slice()
            .sort(function (a, b) {
                return a.name.localeCompare(b.name, "pt-BR");
            })
            .map(function (unit) {
                var paid = 0;

                var paidLate = 0;

                var overdueMonths = 0;

                var overdue = 0;

                var received = 0;

                months.forEach(function (_, i) {
                    var receivedForMonth =
                        historicalReceivedAmount(
                            unit,
                            selectedYear,
                            i
                        );

                    if (receivedForMonth > 0) {
                        received += receivedForMonth;
                        paid += 1;
                    }

                    var paymentRecord = getPaymentRecord(
                        unit,
                        selectedYear,
                        i
                    );

                    if (
                        paymentRecord &&
                        Number(paymentRecord.interestAmount) > 0
                    ) {
                        paidLate += 1;
                    } else if (isPaidLate(unit, i)) {
                        paidLate += 1;
                    }

                    if (!isActive(unit, i)) return;

                    if (effectiveStatus(unit, i) === "atrasado") {
                        overdueMonths += 1;

                        var updated = updatedAmount(unit, i);

                        overdue +=
                            updated === null
                                ? rentForMonth(unit, selectedYear, i)
                                : updated;
                    }
                });

                var title = escapeHtml(unit.name);

                if (selectedEmpreendimentoId === "todos")
                    title +=
                        " <small>(" +
                        escapeHtml(empreendimentoName(unit.empreendimentoId)) +
                        ")</small>";

                if (unit.tenantName)
                    title +=
                        "<br><small>Inquilino: " +
                        escapeHtml(unit.tenantName) +
                        "</small>";

                return (
                    "<tr><td>" +
                    title +
                    '</td><td class="num">' +
                    paid +
                    '</td><td class="num">' +
                    paidLate +
                    '</td><td class="num">' +
                    (overdueMonths
                        ? money(overdue) +
                          " (" +
                          overdueMonths +
                          " " +
                          (overdueMonths === 1 ? "mês" : "meses") +
                          ")"
                        : "—") +
                    '</td><td class="num">' +
                    money(received) +
                    "</td></tr>"
                );
            })
            .join("");

        var totalCard = function (label, value, negative) {
            return (
                '<div class="ar-total"><span>' +
                label +
                '</span><strong class="' +
                (negative ? "ar-neg" : "") +
                '">' +
                money(value) +
                "</strong></div>"
            );
        };

        return (
            '<div class="annual-report">' +
            "<h1>Resumo do ano " +
            selectedYear +
            "</h1>" +
            '<p class="ar-meta">' +
            escapeHtml(scope) +
            " · Emitido em " +
            escapeHtml(formatDate(new Date())) +
            (state.settings.receiverName
                ? " · Recebedor: " + escapeHtml(state.settings.receiverName)
                : "") +
            "</p>" +
            '<div class="ar-totals">' +
            totalCard("Recebido", annualReceived, false) +
            totalCard("Gastos", annualExpenses, false) +
            totalCard("Líquido", annualNet, annualNet < 0) +
            totalCard("Em atraso", annualOverdue, annualOverdue > 0) +
            "</div>" +
            "<h3>Resumo mensal</h3>" +
            '<table class="ar-table"><thead><tr><th>Mês</th><th class="num">Recebido</th><th class="num">Gastos</th><th class="num">Líquido</th></tr></thead><tbody>' +
            monthly
                .map(function (row, i) {
                    return (
                        "<tr><td>" +
                        fullMonths[i] +
                        '</td><td class="num">' +
                        money(row.received) +
                        '</td><td class="num">' +
                        money(row.expenses) +
                        '</td><td class="num ' +
                        (row.net < 0 ? "ar-neg" : "") +
                        '">' +
                        money(row.net) +
                        "</td></tr>"
                    );
                })
                .join("") +
            '</tbody><tfoot><tr class="ar-total-row"><td>Total</td><td class="num">' +
            money(annualReceived) +
            '</td><td class="num">' +
            money(annualExpenses) +
            '</td><td class="num ' +
            (annualNet < 0 ? "ar-neg" : "") +
            '">' +
            money(annualNet) +
            "</td></tr></tfoot></table>" +
            "<h3>Resumo por unidade</h3>" +
            '<table class="ar-table"><thead><tr><th>Unidade</th><th class="num">Pagos</th><th class="num">Pagos c/ atraso</th><th class="num">Em atraso</th><th class="num">Recebido</th></tr></thead><tbody>' +
            (unitRows ||
                '<tr><td colspan="5">Nenhuma unidade cadastrada</td></tr>') +
            "</tbody></table>" +
            "</div>"
        );
    }

    function printAfter(target) {
        var cleanup = function () {
            target.innerHTML = "";
            window.removeEventListener("afterprint", cleanup);
        };

        window.addEventListener("afterprint", cleanup);

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                window.print();
            });
        });
    }

    function printAnnualReport() {
        var reportHtml = buildAnnualReportHtml();

        // Cria uma janela temporária exclusiva para a impressão/salvar em PDF
        var printWindow = window.open("", "_blank");

        if (printWindow) {
            printWindow.document.write(`
					<!DOCTYPE html>
					<html>
					<head>
						<title>Resumo do Ano - ${selectedYear}</title>
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<style>
							/* Estilos focados em centralização e layout limpo */
							* { box-sizing: border-box; }
							body { 
								font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
								margin: 0; 
								padding: 20px; 
								color: #173333; 
								background-color: #fff;
								display: flex;
								justify-content: center;
							}
							.annual-report { 
								width: 100%; 
								max-width: 800px; /* Mantém o relatório centralizado e com largura legível */
								margin: 0 auto;
							}
							.ar-totals { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
							.ar-total { flex: 1; min-width: 140px; background: #f8f9fa; padding: 12px; border-radius: 8px; border: 1px solid #eee; }
							.ar-total span { display: block; font-size: 12px; color: #666; }
							.ar-total strong { font-size: 16px; }
							.ar-neg { color: #a52d3b; }
							.ar-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
							.ar-table th, .ar-table td { border: 1px solid #e0e0e0; padding: 10px 8px; text-align: left; font-size: 13px; }
							.ar-table th.num, .ar-table td.num { text-align: right; }
							.ar-total-row { font-weight: bold; background: #f0f0f0; }

							@media print {
								body { padding: 0; display: block; }
								.annual-report { max-width: 100%; margin: 0; }
							}
						</style>
					</head>
					<body>
						<div class="annual-report">
							${reportHtml}
						</div>
						<script>
							window.onload = function() {
								setTimeout(function() {
									window.print();
								}, 300);
							};
						</script>
					</body>
					</html>
				`);
            printWindow.document.close();
        } else {
            alert(
                "Por favor, permita pop-ups no navegador para gerar o relatório."
            );
        }
    }
    window.onafterprint = function () {
        printReport.innerHTML = "";
    };

    function printReceiptDocument() {
        if (!receiptContext) return;

        // 1. Gera o HTML do recibo com os dados do contexto
        var htmlContent = receiptMarkup(receiptContext);

        // 2. Abre uma nova janela limpa
        var printWindow = window.open("", "_blank");

        if (!printWindow) {
            alert("Por favor, permita pop-ups para gerar o PDF do recibo.");
            return;
        }

        // 3. Escreve o documento completo com o CSS corrigido
        printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recibo de Aluguel</title>
            <style>
                * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    box-sizing: border-box;
                }

                body {
                    font-family: system-ui, -apple-system, sans-serif;
                    padding: 40px 20px;
                    margin: 0;
                    background-color: #ffffff;
                    color: #223331;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .receipt-paper {
                    width: 100%;
                    max-width: 600px;
                    background: #ffffff;
                    border: 1px solid #d1e2e0;
                    border-radius: 12px;
                    padding: 32px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                }

                .receipt-paper h3 {
                    margin-top: 0;
                    margin-bottom: 24px;
                    color: #0d5c58;
                    font-size: 24px;
                }

                .receipt-line {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #e8f0ef;
                    font-size: 15px;
                }

                .receipt-line strong {
                    color: #556b69;
                }

                .receipt-text {
                    margin-top: 24px;
                    line-height: 1.6;
                    font-size: 15px;
                }

                .receipt-note {
                    margin-top: 16px;
                    padding: 12px;
                    background-color: #ffedc2;
                    border: 1px solid #f2d48a;
                    border-radius: 6px;
                    color: #a45b48;
                    font-weight: bold;
                    font-size: 14px;
                }

                .receipt-signature {
                    margin-top: 48px;
                    text-align: center;
                }

                .signature-line {
                    border-bottom: 1px solid #a9c7c3;
                    width: 240px;
                    margin: 0 auto 8px auto;
                    padding-bottom: 4px;
                }

                .signature-name {
					width: 100%;
					/* ocupa a mesma largura da linha */
					text-align: center;
					font-family: "Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive;
					font-size: 30px;
					margin-bottom: 8px;
                }

                .signature-label {
                    font-size: 13px;
                    color: #637d7a;
                }

                @media print {
                    body {
                        padding: 0;
                        background: none;
                    }
                    .receipt-paper {
                        border: 1px solid #ccc;
                        box-shadow: none;
                        max-width: 100%;
                    }
                }
            </style>
        </head>
        <body>
            ${htmlContent}
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 300);
                };
            </script>
        </body>
        </html>
    `);

        printWindow.document.close();
    }

    document.getElementById("prevYear").addEventListener("click", function () {
        selectedYear -= 1;
        render();
    });

    document.getElementById("nextYear").addEventListener("click", function () {
        selectedYear += 1;
        render();
    });

    unitSearch.addEventListener("input", render);

    statusFilter.addEventListener("change", render);

    empreendimentoFilter.addEventListener("change", function () {
        selectedEmpreendimentoId = empreendimentoFilter.value;

        saveSelectedEmpreendimento();

        unitSearch.value = "";

        statusFilter.value = "todos";

        render();
    });

    document.getElementById("addUnit").addEventListener("click", function () {
        openModal();
    });
    document.getElementById("mobileAddUnit").addEventListener("click", function () {
        openModal();
    });
    contractAttachment.addEventListener("change", uploadContractAttachment);

    document
        .getElementById("addExpense")
        .addEventListener("click", function () {
            openExpenseModal();
        });

    toggleExpensesButton.addEventListener("click", toggleExpensesVisibility);

    document
        .getElementById("cancelModal")
        .addEventListener("click", closeModal);

    document.getElementById("saveUnit").addEventListener("click", saveUnit);
    
	archiveContract.addEventListener("click", archiveCurrentContract);
addContractHistory.addEventListener("click", addContractHistoryEntry); 
	 
    addRentChangeButton.addEventListener("click", addRentChange);

    document.getElementById("deleteUnit").addEventListener("click", deleteUnit);

    document
        .getElementById("cancelExpense")
        .addEventListener("click", closeExpenseModal);

    document
        .getElementById("saveExpense")
        .addEventListener("click", saveExpense);

    deleteExpenseButton.addEventListener("click", deleteExpense);

    addCategoryButton.addEventListener("click", addCategory);

    addEnterpriseButton.addEventListener("click", addEnterprise);

    document
        .getElementById("settingsButton")
        .addEventListener("click", openSettings);

    document
        .getElementById("cancelSettings")
        .addEventListener("click", closeSettings);

    document
        .getElementById("saveSettings")
        .addEventListener("click", saveSettings);

    authForm.addEventListener("submit", submitAuth);
    authSkip.addEventListener("click", function () {
        if (authMode !== "create") return;
        localStorage.setItem(SETUP_FLAG_KEY, "1");
        appUnlocked = true;
        closeAuth();
        render();
    });
    savePinButton.addEventListener("click", savePin);

    removePinButton.addEventListener("click", removePin);

    document
        .getElementById("cancelReceipt")
        .addEventListener("click", closeReceipt);

    document
        .getElementById("downloadReceipt")
        .addEventListener("click", downloadReceipt);

    document
        .getElementById("shareReceipt")
        .addEventListener("click", shareReceipt);

    document
        .getElementById("printReceiptButton")
        .addEventListener("click", printReceiptDocument);

    document
        .getElementById("printAnnual")
        .addEventListener("click", printAnnualReport);

    document
        .getElementById("toggleSummaryCards")
        .addEventListener("click", function () {
            summaryCardsExpanded = !summaryCardsExpanded;
            applySummaryCardsVisibility();
        });

    document
        .getElementById("exportBackup")
        .addEventListener("click", exportBackup);

    document
        .getElementById("importBackup")
        .addEventListener("click", function () {
            backupFile.click();
        });

    backupFile.addEventListener("change", importBackup);

    document
        .getElementById("cloudSignIn")
        .addEventListener("click", function () {
            runCloudAuth("signin");
        });

    document
        .getElementById("cloudSignUp")
        .addEventListener("click", function () {
            runCloudAuth("signup");
        });
    cloudGoogleSignIn.addEventListener("click", signInWithGoogle);
    cloudResetPassword.addEventListener("click", resetCloudPassword);
    cloudResendVerification.addEventListener("click", resendCloudVerification);

    document
        .getElementById("cloudSignOut")
        .addEventListener("click", function () {
            if (!firebaseAuth) return;

            if (firebaseUnsubscribe) {
                firebaseUnsubscribe();

                firebaseUnsubscribe = null;
            }

            firebaseAuth.signOut().catch(function (error) {
                setCloudError(cloudErrorMessage(error));
            });
        });

    useCloudData.addEventListener("click", chooseCloudData);

    useLocalData.addEventListener("click", chooseLocalData);

    bannerUseCloud.addEventListener("click", chooseCloudData);
    bannerUseLocal.addEventListener("click", chooseLocalData);

    window.addEventListener("online", function () {
        if (!firebaseUser) return;
        updateConnectionStatus();
        if (cloudHasPendingWrite) scheduleCloudWrite();
    });

    window.addEventListener("offline", function () {
        if (firebaseUser)
            setSyncStatus("Offline — alterações salvas localmente");
    });

    ["click", "keydown", "touchstart"].forEach(function (eventName) {
        document.addEventListener(eventName, registerAppActivity, { passive: eventName === "touchstart" });
    });
    document.addEventListener("visibilitychange", function () {
        if (document.hidden) lockApp();
        else registerAppActivity();
    });

    modal.addEventListener("click", function (event) {
        if (event.target === modal) closeModal();
    });

    expenseModal.addEventListener("click", function (event) {
        if (event.target === expenseModal) closeExpenseModal();
    });

    settingsModal.addEventListener("click", function (event) {
        if (event.target === settingsModal) closeSettings();
    });

    receiptModal.addEventListener("click", function (event) {
        if (event.target === receiptModal) closeReceipt();
    });

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;

        if (!modal.hidden) closeModal();

        if (!expenseModal.hidden) closeExpenseModal();

        if (!settingsModal.hidden) closeSettings();

        if (!receiptModal.hidden) closeReceipt();
    });

    window.addEventListener("pageshow", function (event) {
        collapseExpenseMonths();
        if (event.persisted && lockConfig) {
            appUnlocked = false;
            openAuthLogin();
        }

        requestAnimationFrame(function () {
            requestAnimationFrame(scrollPageToTop);
        });
    });

    updateCloudUi();

    initFirebase();

    initAuth();

    if ("serviceWorker" in navigator) {
        var reloadingForUpdate = false;

        navigator.serviceWorker.addEventListener(
            "controllerchange",
            function () {
                if (reloadingForUpdate) return;

                reloadingForUpdate = true;

                window.location.reload();
            }
        );

        window.addEventListener("load", function () {
            navigator.serviceWorker
                .register("sw.js", { updateViaCache: "none" })
                .then(function (registration) {
                    registration.update();

                    setInterval(function () {
                        registration.update();
                    }, 60 * 60 * 1000);
                })
                .catch(function () {});
        });
    }

    /*
     * Contratos e parcelas — implementação única.
     * Mantém compatibilidade com os registros antigos (startYm/endYm)
     * e evita que contratos ativos, encerrados e históricos se misturem.
     */
    function historyDate(value, isEnd) {
        if (isValidDateValue(value)) return value;
        return isValidStartYm(value) ? contractDateValue(null, value, isEnd) : null;
    }

    function resolveHistoryDate(contract, prefix, isEnd) {
        return historyDate(contract[prefix + "Date"], isEnd) ||
            historyDate(contract[prefix + "Ym"], isEnd);
    }

    function normalizeContractHistory(list) {
        if (!Array.isArray(list)) return [];
        return list.map(function (item) {
            if (!item || typeof item !== "object" || Array.isArray(item)) return null;
            var startDate = resolveHistoryDate(item, "start", false);
            var endDate = resolveHistoryDate(item, "end", true);
            var rent = Number(item.rent);
            if (!item.tenantName && !startDate && !endDate && !Number.isFinite(rent)) return null;
            return {
                id: typeof item.id === "string" && item.id ? item.id : newContractHistoryId(),
                tenantName: typeof item.tenantName === "string" ? item.tenantName.trim() : "",
                tenantPhone: typeof item.tenantPhone === "string" ? item.tenantPhone.trim() : "",
                tenantEmail: typeof item.tenantEmail === "string" ? item.tenantEmail.trim() : "",
                tenantNotes: typeof item.tenantNotes === "string" ? item.tenantNotes.trim() : "",
                startDate: startDate,
                endDate: endDate,
                startYm: contractMonthValue(startDate),
                endYm: contractMonthValue(endDate),
                rent: Number.isFinite(rent) && rent >= 0 ? rent : null,
                dueDay: Number.isInteger(item.dueDay) ? item.dueDay : null,
                status: normalizeContractHistoryStatus(item.status),
                reason: typeof item.reason === "string" ? item.reason.trim() : ""
            };
        }).filter(Boolean);
    }

    function serializeContractHistory(list) {
        return normalizeContractHistory(list);
    }

    function formatTimelineDate(value) {
        if (!isValidDateValue(value)) return "período não informado";
        var parts = value.split("-");
        return parts[2] + "/" + parts[1] + "/" + parts[0];
    }

    function getPaymentRecord(unit, year, month) {
        if (!unit || !unit.paymentHistory || typeof unit.paymentHistory !== "object") return null;
        var key = String(year) + "-" + String(month + 1).padStart(2, "0");
        return unit.paymentHistory[key] || null;
    }

    /*
     * Um pagamento confirmado não pode depender do contrato que está
     * ativo hoje. A parcela pertence ao mês/contrato em que foi baixada.
     * Esta regra é compartilhada pelos totais da grade, painel e relatório.
     */
    function paymentIsConfirmedForTotals(unit, key, payment) {
        if (!payment || !unit) return false;
        var ledger = unit.lateLedger && typeof unit.lateLedger === "object" ? unit.lateLedger : {};
        var statuses = unit.status && typeof unit.status === "object" ? unit.status : {};
        var paidLate = unit.paidLate && typeof unit.paidLate === "object" ? unit.paidLate : {};

        if (
            payment.historicContractId ||
            ledger[key] === "paid" ||
            statuses[key] === "pago" ||
            paidLate[key] === true
        ) {
            return true;
        }

        // Compatibilidade com pagamentos de contratos encerrados nas
        // versões anteriores, que não gravavam o identificador do contrato.
        var history = Array.isArray(unit.contractHistory) ? unit.contractHistory : [];
        return history.some(function (contract) {
            if (!contract) return false;
            var start = contract.startYm || contractMonthValue(contract.startDate);
            var end = contract.endYm || contractMonthValue(contract.endDate);
            return isValidStartYm(start) && isValidStartYm(end) && key >= start && key <= end;
        });
    }

    function historicalReceivedAmount(unit, year, month) {
        var key = String(year) + "-" + String(month + 1).padStart(2, "0");
        var payment = getPaymentRecord(unit, year, month);

        if (paymentIsConfirmedForTotals(unit, key, payment)) {
            return Math.max(0, Number(payment.rentAmount) || 0);
        }

        // Compatibilidade para pagamentos antigos sem histórico financeiro.
        if (year !== selectedYear || statusFor(unit, month) !== "pago") return 0;
        if (isActive(unit, month)) return Math.max(0, Number(rentForMonth(unit, year, month)) || 0);
        var archived = archivedContractForMonth(unit, month);
        return archived && Number.isFinite(Number(archived.rent)) ? Math.max(0, Number(archived.rent)) : 0;
    }

    // Valor base de uma parcela histórica ainda em aberto.
    function historicLateRent(unit, key) {
        if (!unit || !isValidStartYm(key)) return 0;
        var history = Array.isArray(unit.contractHistory) ? unit.contractHistory : [];
        var contract = history.slice().reverse().find(function (item) {
            if (!item) return false;
            var start = item.startYm || contractMonthValue(item.startDate);
            var end = item.endYm || contractMonthValue(item.endDate);
            return isValidStartYm(start) && isValidStartYm(end) && key >= start && key <= end;
        });

        if (contract && Number.isFinite(Number(contract.rent))) {
            return Math.max(0, Number(contract.rent));
        }

        var parts = key.split("-").map(Number);
        return Number.isFinite(parts[0]) && Number.isFinite(parts[1])
            ? Math.max(0, Number(rentForMonth(unit, parts[0], parts[1] - 1)) || 0)
            : 0;
    }

    function recordedInterestAmount(payment) {
        if (!payment || typeof payment !== "object") return 0;

        var fine = Number(payment.fineAmount);
        if (!Number.isFinite(fine) || fine < 0) fine = 0;

        /*
         * Versões atuais registram chargesAmount = multa + juros. Esse é o
         * campo mais seguro: impede que um valor legado incorreto em
         * interestAmount (por exemplo, o valor do aluguel) infle o total.
         */
        var charges = Number(payment.chargesAmount);
        if (Number.isFinite(charges) && charges >= 0) {
            return Math.max(0, charges - fine);
        }

        /*
         * Para registros sem chargesAmount, o total efetivamente pago é a
         * segunda fonte de verdade. Se não houve valor acima do aluguel e
         * da multa, não houve juros a somar.
         */
        var total = Number(payment.totalAmount);
        var rent = Number(payment.rentAmount);
        if (Number.isFinite(total) && Number.isFinite(rent)) {
            return Math.max(0, total - rent - fine);
        }

        // Compatibilidade com o formato mais antigo, que só tinha juros.
        return Math.max(0, Number(payment.interestAmount) || 0);
    }

    function paymentWasLate(unit, key) {
        var ledger = unit && unit.lateLedger && typeof unit.lateLedger === "object"
            ? unit.lateLedger
            : {};
        var paidLate = unit && unit.paidLate && typeof unit.paidLate === "object"
            ? unit.paidLate
            : {};

        return ledger[key] === "paid" || paidLate[key] === true;
    }

    function historicalInterestAmount(unit, year, month) {
        var key = String(year) + "-" + String(month + 1).padStart(2, "0");
        var payment = getPaymentRecord(unit, year, month);

        /*
         * Juros existem somente em uma parcela confirmada como paga com
         * atraso. Um campo de juros eventualmente salvo em uma parcela
         * normal (formato legado) não pode contaminar o total.
         */
        if (
            !paymentIsConfirmedForTotals(unit, key, payment) ||
            !paymentWasLate(unit, key)
        ) {
            return 0;
        }

        return recordedInterestAmount(payment);
    }

    function ensureFinancialHistory(unit) {
        unit.status = unit.status && typeof unit.status === "object" ? unit.status : {};
        unit.paidLate = unit.paidLate && typeof unit.paidLate === "object" ? unit.paidLate : {};
        unit.lateLedger = unit.lateLedger && typeof unit.lateLedger === "object" ? unit.lateLedger : {};
        unit.paymentHistory = unit.paymentHistory && typeof unit.paymentHistory === "object" ? unit.paymentHistory : {};
    }

    function archiveCurrentContract() {
        var unit = editingId ? state.units.find(function (item) { return item.id === editingId; }) : null;
        if (!unit || !tenantName.value.trim()) { tenantName.focus(); return false; }
        ensureFinancialHistory(unit);
        var startDate = unitStartYm.value || unit.startDate || null;
        var endDate = unitEndYm.value || localDateValue(new Date());

        months.forEach(function (_, month) {
            var key = monthKey(month);
            var currentStatus = effectiveStatus(unit, month);
            if (currentStatus === "atrasado" || unit.status[key] === "atrasado") {
                unit.status[key] = "atrasado";
                unit.lateLedger[key] = "open";
            }
            if (unit.status[key] === "pago" && !unit.paymentHistory[key]) {
                var amount = rentForMonth(unit, selectedYear, month);
                unit.paymentHistory[key] = {
                    rentAmount: amount, totalAmount: amount, paidAt: null,
                    fineAmount: 0, interestAmount: 0, chargesAmount: 0
                };
            }
        });

        pendingContractHistory.push({
            id: newContractHistoryId(),
            tenantName: tenantName.value.trim(),
            tenantPhone: tenantPhone.value.trim(),
            tenantEmail: tenantEmail.value.trim(),
            tenantNotes: tenantNotes.value.trim(),
            startDate: startDate,
            endDate: endDate,
            startYm: contractMonthValue(startDate),
            endYm: contractMonthValue(endDate),
            rent: Number.isFinite(Number(unitRent.value)) ? Number(unitRent.value) : null,
            dueDay: unitDueDay.value === "" ? null : Number(unitDueDay.value),
            status: "encerrado",
            reason: ""
        });
        unit.contractHistory = serializeContractHistory(pendingContractHistory);
        unit.tenantName = "";
        unit.tenantPhone = "";
        unit.tenantEmail = "";
        unit.tenantNotes = "";
        unit.rent = 0;
        unit.dueDay = null;
        unit.startDate = null;
        unit.endDate = null;
        unit.startYm = null;
        unit.endYm = null;
        unit.rentChanges = [];
        pendingRentChanges = [];
        saveState();

        tenantName.value = "";
        tenantPhone.value = "";
        tenantEmail.value = "";
        tenantNotes.value = "";
        unitRent.value = "";
        unitDueDay.value = "";
        unitStartYm.value = "";
        unitEndYm.value = "";
        renderRentChanges();
        renderContractHistory();
        render();
        return true;
    }

    function reactivateHistoricalContract(index) {
        var unit = editingId ? state.units.find(function (item) { return item.id === editingId; }) : null;
        var contract = pendingContractHistory[index];
        if (!unit || !contract) return;
        if (String(unit.tenantName || "").trim()) {
            alert("Esta unidade já possui um contrato ativo. Encerre-o antes de reativar um contrato antigo.");
            return;
        }
        var startDate = resolveHistoryDate(contract, "start", false);
        if (!startDate) {
            alert("Este contrato não possui uma data de início válida.");
            return;
        }
        unit.tenantName = contract.tenantName || "";
        unit.tenantPhone = contract.tenantPhone || "";
        unit.tenantEmail = "";
        unit.tenantNotes = contract.tenantNotes || "";
        unit.rent = Number.isFinite(Number(contract.rent)) ? Number(contract.rent) : 0;
        unit.dueDay = Number.isInteger(contract.dueDay) ? contract.dueDay : null;
        unit.startDate = startDate;
        unit.endDate = null;
        unit.startYm = contractMonthValue(startDate);
        unit.endYm = null;
        unit.rentChanges = [];
        ensureFinancialHistory(unit);
        pendingContractHistory.splice(index, 1);
        unit.contractHistory = serializeContractHistory(pendingContractHistory);
        saveState();
        openModal(unit.id);
        render();
    }

    function contractInstallmentKeys(contract) {
        var start = contract.startYm || contractMonthValue(contract.startDate);
        var end = contract.endYm || contractMonthValue(contract.endDate);
        if (!isValidStartYm(start) || !isValidStartYm(end) || end < start) return [];
        var result = [], cursor = start;
        while (cursor <= end) {
            result.push(cursor);
            var parts = cursor.split("-").map(Number);
            var next = new Date(parts[0], parts[1], 1);
            cursor = next.getFullYear() + "-" + String(next.getMonth() + 1).padStart(2, "0");
        }
        return result;
    }

    function historicLateKeysForContract(unit, contract) {
        var ledger = unit && unit.lateLedger && typeof unit.lateLedger === "object" ? unit.lateLedger : {};
        return Object.keys(ledger).filter(function (key) {
            return (ledger[key] === true || ledger[key] === "open") &&
                (!contract.startYm || key >= contract.startYm) &&
                (!contract.endYm || key <= contract.endYm);
        });
    }

    function historicalInstallmentState(unit, key) {
        var ledger = unit.lateLedger && typeof unit.lateLedger === "object" ? unit.lateLedger : {};
        if (ledger[key] === true || ledger[key] === "open") return "atrasado";
        if (ledger[key] === "paid") return "pago-atrasado";
        return getPaymentRecord(unit, Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1) ? "pago" : "pendente";
    }

    var contractInstallmentsModal = document.getElementById("contractInstallmentsModal");
    var contractInstallmentsTitle = document.getElementById("contractInstallmentsTitle");
    var contractInstallmentsSummary = document.getElementById("contractInstallmentsSummary");
    var contractInstallmentsList = document.getElementById("contractInstallmentsList");
    var historicPaymentAdjustContext = null;

    function openContractInstallments(index) {
        var unit = editingId ? state.units.find(function (item) { return item.id === editingId; }) : null;
        var contract = pendingContractHistory[index];
        if (!unit || !contract) return;
        var keys = contractInstallmentKeys(contract);
        var openLate = keys.filter(function (key) { return historicalInstallmentState(unit, key) === "atrasado"; }).length;
        var paidLate = keys.filter(function (key) { return historicalInstallmentState(unit, key) === "pago-atrasado"; }).length;
        contractInstallmentsTitle.textContent = "Parcelas · " + (contract.tenantName || "Contrato encerrado");
        contractInstallmentsSummary.textContent = (openLate ? openLate + " em atraso" : "Nenhuma em atraso") +
            (paidLate ? " · " + paidLate + " paga(s) com atraso" : "") +
            " · " + money(Number(contract.rent) || 0) + " por parcela";
        contractInstallmentsList.innerHTML = keys.length ? keys.map(function (key) {
            var stateName = historicalInstallmentState(unit, key);
            var label = stateName === "atrasado" ? "Em atraso" : stateName === "pago-atrasado" ? "Pago (atraso)" : stateName === "pago" ? "Pago" : "Pendente";
            var klass = stateName === "atrasado" ? " is-late" : (stateName.indexOf("pago") === 0 ? " is-paid" : "");
            var action = stateName === "atrasado"
                ? '<button class="btn btn-primary" type="button" data-installment-settle="' + key + '">Dar baixa</button>'
                : (stateName.indexOf("pago") === 0 ? '<button class="btn btn-ghost" type="button" data-installment-receipt="' + key + '">Recibo</button>' : "");
            return '<div class="contract-installment-row' + klass + '"><div><strong>' + escapeHtml(ymLabel(key)) +
                '</strong><span>Vencimento: ' + String(contract.dueDay || "—") + ' · ' +
                escapeHtml(label) + ' · ' + money(Number(contract.rent) || 0) +
                '</span></div><div class="contract-installment-actions">' + action + '</div></div>';
        }).join("") : '<p class="rent-changes-empty">Não foi possível identificar o período deste contrato.</p>';
        contractInstallmentsList.querySelectorAll("[data-installment-settle]").forEach(function (button) {
            button.addEventListener("click", function () { openHistoricPaymentAdjust(index, button.dataset.installmentSettle); });
        });
        contractInstallmentsList.querySelectorAll("[data-installment-receipt]").forEach(function (button) {
            button.addEventListener("click", function () { openHistoricInstallmentReceipt(index, button.dataset.installmentReceipt); });
        });
        ModalManager.open(contractInstallmentsModal);
    }

    function openHistoricPaymentAdjust(index, key) {
        var unit = editingId ? state.units.find(function (item) { return item.id === editingId; }) : null;
        var contract = pendingContractHistory[index];
        if (!unit || !contract) return;
        historicPaymentAdjustContext = { unitId: unit.id, contractIndex: index, contractId: contract.id, key: key };
        paymentAdjustContext = null;
        document.getElementById("paymentAdjustTitle").textContent = "Dar baixa em parcela";
        document.getElementById("paymentAdjustInfo").textContent = unit.name + " · " +
            (contract.tenantName || "Contrato encerrado") + " · " + ymLabel(key);
        document.getElementById("paymentAdjustDate").value = localDateValue(new Date());
        document.getElementById("paymentAdjustRent").value = Number(contract.rent) || 0;
        document.getElementById("paymentAdjustFine").value = 0;
        document.getElementById("paymentAdjustInterest").value = 0;
        document.getElementById("paymentAdjustNotes").value = "";
        updatePaymentAdjustTotal();
        ModalManager.open(document.getElementById("paymentAdjustModal"));
    }

    function updatePaymentAdjustTotal() {
        var rent = Number(document.getElementById("paymentAdjustRent").value) || 0;
        var fine = Number(document.getElementById("paymentAdjustFine").value) || 0;
        var interest = Number(document.getElementById("paymentAdjustInterest").value) || 0;
        document.getElementById("paymentAdjustTotal").value = (rent + fine + interest).toFixed(2);
    }

    function savePaymentAdjust() {
        var dateValue = document.getElementById("paymentAdjustDate").value;
        var rent = Number(document.getElementById("paymentAdjustRent").value);
        var fine = Number(document.getElementById("paymentAdjustFine").value) || 0;
        var interest = Number(document.getElementById("paymentAdjustInterest").value) || 0;
        var notes = document.getElementById("paymentAdjustNotes").value.trim();
        if (!dateValue || !Number.isFinite(rent) || rent < 0 || fine < 0 || interest < 0) {
            alert("Informe a data e valores válidos, sem números negativos.");
            return;
        }
        var dateParts = dateValue.split("-");
        var paidAt = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]), 12).toISOString();

        if (historicPaymentAdjustContext) {
            var historicUnit = state.units.find(function (item) { return item.id === historicPaymentAdjustContext.unitId; });
            if (!historicUnit) return;
            createVersionedBackup("Baixa de parcela histórica", historicPaymentAdjustContext.key);
            recordOperation("Baixa de parcela histórica", historicPaymentAdjustContext.key);
            ensureFinancialHistory(historicUnit);
            historicUnit.lateLedger[historicPaymentAdjustContext.key] = "paid";
            historicUnit.paymentHistory[historicPaymentAdjustContext.key] = {
                rentAmount: rent, fineAmount: fine, interestAmount: interest,
                chargesAmount: fine + interest, totalAmount: rent + fine + interest,
                paidAt: paidAt, notes: notes, historicContractId: historicPaymentAdjustContext.contractId
            };
            var historyIndex = historicPaymentAdjustContext.contractIndex;
            historicPaymentAdjustContext = null;
            saveState();
            ModalManager.close(document.getElementById("paymentAdjustModal"));
            ModalManager.close(contractInstallmentsModal);
            openContractInstallments(historyIndex);
            renderContractHistory();
            render();
            return;
        }

        if (!paymentAdjustContext) return;
        var activeUnit = state.units.find(function (item) { return item.id === paymentAdjustContext.unitId; });
        if (!activeUnit) return;
        createVersionedBackup("Ajuste de pagamento", paymentAdjustContext.key);
        recordOperation("Ajuste de pagamento", paymentAdjustContext.key);
        ensureFinancialHistory(activeUnit);
        activeUnit.paymentHistory[paymentAdjustContext.key] = {
            rentAmount: rent, fineAmount: fine, interestAmount: interest,
            chargesAmount: fine + interest, totalAmount: rent + fine + interest,
            paidAt: paidAt, notes: notes
        };
        paymentAdjustContext = null;
        saveState();
        render();
        ModalManager.close(document.getElementById("paymentAdjustModal"));
    }

    function openHistoricInstallmentReceipt(index, key) {
        var unit = editingId ? state.units.find(function (item) { return item.id === editingId; }) : null;
        var contract = pendingContractHistory[index];
        if (!unit || !contract) return;
        var parts = key.split("-").map(Number);
        var payment = getPaymentRecord(unit, parts[0], parts[1] - 1);
        receiptContext = {
            unit: { name: unit.name, tenantName: contract.tenantName || "" },
            month: parts[1] - 1, year: parts[0], monthName: fullMonths[parts[1] - 1],
            issuedAt: formatDate(new Date()), status: historicalInstallmentState(unit, key) === "pago-atrasado" ? "pago-atrasado" : "pago",
            amount: Number(payment && payment.rentAmount) || Number(contract.rent) || 0,
            fineAmount: Number(payment && payment.fineAmount) || 0,
            interestAmount: Number(payment && payment.interestAmount) || 0,
            chargesAmount: Number(payment && payment.chargesAmount) || 0,
            totalAmount: Number(payment && payment.totalAmount) || Number(contract.rent) || 0,
            paidAt: payment && payment.paidAt || null,
            tenantName: contract.tenantName || ""
        };
        document.getElementById("receiptTitle").textContent = "Recibo · " + unit.name;
        receiptPreview.innerHTML = receiptMarkup(receiptContext);
        ModalManager.open(receiptModal);
    }

    function cleanStateSnapshot() {
        var copy = JSON.parse(JSON.stringify(state));
        delete copy.versionedBackups;
        delete copy.operationHistory;
        return copy;
    }

    function createVersionedBackup(label, detail) {
        state.versionedBackups = Array.isArray(state.versionedBackups) ? state.versionedBackups : [];
        state.versionedBackups.unshift({
            id: "backup-" + Date.now().toString(36) + Math.random().toString(36).slice(2),
            createdAt: new Date().toISOString(), label: label, detail: detail || "", snapshot: cleanStateSnapshot()
        });
        state.versionedBackups = state.versionedBackups.slice(0, 12);
    }

    function recordOperation(action, detail) {
        state.operationHistory = Array.isArray(state.operationHistory) ? state.operationHistory : [];
        state.operationHistory.unshift({
            id: "operation-" + Date.now().toString(36) + Math.random().toString(36).slice(2),
            createdAt: new Date().toISOString(), action: action, detail: detail || ""
        });
        state.operationHistory = state.operationHistory.slice(0, 80);
    }

    function renderBackupHistory() {
        var list = document.getElementById("backupHistoryList");
        if (!list) return;
        var backups = Array.isArray(state.versionedBackups) ? state.versionedBackups : [];
        var operations = Array.isArray(state.operationHistory) ? state.operationHistory.slice(0, 4) : [];
        list.innerHTML = backups.slice(0, 5).map(function (backup) {
            var date = new Date(backup.createdAt);
            return '<div class="backup-history-row"><div><strong>' + escapeHtml(backup.label) +
                '</strong><span>' + escapeHtml(formatDate(date) + " " + String(date.getHours()).padStart(2, "0") + ":" +
                String(date.getMinutes()).padStart(2, "0")) + '</span></div><button class="btn btn-ghost" type="button" data-restore-backup="' +
                escapeHtml(backup.id) + '">Restaurar</button></div>';
        }).join("") + operations.map(function (operation) {
            return '<div class="backup-history-row"><div><strong>' + escapeHtml(operation.action) +
                '</strong><span>' + escapeHtml(operation.detail || "") + '</span></div></div>';
        }).join("") || '<p class="rent-changes-empty">Nenhum backup ou operação sensível registrado.</p>';
        list.querySelectorAll("[data-restore-backup]").forEach(function (button) {
            button.addEventListener("click", function () {
                var backup = backups.find(function (item) { return item.id === button.dataset.restoreBackup; });
                if (!backup || !backup.snapshot || !window.confirm("Restaurar este backup?")) return;
                createVersionedBackup("Antes de restaurar backup", backup.label);
                recordOperation("Restauração de backup", backup.label);
                var savedBackups = state.versionedBackups, savedOperations = state.operationHistory;
                state = normalizeState(backup.snapshot);
                state.versionedBackups = savedBackups;
                state.operationHistory = savedOperations;
                expenseCategories = state.expenseCategories;
                saveState();
                renderBackupHistory();
                render();
            });
        });
    }

    function renderContractHistory() {
        var unit = editingId ? state.units.find(function (item) { return item.id === editingId; }) : null;
        var cards = pendingContractHistory.map(function (contract, index) {
            var lateCount = unit ? historicLateKeysForContract(unit, contract).length : 0;
            var installmentKeys = contractInstallmentKeys(contract);
            var pendingCount = unit ? installmentKeys.filter(function (key) {
                return historicalInstallmentState(unit, key) === "pendente";
            }).length : 0;
            var status = contractHistoryStatusInfo(contract.status);
            var tone = lateCount ? " is-alert" : " is-neutral";
            var summary = lateCount
                ? '<span class="contract-metric is-late">' + lateCount + ' em atraso</span>'
                : (pendingCount
                    ? '<span class="contract-metric is-pending">' + pendingCount + ' pendente' + (pendingCount === 1 ? '' : 's') + '</span>'
                    : '<span class="contract-metric is-ok">Sem pendências</span>');
            return '<article class="contract-timeline-card ' + status[1] + tone + '">' +
                '<span class="contract-timeline-node" aria-hidden="true"></span>' +
                '<div class="contract-timeline-heading"><div><strong>' +
                escapeHtml(contract.tenantName || "Inquilino não informado") +
                '</strong><span class="contract-period">' +
                escapeHtml(formatTimelineDate(resolveHistoryDate(contract, "start", false)) + " até " +
                formatTimelineDate(resolveHistoryDate(contract, "end", true))) +
                '</span></div><span class="contract-status">' + status[0] + '</span></div>' +
                '<div class="contract-timeline-details"><span class="contract-rent">' +
                money(Number(contract.rent) || 0) + ' / mês</span>' + summary + '</div>' +
                '<div class="contract-history-actions"><button class="btn btn-ghost" type="button" data-history-installments="' + index +
                '">Ver parcelas</button><button class="btn btn-ghost" type="button" data-history-reactivate="' + index +
                '">Reativar</button><button class="btn btn-danger" type="button" data-history-remove="' + index + '">Remover</button></div></article>';
        }).join("");
        contractHistoryList.innerHTML = cards ? '<div class="contract-timeline">' + cards + '</div>' :
            '<p class="rent-changes-empty">Nenhum contrato encerrado registrado.</p>';
        contractHistoryList.querySelectorAll("[data-history-installments]").forEach(function (button) {
            button.addEventListener("click", function () { openContractInstallments(Number(button.dataset.historyInstallments)); });
        });
        contractHistoryList.querySelectorAll("[data-history-reactivate]").forEach(function (button) {
            button.addEventListener("click", function () { reactivateHistoricalContract(Number(button.dataset.historyReactivate)); });
        });
        contractHistoryList.querySelectorAll("[data-history-remove]").forEach(function (button) {
            button.addEventListener("click", function () {
                var index = Number(button.dataset.historyRemove);
                if (!window.confirm("Remover este contrato do histórico?")) return;
                createVersionedBackup("Remoção de contrato histórico", pendingContractHistory[index].tenantName || "");
                recordOperation("Contrato histórico removido", pendingContractHistory[index].tenantName || "");
                pendingContractHistory.splice(index, 1);
                if (unit) { unit.contractHistory = serializeContractHistory(pendingContractHistory); saveState(); }
                renderContractHistory();
            });
        });
    }

    function endCurrentContractOnlyNow() {
        var unit = editingId ? state.units.find(function (item) { return item.id === editingId; }) : null;
        if (!unit || !String(tenantName.value || "").trim()) { tenantName.focus(); return; }
        var previousTenant = tenantName.value.trim();
        if (!window.confirm("Encerrar o contrato de " + previousTenant + "? A unidade poderá ficar vaga.")) return;
        createVersionedBackup("Encerramento de contrato", unit.name + " · " + previousTenant);
        recordOperation("Contrato encerrado", unit.name + " · " + previousTenant);
        if (!archiveCurrentContract()) return;
        document.getElementById("modalTitle").textContent = "Unidade vaga · " + unit.name;
        startNewContractButton.hidden = false;
    }

    function prepareNewContractForm() {
        var unit = editingId ? state.units.find(function (item) { return item.id === editingId; }) : null;
        document.getElementById("modalTitle").textContent = unit ? "Novo contrato · " + unit.name : "Novo contrato";
        tenantName.value = ""; tenantPhone.value = ""; tenantEmail.value = ""; tenantNotes.value = "";
        unitRent.value = ""; unitDueDay.value = ""; unitStartYm.value = ""; unitEndYm.value = "";
        pendingRentChanges = [];
        document.getElementById("rentChanges").open = false;
        renderRentChanges();
        startNewContractButton.hidden = true;
        tenantName.focus();
    }

    function deleteUnitNow() {
        if (!editingId || !window.confirm("Excluir esta unidade e seus registros?")) return;
        var unit = state.units.find(function (item) { return item.id === editingId; });
        createVersionedBackup("Exclusão de unidade", unit ? unit.name : "");
        recordOperation("Unidade excluída", unit ? unit.name : "");
        state.units = state.units.filter(function (item) { return item.id !== editingId; });
        saveState(); closeModal(); render();
    }

    archiveContract.removeEventListener("click", archiveCurrentContract);
    archiveContract.removeEventListener("click", endCurrentContractOnly);
    archiveContract.addEventListener("click", endCurrentContractOnly);
    document.getElementById("startNewContract").addEventListener("click", prepareNewContractForm);
    document.getElementById("closeContractInstallments").addEventListener("click", function () { ModalManager.close(contractInstallmentsModal); });
    document.getElementById("paymentAdjustFine").addEventListener("input", updatePaymentAdjustTotal);
    document.getElementById("createBackupNow").addEventListener("click", function () {
        createVersionedBackup("Backup manual", "");
        recordOperation("Backup manual criado", "");
        saveState(); renderBackupHistory();
    });



    /* Integrações de interface da auditoria. */
    function endCurrentContractOnly() {
        requireSensitiveAccess("encerrar este contrato", endCurrentContractOnlyNow);
    }

    function deleteUnit() {
        requireSensitiveAccess("excluir esta unidade", deleteUnitNow);
    }

    document.getElementById("cancelPaymentAdjust").addEventListener("click", function () {
        historicPaymentAdjustContext = null;
    });
    document.getElementById("settingsButton").addEventListener("click", function () {
        setTimeout(renderBackupHistory, 0);
    });

})();
