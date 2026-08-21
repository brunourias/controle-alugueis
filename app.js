(function () {
    "use strict";

// ===============================
// Gerenciador de Modais
// ===============================

function collapseRetractablePanels() {
    document.querySelectorAll("details[open]").forEach(function (panel) {
        panel.open = false;
    });
}

const ModalManager = (() => {

    const stack = [];
    const focusOrigins = new WeakMap();

    function getOpenModal() {
        return document.querySelector(".modal-backdrop:not([hidden])");
    }

    function closeExpandablePanels() {
        collapseRetractablePanels();
    }

    function focusableElements(container) {
        return Array.prototype.slice.call(container.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(function (element) { return !element.hidden && element.offsetParent !== null; });
    }

    function open(modal) {
        if (!modal || !modal.hidden) return;

        closeExpandablePanels();
        focusOrigins.set(modal, document.activeElement);
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.hidden = false;
        document.body.classList.add("modal-open");

        if (!stack.includes(modal)) {
            stack.push(modal);
        }

        window.requestAnimationFrame(function () {
            var first = focusableElements(modal)[0];
            if (first) first.focus({ preventScroll: true });
        });

        history.pushState({
            modal: true,
            id: modal.id || null
        }, "");
    }

    function close(modal = null, options = {}) {
        const target = modal || stack[stack.length - 1] || getOpenModal();

        if (!target) return false;

        // Fechamentos por botão não devem deixar uma entrada "modal" órfã no Voltar.
        if (!options.fromHistory && history.state && history.state.modal && history.state.id === (target.id || null)) {
            history.replaceState(Object.assign({}, history.state, { modal: false, id: null }), "");
        }

        target.hidden = true;

        const index = stack.lastIndexOf(target);
        if (index !== -1) {
            stack.splice(index, 1);
        }

        const hasModalOpen =
            document.querySelector(".modal-backdrop:not([hidden])");

        if (!hasModalOpen) {
            document.body.classList.remove("modal-open");
            var origin = focusOrigins.get(target);
            if (origin && document.contains(origin) && typeof origin.focus === "function") {
                origin.focus({ preventScroll: true });
            }
        }

        return true;
    }

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Tab") return;
        var modal = getOpenModal();
        if (!modal) return;
        var focusable = focusableElements(modal);
        if (!focusable.length) {
            event.preventDefault();
            return;
        }
        var current = document.activeElement;
        var index = focusable.indexOf(current);
        if (event.shiftKey && (index <= 0 || current === modal)) {
            event.preventDefault();
            focusable[focusable.length - 1].focus();
        } else if (!event.shiftKey && index === focusable.length - 1) {
            event.preventDefault();
            focusable[0].focus();
        }
    });

    // Botão Voltar: fecha primeiro o conteúdo sobreposto; na raiz, deixa o sistema sair do app.
    window.addEventListener("popstate", (event) => {
        const opened = getOpenModal();
        const annualReport = document.getElementById("annualReportModal");

        if (opened) {
            close(opened, { fromHistory: true });
            return;
        }

        // O Resumo do Ano possui seu próprio manipulador logo abaixo.
        if (annualReport && annualReport.style.display !== "none") return;

        if (event.state && event.state.controleAlugueisRoot) {
            window.setTimeout(function () {
                if (!getOpenModal()) history.back();
            }, 0);
        }
    });

    return {
        open,
        close,
        getOpenModal
    };

})();

// Marca a entrada principal sem criar uma tela extra no histórico.
if (!history.state || !history.state.controleAlugueisRoot) {
    history.replaceState(Object.assign({}, history.state || {}, { controleAlugueisRoot: true }), "");
}


// Mantém a navegação previsível: qualquer ação de botão recolhe painéis expansíveis.
// O próprio botão pode abrir sua tela/modal em seguida, sempre a partir do estado limpo.
document.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button || button.disabled) return;
    collapseRetractablePanels();
}, true);

    var STORAGE_KEY = "controle-alugueis-v1";
    var LOCK_STORAGE_KEY = "controle-alugueis-lock";
    var SETUP_FLAG_KEY = "controle-alugueis-lock-setup";
    var OFFLINE_ACCESS_KEY = "controle-alugueis-offline-access";
    var OFFLINE_ACCESS_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

    var ENTERPRISE_SELECTION_KEY = "controle-alugueis-empreendimento";
    var WORKSPACE_SELECTION_KEY = "controle-alugueis-workspace";

    var FIREBASE_CONFIG = {
        apiKey: "AIzaSyC9G72amaYJ4CiBgNcyMcNyi1MDva_8J1I",
        authDomain: "controle-alugueis-38871.firebaseapp.com",
        projectId: "controle-alugueis-38871",
        storageBucket: "controle-alugueis-38871.firebasestorage.app",
        messagingSenderId: "36592018809",
        appId: "1:36592018809:web:c4d7237fbfba0901487ba8",
    };

    var DEFAULT_ENTERPRISE_NAME = "Meu empreendimento";
    // Administrador da plataforma: aprova quem pode iniciar um espaço próprio.
    // A proteção efetiva é reforçada pelas regras do Firestore entregues junto.
    var PLATFORM_ADMIN_EMAILS = ["brunourias@gmail.com"];

    var DEFAULT_SETTINGS = {
        finePercent: 10,
        // Mantém o nome antigo do campo para compatibilidade com dados salvos.
        // O valor agora representa JUROS DE MORA AO MÊS, não ao dia.
        dailyInterestPercent: 1,
        receiverName: "",
        reminderDays: 5,
        overdueFollowUpDays: 3,
        defaultAdjustmentPercent: 0,
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
    var taxDashboardExpanded = false;
    var financialReportExpanded = false;
    var actionCenterExpanded = false;
    // A tela inicial prioriza a operação diária. Financeiro e relatórios
    // concentram informações de análise, sem poluir a rotina de cobrança.
    var activeAppView = "home";
    // No celular, o primeiro acesso exibe apenas os atalhos; cada tela abre sob demanda.
    var mobileLauncherActive = true;
    // Identifica qual atalho abriu a tela atual para permitir fechá-la ao tocar novamente.
    var activeMobileShortcut = "";
    // Evita duas solicitações de digital sobrepostas durante a inicialização.
    var biometricUnlockInProgress = false;
    // Cada abertura do bloqueio tenta a digital apenas uma vez.
    var biometricAutoPromptAttempted = false;
    var didInitialScroll = false;
    var lastGridScrollLeft = 0;
    var receiptContext = null;
    var lockConfig = loadLockConfig();
    var appUnlocked = false;
    var authMode = "login";
    var autoLockTimer = null;
    var AUTO_LOCK_MS = 5 * 60 * 1000;
    var appLastActivityAt = Date.now();
    // Evita que eventos de retorno do Android/PWA religuem o bloqueio
    // imediatamente após um PIN aceito.
    var authUnlockGraceUntil = 0;
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
    var expensesCount = document.getElementById("expensesCount");
    var expensesTopCategory = document.getElementById("expensesTopCategory");
    var expensesPreview = document.getElementById("expensesPreview");
    var expensesYear = document.getElementById("expensesYear");
    var lockError = document.getElementById("lockError");
    var modal = document.getElementById("modal");
    var settingsModal = document.getElementById("settingsModal");
    var onboardingModal = document.getElementById("onboardingModal");
    var onboardingContent = document.getElementById("onboardingContent");
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
    var authBiometric = document.getElementById("authBiometric");
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
    var overdueFollowUpDays = document.getElementById("overdueFollowUpDays");
    var defaultAdjustmentPercent = document.getElementById("defaultAdjustmentPercent");
    var cashForecast = document.getElementById("cashForecast");
    var unitOverview = document.getElementById("unitOverview");
    var suggestedRentAdjustment = document.getElementById("suggestedRentAdjustment");
    var applySuggestedRentAdjustment = document.getElementById("applySuggestedRentAdjustment");
    var securityStatus = document.getElementById("securityStatus");
    var currentPinLabel = document.getElementById("currentPinLabel");
    var pinCurrentSection = document.getElementById("pinCurrentSection");
    var pinChangePanel = document.getElementById("pinChangePanel");
    var currentPin = document.getElementById("currentPin");
    var newPin = document.getElementById("newPin");
    var confirmPin = document.getElementById("confirmPin");
    var savePinButton = document.getElementById("savePin");
    var removePinButton = document.getElementById("removePin");
    var biometricStatus = document.getElementById("biometricStatus");
    var enableBiometricButton = document.getElementById("enableBiometric");
    var removeBiometricButton = document.getElementById("removeBiometric");
    var backupFile = document.getElementById("backupFile");
    var chargeModal = document.getElementById("chargeModal");
    var chargeModalContext = document.getElementById("chargeModalContext");
    var chargeType = document.getElementById("chargeType");
    var chargeDate = document.getElementById("chargeDate");
    var chargePromisedDate = document.getElementById("chargePromisedDate");
    var chargeNextActionDate = document.getElementById("chargeNextActionDate");
    var chargeNote = document.getElementById("chargeNote");
    var chargeModalUnitId = null;
    var chargeModalHandledLateKeys = [];
    var expenseModal = document.getElementById("expenseModal");
    var expenseModalTitle = document.getElementById("expenseModalTitle");
    var expenseYm = document.getElementById("expenseYm");
    var expenseEmpreendimento = document.getElementById(
        "expenseEmpreendimento"
    );
    var expenseCategory = document.getElementById("expenseCategory");
    var expenseAmount = document.getElementById("expenseAmount");
    var expenseDescription = document.getElementById("expenseDescription");
    var expenseTaxTreatment = document.getElementById("expenseTaxTreatment");
    var expenseTaxProvider = document.getElementById("expenseTaxProvider");
    var expenseTaxDocument = document.getElementById("expenseTaxDocument");
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
    var pwaStatus = document.getElementById("pwaStatus");
    var pwaStatusText = document.getElementById("pwaStatusText");
    var pwaStatusAction = document.getElementById("pwaStatusAction");
    var pwaStatusDismiss = document.getElementById("pwaStatusDismiss");
    var accountGate = document.getElementById("accountGate");
    var accountGateTitle = document.getElementById("accountGateTitle");
    var accountGateMessage = document.getElementById("accountGateMessage");
    var accountGateAuth = document.getElementById("accountGateAuth");
    var accountGatePending = document.getElementById("accountGatePending");
    var accountGateEmail = document.getElementById("accountGateEmail");
    var accountGatePassword = document.getElementById("accountGatePassword");
    var accountGateError = document.getElementById("accountGateError");
    var syncStatus = document.getElementById("syncStatus");
    var cloudReconcile = document.getElementById("cloudReconcile");
    var cloudReconcileText = document.getElementById("cloudReconcileText");
    var useCloudData = document.getElementById("useCloudData");
    var useLocalData = document.getElementById("useLocalData");
    var cloudBanner = document.getElementById("cloudBanner");
    var accountAccessNotice = document.getElementById("accountAccessNotice");
    var platformApprovalsSection = document.getElementById("platformApprovalsSection");
    var platformApprovalsList = document.getElementById("platformApprovalsList");
    var platformAdminModal = document.getElementById("platformAdminModal");
    var platformAdminButton = document.getElementById("platformAdminButton");
    var platformAdminBadge = document.getElementById("platformAdminBadge");
    var subscriptionNotice = document.getElementById("subscriptionNotice");
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
    var cloudWorkspaceId = null;
    var cloudWorkspaceReady = false;
    var cloudWorkspaces = [];
    var cloudWorkspaceRole = null;
    var workspaceUiBound = false;
    var cloudAccountApproved = false;
    var cloudAccessChecking = false;
    var cloudAccountSettings = null;
    var cloudLastSyncAt = 0;
    var cloudSessionStartedAt = 0;
    var platformPendingUnsubscribe = null;
    var onboardingResumeRequested = false;
    var platformPlanCatalog = [];
    var cloudAuthInFlight = false;
    var cloudAuthCooldownUntil = 0;
    var cloudAuthCooldownTimer = null;
    var pendingPwaInstall = null;
    var pendingPwaUpdate = null;
    var pwaUpdateAccepted = false;
    var pendingPwaShortcut = new URLSearchParams(window.location.search).get("action");

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
		var total = monthlyFinancialMetrics(units, selectedYear, refMonth).expected;
		var enterpriseCount = state.empreendimentos.length;
		var unitLabel = units.length === 1 ? "unidade" : "unidades";
		var enterpriseLabel = enterpriseCount === 1 ? "empreendimento" : "empreendimentos";
		var parts = [];
		if (selectedEmpreendimentoId === "todos") {
		  parts.push('<span class="header-metric header-metric-enterprise">' + enterpriseCount + " " + enterpriseLabel + "</span>");
		}
		parts.push('<span class="header-metric header-metric-units">' + units.length + " " + unitLabel + "</span>");
		parts.push('<span class="header-metric header-metric-income">' + money(total) + "/mês</span>");
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
            overdueFollowUpDays: settings && Number.isInteger(Number(settings.overdueFollowUpDays)) && Number(settings.overdueFollowUpDays) >= 1 && Number(settings.overdueFollowUpDays) <= 30 ? Number(settings.overdueFollowUpDays) : DEFAULT_SETTINGS.overdueFollowUpDays,
            defaultAdjustmentPercent: settings && Number.isFinite(Number(settings.defaultAdjustmentPercent)) && Number(settings.defaultAdjustmentPercent) >= -100 && Number(settings.defaultAdjustmentPercent) <= 1000 ? Number(settings.defaultAdjustmentPercent) : DEFAULT_SETTINGS.defaultAdjustmentPercent,
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
            taxTreatment: ["dedutivel", "nao_dedutivel", "revisar"].indexOf(expense.taxTreatment) >= 0 ? expense.taxTreatment : "revisar",
            taxProvider: typeof expense.taxProvider === "string" ? expense.taxProvider.trim().slice(0, 120) : "",
            taxDocument: typeof expense.taxDocument === "string" ? expense.taxDocument.trim().slice(0, 80) : "",
            // Usado para mostrar os últimos lançamentos pela ordem de inclusão,
            // independentemente da data contábil escolhida.
            createdAt: typeof expense.createdAt === "string" && !Number.isNaN(Date.parse(expense.createdAt))
                ? expense.createdAt
                : date + "T00:00:00.000Z",
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
            return entry && typeof entry === "object";
        }).map(function (entry, index) {
            return {
                id: typeof entry.id === "string" && entry.id ? entry.id : "charge-" + index + "-" + Date.now().toString(36),
                createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString(),
                date: isValidDateValue(entry.date) ? entry.date : "",
                kind: ["whatsapp", "ligacao", "contato", "promessa", "nota"].indexOf(entry.kind) >= 0 ? entry.kind : "contato",
                note: typeof entry.note === "string" ? entry.note.trim().slice(0, 220) : "",
                promisedDate: isValidDateValue(entry.promisedDate) ? entry.promisedDate : "",
                nextActionDate: isValidDateValue(entry.nextActionDate) ? entry.nextActionDate : "",
                handledLateKeys: Array.isArray(entry.handledLateKeys)
                    ? entry.handledLateKeys.filter(function (key) { return typeof key === "string" && /^\d{4}-\d{2}$/.test(key); }).slice(0, 24)
                    : []
            };
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

    function rememberOfflineAccess(user) {
        if (!user || !navigator.onLine) return;
        localStorage.setItem(OFFLINE_ACCESS_KEY, JSON.stringify({
            uid: user.uid || "",
            email: user.email || "",
            verifiedAt: Date.now()
        }));
    }

    function canUseOfflineMode() {
        if (navigator.onLine || !lockConfig) return false;
        try {
            var access = JSON.parse(localStorage.getItem(OFFLINE_ACCESS_KEY) || "null");
            return !!(access && access.uid && Number(access.verifiedAt) &&
                Date.now() - Number(access.verifiedAt) <= OFFLINE_ACCESS_MAX_AGE);
        } catch (error) {
            return false;
        }
    }

    function saveState() {
        if (firebaseUser && cloudWorkspaceReady && !canWriteWorkspace()) {
            setCloudError("Esta área está em modo consulta. Nenhuma alteração foi salva.");
            setSyncStatus("Modo consulta");
            activateWorkspace(cloudWorkspaceId).catch(function () {});
            return;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

        if (!cloudApplyingRemote) scheduleCloudWrite();
    }

    function setCloudError(message) {
        cloudError.textContent = message || "";
        if (accountGateError) accountGateError.textContent = message || "";
    }

    function setAccountGate(visible, options) {
        if (!accountGate) return;
        options = options || {};
        accountGate.hidden = !visible;
        accountGate.classList.toggle("is-visible", !!visible && !options.verifying);
        document.body.classList.toggle("app-access-gated", !!visible);
        if (!visible) return;

        closeAuth();
        appUnlocked = false;
        accountGateTitle.textContent = options.title || "Acesse sua conta";
        accountGateMessage.textContent = options.message || "Entre ou crie sua conta para solicitar acesso à plataforma.";
        accountGateAuth.hidden = !!options.pending || !!options.verifying;
        accountGatePending.hidden = !options.pending;
    }

    function setSyncStatus(message) {
        syncStatus.textContent = message;
        if (/^Sincronizado/.test(String(message || ""))) cloudLastSyncAt = Date.now();
        renderAccountHealth();
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

        if (code === "auth/too-many-requests")
            return "Muitas tentativas foram feitas neste aparelho. Aguarde alguns minutos antes de tentar novamente.";

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
            code === "firestore/permission-denied" ||
            /permission|permiss[aã]o|insufficient/i.test(String(error && error.message || ""))
        )
            return error && error.workspaceStep
                ? "A nuvem bloqueou ao tentar " + error.workspaceStep + ". Verifique se as regras do Firestore atualizadas foram publicadas."
                : "A conta entrou, mas as regras da nuvem ainda não permitem acessar os dados. Publique as regras atualizadas do Firestore.";

        if (code === "unavailable" || code === "firestore/unavailable")
            return "A nuvem está indisponível no momento. Verifique a conexão e tente novamente.";

        if (code === "failed-precondition" || code === "firestore/failed-precondition")
            return "O armazenamento local da nuvem está em atualização. Feche outras abas do app e tente novamente.";

        var detail = error && error.workspaceStep ? " (" + error.workspaceStep + ")" : "";
        return "Não foi possível conectar à nuvem agora" + detail + ". Os dados locais continuam disponíveis.";
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

    function personalWorkspaceId(user) {
        return "personal-" + user.uid;
    }

    function workspaceRef(workspaceId) {
        return firebaseDb ? firebaseDb.collection("workspaces").doc(workspaceId) : null;
    }

    function workspaceMemberRef(workspaceId, userId) {
        var ref = workspaceRef(workspaceId);
        return ref ? ref.collection("members").doc(userId) : null;
    }

    function cloudDocRef() {
        var ref = firebaseUser && cloudWorkspaceId
            ? workspaceRef(cloudWorkspaceId)
            : null;
        return ref ? ref.collection("state").doc("current") : null;
    }

    /*
     * A primeira entrada de cada conta cria uma área pessoal.
     * Contas antigas têm o documento users/{uid} copiado para essa área;
     * o documento legado é preservado como uma cópia de segurança.
     */
    function isPlatformAdmin(user) {
        return !!(user && user.email && PLATFORM_ADMIN_EMAILS.indexOf(String(user.email).toLowerCase()) >= 0);
    }

    function accessRequestRef(userId) {
        return firebaseDb && userId ? firebaseDb.collection("accessRequests").doc(userId) : null;
    }

    function setAccountAccessNotice(message, pending) {
        if (!accountAccessNotice) return;
        accountAccessNotice.hidden = !message;
        accountAccessNotice.textContent = message || "";
        accountAccessNotice.classList.toggle("is-pending", !!pending);
    }

    function requestOrCheckAccountApproval(user) {
        if (!firebaseDb || !user) return Promise.resolve(false);
        if (isPlatformAdmin(user)) return Promise.resolve(true);
        var profile = firebaseDb.collection("profiles").doc(user.uid);
        // Usuários já existentes continuam ativos ao habilitar o modo de aprovação.
        return profile.get().then(function (profileSnapshot) {
            var request = accessRequestRef(user.uid);
            return request.get().then(function (snapshot) {
                var data = snapshot.exists ? snapshot.data() || {} : {};
                cloudAccountSettings = snapshot.exists ? data : null;
                if (profileSnapshot.exists && data.status !== "suspended") return true;
                if (data.status === "approved") return true;
                if (data.status === "rejected") {
                    setAccountAccessNotice("Seu cadastro não foi aprovado. Fale com a administração para solicitar uma revisão.", true);
                    return false;
                }
                if (snapshot.exists) {
                    setAccountAccessNotice("Cadastro recebido. Sua conta está aguardando aprovação para criar a área de trabalho.", true);
                    return false;
                }
                return request.set({
                    uid: user.uid,
                    email: user.email || "",
                    displayName: user.displayName || "",
                    status: "pending",
                    plan: "trial",
                    limits: defaultPlatformLimits("trial"),
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }).then(function () {
                    setAccountAccessNotice("Cadastro recebido. Sua conta está aguardando aprovação para criar a área de trabalho.", true);
                    return false;
                });
            });
        });
    }

    function builtinPlatformPlans() {
        return [
            { id: "trial", name: "Teste", price: 0, limits: { units: 10, enterprises: 1, workspaces: 1, users: 2 }, system: true },
            { id: "starter", name: "Inicial", price: 0, limits: { units: 30, enterprises: 3, workspaces: 3, users: 5 }, system: true },
            { id: "professional", name: "Profissional", price: 0, limits: { units: 9999, enterprises: 999, workspaces: 999, users: 999 }, system: true }
        ];
    }

    function platformPlans() {
        return platformPlanCatalog.length ? platformPlanCatalog : builtinPlatformPlans();
    }

    function platformPlanFor(id) {
        return platformPlans().find(function (item) { return item.id === id; }) || builtinPlatformPlans()[0];
    }

    function platformAccountStatusLabel(status) {
        return { pending: "Aguardando aprovação", approved: "Ativa", rejected: "Recusada", suspended: "Suspensa" }[status] || "Ativa";
    }

    function subscriptionStatusLabel(status) {
        return { trial: "Em teste", active: "Assinatura ativa", overdue: "Pagamento vencido", canceled: "Assinatura cancelada" }[status] || "Em teste";
    }

    function addSubscriptionDays(days) {
        var date = new Date();
        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() + Number(days || 0));
        return date.toISOString().slice(0, 10);
    }

    function subscriptionDueInfo(value) {
        var match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return { kind: "none", days: null };
        var target = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        var today = new Date();
        target.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        var days = Math.round((target.getTime() - today.getTime()) / 86400000);
        return { kind: days < 0 ? "expired" : days <= 7 ? "soon" : "ok", days: days };
    }

    function isSubscriptionLocked() {
        if (!firebaseUser || isPlatformAdmin(firebaseUser)) return false;
        var account = cloudAccountSettings || {};
        var status = String(account.subscriptionStatus || "");
        var due = subscriptionDueInfo(account.subscriptionDueDate);
        return ["overdue", "canceled"].indexOf(status) >= 0 || due.kind === "expired";
    }

    function subscriptionLockMessage() {
        var account = cloudAccountSettings || {};
        var status = String(account.subscriptionStatus || "");
        if (status === "canceled") return "Sua assinatura está cancelada. Os dados permanecem disponíveis para consulta; renove para voltar a editar.";
        if (status === "overdue") return "Há uma pendência na assinatura. Os dados estão em modo consulta até a renovação.";
        return "O período da assinatura venceu. Os dados estão em modo consulta até a renovação.";
    }

    function renderAccountHealth() {
        var health = document.getElementById("accountHealth");
        if (!health) return;
        if (!firebaseUser || !cloudAccountApproved) {
            health.hidden = true;
            return;
        }
        var mode = isSubscriptionLocked() ? "Modo consulta" : "Edição liberada";
        var lastSync = cloudLastSyncAt ? new Date(cloudLastSyncAt).toLocaleString("pt-BR") : "Ainda não concluída";
        var lastAccess = cloudSessionStartedAt ? new Date(cloudSessionStartedAt).toLocaleString("pt-BR") : "Sessão atual";
        health.hidden = false;
        health.classList.toggle("is-readonly", isSubscriptionLocked());
        health.innerHTML = '<strong>Saúde da conta</strong><span><b>' + escapeHtml(mode) + '</b> · sincronização: ' + escapeHtml(syncStatus.textContent || "Aguardando") + '</span><span>Última sincronização: ' + escapeHtml(lastSync) + ' · acesso atual: ' + escapeHtml(lastAccess) + '</span>';
    }

    function updateSubscriptionNotice() {
        if (!subscriptionNotice) return;
        var account = cloudAccountSettings || {};
        var info = subscriptionDueInfo(account.subscriptionDueDate);
        var status = account.subscriptionStatus;
        subscriptionNotice.hidden = !firebaseUser || isPlatformAdmin(firebaseUser) || (info.kind !== "expired" && info.kind !== "soon" && ["overdue", "canceled"].indexOf(status) < 0);
        if (subscriptionNotice.hidden) {
            renderAccountHealth();
            return;
        }
        var message = isSubscriptionLocked()
            ? subscriptionLockMessage()
            : info.kind === "soon"
                ? "Seu plano vence em " + info.days + " dia(s). Programe a renovação."
                : "Há uma pendência na sua assinatura. Fale com a administração.";
        subscriptionNotice.textContent = message;
        subscriptionNotice.classList.toggle("is-expired", isSubscriptionLocked());
        renderAccountHealth();
    }

    function platformPlanLabel(plan) {
        if (cloudAccountSettings && cloudAccountSettings.plan === plan && cloudAccountSettings.planName)
            return String(cloudAccountSettings.planName);
        return platformPlanFor(plan).name || "Teste";
    }

    function defaultPlatformLimits(plan) {
        var limits = platformPlanFor(plan).limits || {};
        return {
            units: Number(limits.units) || 0,
            enterprises: Number(limits.enterprises) || 0,
            workspaces: Number(limits.workspaces) || 0,
            users: Number(limits.users) || 0
        };
    }

    function loadPlatformPlans() {
        if (!firebaseDb || !isPlatformAdmin(firebaseUser)) return Promise.resolve(platformPlans());
        return firebaseDb.collection("platformPlans").get().then(function (snapshot) {
            var custom = [];
            snapshot.forEach(function (item) {
                var data = item.data() || {};
                if (!data.name || !data.limits || typeof data.limits !== "object") return;
                custom.push({
                    id: item.id, name: String(data.name).slice(0, 60),
                    price: Number(data.price) || 0,
                    limits: {
                        units: Number(data.limits.units) || 0,
                        enterprises: Number(data.limits.enterprises) || 0,
                        workspaces: Number(data.limits.workspaces) || 0,
                        users: Number(data.limits.users) || 0
                    },
                    system: data.system === true
                });
            });
            var builtins = builtinPlatformPlans();
            builtins.forEach(function (base) {
                if (!custom.some(function (plan) { return plan.id === base.id; })) custom.push(base);
            });
            platformPlanCatalog = custom.sort(function (left, right) {
                return left.name.localeCompare(right.name, "pt-BR");
            });
            return platformPlanCatalog;
        }).catch(function () {
            platformPlanCatalog = builtinPlatformPlans();
            return platformPlanCatalog;
        });
    }

    function activePlatformPlan() {
        if (isPlatformAdmin(firebaseUser)) return "professional";
        return cloudAccountSettings && typeof cloudAccountSettings.plan === "string" ? cloudAccountSettings.plan : "trial";
    }

    function activePlatformLimits() {
        var base = defaultPlatformLimits(activePlatformPlan());
        var custom = cloudAccountSettings && cloudAccountSettings.limits && typeof cloudAccountSettings.limits === "object" ? cloudAccountSettings.limits : {};
        ["units", "enterprises", "workspaces", "users"].forEach(function (key) {
            if (Number.isFinite(Number(custom[key])) && Number(custom[key]) >= 0) base[key] = Number(custom[key]);
        });
        return base;
    }

    function limitMessage(resource, used, limit) {
        var labels = { units: "unidades", enterprises: "empreendimentos", workspaces: "áreas de trabalho", users: "usuários" };
        return "Limite do plano " + platformPlanLabel(activePlatformPlan()) + " atingido: " + used + "/" + limit + " " + (labels[resource] || resource) + ". Fale com a administração para ampliar o plano.";
    }

    function canCreateWithinPlan(resource, used) {
        if (isPlatformAdmin(firebaseUser) || !firebaseUser) return true;
        var limit = activePlatformLimits()[resource];
        if (!Number.isFinite(limit) || limit >= 9999 || used < limit) return true;
        var message = limitMessage(resource, used, limit);
        setCloudError(message);
        setEnterpriseStatus(message, true);
        return false;
    }

    function renderPlanUsage() {
        var usage = document.getElementById("planUsage");
        if (!usage) return;
        if (!firebaseUser || !cloudAccountApproved) { usage.hidden = true; return; }
        var limits = activePlatformLimits(), plan = activePlatformPlan(), unitCount = state.units.length, enterpriseCount = state.empreendimentos.length;
        usage.hidden = false;
        usage.innerHTML = '<strong>Plano ' + escapeHtml(platformPlanLabel(plan)) + '</strong><span>' + unitCount + '/' + limits.units + ' unidades · ' + enterpriseCount + '/' + limits.enterprises + ' empreendimentos · carregando colaboradores...</span>';
        if (!firebaseDb || !cloudWorkspaceId) return;
        workspaceRef(cloudWorkspaceId).collection("members").get().then(function (snapshot) {
            if (!firebaseUser || usage.hidden) return;
            usage.innerHTML = '<strong>Plano ' + escapeHtml(platformPlanLabel(plan)) + '</strong><span>' + unitCount + '/' + limits.units + ' unidades · ' + enterpriseCount + '/' + limits.enterprises + ' empreendimentos · ' + snapshot.size + '/' + limits.users + ' usuários</span>';
        }).catch(function () {});
    }

    function platformAccountRef(userId) { return accessRequestRef(userId); }

    function writePlatformAudit(action, accountId, details) {
        if (!firebaseDb || !isPlatformAdmin(firebaseUser)) return Promise.resolve();
        return firebaseDb.collection("platformAudit").add({
            action: action, accountId: accountId || "", details: details || {},
            actorEmail: firebaseUser.email || "", actorId: firebaseUser.uid,
            createdAt: Date.now()
        }).catch(function () {});
    }

    function updatePlatformAccount(userId, patch, action) {
        if (!isPlatformAdmin(firebaseUser) || !platformAccountRef(userId)) return;
        return platformAccountRef(userId).set(Object.assign({ uid: userId, updatedAt: Date.now(), updatedBy: firebaseUser.uid }, patch), { merge: true })
            .then(function () {
                if (firebaseUser && userId === firebaseUser.uid) cloudAccountSettings = Object.assign({}, cloudAccountSettings || {}, patch);
                return writePlatformAudit(action || "Conta atualizada", userId, patch);
            }).then(function () {
                renderPlatformApprovals(); renderPlatformPlans(); renderPlatformAudit(); renderPlanUsage(); renderAccountHealth();
            }).catch(function (error) { setCloudError(cloudErrorMessage(error)); });
    }

    function renderPlatformPlans() {
        var list = document.getElementById("platformPlansList");
        if (!list || !isPlatformAdmin(firebaseUser)) return;
        loadPlatformPlans().then(function () {
            list.innerHTML = platformPlans().map(function (plan) {
                var limits = plan.limits || {};
                return '<article class="platform-plan-row"><div><strong>' + escapeHtml(plan.name) + '</strong><span>' + (plan.price ? money(plan.price) + '/mês · ' : '') + Number(limits.units) + ' unidades · ' + Number(limits.enterprises) + ' empreendimentos · ' + Number(limits.users) + ' usuários</span></div>' + (plan.system ? '<small>Plano base</small>' : '<button class="btn btn-danger" type="button" data-delete-plan="' + escapeHtml(plan.id) + '">Remover</button>') + '</article>';
            }).join("");
            list.querySelectorAll("[data-delete-plan]").forEach(function (button) {
                button.addEventListener("click", function () {
                    if (!window.confirm("Remover este plano? Clientes já associados manterão os limites atuais.")) return;
                    firebaseDb.collection("platformPlans").doc(button.dataset.deletePlan).delete()
                        .then(function () { return writePlatformAudit("Plano removido", "", { plan: button.dataset.deletePlan }); })
                        .then(function () { platformPlanCatalog = []; renderPlatformPlans(); renderPlatformApprovals(); });
                });
            });
        });
    }

    function savePlatformPlan() {
        var nameInput = document.getElementById("platformPlanName"), priceInput = document.getElementById("platformPlanPrice");
        var unitInput = document.getElementById("platformPlanUnits"), enterpriseInput = document.getElementById("platformPlanEnterprises"), userInput = document.getElementById("platformPlanUsers");
        if (!isPlatformAdmin(firebaseUser) || !nameInput) return;
        var name = nameInput.value.trim(), price = Number(priceInput.value);
        var limits = { units: Number(unitInput.value), enterprises: Number(enterpriseInput.value), users: Number(userInput.value), workspaces: Number(enterpriseInput.value) };
        if (!name || !Number.isFinite(price) || price < 0 || Object.keys(limits).some(function (key) { return !Number.isInteger(limits[key]) || limits[key] < 1; })) {
            nameInput.setCustomValidity("Informe nome, preço e limites válidos."); nameInput.reportValidity(); return;
        }
        nameInput.setCustomValidity("");
        var id = "custom-" + name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
        firebaseDb.collection("platformPlans").doc(id).set({ name: name, price: price, limits: limits, createdAt: Date.now(), createdBy: firebaseUser.uid })
            .then(function () { return writePlatformAudit("Plano criado", "", { plan: name, price: price, limits: limits }); })
            .then(function () { [nameInput, priceInput, unitInput, enterpriseInput, userInput].forEach(function (input) { input.value = ""; }); platformPlanCatalog = []; renderPlatformPlans(); renderPlatformApprovals(); })
            .catch(function (error) { setCloudError(cloudErrorMessage(error)); });
    }

    function renderPlatformAudit() {
        var list = document.getElementById("platformAuditList");
        if (!list || !firebaseDb || !isPlatformAdmin(firebaseUser)) return;
        list.innerHTML = '<p class="settings-note">Carregando histórico...</p>';
        firebaseDb.collection("platformAudit").orderBy("createdAt", "desc").limit(30).get().then(function (snapshot) {
            var entries = [];
            snapshot.forEach(function (item) { entries.push(item.data() || {}); });
            list.innerHTML = entries.length ? entries.map(function (entry) {
                var when = entry.createdAt ? new Date(Number(entry.createdAt)).toLocaleString("pt-BR") : "data não informada";
                return '<div class="platform-audit-row"><strong>' + escapeHtml(entry.action || "Alteração") + '</strong><span>' + escapeHtml(entry.actorEmail || "Administração") + ' · ' + escapeHtml(when) + '</span></div>';
            }).join("") : '<p class="settings-note">Nenhuma operação administrativa registrada ainda.</p>';
        }).catch(function () { list.innerHTML = '<p class="settings-note">O histórico estará disponível após publicar as regras atualizadas.</p>'; });
    }

    function updatePlatformAdminTrigger() {
        var canManage = isPlatformAdmin(firebaseUser) && !!firebaseDb;
        if (platformAdminButton) platformAdminButton.hidden = !canManage;
        if (!canManage) {
            if (platformAdminBadge) platformAdminBadge.hidden = true;
            return;
        }
        if (!platformPendingUnsubscribe) subscribePlatformRequests();
    }

    function setPlatformPendingCount(pending, subscriptionAlerts) {
        if (!platformAdminBadge) return;
        pending = Number(pending) || 0;
        subscriptionAlerts = Number(subscriptionAlerts) || 0;
        var count = pending + subscriptionAlerts;
        platformAdminBadge.hidden = count < 1;
        platformAdminBadge.textContent = count > 99 ? "99+" : String(count);
        var pieces = [];
        if (pending) pieces.push(pending + " solicitação(ões)");
        if (subscriptionAlerts) pieces.push(subscriptionAlerts + " assinatura(s) para revisar");
        platformAdminButton.setAttribute("aria-label", count ? "Administração da plataforma: " + pieces.join(" e ") : "Administração da plataforma");
        platformAdminButton.title = count ? pieces.join(" · ") : "Administração da plataforma";
    }

    function subscribePlatformRequests() {
        if (!isPlatformAdmin(firebaseUser) || !firebaseDb || platformPendingUnsubscribe) return;
        platformPendingUnsubscribe = firebaseDb.collection("accessRequests").onSnapshot(function (snapshot) {
            var pending = 0, alerts = 0;
            snapshot.forEach(function (item) {
                var account = item.data() || {};
                if (account.status === "pending") pending += 1;
                var due = subscriptionDueInfo(account.subscriptionDueDate);
                if (account.status === "approved" && (due.kind === "expired" || due.kind === "soon" || account.subscriptionStatus === "overdue")) alerts += 1;
            });
            setPlatformPendingCount(pending, alerts);
            if (platformApprovalsSection && platformAdminModal && !platformAdminModal.hidden) renderPlatformApprovals();
        }, function () { setPlatformPendingCount(0, 0); });
    }

    function openPlatformAdmin() {
        if (!isPlatformAdmin(firebaseUser) || !platformAdminModal) return;
        ModalManager.open(platformAdminModal);
        renderPlatformApprovals();
        renderPlatformPlans();
        renderPlatformAudit();
    }

    function closePlatformAdmin() {
        if (platformAdminModal) ModalManager.close(platformAdminModal);
    }

    function renderPlatformApprovals() {
        if (!platformApprovalsSection || !platformApprovalsList) return;
        var canManagePlatform = isPlatformAdmin(firebaseUser);
        platformApprovalsSection.hidden = !canManagePlatform;
        if (!canManagePlatform || !firebaseDb) return;

        platformApprovalsList.innerHTML = '<p class="settings-note">Carregando contas da plataforma...</p>';

        loadPlatformPlans().then(function () { return Promise.all([
            firebaseDb.collection("profiles").get(),
            firebaseDb.collection("accessRequests").get()
        ]); }).then(function (results) {
            var profiles = {};
            var accounts = {};

            results[0].forEach(function (item) {
                profiles[item.id] = item.data() || {};
            });
            results[1].forEach(function (item) {
                accounts[item.id] = Object.assign({ id: item.id }, item.data() || {});
            });

            Object.keys(profiles).forEach(function (id) {
                if (!accounts[id]) accounts[id] = { id: id, status: "approved" };
                accounts[id].profile = profiles[id];
            });

            var list = Object.keys(accounts).map(function (id) {
                var account = accounts[id];
                var profile = account.profile || {};
                var hasRequestStatus = typeof account.status === "string";
                var status = hasRequestStatus ? account.status : "approved";
                var plan = typeof account.plan === "string" ? account.plan : "trial";
                var limits = account.limits && typeof account.limits === "object"
                    ? account.limits : defaultPlatformLimits(plan);
                return {
                    id: id,
                    email: account.email || profile.email || id,
                    displayName: account.displayName || profile.displayName || "",
                    status: status,
                    plan: plan,
                    limits: limits,
                    subscriptionStatus: typeof account.subscriptionStatus === "string" ? account.subscriptionStatus : (plan === "trial" ? "trial" : "active"),
                    subscriptionDueDate: typeof account.subscriptionDueDate === "string" ? account.subscriptionDueDate : "",
                    createdAt: Number(account.createdAt || profile.updatedAt) || 0,
                    workspaces: Array.isArray(profile.workspaceIds) ? profile.workspaceIds.length : 0
                };
            }).sort(function (left, right) {
                var priority = { pending: 0, suspended: 1, approved: 2, rejected: 3 };
                return (priority[left.status] || 9) - (priority[right.status] || 9) ||
                    right.createdAt - left.createdAt;
            });

            var filter = document.getElementById("platformSubscriptionFilter");
            var filterValue = filter ? filter.value : "all";
            if (filterValue !== "all") list = list.filter(function (item) {
                return filterValue === "pending" ? item.status === "pending" :
                    filterValue === "suspended" ? item.status === "suspended" :
                    item.subscriptionStatus === filterValue;
            });

            var active = list.filter(function (item) { return item.status === "approved"; }).length;
            var pending = list.filter(function (item) { return item.status === "pending"; }).length;
            var suspended = list.filter(function (item) { return item.status === "suspended"; }).length;
            var summary = '<div class="platform-account-metrics">' +
                '<span><strong>' + list.length + '</strong> contas</span>' +
                '<span><strong>' + active + '</strong> ativas</span>' +
                '<span><strong>' + pending + '</strong> aguardando</span>' +
                '<span><strong>' + suspended + '</strong> suspensas</span></div>';

            platformApprovalsList.innerHTML = summary + (list.length ? list.map(function (account) {
                var date = account.createdAt
                    ? new Date(account.createdAt).toLocaleDateString("pt-BR")
                    : "data não informada";
                var isPending = account.status === "pending";
                var isSuspended = account.status === "suspended";
                var primaryAction = isPending
                    ? '<button class="btn btn-primary" type="button" data-platform-activate="' + escapeHtml(account.id) + '">Aprovar</button>'
                    : isSuspended
                        ? '<button class="btn btn-primary" type="button" data-platform-activate="' + escapeHtml(account.id) + '">Reativar</button>'
                        : '<button class="btn btn-danger" type="button" data-platform-suspend="' + escapeHtml(account.id) + '">Suspender</button>';
                var dueInfo = subscriptionDueInfo(account.subscriptionDueDate);
                var dueText = dueInfo.kind === "expired" ? "Vencida" : subscriptionStatusLabel(account.subscriptionStatus);
                var dueDateText = account.subscriptionDueDate
                    ? (dueInfo.kind === "expired" ? " · em " : " · vence ") + formatDate(account.subscriptionDueDate)
                    : "";
                return '<article class="platform-account-row">' +
                    '<div class="platform-account-main"><strong>' + escapeHtml(account.displayName || account.email) + '</strong>' +
                    '<span>' + escapeHtml(account.email) + ' · desde ' + escapeHtml(date) + '</span>' +
                    '<div class="platform-account-meta"><b class="platform-status platform-status-' + escapeHtml(account.status) + '">' + escapeHtml(platformAccountStatusLabel(account.status)) + '</b>' +
                    '<b class="subscription-status subscription-' + escapeHtml(dueInfo.kind) + '">' + escapeHtml(dueText) + escapeHtml(dueDateText) + '</b>' +
                    '<span>' + account.workspaces + ' área(s)</span>' +
                    '<span>limite: ' + Number(account.limits.units || 0) + ' unidades · ' + Number(account.limits.enterprises == null ? 1 : account.limits.enterprises) + ' empreendimentos · ' + Number(account.limits.users || 0) + ' usuários</span></div></div>' +
                    '<div class="platform-account-quick-actions"><button class="btn btn-ghost" type="button" data-renew-subscription="' + escapeHtml(account.id) + '">Renovar 30 dias</button>' + primaryAction + '</div>' +
                    '<details class="platform-account-manage"><summary>Gerenciar acesso e limites</summary><div class="platform-account-actions"><label>Plano<select data-account-plan="' + escapeHtml(account.id) + '">' +
                    platformPlans().map(function (plan) {
                        return '<option value="' + escapeHtml(plan.id) + '"' + (plan.id === account.plan ? " selected" : "") + '>' + escapeHtml(plan.name) + '</option>';
                    }).join("") + '</select></label><label>Assinatura<select data-subscription-status="' + escapeHtml(account.id) + '">' +
                    ["trial", "active", "overdue", "canceled"].map(function (status) { return '<option value="' + status + '"' + (status === account.subscriptionStatus ? " selected" : "") + '>' + subscriptionStatusLabel(status) + '</option>'; }).join("") + '</select></label><label>Vence em<input type="date" data-subscription-due="' + escapeHtml(account.id) + '" value="' + escapeHtml(account.subscriptionDueDate || "") + '"></label><div class="platform-limit-editor"><strong>Limites personalizados</strong><div><label>Unidades<input type="number" min="0" data-account-limit="' + escapeHtml(account.id) + '" data-limit-key="units" value="' + Number(account.limits.units || 0) + '"></label><label>Empreendimentos<input type="number" min="0" data-account-limit="' + escapeHtml(account.id) + '" data-limit-key="enterprises" value="' + Number(account.limits.enterprises == null ? 1 : account.limits.enterprises) + '"></label><label>Usuários<input type="number" min="0" data-account-limit="' + escapeHtml(account.id) + '" data-limit-key="users" value="' + Number(account.limits.users || 0) + '"></label></div></div></div></details></article>';
            }).join("") : '<p class="settings-note">Nenhuma conta cadastrada ainda.</p>');

            platformApprovalsList.querySelectorAll("[data-platform-activate]").forEach(function (button) {
                button.addEventListener("click", function () {
                    var planSelect = Array.prototype.slice.call(platformApprovalsList.querySelectorAll("[data-account-plan]")).find(function (select) { return select.dataset.accountPlan === button.dataset.platformActivate; });
                    var plan = planSelect ? planSelect.value : "trial";
                    updatePlatformAccount(button.dataset.platformActivate, {
                        status: "approved", plan: plan, planName: platformPlanLabel(plan), limits: defaultPlatformLimits(plan),
                        subscriptionStatus: plan === "trial" ? "trial" : "active",
                        subscriptionDueDate: addSubscriptionDays(30),
                        approvedAt: Date.now(), approvedBy: firebaseUser.uid
                    }, "Conta aprovada");
                });
            });
            platformApprovalsList.querySelectorAll("[data-platform-suspend]").forEach(function (button) {
                button.addEventListener("click", function () {
                    if (!window.confirm("Suspender o acesso desta conta? Os dados serão preservados, mas a sincronização ficará bloqueada.")) return;
                    updatePlatformAccount(button.dataset.platformSuspend, { status: "suspended", suspendedAt: Date.now(), suspendedBy: firebaseUser.uid }, "Acesso suspenso");
                });
            });
            platformApprovalsList.querySelectorAll("[data-account-plan]").forEach(function (select) {
                select.addEventListener("change", function () {
                    var plan = select.value;
                    updatePlatformAccount(select.dataset.accountPlan, { plan: plan, planName: platformPlanLabel(plan), limits: defaultPlatformLimits(plan) }, "Plano alterado");
                });
            });
            platformApprovalsList.querySelectorAll("[data-renew-subscription]").forEach(function (button) {
                button.addEventListener("click", function () {
                    var accountId = button.dataset.renewSubscription;
                    var due = addSubscriptionDays(30);
                    updatePlatformAccount(accountId, { subscriptionStatus: "active", subscriptionDueDate: due }, "Assinatura renovada por 30 dias");
                });
            });
            platformApprovalsList.querySelectorAll("[data-subscription-status], [data-subscription-due]").forEach(function (input) {
                input.addEventListener("change", function () {
                    var accountId = input.dataset.subscriptionStatus || input.dataset.subscriptionDue;
                    var statusField = platformApprovalsList.querySelector('[data-subscription-status="' + accountId + '"]');
                    var dueField = platformApprovalsList.querySelector('[data-subscription-due="' + accountId + '"]');
                    updatePlatformAccount(accountId, {
                        subscriptionStatus: statusField ? statusField.value : "trial",
                        subscriptionDueDate: dueField ? dueField.value : ""
                    }, "Assinatura atualizada");
                });
            });
            platformApprovalsList.querySelectorAll("[data-account-limit]").forEach(function (input) {
                input.addEventListener("change", function () {
                    var accountId = input.dataset.accountLimit;
                    var limits = {};
                    Array.prototype.slice.call(platformApprovalsList.querySelectorAll("[data-account-limit]"))
                        .filter(function (field) { return field.dataset.accountLimit === accountId; })
                        .forEach(function (field) {
                            var value = Number(field.value);
                            if (Number.isInteger(value) && value >= 0) limits[field.dataset.limitKey] = value;
                        });
                    if (Object.keys(limits).length !== 3) return;
                    updatePlatformAccount(accountId, { limits: limits }, "Limites personalizados");
                });
            });
        }).catch(function (error) {
            platformApprovalsList.innerHTML = '<p class="cloud-error">Não foi possível carregar as contas da plataforma.</p>';
            setCloudError(cloudErrorMessage(error));
        });
    }

    function ensurePersonalWorkspace(user) {
        if (!firebaseDb || !user) return Promise.reject(new Error("Nuvem indisponível"));

        var workspaceId = personalWorkspaceId(user);
        var workspace = workspaceRef(workspaceId);
        var profile = firebaseDb.collection("profiles").doc(user.uid);
        var member = workspaceMemberRef(workspaceId, user.uid);
        var legacy = firebaseDb.collection("users").doc(user.uid);
        var now = Date.now();

        cloudWorkspaceReady = false;
        cloudWorkspaceId = null;

        /*
         * Criação em etapas: cada operação tem uma permissão simples e
         * recupera uma inicialização anterior que tenha ficado incompleta.
         */
        return workspace.set({
            name: "Meus imóveis",
            ownerId: user.uid,
            type: "personal",
            createdAt: now,
            updatedAt: now
        }, { merge: true })
        .catch(function (error) {
            error.workspaceStep = "criar a área pessoal";
            throw error;
        })
        .then(function () {
            return member.set({
                role: "owner",
                email: user.email || "",
                displayName: user.displayName || "",
                joinedAt: now
            }, { merge: true });
        })
        .catch(function (error) {
            error.workspaceStep = error.workspaceStep || "criar o proprietário da área";
            throw error;
        })
        .then(function () {
            return profile.set({
                email: user.email || "",
                displayName: user.displayName || "",
                personalWorkspaceId: workspaceId,
                workspaceIds: firebase.firestore.FieldValue.arrayUnion(workspaceId),
                updatedAt: now
            }, { merge: true });
        })
        .catch(function (error) {
            error.workspaceStep = error.workspaceStep || "atualizar o perfil da conta";
            throw error;
        })
        .then(function () {
            return legacy.get();
        })
        .then(function (legacySnapshot) {
            var data = legacySnapshot.exists ? legacySnapshot.data() || {} : {};
            if (!data.payload) return null;
            return cloudDocRefFor(workspace).set({
                payload: data.payload,
                updatedAt: Number(data.updatedAt) || now,
                migratedFrom: "users/" + user.uid,
                migratedAt: now
            }, { merge: true });
        })
        .catch(function (error) {
            error.workspaceStep = error.workspaceStep || "migrar os dados existentes";
            throw error;
        })
        .then(function () {
            if (firebaseUser && firebaseUser.uid === user.uid) {
                cloudWorkspaceId = workspaceId;
                cloudWorkspaceReady = true;
            }
            return workspaceId;
        });
    }

    function cloudDocRefFor(workspace) {
        return workspace.collection("state").doc("current");
    }

    function workspaceRoleLabel(role) {
        return {
            owner: "Proprietário",
            admin: "Administrador",
            operator: "Operador",
            billing: "Cobrança",
            finance: "Financeiro",
            viewer: "Consulta"
        }[role] || "Sem permissão";
    }

    function workspaceRoleCapabilities(role) {
        return {
            owner: ["Acesso total", "Gerencia área, equipe e permissões", "Pode remover colaboradores"],
            admin: ["Opera todos os dados", "Gerencia equipe e permissões", "Não altera o proprietário"],
            operator: ["Unidades, contratos, cobranças e pagamentos", "Gastos e relatórios", "Não gerencia equipe"],
            billing: ["Registra cobranças e baixas de pagamento", "Não edita gastos, contratos ou equipe", "Consulta dados financeiros"],
            finance: ["Registra pagamentos e gastos", "Consulta unidades e contratos", "Não encerra nem altera contratos"],
            viewer: ["Consulta unidades e relatórios", "Não altera dados", "Não gerencia equipe"]
        }[role] || [];
    }

    function workspaceRoleDescription(role) {
        return workspaceRoleCapabilities(role).join(" · ");
    }

    function canManageWorkspace() {
        return cloudWorkspaceRole === "owner" || cloudWorkspaceRole === "admin";
    }

    function hasWorkspacePermission(capability) {
        if (isSubscriptionLocked()) return false;
        // Enquanto estiver no modo local, o proprietário do dispositivo mantém
        // controle total. Na nuvem, o perfil é a fonte de verdade.
        if (!firebaseUser || !cloudWorkspaceRole || isPlatformAdmin(firebaseUser)) return true;
        var permissions = {
            manageContracts: ["owner", "admin", "operator"],
            manageExpenses: ["owner", "admin", "operator", "finance"],
            managePayments: ["owner", "admin", "operator", "billing", "finance"],
            manageCollections: ["owner", "admin", "operator", "billing"],
            manageSettings: ["owner", "admin", "operator"]
        };
        return (permissions[capability] || []).indexOf(cloudWorkspaceRole) >= 0;
    }

    function workspacePermissionMessage(capability) {
        return {
            manageContracts: "Seu perfil permite consultar contratos, mas não criar, alterar ou encerrar contratos.",
            manageExpenses: "Seu perfil não tem permissão para alterar gastos.",
            managePayments: "Seu perfil não tem permissão para registrar ou ajustar pagamentos.",
            manageCollections: "Seu perfil não tem permissão para registrar cobranças.",
            manageSettings: "Seu perfil não tem permissão para alterar as configurações da área."
        }[capability] || "Seu perfil não tem permissão para realizar esta ação.";
    }

    function requireWorkspacePermission(capability) {
        if (hasWorkspacePermission(capability)) return true;
        setCloudError(workspacePermissionMessage(capability));
        return false;
    }

    function canWriteWorkspace() {
        return hasWorkspacePermission("manageContracts") ||
            hasWorkspacePermission("manageExpenses") ||
            hasWorkspacePermission("managePayments") ||
            hasWorkspacePermission("manageCollections");
    }

    function renderRolePermissions() {
        var controls = [
            ["addUnit", "manageContracts"],
            ["mobileAddUnit", "manageContracts"],
            ["addExpense", "manageExpenses"],
            ["saveUnit", "manageContracts"],
            ["deleteUnit", "manageContracts"],
            ["archiveContract", "manageContracts"],
            ["startNewContract", "manageContracts"],
            ["saveExpense", "manageExpenses"],
            ["deleteExpense", "manageExpenses"],
            ["savePaymentAdjust", "managePayments"],
            ["saveCharge", "manageCollections"],
            ["saveChargeAndOpenWhatsapp", "manageCollections"]
        ];
        controls.forEach(function (item) {
            var button = document.getElementById(item[0]);
            if (button) button.disabled = !hasWorkspacePermission(item[1]);
        });
        document.querySelectorAll("[data-charge-unit]").forEach(function (button) {
            button.disabled = !hasWorkspacePermission("manageCollections");
        });
        document.querySelectorAll(".expense-edit").forEach(function (button) {
            button.disabled = !hasWorkspacePermission("manageExpenses");
        });
    }

    function workspaceSelectElement() {
        return document.getElementById("workspaceSelect");
    }

    function workspaceSectionElement() {
        return document.getElementById("workspaceSection");
    }

    function renderWorkspaceControls() {
        var section = workspaceSectionElement();
        var selector = workspaceSelectElement();
        var role = document.getElementById("workspaceRole");
        var membersSection = document.getElementById("workspaceMembersSection");
        if (!section || !selector || !role || !membersSection) return;

        section.hidden = !firebaseUser || !cloudAccountApproved;
        membersSection.hidden = !firebaseUser || !cloudAccountApproved || !canManageWorkspace();
        if (!firebaseUser || !cloudAccountApproved) return;

        selector.innerHTML = cloudWorkspaces.map(function (workspace) {
            return '<option value="' + escapeHtml(workspace.id) + '">' +
                escapeHtml(workspace.name || "Área de trabalho") + '</option>';
        }).join("");
        selector.value = cloudWorkspaceId || "";
        role.textContent = "Sua permissão: " + workspaceRoleLabel(cloudWorkspaceRole) +
            (isSubscriptionLocked() ? " · assinatura em modo consulta" : "");

        if (canManageWorkspace()) renderWorkspaceMembers();
        renderPlanUsage();
        renderPlatformApprovals();
    }

    function loadWorkspaceList() {
        if (!firebaseDb || !firebaseUser) return Promise.resolve([]);

        var profile = firebaseDb.collection("profiles").doc(firebaseUser.uid);
        var personalId = personalWorkspaceId(firebaseUser);
        return profile.get().then(function (snapshot) {
            var profileData = snapshot.exists ? snapshot.data() || {} : {};
            var ids = Array.isArray(profileData.workspaceIds)
                ? profileData.workspaceIds.filter(function (id) { return typeof id === "string" && id; })
                : [];
            if (ids.indexOf(personalId) < 0) ids.unshift(personalId);

            return Promise.all(ids.map(function (id) {
                return workspaceRef(id).get().then(function (workspaceSnapshot) {
                    if (!workspaceSnapshot.exists) return null;
                    var data = workspaceSnapshot.data() || {};
                    return { id: id, name: typeof data.name === "string" ? data.name : "Área de trabalho" };
                }).catch(function () { return null; });
            }));
        }).then(function (workspaces) {
            cloudWorkspaces = workspaces.filter(Boolean);
            var rememberedWorkspace = localStorage.getItem(
                WORKSPACE_SELECTION_KEY + "-" + firebaseUser.uid
            );
            if (
                rememberedWorkspace &&
                cloudWorkspaces.some(function (item) { return item.id === rememberedWorkspace; }) &&
                (!cloudWorkspaceId || cloudWorkspaceId === personalId)
            ) {
                cloudWorkspaceId = rememberedWorkspace;
            } else if (!cloudWorkspaces.some(function (item) { return item.id === cloudWorkspaceId; })) {
                cloudWorkspaceId = cloudWorkspaces.length ? cloudWorkspaces[0].id : null;
            }
            if (!cloudWorkspaceId) {
                cloudWorkspaceRole = null;
                renderWorkspaceControls();
                return cloudWorkspaces;
            }
            return workspaceMemberRef(cloudWorkspaceId, firebaseUser.uid).get().then(function (memberSnapshot) {
                var member = memberSnapshot.exists ? memberSnapshot.data() || {} : {};
                cloudWorkspaceRole = member.role || null;
                renderWorkspaceControls();
                return cloudWorkspaces;
            });
        });
    }

    function saveWorkspaceSelection() {
        if (!firebaseUser || !cloudWorkspaceId) return;
        localStorage.setItem(WORKSPACE_SELECTION_KEY + "-" + firebaseUser.uid, cloudWorkspaceId);
    }

    function updateWorkspaceRole() {
        if (!firebaseUser || !cloudWorkspaceId) return Promise.resolve(null);
        return workspaceMemberRef(cloudWorkspaceId, firebaseUser.uid).get().then(function (snapshot) {
            var member = snapshot.exists ? snapshot.data() || {} : {};
            cloudWorkspaceRole = member.role || null;
            renderWorkspaceControls();
            return cloudWorkspaceRole;
        });
    }



    function newInviteToken() {
        if (window.crypto && window.crypto.getRandomValues) {
            var bytes = new Uint8Array(24);
            window.crypto.getRandomValues(bytes);
            return Array.prototype.map.call(bytes, function (byte) {
                return byte.toString(16).padStart(2, "0");
            }).join("");
        }
        return Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    }

    function inviteUrl(workspaceId, token) {
        var url = new URL(window.location.href);
        url.searchParams.set("workspace", workspaceId);
        url.searchParams.set("invite", token);
        return url.toString();
    }

    function inviteEmailValue() {
        var input = document.getElementById("workspaceInviteEmail");
        return input ? String(input.value || "").trim().toLowerCase() : "";
    }

    function inviteExpiresLabel(value) {
        var date = value && typeof value.toDate === "function" ? value.toDate() : null;
        return date ? date.toLocaleDateString("pt-BR") : "data não informada";
    }

    function inviteEmailLink(invite) {
        var subject = "Convite para acessar o Controle de Aluguéis";
        var body = "Olá!\n\nVocê foi convidado(a) para acessar uma área no Controle de Aluguéis como " +
            workspaceRoleLabel(invite.role) + ".\n\nUse este link para entrar ou criar sua conta com este mesmo e-mail:\n" +
            invite.link + "\n\nO convite é válido até " + inviteExpiresLabel(invite.expiresAt) +
            ".\n\nPor segurança, o link só funciona para " + invite.email + ".";
        return "mailto:" + encodeURIComponent(invite.email) + "?subject=" +
            encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    }

    function copyInviteLink(link, result) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link).then(function () {
                if (result) result.textContent = "Link copiado.";
            }).catch(function () { window.prompt("Copie este link:", link); });
        } else {
            window.prompt("Copie este link:", link);
        }
    }

    function createWorkspaceInvite() {
        if (!firebaseDb || !firebaseUser || !cloudWorkspaceId || !canManageWorkspace()) return;
        var roleInput = document.getElementById("workspaceInviteRole");
        var result = document.getElementById("workspaceInviteResult");
        var role = roleInput ? roleInput.value : "operator";
        var email = inviteEmailValue();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (result) {
                result.hidden = false;
                result.textContent = "Informe o e-mail da pessoa que receberá o convite.";
            }
            document.getElementById("workspaceInviteEmail").focus();
            return;
        }
        if (["admin", "operator", "billing", "finance", "viewer"].indexOf(role) < 0) return;

        Promise.all([
            workspaceRef(cloudWorkspaceId).collection("members").get(),
            workspaceRef(cloudWorkspaceId).collection("invites").where("status", "==", "pending").get()
        ]).then(function (snapshots) {
            var committedMembers = snapshots[0].size;
            var pendingInvites = snapshots[1].size;
            if (!canCreateWithinPlan("users", committedMembers + pendingInvites)) return null;
            var token = newInviteToken();
            var expiresAt = firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
            var link = inviteUrl(cloudWorkspaceId, token);
            var invite = {
                role: role,
                email: email,
                status: "pending",
                createdAt: Date.now(),
                expiresAt: expiresAt,
                createdBy: firebaseUser.uid,
                lastSentAt: Date.now()
            };
            return workspaceRef(cloudWorkspaceId).collection("invites").doc(token).set(invite).then(function () {
                if (!result) return;
                result.hidden = false;
                result.innerHTML = 'Convite preparado para <strong>' + escapeHtml(email) +
                    '</strong>, válido por 7 dias. <button class="btn btn-ghost" type="button" data-email-invite>Abrir e-mail</button> <button class="btn btn-ghost" type="button" data-copy-invite>Copiar link</button>';
                var emailButton = result.querySelector("[data-email-invite]");
                var copyButton = result.querySelector("[data-copy-invite]");
                if (emailButton) emailButton.addEventListener("click", function () {
                    window.location.href = inviteEmailLink(Object.assign({ link: link }, invite));
                });
                if (copyButton) copyButton.addEventListener("click", function () { copyInviteLink(link, result); });
                renderWorkspaceMembers();
                renderPlanUsage();
            });
        }).catch(function (error) {
            setCloudError(cloudErrorMessage(error));
        });
    }

    function renderWorkspaceMembers() {
        var list = document.getElementById("workspaceMembersList");
        var overview = document.getElementById("workspacePermissions");
        if (!list || !canManageWorkspace() || !cloudWorkspaceId) return;
        list.innerHTML = '<p class="settings-note">Carregando colaboradores...</p>';
        Promise.all([
            workspaceRef(cloudWorkspaceId).collection("members").get(),
            workspaceRef(cloudWorkspaceId).collection("invites").get()
        ]).then(function (snapshots) {
            var snapshot = snapshots[0];
            var inviteSnapshot = snapshots[1];
            var members = [];
            snapshot.forEach(function (item) {
                var member = item.data() || {};
                members.push({ id: item.id, email: member.email || item.id, role: member.role || "viewer", displayName: member.displayName || "" });
            });
            var order = ["owner", "admin", "operator", "billing", "finance", "viewer"];
            members.sort(function (left, right) {
                return order.indexOf(left.role) - order.indexOf(right.role) || left.email.localeCompare(right.email);
            });
            if (overview) {
                overview.innerHTML = '<div class="workspace-access-heading"><h4>Perfis e funcionalidades</h4><p>Veja quem tem cada perfil e qual é o escopo de acesso correspondente.</p></div>' +
                    '<div class="workspace-role-matrix">' + order.map(function (role) {
                        var assigned = members.filter(function (member) { return member.role === role; });
                        var capabilities = workspaceRoleCapabilities(role);
                        return '<article class="workspace-role-card"><div><strong>' + escapeHtml(workspaceRoleLabel(role)) + '</strong><span>' + assigned.length + ' ' + (assigned.length === 1 ? 'usuário' : 'usuários') + '</span></div><ul>' + capabilities.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join("") + '</ul></article>';
                    }).join("") + '</div>';
            }
            list.innerHTML = '<h4 class="workspace-members-heading">Usuários desta área (' + members.length + ')</h4>' + (members.length ? members.map(function (member) {
                var removable = member.role !== "owner";
                return '<div class="workspace-member-row"><div><strong>' + escapeHtml(member.displayName || member.email) + '</strong><span>' + escapeHtml(member.email) + ' · ' + escapeHtml(workspaceRoleLabel(member.role)) + '</span><small>' + escapeHtml(workspaceRoleDescription(member.role)) + '</small></div>' + (removable ? '<div class="workspace-member-actions"><select data-member-role="' + escapeHtml(member.id) + '">' + ["admin","operator","billing","finance","viewer"].map(function(role){return '<option value="'+role+'"'+(member.role===role?' selected':'')+'>'+workspaceRoleLabel(role)+'</option>';}).join("") + '</select><button class="btn btn-danger" type="button" data-remove-member="' + escapeHtml(member.id) + '">Remover</button></div>' : '<span class="workspace-owner">Proprietário</span>') + '</div>';
            }).join("") : '<p class="settings-note">Nenhum colaborador cadastrado.</p>');
            list.querySelectorAll("[data-member-role]").forEach(function (select) {
                select.addEventListener("change", function () {
                    workspaceMemberRef(cloudWorkspaceId, select.dataset.memberRole).set({ role: select.value }, { merge: true })
                        .then(renderWorkspaceMembers)
                        .catch(function(error){ setCloudError(cloudErrorMessage(error)); });
                });
            });
            list.querySelectorAll("[data-remove-member]").forEach(function (button) {
                button.addEventListener("click", function () {
                    if (!window.confirm("Remover o acesso deste colaborador?")) return;
                    workspaceMemberRef(cloudWorkspaceId, button.dataset.removeMember).delete()
                        .then(renderWorkspaceMembers)
                        .catch(function (error) { setCloudError(cloudErrorMessage(error)); });
                });
            });

            var invites = [];
            inviteSnapshot.forEach(function (item) {
                var invite = item.data() || {};
                invite.id = item.id;
                invites.push(invite);
            });
            invites.sort(function (left, right) { return Number(right.createdAt) - Number(left.createdAt); });
            var inviteMarkup = invites.length ? '<h4 class="workspace-members-heading">Convites</h4>' +
                invites.map(function (invite) {
                    var expired = !invite.expiresAt || invite.expiresAt.toDate() <= new Date();
                    var status = invite.status === "pending" && expired ? "expirado" : (invite.status || "pendente");
                    var isPending = status === "pending";
                    var inviteLink = inviteUrl(cloudWorkspaceId, invite.id);
                    return '<div class="workspace-invite-row"><div><strong>' + escapeHtml(invite.email || "E-mail não informado") + '</strong><span>' +
                        escapeHtml(workspaceRoleLabel(invite.role || "viewer")) + ' · ' + escapeHtml(status.charAt(0).toUpperCase() + status.slice(1)) +
                        '</span><small>' + (isPending ? 'Válido até ' + inviteExpiresLabel(invite.expiresAt) : 'Criado em ' + new Date(Number(invite.createdAt) || Date.now()).toLocaleDateString("pt-BR")) +
                        '</small></div>' + (isPending ? '<div class="workspace-member-actions"><button class="btn btn-ghost" type="button" data-email-invite="' + escapeHtml(invite.id) + '">Reenviar</button><button class="btn btn-danger" type="button" data-revoke-invite="' + escapeHtml(invite.id) + '">Revogar</button></div>' : '') + '</div>';
                }).join("") : "";
            list.insertAdjacentHTML("beforeend", inviteMarkup);
            list.querySelectorAll("[data-email-invite]").forEach(function (button) {
                button.addEventListener("click", function () {
                    var invite = invites.find(function (item) { return item.id === button.dataset.emailInvite; });
                    if (!invite) return;
                    var expiresAt = firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
                    workspaceRef(cloudWorkspaceId).collection("invites").doc(invite.id).update({
                        expiresAt: expiresAt,
                        lastSentAt: Date.now()
                    }).then(function () {
                        invite.expiresAt = expiresAt;
                        invite.link = inviteUrl(cloudWorkspaceId, invite.id);
                        window.location.href = inviteEmailLink(invite);
                        renderWorkspaceMembers();
                    }).catch(function (error) { setCloudError(cloudErrorMessage(error)); });
                });
            });
            list.querySelectorAll("[data-revoke-invite]").forEach(function (button) {
                button.addEventListener("click", function () {
                    if (!window.confirm("Revogar este convite? O link deixará de funcionar imediatamente.")) return;
                    workspaceRef(cloudWorkspaceId).collection("invites").doc(button.dataset.revokeInvite).update({
                        status: "revoked",
                        revokedAt: Date.now(),
                        revokedBy: firebaseUser.uid
                    }).then(renderWorkspaceMembers)
                        .catch(function (error) { setCloudError(cloudErrorMessage(error)); });
                });
            });
        }).catch(function (error) {
            list.innerHTML = '<p class="cloud-error">Não foi possível carregar os colaboradores.</p>';
            if (overview) overview.innerHTML = "";
            setCloudError(cloudErrorMessage(error));
        });
    }

    function pendingInviteFromUrl(user) {
        if (!firebaseDb || !user) return Promise.resolve(null);
        var params = new URLSearchParams(window.location.search);
        var workspaceId = params.get("workspace");
        var token = params.get("invite");
        if (!workspaceId || !token || !/^[a-zA-Z0-9_-]{20,}$/.test(token)) return Promise.resolve(null);
        return workspaceRef(workspaceId).collection("invites").doc(token).get().then(function (snapshot) {
            if (!snapshot.exists) throw new Error("Convite não encontrado.");
            var data = snapshot.data() || {};
            if (String(data.email || "").toLowerCase() !== String(user.email || "").toLowerCase()) {
                throw new Error("Este convite foi enviado para outro e-mail.");
            }
            return { workspaceId: workspaceId, token: token };
        });
    }

    function acceptInviteFromUrl() {
        if (!firebaseDb || !firebaseUser) return Promise.resolve(null);
        var params = new URLSearchParams(window.location.search);
        var workspaceId = params.get("workspace");
        var token = params.get("invite");
        if (!workspaceId || !token || !/^[a-zA-Z0-9_-]{20,}$/.test(token)) return Promise.resolve(null);

        var invite = workspaceRef(workspaceId).collection("invites").doc(token);
        var profile = firebaseDb.collection("profiles").doc(firebaseUser.uid);
        return Promise.all([invite.get(), profile.get()]).then(function (snapshots) {
            var snapshot = snapshots[0];
            var profileSnapshot = snapshots[1];
            if (!snapshot.exists) throw new Error("Convite não encontrado.");
            var data = snapshot.data() || {};
            var role = data.role;
            var invitedEmail = String(data.email || "").toLowerCase();
            var currentEmail = String(firebaseUser.email || "").toLowerCase();
            var expired = !data.expiresAt || data.expiresAt.toDate() <= new Date();
            if (invitedEmail !== currentEmail) throw new Error("Entre com o mesmo e-mail que recebeu o convite.");
            if (data.status !== "pending" || expired || ["admin", "operator", "billing", "finance", "viewer"].indexOf(role) < 0) {
                throw new Error("Este convite expirou, foi revogado ou já foi utilizado.");
            }

            var batch = firebaseDb.batch();
            var profilePayload = profileSnapshot.exists ? {
                email: firebaseUser.email || "",
                displayName: firebaseUser.displayName || "",
                workspaceIds: firebase.firestore.FieldValue.arrayUnion(workspaceId),
                updatedAt: Date.now()
            } : {
                email: firebaseUser.email || "",
                displayName: firebaseUser.displayName || "",
                workspaceIds: [workspaceId],
                invitedOnly: true,
                acceptedWorkspaceId: workspaceId,
                acceptedInviteId: token,
                updatedAt: Date.now()
            };
            batch.set(profile, profilePayload, { merge: true });
            batch.set(workspaceMemberRef(workspaceId, firebaseUser.uid), {
                role: role,
                email: firebaseUser.email || "",
                displayName: firebaseUser.displayName || "",
                inviteId: token,
                joinedAt: Date.now()
            });
            batch.update(invite, {
                status: "accepted",
                acceptedBy: firebaseUser.uid,
                acceptedAt: Date.now()
            });
            return batch.commit().then(function () { return workspaceId; });
        }).then(function (acceptedWorkspaceId) {
            params.delete("workspace");
            params.delete("invite");
            var url = window.location.pathname + (params.toString() ? "?" + params.toString() : "") + window.location.hash;
            window.history.replaceState({}, "", url);
            return acceptedWorkspaceId;
        });
    }

    function bindWorkspaceControls() {
        if (workspaceUiBound) return;
        workspaceUiBound = true;
        var selector = workspaceSelectElement();
        var inviteButton = document.getElementById("createWorkspaceInvite");
        if (selector) selector.addEventListener("change", function () {
            activateWorkspace(selector.value).catch(function (error) {
                setCloudError(cloudErrorMessage(error));
                renderWorkspaceControls();
            });
        });
        if (inviteButton) inviteButton.addEventListener("click", createWorkspaceInvite);
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




    function finishCloudReconciliation() {
        cloudReconcile.hidden = true;
        cloudBanner.hidden = true;
        cloudPendingRemote = null;
        subscribeCloud();
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
        // A escolha explícita pelo aparelho atualiza a base de comparação.
        // Assim a próxima gravação não sobrescreve uma alteração remota sem confirmação.
        var localState = state;
        return readGranularState().then(function (remote) {
            cloudGranularBaseline = remote
                ? granularSnapshot(remote)
                : { meta: null, units: {}, expenses: {}, contracts: {} };
            state = localState;
            expenseCategories = state.expenseCategories;
            cloudReconcile.hidden = true;
            cloudBanner.hidden = true;
            cloudPendingRemote = null;
            cloudUpdatedAt = Date.now();
            scheduleCloudWrite();
            subscribeCloud();
        }).catch(function (error) {
            setCloudError(cloudErrorMessage(error));
        });
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
        updatePlatformAdminTrigger();
    }

    function prepareWorkspaceAccess(user) {
        return pendingInviteFromUrl(user).then(function (inviteContext) {
            if (inviteContext) {
                // Colaboradores convidados não precisam de uma assinatura própria:
                // o acesso é limitado à área para a qual foram convidados.
                cloudAccountApproved = true;
                updateCloudUi();
                renderWorkspaceControls();
                setAccountAccessNotice("Convite identificado. Vinculando você à área de trabalho...");
                return acceptInviteFromUrl().then(function (workspaceId) {
                    return loadWorkspaceList().then(function () { return workspaceId; });
                });
            }

            return requestOrCheckAccountApproval(user)
                .catch(function (error) {
                    error.workspaceStep = error.workspaceStep || "verificar a aprovação da conta";
                    throw error;
                })
                .then(function (approved) {
                    cloudAccountApproved = approved;
                    updateCloudUi();
                    renderWorkspaceControls();
                    if (!approved) {
                        cloudAccessChecking = false;
                        cloudWorkspaceReady = false;
                        cloudWorkspaceId = null;
                        cloudWorkspaces = [];
                        cloudWorkspaceRole = null;
                        setCloudStatus("Conta conectada. Aguardando aprovação da administração.");
                        setSyncStatus("Acesso pendente");
                        setAccountGate(true, {
                            title: "Cadastro em análise",
                            message: "Seu cadastro foi recebido. Aguarde a aprovação da administração para liberar a área de trabalho.",
                            pending: true
                        });
                        renderPlatformApprovals();
                        return null;
                    }
                    setAccountAccessNotice("");
                    cloudSessionStartedAt = Date.now();
                    firebaseDb.collection("profiles").doc(user.uid).set({
                        lastAccessAt: cloudSessionStartedAt
                    }, { merge: true }).catch(function () {});
                    return ensurePersonalWorkspace(user).then(function () {
                        return loadWorkspaceList();
                    }).then(function () {
                        return acceptInviteFromUrl();
                    });
                });
        }).then(function (acceptedWorkspaceId) {
            if (acceptedWorkspaceId === null && !cloudAccountApproved) return null;
            return loadWorkspaceList().then(function () { return acceptedWorkspaceId || null; });
        });
    }

    function handleCloudAuthState(user) {
        firebaseUser = user;

        setCloudError("");

        updateCloudUi();

        if (firebaseUnsubscribe) {
            firebaseUnsubscribe();

            firebaseUnsubscribe = null;
        }
        if (platformPendingUnsubscribe) {
            platformPendingUnsubscribe();
            platformPendingUnsubscribe = null;
        }

        if (user) {
            cloudAccessChecking = true;
            // A conta já autenticada vê primeiro o PIN do dispositivo.
            // A aprovação continua sendo verificada em segundo plano.
            if (lockConfig) openAuthLogin();
            setAccountGate(true, {
                title: "Verificando acesso",
                message: "Estamos preparando sua área de trabalho.",
                pending: true,
                verifying: true
            });
            setCloudStatus("Conta conectada. Verificando a liberação da conta...");
            cloudAccountApproved = false;
            setAccountAccessNotice("");
            prepareWorkspaceAccess(user)
                .then(function (acceptedWorkspaceId) {
                    if (acceptedWorkspaceId === null && !cloudAccountApproved) return;
                    if (!firebaseUser || firebaseUser.uid !== user.uid) return;
                    rememberOfflineAccess(user);
                    bindWorkspaceControls();
                    setCloudStatus("Conta conectada. Sincronização automática ativa.");
                    if (acceptedWorkspaceId) return activateWorkspace(acceptedWorkspaceId).then(function () {
                        cloudAccessChecking = false;
                        setAccountGate(false);
                        if (appUnlocked) revealApp();
                        else if (authModal.hidden) initAuth();
                    });
                    reconcileCloud();
                    cloudAccessChecking = false;
                    setAccountGate(false);
                    if (appUnlocked) revealApp();
                    else if (authModal.hidden) initAuth();
                })
                .catch(function (error) {
                    cloudAccessChecking = false;
                    cloudWorkspaceReady = false;
                    cloudWorkspaceId = null;
                    setCloudError(cloudErrorMessage(error));
                    setSyncStatus("Não sincronizado — salvo localmente");
                    setAccountGate(true, {
                        title: "Não foi possível liberar o acesso",
                        message: "Verifique sua conexão ou tente novamente em alguns instantes.",
                        pending: false
                    });
                });
        } else {
            localStorage.removeItem(OFFLINE_ACCESS_KEY);
            cloudAccessChecking = false;
            cloudAccountApproved = false;
            setAccountAccessNotice("");
            if (platformApprovalsSection) platformApprovalsSection.hidden = true;
            cloudWorkspaceId = null;
            cloudWorkspaceReady = false;
            cloudWorkspaces = [];
            cloudWorkspaceRole = null;
            renderWorkspaceControls();
            setCloudStatus(
                "Sincronização opcional com Firebase. Seus dados locais permanecem disponíveis."
            );
            setAccountGate(true, {
                title: "Acesse sua conta",
                message: "Entre ou crie sua conta para solicitar acesso à plataforma.",
                pending: false
            });
        }
    }

    function setCloudStatus(message) {
        cloudStatus.textContent = message;
    }

    function initFirebase() {
        if (!window.firebase || !firebase.initializeApp) {
            if (canUseOfflineMode()) {
                cloudAccessChecking = false;
                cloudAccountApproved = true;
                setCloudStatus("Modo offline. Dados deste aparelho disponíveis.");
                setSyncStatus("Offline — alterações salvas neste aparelho");
                return;
            }
            setCloudStatus(
                "Nuvem indisponível neste carregamento. Conecte-se à internet para validar o acesso."
            );
            return;
        }

        try {
            if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);

            firebaseAuth = firebase.auth();

            firebaseDb = firebase.firestore();

            // O aplicativo preserva o seu estado localmente. Não habilitamos a
            // persistência legada do Firestore, que foi descontinuada pelo SDK.

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

    function cloudAuthButtons() {
        return ["cloudSignIn", "cloudSignUp", "cloudGoogleSignIn", "cloudResetPassword", "accountGateSignIn", "accountGateSignUp", "accountGateGoogle", "accountGateReset"]
            .map(function (id) { return document.getElementById(id); })
            .filter(Boolean);
    }

    function refreshCloudAuthControls() {
        var coolingDown = Date.now() < cloudAuthCooldownUntil;
        cloudAuthButtons().forEach(function (button) {
            button.disabled = cloudAuthInFlight || coolingDown;
        });
        if (cloudAuthCooldownTimer) clearTimeout(cloudAuthCooldownTimer);
        if (coolingDown) {
            cloudAuthCooldownTimer = setTimeout(function () {
                cloudAuthCooldownTimer = null;
                refreshCloudAuthControls();
            }, Math.max(0, cloudAuthCooldownUntil - Date.now()) + 50);
        }
    }

    function startCloudAuthAttempt() {
        if (cloudAuthInFlight) {
            setCloudError("Uma tentativa de acesso já está em andamento.");
            return false;
        }
        if (Date.now() < cloudAuthCooldownUntil) {
            var minutes = Math.max(1, Math.ceil((cloudAuthCooldownUntil - Date.now()) / 60000));
            setCloudError("Aguarde cerca de " + minutes + " minuto(s) antes de tentar novamente.");
            return false;
        }
        cloudAuthInFlight = true;
        refreshCloudAuthControls();
        return true;
    }

    function finishCloudAuthAttempt(error) {
        cloudAuthInFlight = false;
        if (error && error.code === "auth/too-many-requests") {
            // O tempo exato é definido pelo Firebase; 15 minutos evita insistência.
            cloudAuthCooldownUntil = Date.now() + 15 * 60 * 1000;
        }
        refreshCloudAuthControls();
    }

    function runCloudAuth(action) {
        setCloudError("");
        if (!startCloudAuthAttempt()) return;

        var email = cloudEmail.value.trim();

        var password = cloudPassword.value;

        if (!email || email.indexOf("@") < 1) {
            setCloudError("Informe um e-mail válido.");
            cloudEmail.focus();
            finishCloudAuthAttempt();
            return;
        }

        if (password.length < 6) {
            setCloudError("A senha deve ter pelo menos 6 caracteres.");
            cloudPassword.focus();
            finishCloudAuthAttempt();
            return;
        }

        if (!firebaseAuth) {
            setCloudError("A nuvem ainda não está disponível. Tente novamente em instantes.");
            finishCloudAuthAttempt();
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
                return null;
            })
            .then(function () { finishCloudAuthAttempt(); })
            .catch(function (error) {
                setCloudError(cloudErrorMessage(error));
                finishCloudAuthAttempt(error);
            });
    }

    function resetCloudPassword() {
        if (!startCloudAuthAttempt()) return;
        var email = cloudEmail.value.trim();
        if (!email || email.indexOf("@") < 1) {
            setCloudError("Informe seu e-mail para receber o link de recuperação.");
            cloudEmail.focus();
            finishCloudAuthAttempt();
            return;
        }
        firebaseAuth.sendPasswordResetEmail(email).then(function () {
            setCloudError("Enviamos o link para redefinir sua senha.");
            finishCloudAuthAttempt();
        }).catch(function (error) {
            setCloudError(cloudErrorMessage(error));
            finishCloudAuthAttempt(error);
        });
    }

    function signInWithGoogle() {
        if (!firebaseAuth || !window.firebase || !startCloudAuthAttempt()) return;
        var provider = new firebase.auth.GoogleAuthProvider();
        firebaseAuth.signInWithPopup(provider).then(function () {
            finishCloudAuthAttempt();
        }).catch(function (error) {
            setCloudError(cloudErrorMessage(error));
            finishCloudAuthAttempt(error);
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

    async function biometricAvailable() {
        if (
            !window.PublicKeyCredential ||
            !navigator.credentials ||
            typeof navigator.credentials.create !== "function"
        ) {
            return false;
        }

        try {
            if (
                typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
                "function"
            ) {
                return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    function biometricConfigured() {
        return !!(lockConfig && lockConfig.credentialId);
    }

    async function updateBiometricUi() {
        if (!biometricStatus || !enableBiometricButton || !removeBiometricButton)
            return;

        var supported = await biometricAvailable();
        var configured = biometricConfigured();

        enableBiometricButton.hidden = !supported || !lockConfig || configured;
        removeBiometricButton.hidden = !configured;

        if (!supported) {
            biometricStatus.textContent =
                "Desbloqueio por digital não está disponível neste aparelho ou navegador.";
            return;
        }

        biometricStatus.textContent = configured
            ? "Desbloqueio por digital ativo neste aparelho."
            : lockConfig
            ? "Use a digital ou o bloqueio de tela do aparelho para entrar mais rápido."
            : "Defina um PIN antes de ativar o desbloqueio por digital.";
    }

    async function enableBiometric() {
        if (!lockConfig) return;

        if (!(await verifyPin(currentPin.value, lockConfig))) {
            securityStatus.textContent =
                "Informe o PIN atual para ativar a digital.";
            securityStatus.style.color = "#a52d3b";
            currentPin.focus();
            return;
        }

        if (!(await biometricAvailable())) {
            biometricStatus.textContent =
                "A digital não está disponível neste aparelho ou navegador.";
            return;
        }

        try {
            var credential = await navigator.credentials.create({
                publicKey: {
                    challenge: randomBytes(32),
                    rp: {
                        name: "Controle de Aluguéis",
                        id: window.location.hostname,
                    },
                    user: {
                        id: randomBytes(32),
                        name: "acesso-local",
                        displayName: "Acesso local",
                    },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required",
                        residentKey: "discouraged",
                    },
                    timeout: 60000,
                    attestation: "none",
                },
            });

            if (!credential || !credential.rawId) {
                throw new Error("Credencial não criada.");
            }

            saveLockConfig(
                Object.assign({}, lockConfig, {
                    credentialId: bytesToBase64Url(
                        new Uint8Array(credential.rawId)
                    ),
                })
            );
            currentPin.value = "";
            securityStatus.textContent =
                "Digital ativada neste aparelho.";
            securityStatus.style.color = "#0f766e";
            await updateBiometricUi();
        } catch (error) {
            biometricStatus.textContent =
                error && error.name === "NotAllowedError"
                    ? "A confirmação foi cancelada ou o aparelho não tem bloqueio de tela configurado."
                    : "Não foi possível ativar a digital neste navegador. Confirme o bloqueio de tela e tente novamente.";
        }
    }

    async function removeBiometric() {
        if (!biometricConfigured()) return;

        if (!(await verifyPin(currentPin.value, lockConfig))) {
            securityStatus.textContent =
                "Informe o PIN atual para remover a digital.";
            securityStatus.style.color = "#a52d3b";
            currentPin.focus();
            return;
        }

        saveLockConfig(
            Object.assign({}, lockConfig, { credentialId: null })
        );
        currentPin.value = "";
        securityStatus.textContent =
            "Desbloqueio por digital removido deste aparelho.";
        securityStatus.style.color = "#0f766e";
        await updateBiometricUi();
    }

    async function unlockWithBiometric() {
        if (
            authMode !== "login" ||
            !biometricConfigured() ||
            biometricUnlockInProgress
        ) return;

        biometricUnlockInProgress = true;
        try {
            var assertion = await navigator.credentials.get({
                publicKey: {
                    challenge: randomBytes(32),
                    allowCredentials: [
                        {
                            type: "public-key",
                            id: base64UrlToBytes(lockConfig.credentialId),
                            transports: ["internal"],
                        },
                    ],
                    userVerification: "required",
                    timeout: 60000,
                },
            });

            if (!assertion) throw new Error("Autenticação não concluída.");

            appUnlocked = true;
            closeAuth();
            revealApp();
            render();
        } catch (error) {
            // Cancelamento, indisponibilidade ou falha da digital não é um erro
            // visível: volta diretamente para o PIN, sem deixar aviso atrás do
            // diálogo do sistema.
            showPinLogin();
        } finally {
            biometricUnlockInProgress = false;
        }
    }

    function showPinLogin() {
        if (authMode !== "login") return;

        authMessage.textContent = "Digite seu PIN para acessar.";
        authPinLabel.hidden = false;
        authSubmit.hidden = false;
        authBiometric.hidden = true;
        authPin.value = "";
        showAuthError("");
        setTimeout(function () {
            focusAuthInput(authPin);
        }, 0);
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
        authBiometric.hidden = true;
        authSubmit.hidden = false;

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
        // Eventos de autenticação/nuvem podem disparar durante a mesma abertura.
        // Não reinicia a tela nem chama a digital uma segunda vez.
        if (!authModal.hidden && authMode === "login" && biometricAutoPromptAttempted) {
            return;
        }

        var freshLogin = authModal.hidden;
        if (freshLogin) biometricAutoPromptAttempted = false;

        document.body.classList.add("app-loading");
        authMode = "login";

        authTitle.textContent = "Entrar";

        var useBiometric = biometricConfigured();

        authMessage.textContent = useBiometric
            ? "Confirme sua digital para acessar."
            : "Digite seu PIN para acessar.";

        authNewLabel.hidden = true;
        authConfirmLabel.hidden = true;
        authPinLabel.hidden = useBiometric;
        authSkip.hidden = true;
        authBiometric.hidden = !useBiometric;
        authBiometric.textContent = "Entrar com PIN";
        authSubmit.hidden = useBiometric;

        authSubmit.textContent = "Entrar";

        authPin.value = "";
        showAuthError("");

        authModal.hidden = false;
        setTimeout(function () {
            if (useBiometric && !biometricAutoPromptAttempted) {
                biometricAutoPromptAttempted = true;
                unlockWithBiometric();
            } else if (!useBiometric) {
                focusAuthInput(authPin);
            }
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
        // Não revela os dados locais enquanto a conta ainda está sendo validada.
        if (cloudAccessChecking) return;
        scrollPageToTop();
        document.body.classList.remove("app-loading");
        appLastActivityAt = Date.now();
        authUnlockGraceUntil = Date.now() + 2000;
        armAutoLock();
        window.setTimeout(runPwaShortcut, 0);

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
        // O PIN protege este dispositivo, mas não substitui a autenticação
        // da plataforma. Sem conta liberada, o aplicativo permanece fechado.
        var offlineMode = canUseOfflineMode();
        if ((!firebaseUser || !cloudAccountApproved) && !offlineMode) {
            var restoringSession = !!cloudInitialized && !firebaseUser;
            setAccountGate(true, {
                title: restoringSession ? "Verificando acesso" : "Acesse sua conta",
                message: restoringSession
                    ? "Estamos preparando sua área de trabalho."
                    : "Entre ou crie sua conta para solicitar acesso à plataforma.",
                pending: false,
                verifying: restoringSession
            });
            return;
        }

        if (offlineMode) {
            setAccountGate(false);
            setCloudStatus("Modo offline. Entre com seu PIN para acessar os dados deste aparelho.");
            setSyncStatus("Offline — alterações salvas neste aparelho");
        }

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
        var remaining = Math.max(0, AUTO_LOCK_MS - (Date.now() - appLastActivityAt));
        autoLockTimer = setTimeout(function () {
            if (Date.now() - appLastActivityAt >= AUTO_LOCK_MS) lockApp();
            else armAutoLock();
        }, remaining);
    }

    function lockApp() {
        clearTimeout(autoLockTimer);
        // Alguns navegadores móveis emitem visibility/pageshow ao fechar o teclado.
        // Durante a confirmação do login, esses eventos não devem abrir o PIN novamente.
        if (Date.now() < authUnlockGraceUntil) {
            armAutoLock();
            return;
        }
        if (!lockConfig || !appUnlocked) return;
        appUnlocked = false;
        openAuthLogin();
    }

    function registerAppActivity() {
        if (!appUnlocked) return;
        appLastActivityAt = Date.now();
        armAutoLock();
    }

    function checkSessionOnReturn() {
        if (!appUnlocked) return;
        if (Date.now() < authUnlockGraceUntil) {
            armAutoLock();
            return;
        }
        if (Date.now() - appLastActivityAt >= AUTO_LOCK_MS) lockApp();
        else armAutoLock();
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
        authBiometric.hidden = true;
        authSubmit.hidden = false;
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
            if (
                y === selectedYear &&
                (statuses[key] === "atrasado" || effectiveStatus(unit, m) === "atrasado")
            ) {
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
                '<button class="tenant-action charge-btn" type="button" aria-label="Cobrar ' +
                escapeHtml(unit.tenantName || "inquilino") +
                ' pelo WhatsApp" data-tenant-action data-charge-unit="' + escapeHtml(unit.id) + '">Cobrar</button>';
        }
        var whatsapp = whatsappUrl(unit.tenantPhone);
        if (whatsapp) {
            actions +=
                '<a class="tenant-action" href="' +
                escapeHtml(whatsapp) +
                '" target="_blank" rel="noopener noreferrer" aria-label="Falar com ' +
                escapeHtml(unit.tenantName || "inquilino") +
                ' pelo WhatsApp" data-tenant-action><svg class="tenant-whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a9.82 9.82 0 0 0-8.46 14.81L2.5 21.5l4.84-.99A9.82 9.82 0 1 0 12 2Z"></path><path fill="#ffffff" d="M16.97 14.54c-.2.56-1.13 1.03-1.57 1.1-.42.07-.96.1-1.55-.09-.35-.11-.8-.26-1.38-.51-2.43-1.05-4.02-3.51-4.14-3.67-.12-.16-.99-1.32-.99-2.52 0-1.2.63-1.79.85-2.03.22-.24.48-.3.64-.3.16 0 .32 0 .46.01.15.01.35-.06.55.42.2.48.67 1.65.73 1.77.06.12.1.27.02.43-.08.16-.12.27-.24.41-.12.14-.25.31-.36.42-.12.12-.24.25-.1.49.14.24.63 1.04 1.35 1.68.93.83 1.72 1.09 1.96 1.21.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.39.66 1.63.78.24.12.4.18.46.28.06.1.06.58-.14 1.14Z"></path></svg></a>';
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

    function onboardingStorageKey() {
        return "controle-alugueis-onboarding-" + (firebaseUser ? firebaseUser.uid : "local");
    }

    function onboardingProgress() {
        try { return JSON.parse(localStorage.getItem(onboardingStorageKey()) || "{}") || {}; }
        catch (error) { return {}; }
    }

    function saveOnboardingProgress(progress) {
        localStorage.setItem(onboardingStorageKey(), JSON.stringify(progress || {}));
    }

    function onboardingSteps() {
        var enterprise = state.empreendimentos[0] || {};
        var enterpriseReady = state.empreendimentos.some(function (item) {
            return item.name && item.name !== DEFAULT_ENTERPRISE_NAME;
        });
        var unitReady = state.units.length > 0;
        var contractReady = state.units.some(function (unit) {
            return String(unit.tenantName || "").trim() && Number.isInteger(Number(unit.dueDay));
        });
        var progress = onboardingProgress();
        return {
            enterprise: enterprise,
            enterpriseReady: enterpriseReady,
            unitReady: unitReady,
            contractReady: contractReady,
            chargesReady: progress.chargesReviewed === true,
            progress: progress
        };
    }

    function renderOnboarding() {
        if (!onboardingContent) return;
        var steps = onboardingSteps();
        var completed = [steps.enterpriseReady, steps.unitReady, steps.contractReady, steps.chargesReady]
            .filter(Boolean).length;
        var enterpriseAction = steps.enterpriseReady
            ? '<span class="onboarding-done">Concluído</span>'
            : '<div class="onboarding-enterprise"><input id="onboardingEnterpriseName" maxlength="80" placeholder="Ex.: Residencial Boa Vista" value="' + escapeHtml(steps.enterprise.name === DEFAULT_ENTERPRISE_NAME ? "" : steps.enterprise.name || "") + '"><button id="onboardingSaveEnterprise" class="btn btn-primary" type="button">Salvar</button></div>';
        var unitAction = steps.unitReady
            ? '<span class="onboarding-done">Concluído</span>'
            : '<button id="onboardingAddUnit" class="btn btn-primary" type="button">Cadastrar unidade</button>';
        var contractAction = steps.contractReady
            ? '<span class="onboarding-done">Concluído</span>'
            : steps.unitReady
                ? '<button id="onboardingEditContract" class="btn btn-ghost" type="button">Completar contrato</button>'
                : '<span class="onboarding-wait">Disponível após a unidade</span>';
        var chargesAction = steps.chargesReady
            ? '<span class="onboarding-done">Concluído</span>'
            : '<button id="onboardingReviewCharges" class="btn btn-ghost" type="button">Revisar cobrança</button>';
        onboardingContent.innerHTML = '<div class="onboarding-progress"><strong>' + completed + '/4 concluídos</strong><span>Você pode concluir agora ou continuar depois.</span></div>' +
            '<ol class="onboarding-steps">' +
            '<li class="' + (steps.enterpriseReady ? "is-done" : "") + '"><span>1</span><div><strong>Nomeie seu empreendimento</strong><small>Organize seus imóveis desde o início.</small>' + enterpriseAction + '</div></li>' +
            '<li class="' + (steps.unitReady ? "is-done" : "") + '"><span>2</span><div><strong>Cadastre a primeira unidade</strong><small>Inclua a identificação do imóvel.</small>' + unitAction + '</div></li>' +
            '<li class="' + (steps.contractReady ? "is-done" : "") + '"><span>3</span><div><strong>Informe o primeiro contrato</strong><small>Inquilino, valor e dia de vencimento.</small>' + contractAction + '</div></li>' +
            '<li class="' + (steps.chargesReady ? "is-done" : "") + '"><span>4</span><div><strong>Revise multa e juros</strong><small>Defina suas regras antes da primeira cobrança.</small>' + chargesAction + '</div></li></ol>';

        var saveEnterprise = document.getElementById("onboardingSaveEnterprise");
        if (saveEnterprise) saveEnterprise.addEventListener("click", function () {
            var input = document.getElementById("onboardingEnterpriseName");
            var name = input.value.trim();
            if (!name) { input.focus(); return; }
            var target = state.empreendimentos[0];
            if (target) target.name = name;
            else state.empreendimentos.push({ id: newEnterpriseId(), name: name });
            selectedEmpreendimentoId = state.empreendimentos[0].id;
            saveSelectedEmpreendimento();
            saveState();
            renderOnboarding();
        });
        var addUnit = document.getElementById("onboardingAddUnit");
        if (addUnit) addUnit.addEventListener("click", function () {
            onboardingResumeRequested = true;
            ModalManager.close(onboardingModal);
            openModal();
        });
        var editContract = document.getElementById("onboardingEditContract");
        if (editContract) editContract.addEventListener("click", function () {
            onboardingResumeRequested = true;
            ModalManager.close(onboardingModal);
            openModal(state.units[0].id);
        });
        var reviewCharges = document.getElementById("onboardingReviewCharges");
        if (reviewCharges) reviewCharges.addEventListener("click", function () {
            var progress = onboardingProgress();
            progress.chargesReviewed = true;
            saveOnboardingProgress(progress);
            renderOnboarding();
            openSettings();
        });
    }

    function maybeOpenOnboarding() {
        if (!onboardingModal || !onboardingContent || !firebaseUser || !cloudAccountApproved ||
            isPlatformAdmin(firebaseUser) || !appUnlocked) return;
        var progress = onboardingProgress();
        var steps = onboardingSteps();
        if (progress.dismissed || progress.completed || (!onboardingResumeRequested && steps.unitReady)) return;
        if (ModalManager.getOpenModal()) return;
        onboardingResumeRequested = false;
        renderOnboarding();
        ModalManager.open(onboardingModal);
    }

    function closeOnboarding(complete) {
        var progress = onboardingProgress();
        progress.dismissed = !complete;
        progress.completed = !!complete;
        progress.completedAt = complete ? Date.now() : progress.completedAt;
        saveOnboardingProgress(progress);
        onboardingResumeRequested = false;
        if (onboardingModal) ModalManager.close(onboardingModal);
    }

    function isMobileNavigation() {
        return window.matchMedia && window.matchMedia("(max-width: 680px)").matches;
    }

    function renderAppNavigation() {
        var validViews = ["home", "overview", "units", "financial", "reports", "tax"];
        if (validViews.indexOf(activeAppView) < 0) activeAppView = "home";
        var mobileNavigation = isMobileNavigation();
        var launcherOnly = mobileNavigation && mobileLauncherActive;
        if (!mobileNavigation && (activeAppView === "units" || activeAppView === "tax")) {
            activeAppView = "home";
        }
        var navigation = document.getElementById("appNavigation");
        if (navigation) navigation.classList.toggle("is-launcher", launcherOnly);

        document.querySelectorAll("[data-app-view-panel]").forEach(function (panel) {
            var view = panel.dataset.appViewPanel;
            if (mobileNavigation) {
                // No celular os atalhos são telas exclusivas: nunca deixa conteúdo
                // de outro atalho visível. Na abertura, ficam somente os botões.
                panel.hidden = launcherOnly || view !== activeAppView;
                return;
            }
            // No desktop, Início mantém o resumo mensal e as unidades juntos.
            panel.hidden = view === "units"
                ? activeAppView !== "home"
                : view !== activeAppView;
        });

        var financialView = document.getElementById("financialView");
        if (financialView) {
            financialView.classList.toggle(
                "is-mobile-expenses-focus",
                mobileNavigation &&
                    !launcherOnly &&
                    activeAppView === "financial" &&
                    activeMobileShortcut === "expenses"
            );
        }

        document.querySelectorAll("[data-app-view]").forEach(function (button) {
            var selected = mobileNavigation
                ? !launcherOnly && button.dataset.appNavKey === activeMobileShortcut
                : !launcherOnly && button.dataset.appView === activeAppView;
            button.classList.toggle("is-active", selected);
            button.setAttribute("aria-current", selected ? "page" : "false");
        });

        if (mobileNavigation) {
            document.querySelectorAll("[data-app-nav-key]").forEach(function (button) {
                var selected = !launcherOnly &&
                    button.dataset.appNavKey === activeMobileShortcut;
                button.classList.toggle("is-active", selected);
                button.setAttribute("aria-current", selected ? "page" : "false");
            });
        }
        ["addUnit", "mobileAddUnit"].forEach(function (id) {
            var button = document.getElementById(id);
            if (button) button.hidden = launcherOnly || (mobileNavigation ? activeAppView !== "units" : activeAppView !== "home");
        });
    }

    function focusCurrentMonthInGrid() {
        if (!tableWrap || tableWrap.hidden) return;

        var monthHeaders = grid.querySelectorAll("thead th");
        if (monthHeaders.length < 2) return;

        var currentMonthIndex = new Date().getMonth();
        var target = grid.querySelector("thead th.month-current") ||
            monthHeaders[currentMonthIndex + 1];
        if (!target) return;

        // A primeira coluna é fixa. Centraliza o mês no espaço que sobra à direita dela,
        // para que ele não fique escondido por baixo das informações da unidade.
        var frozenColumn = monthHeaders[0];
        var frozenWidth = frozenColumn ? frozenColumn.getBoundingClientRect().width : 0;
        var visibleWidth = Math.max(0, tableWrap.clientWidth - frozenWidth);
        var targetCenter = target.offsetLeft + target.offsetWidth / 2;
        var scrollLeft = Math.max(
            0,
            targetCenter - frozenWidth - visibleWidth / 2
        );
        var maxScrollLeft = Math.max(0, tableWrap.scrollWidth - tableWrap.clientWidth);
        lastGridScrollLeft = Math.min(scrollLeft, maxScrollLeft);
        tableWrap.scrollTo({ left: lastGridScrollLeft, behavior: "smooth" });
    }

    function closeMobileShortcut() {
        if (!isMobileNavigation()) return;
        mobileLauncherActive = true;
        activeMobileShortcut = "";
        activeAppView = "home";
        actionCenterExpanded = false;
        renderAppNavigation();
        renderActionCenter();
        scrollPageToTop();
    }

    function showAppView(view) {
        collapseRetractablePanels();
        activeAppView = view;
        if (isMobileNavigation()) {
            mobileLauncherActive = false;
            renderAppNavigation();
            window.setTimeout(function () {
                var panel = document.querySelector('[data-app-view-panel="' + view + '"]');
                if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
                if (view === "units") focusCurrentMonthInGrid();
            }, 0);
            return;
        }
        renderAppNavigation();
        scrollPageToTop();
    }

    function render() {
        if (tableWrap.scrollLeft > 0) lastGridScrollLeft = tableWrap.scrollLeft;
        renderAppNavigation();
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
        renderOverview();
        renderGrid(visibleUnits);
        renderRolePermissions();
        if (didInitialScroll && visibleUnits.length > 0)
            tableWrap.scrollLeft = lastGridScrollLeft;
        renderSummary();
        renderExpenses();
        renderTaxDashboard();
        renderPlanUsage();
        setTimeout(maybeOpenOnboarding, 0);
    }



    function chargeKindLabel(kind) {
        return { whatsapp: "Mensagem por WhatsApp", ligacao: "Ligação", contato: "Contato realizado", promessa: "Promessa de pagamento", nota: "Observação" }[kind] || "Contato realizado";
    }

    function chargeLogDate(value) {
        return isValidDateValue(value) ? new Date(value + "T12:00:00") : null;
    }

    function lateInstallmentKeysForUnit(unit) {
        var ledger = unit && unit.lateLedger && typeof unit.lateLedger === "object" ? unit.lateLedger : {};
        return months.reduce(function (keys, _, month) {
            var key = monthKey(month);
            if (effectiveStatus(unit, month) === "atrasado" || statusFor(unit, month) === "atrasado" || ledger[key] === true || ledger[key] === "open") keys.push(key);
            return keys;
        }, []);
    }

    function renderChargeHistory(unit) {
        var list = document.getElementById("chargeHistoryList");
        if (!list) return;
        if (!unit) {
            list.innerHTML = '<p class="rent-changes-empty">Salve a unidade antes de registrar cobranças.</p>';
            return;
        }
        var entries = (unit.chargeLog || []).slice().sort(function (a, b) {
            return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
        });
        if (!entries.length) {
            list.innerHTML = '<p class="rent-changes-empty">Nenhuma cobrança registrada.</p>';
            return;
        }
        list.innerHTML = entries.slice(0, 8).map(function (entry) {
            var meta = [entry.date ? formatTimelineDate(entry.date) : "", entry.promisedDate ? "prometeu pagar em " + formatTimelineDate(entry.promisedDate) : "", entry.nextActionDate ? "próxima ação: " + formatTimelineDate(entry.nextActionDate) : ""].filter(Boolean).join(" · ");
            return '<div class="charge-history-row"><div><strong>' + escapeHtml(chargeKindLabel(entry.kind)) + '</strong><span>' + escapeHtml(meta || "Sem data informada") + (entry.note ? " · " + escapeHtml(entry.note) : "") + '</span></div></div>';
        }).join("");
    }

    function openChargeModal(unitId, installmentKey) {
        var unit = state.units.find(function (item) { return item.id === unitId; });
        if (!unit) return;
        chargeModalUnitId = unit.id;
        chargeModalHandledLateKeys = typeof installmentKey === "string" && /^\d{4}-\d{2}$/.test(installmentKey) ? [installmentKey] : [];
        var hasLateInstallment = chargeModalHandledLateKeys.length > 0;
        chargeModalContext.textContent = unit.name + (unit.tenantName ? " · " + unit.tenantName : "") +
            (hasLateInstallment ? ". Esta cobrança será vinculada somente à parcela selecionada. Agende um retorno apenas se quiser ser lembrado depois." : ". Registre o contato e, se necessário, defina um próximo passo.");
        chargeType.value = "whatsapp";
        chargeDate.value = new Date().toISOString().slice(0, 10);
        chargePromisedDate.value = "";
        chargeNextActionDate.value = "";
        chargeNote.value = "";
        ModalManager.open(chargeModal);
    }

    function saveChargeRecord(openWhatsapp) {
        if (!requireWorkspacePermission("manageCollections")) return;
        var unit = state.units.find(function (item) { return item.id === chargeModalUnitId; });
        if (!unit) return;
        if (!isValidDateValue(chargeDate.value)) {
            chargeDate.focus();
            return;
        }
        // A cobrança registrada trata as parcelas em atraso existentes neste momento.
        // Novos atrasos futuros continuam aparecendo normalmente como ação pendente.
        var handledLateKeys = chargeModalHandledLateKeys.slice();
        var entry = {
            id: "charge-" + Date.now().toString(36),
            createdAt: new Date().toISOString(),
            date: chargeDate.value,
            kind: chargeType.value,
            note: String(chargeNote.value || "").trim().slice(0, 220),
            promisedDate: isValidDateValue(chargePromisedDate.value) ? chargePromisedDate.value : "",
            nextActionDate: isValidDateValue(chargeNextActionDate.value) ? chargeNextActionDate.value : "",
            handledLateKeys: handledLateKeys
        };
        unit.chargeLog = [entry].concat(unit.chargeLog || []).slice(0, 40);
        createVersionedBackup("Registro de cobrança", unit.name + " · " + (unit.tenantName || ""));
        recordOperation("Cobrança registrada", unit.name + " · " + chargeKindLabel(entry.kind));
        saveState();
        render();
        renderChargeHistory(unit);
        ModalManager.close(chargeModal);
        chargeModalUnitId = null;
        chargeModalHandledLateKeys = [];
        if (openWhatsapp) {
            var url = chargeUrl(unit);
            if (url) window.open(url, "_blank", "noopener");
        }
    }

    function renderOverview() {
        var container = document.getElementById("overviewDashboard");
        if (!container) return;
        var today = new Date();
        var currentMonth = today.getMonth();
        var units = scopedUnits();
        var occupied = units.filter(function (unit) {
            return isActive(unit, currentMonth) && String(unit.tenantName || "").trim();
        }).length;
        var occupancy = units.length ? Math.round((occupied / units.length) * 100) : 0;
        var dueSoon = units.filter(function (unit) {
            var reminder = isActive(unit, currentMonth) ? dueReminder(unit) : null;
            return reminder !== null && reminder >= 0 && reminder <= 7;
        }).length;
        var contractsEnding = units.filter(function (unit) {
            var end = chargeLogDate(unit.endDate);
            if (!end) return false;
            var days = Math.ceil((end - today) / 86400000);
            return days >= 0 && days <= 60;
        }).length;
        var overdue = 0;
        units.forEach(function (unit) {
            months.forEach(function (_, month) {
                var key = monthKey(month);
                var ledger = unit.lateLedger && typeof unit.lateLedger === "object" ? unit.lateLedger : {};
                if (effectiveStatus(unit, month) === "atrasado" || statusFor(unit, month) === "atrasado" || ledger[key] === true || ledger[key] === "open") overdue += 1;
            });
        });
        container.innerHTML =
            '<div class="overview-heading"><p>EMPREENDIMENTO</p><h2>Visão geral</h2><span>Acompanhe contratos, ocupação e próximos passos.</span></div>' +
            '<div class="overview-grid">' +
                '<article><span>Ocupação</span><strong>' + occupancy + '%</strong><small>' + occupied + ' de ' + units.length + ' unidades</small></article>' +
                '<article><span>Vencem em 7 dias</span><strong>' + dueSoon + '</strong><small>parcelas para acompanhar</small></article>' +
                '<article class="' + (overdue ? 'is-alert' : '') + '"><span>Em atraso</span><strong>' + overdue + '</strong><small>parcelas em aberto</small></article>' +
                '<article><span>Contratos a vencer</span><strong>' + contractsEnding + '</strong><small>nos próximos 60 dias</small></article>' +
            '</div>';
    }

    function renderActionCenter() {
        var container = document.getElementById("actionCenter");
        if (!container) return;
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);
        var urgent = [], week = [], decisions = [], completedCharges = [];
        var currentMonth = today.getMonth();
        var weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

        function add(list, title, description, unitId, action, recordId, recordType) {
            list.push({
                title: title,
                description: description,
                unitId: unitId || "",
                action: action || "",
                recordId: recordId || "",
                recordType: recordType || ""
            });
        }

        scopedUnits().forEach(function (unit) {
            months.forEach(function (_, month) {
                var key = monthKey(month);
                var ledger = unit.lateLedger && typeof unit.lateLedger === "object" ? unit.lateLedger : {};
                var wasCharged = (unit.chargeLog || []).some(function (entry) {
                    // Apenas uma cobrança vinculada a uma única parcela a considera tratada.
                    // Registros antigos e os registros amplos anteriores voltam a aparecer
                    // para não esconder parcelas que não foram efetivamente cobradas.
                    return Array.isArray(entry.handledLateKeys) &&
                        entry.handledLateKeys.length === 1 &&
                        entry.handledLateKeys[0] === key;
                });
                if (!wasCharged && (effectiveStatus(unit, month) === "atrasado" || statusFor(unit, month) === "atrasado" || ledger[key] === true || ledger[key] === "open")) {
                    var amount = (ledger[key] === true || ledger[key] === "open") ? historicLateRent(unit, key) : (updatedAmount(unit, month) === null ? rentForMonth(unit, selectedYear, month) : updatedAmount(unit, month));
                    add(urgent, unit.name + " · parcela em atraso", fullMonths[month] + " · " + money(amount), unit.id, "charge", key, "late");
                }
            });
            (unit.chargeLog || []).forEach(function (entry) {
                var registeredAt = chargeLogDate(entry.date) || new Date(entry.createdAt || 0);
                if (Array.isArray(entry.handledLateKeys) && entry.handledLateKeys.length === 1 &&
                    !isNaN(registeredAt.getTime()) && registeredAt >= weekStart && registeredAt <= new Date(today.getTime() + 86399999)) {
                    var installmentKey = entry.handledLateKeys[0];
                    var installmentMonth = Number(installmentKey.slice(5, 7)) - 1;
                    add(completedCharges, unit.name + " · cobrança registrada",
                        (fullMonths[installmentMonth] || "Parcela") + " · " + chargeKindLabel(entry.kind),
                        unit.id, "", entry.id, "completed-charge");
                }
                var date = chargeLogDate(entry.nextActionDate);
                if (!date) return;
                var label = unit.name + " · retorno de cobrança";
                var detail = (unit.tenantName || "Inquilino") + " · " + chargeKindLabel(entry.kind);
                if (date <= today) add(urgent, label, detail + " · ação prevista para " + formatTimelineDate(entry.nextActionDate), unit.id, "charge", entry.id, "charge");
                else if (date <= weekEnd) add(week, label, detail + " · em " + formatTimelineDate(entry.nextActionDate), unit.id, "charge", entry.id, "charge");
            });
            if (selectedYear === today.getFullYear() && isActive(unit, currentMonth)) {
                var reminder = dueReminder(unit);
                if (reminder !== null && reminder >= 0 && reminder <= 7) {
                    add(week, unit.name + " · vencimento próximo", (unit.tenantName || "Inquilino") + " · vence em " + reminder + " dia(s)", unit.id, "open");
                }
            }
            if (!String(unit.tenantName || "").trim()) {
                add(decisions, unit.name + " · unidade vaga", "Defina se deseja iniciar uma nova locação.", unit.id, "open");
            } else if (isValidDateValue(unit.endDate)) {
                var endDate = chargeLogDate(unit.endDate);
                var endDays = Math.ceil((endDate - today) / 86400000);
                if (endDays >= 0 && endDays <= 60) {
                    var decision = state.renewalDecisions[unit.id] || "A decidir";
                    add(decisions, unit.name + " · contrato termina em " + endDays + " dia(s)", unit.tenantName + " · " + decision, unit.id, "decision");
                }
            }
        });

        state.tasks.filter(function (task) { return !task.done; }).forEach(function (task) {
            var date = chargeLogDate(task.dueDate);
            var target = !date || date <= today ? urgent : date <= weekEnd ? week : null;
            if (target) add(target, "Tarefa · " + task.title, date ? "Prazo: " + formatTimelineDate(task.dueDate) : "Sem prazo definido", task.unitId, "task:" + task.id, task.id, "task");
        });

        var taxReviewCount = scopedExpenses().filter(function (expense) {
            return expense.ym.slice(0, 4) === String(selectedYear) && expense.taxTreatment !== "dedutivel" && expense.taxTreatment !== "nao_dedutivel";
        }).length;
        if (taxReviewCount) add(week, "Classificação fiscal pendente", taxReviewCount + " gasto(s) aguardando revisão para o IR.", "", "tax");

        function rows(items, empty, tone) {
            if (!items.length) return '<p class="operations-empty">' + empty + '</p>';
            return items.slice(0, 8).map(function (item) {
                var button = item.recordType === "completed-charge"
                    ? '<span class="action-completed-label">Registrada</span>'
                    : item.recordType === "charge"
                        ? '<button class="btn btn-ghost" type="button" data-complete-charge-followup="' + escapeHtml(item.unitId) + '" data-charge-record-id="' + escapeHtml(item.recordId) + '">Concluir</button>'
                    : item.action === "charge" ? '<button class="btn btn-ghost" type="button" data-register-charge="' + escapeHtml(item.unitId) + '" data-charge-month="' + escapeHtml(item.recordId) + '">Cobrar</button>' :
                    item.action === "decision" ? '<button class="btn btn-ghost" type="button" data-open-unit="' + escapeHtml(item.unitId) + '">Decidir</button>' :
                    item.action === "tax" ? '<button class="btn btn-ghost" type="button" data-open-tax-dashboard>Revisar</button>' :
                    item.action && item.action.indexOf("task:") === 0 ? '<button class="btn btn-ghost" type="button" data-task-done="' + escapeHtml(item.action.slice(5)) + '">Concluir</button>' :
                    item.unitId ? '<button class="btn btn-ghost" type="button" data-open-unit="' + escapeHtml(item.unitId) + '">Ver</button>' : "";
                var removeButton = item.recordType === "charge"
                    ? '<button class="btn btn-danger" type="button" data-delete-charge-record="' + escapeHtml(item.unitId) + '" data-charge-record-id="' + escapeHtml(item.recordId) + '">Excluir</button>'
                    : item.recordType === "task"
                        ? '<button class="btn btn-danger" type="button" data-delete-task="' + escapeHtml(item.recordId) + '">Excluir</button>'
                        : "";
                return '<div class="operations-row action-priority-row ' + tone + '"><div><strong>' + escapeHtml(item.title) + '</strong><span>' + escapeHtml(item.description) + '</span></div><div class="action-row-actions">' + button + removeButton + '</div></div>';
            }).join("");
        }

        var attentionCount = urgent.length + week.length + decisions.length;
        var chargeCount = urgent.filter(function (item) { return item.action === "charge" && item.recordType !== "charge"; }).length;
        var followUpCount = urgent.concat(week).filter(function (item) { return item.recordType === "charge"; }).length;
        var taskCount = urgent.filter(function (item) { return item.action && item.action.indexOf("task:") === 0; }).length;
        var fiscalCount = week.filter(function (item) { return item.action === "tax"; }).length;
        var dueCount = week.filter(function (item) { return item.action === "open"; }).length;
        var summaryParts = [];
        if (chargeCount) summaryParts.push(chargeCount + " " + (chargeCount === 1 ? "cobrança" : "cobranças"));
        if (followUpCount) summaryParts.push(followUpCount + " " + (followUpCount === 1 ? "retorno" : "retornos"));
        if (dueCount) summaryParts.push(dueCount + " " + (dueCount === 1 ? "vencimento" : "vencimentos"));
        if (fiscalCount) summaryParts.push(fiscalCount + " revisão fiscal");
        if (taskCount) summaryParts.push(taskCount + " " + (taskCount === 1 ? "tarefa" : "tarefas"));
        if (decisions.length) summaryParts.push(decisions.length + " decisão" + (decisions.length === 1 ? "" : "ões"));
        var badge = attentionCount
            ? '<div class="action-count-explainer"><span class="action-alert-badge" aria-hidden="true">' + attentionCount + '</span><span><strong>' + attentionCount + ' ' + (attentionCount === 1 ? 'ação pendente' : 'ações pendentes') + '</strong><small>' + escapeHtml(summaryParts.join(" · ")) + '</small></span></div>'
            : '<span class="action-ok-badge" aria-label="Sem ações pendentes">✓</span>';
        var taskForm = '<form id="operationalTaskForm" class="operational-task-form"><input id="operationalTaskTitle" type="text" maxlength="140" placeholder="Ex.: Cobrar comprovante" required><input id="operationalTaskDue" type="date"><button class="btn btn-primary" type="submit">Adicionar</button></form>';
        var completedMarkup = completedCharges.length
            ? '<div class="completed-charge-list"><h4>Cobranças registradas</h4>' + rows(completedCharges, "", "is-completed") + '</div>'
            : "";
        var detail = '<div class="action-priority-grid">' +
            '<section class="action-priority-section is-urgent"><h3>Urgente hoje</h3>' + rows(urgent, "Nada urgente no momento.", "is-urgent") + '</section>' +
            '<section class="action-priority-section"><h3>Esta semana</h3>' + rows(week, "Nenhuma ação prevista para os próximos 7 dias.", "is-week") + completedMarkup + '</section>' +
            '<section class="action-priority-section"><h3>Decisões de contrato</h3>' + rows(decisions, "Nenhuma decisão de contrato pendente.", "is-decision") + '</section>' +
            '</div><section class="action-tasks-panel"><h3>Tarefas manuais</h3>' + taskForm + '</section>';

        var compactSummary = attentionCount
            ? attentionCount + " " + (attentionCount === 1 ? "ação pendente" : "ações pendentes")
            : "Nenhuma pendência agora";
        var shieldIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v5.2c0 4.8-3.3 8.3-8 9.8-4.7-1.5-8-5-8-9.8V6l8-3Z"></path>' +
            (attentionCount ? '' : '<path d="m8.6 12.1 2.1 2.1 4.7-4.7"></path>') + '</svg>';
        var navAlert = document.getElementById("actionAlertNav");
        var navAlertBadge = document.getElementById("actionAlertNavBadge");
        if (navAlert) {
            navAlert.classList.toggle("has-alert", attentionCount > 0);
            navAlert.classList.toggle("is-clear", attentionCount === 0);
            navAlert.setAttribute("aria-label", attentionCount ? compactSummary + ". Abrir ações." : "Sem pendências. Abrir ações.");
            navAlert.title = attentionCount ? compactSummary : "Sem pendências";
        }
        if (navAlertBadge) {
            navAlertBadge.hidden = attentionCount === 0;
            navAlertBadge.textContent = attentionCount || "";
        }

        container.classList.remove("is-compact");
        container.hidden = !actionCenterExpanded;
        container.innerHTML = actionCenterExpanded
            ? '<div class="action-center-heading"><div class="action-title"><h2>O que precisa de ação</h2><p>Prioridades, cobranças e decisões do portfólio.</p></div><div class="action-heading-controls">' + badge + '<button class="btn btn-ghost" id="toggleActionCenter" type="button" aria-expanded="true">Ocultar</button></div></div><div class="action-center-detail">' + detail + '</div>'
            : "";

        var toggleActionCenter = document.getElementById("toggleActionCenter");
        if (toggleActionCenter) toggleActionCenter.addEventListener("click", function () { actionCenterExpanded = false; renderActionCenter(); });
        var taskFormElement = document.getElementById("operationalTaskForm");
        if (taskFormElement) taskFormElement.addEventListener("submit", function (event) {
            event.preventDefault();
            var title = String(document.getElementById("operationalTaskTitle").value || "").trim();
            var dueDate = document.getElementById("operationalTaskDue").value;
            if (!title) return;
            state.tasks.push({ id: "task-" + Date.now().toString(36), title: title, dueDate: isValidDateValue(dueDate) ? dueDate : "", unitId: "", done: false, createdAt: new Date().toISOString() });
            saveState(); render();
        });
        container.querySelectorAll("[data-open-unit]").forEach(function (button) { button.addEventListener("click", function () { openModal(button.dataset.openUnit); }); });
        container.querySelectorAll("[data-register-charge]").forEach(function (button) { button.addEventListener("click", function () { openChargeModal(button.dataset.registerCharge, button.dataset.chargeMonth || ""); }); });
        container.querySelectorAll("[data-complete-charge-followup]").forEach(function (button) { button.addEventListener("click", function () {
            var unit = state.units.find(function (item) { return item.id === button.dataset.completeChargeFollowup; });
            var entry = unit && (unit.chargeLog || []).find(function (item) { return item.id === button.dataset.chargeRecordId; });
            if (!entry) return;
            entry.nextActionDate = "";
            createVersionedBackup("Retorno de cobrança concluído", unit.name);
            recordOperation("Retorno de cobrança concluído", unit.name);
            saveState();
            render();
        }); });
        container.querySelectorAll("[data-task-done]").forEach(function (button) { button.addEventListener("click", function () {
            var task = state.tasks.find(function (item) { return item.id === button.dataset.taskDone; });
            if (task) { task.done = true; saveState(); render(); }
        }); });
        container.querySelectorAll("[data-delete-charge-record]").forEach(function (button) { button.addEventListener("click", function () {
            var unit = state.units.find(function (item) { return item.id === button.dataset.deleteChargeRecord; });
            if (!unit || !window.confirm("Excluir este registro de cobrança?")) return;
            unit.chargeLog = (unit.chargeLog || []).filter(function (entry) {
                return entry.id !== button.dataset.chargeRecordId;
            });
            createVersionedBackup("Remoção de registro de cobrança", unit.name);
            recordOperation("Registro de cobrança removido", unit.name);
            saveState();
            render();
        }); });
        container.querySelectorAll("[data-delete-task]").forEach(function (button) { button.addEventListener("click", function () {
            var task = state.tasks.find(function (item) { return item.id === button.dataset.deleteTask; });
            if (!task || !window.confirm("Excluir esta tarefa?")) return;
            createVersionedBackup("Remoção de tarefa", task.title);
            recordOperation("Tarefa removida", task.title);
            state.tasks = state.tasks.filter(function (item) { return item.id !== task.id; });
            saveState();
            render();
        }); });
        container.querySelectorAll("[data-open-tax-dashboard]").forEach(function (button) { button.addEventListener("click", function () { taxDashboardExpanded = true; renderTaxDashboard(); var dashboard = document.getElementById("taxDashboard"); if (dashboard) dashboard.scrollIntoView({ behavior: "smooth", block: "start" }); }); });
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
							'"><div class="status-cell"><div class="status-inactive" aria-label="Sem contrato"><span>Sem contrato</span></div></div></td>'
						);
					}

					if (!isActive(unit, i)) {
						return (
							'<td class="' +
							(i === currentMonth ? "month-current" : "") +
							'"><div class="status-cell"><div class="status-inactive" aria-label="Fora do período"><span>Fora do período</span></div></div></td>'
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
                    unit.chargeLog.unshift({
                        createdAt: new Date().toISOString(),
                        date: new Date().toISOString().slice(0, 10),
                        kind: "whatsapp",
                        tenantName: unit.tenantName || "",
                        handledLateKeys: []
                    });
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

function renderCashForecast() {
    if (!cashForecast) return;
    var today=new Date(); today.setHours(0,0,0,0); var totals=[0,0,0], horizons=[30,60,90], next=[];
    scopedUnits().forEach(function(unit){ if(!unit.tenantName || !Number.isInteger(unit.dueDay)) return;
        for(var o=0;o<4;o++){ var base=new Date(today.getFullYear(),today.getMonth()+o,1), last=new Date(base.getFullYear(),base.getMonth()+1,0).getDate(), due=new Date(base.getFullYear(),base.getMonth(),Math.min(unit.dueDay,last));
            var ym=due.getFullYear()+"-"+String(due.getMonth()+1).padStart(2,"0"), start=unit.startDate||"", end=unit.endDate||"", value=due.getFullYear()+"-"+String(due.getMonth()+1).padStart(2,"0")+"-"+String(due.getDate()).padStart(2,"0");
            if(due<today || (start&&value<start) || (end&&value>end)) continue;
            var days=Math.ceil((due-today)/86400000), amount=Number(rentForYm(unit,ym))||0; horizons.forEach(function(h,i){if(days<=h)totals[i]+=amount}); next.push({due:due,amount:amount,unit:unit});
        }
    });
    next.sort(function(a,b){return a.due-b.due});
    cashForecast.innerHTML='<div class="cash-forecast-metrics">'+horizons.map(function(h,i){return '<div><span>Próximos '+h+' dias</span><strong>'+money(totals[i])+'</strong></div>'}).join("")+'</div><p class="cash-forecast-note">Considera contratos ativos e vencimentos previstos.</p><div class="cash-forecast-next">'+(next.slice(0,3).map(function(x){return '<span><strong>'+escapeHtml(x.unit.name)+'</strong> · '+String(x.due.getDate()).padStart(2,"0")+"/"+String(x.due.getMonth()+1).padStart(2,"0")+' · '+money(x.amount)+'</span>'}).join("")||'<span>Nenhuma receita contratada nos próximos 90 dias.</span>')+'</div>';
}
function renderUnitOverview(unit) {
    if(!unitOverview)return;
    if(!unit){unitOverview.innerHTML='<p class="field-help">Salve a unidade para ver o resumo.</p>';return;}
    var late=months.filter(function(_,m){return effectiveStatus(unit,m)==="atrasado"}).length, follow=(unit.chargeLog||[]).map(function(x){return x.nextActionDate}).filter(isValidDateValue).sort()[0];
    unitOverview.innerHTML='<div class="unit-overview-grid"><div><span>Contrato atual</span><strong>'+escapeHtml(unit.tenantName||"Unidade vaga")+'</strong></div><div><span>Aluguel</span><strong>'+(unit.tenantName?money(unit.rent):"—")+'</strong></div><div><span>Situação</span><strong>'+(late?late+" atraso(s)":"Em dia")+'</strong></div><div><span>Próxima ação</span><strong>'+(follow?formatTimelineDate(follow):"Não definida")+'</strong></div></div>';
}
function suggestAdjustment() {
    var percent=Number(state.settings.defaultAdjustmentPercent), rent=Number(unitRent.value);
    if(!Number.isFinite(percent)||percent===0||!Number.isFinite(rent)){suggestedRentAdjustment.textContent="Defina o percentual padrão nas Configurações e o valor do aluguel.";return;}
    var base=unitStartYm.value?unitStartYm.value.slice(0,7):monthKey(new Date().getMonth()), p=base.split("-").map(Number), date=new Date(p[0]+1,p[1]-1,1), ym=date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0"), value=Math.round(rent*(1+percent/100)*100)/100;
    rentChangeYm.value=ym;rentChangePercent.value=String(percent);rentChangeAbsolute.value="";suggestedRentAdjustment.textContent="Sugestão: "+percent+"% em "+ymLabel(ym)+" · "+money(value)+". Revise e clique em “Adicionar reajuste”.";
}
function renderSummary() {
    var units = scopedUnits();
    var now = new Date();
    var current = now.getFullYear() === selectedYear ? now.getMonth() : -1;
    var monthLabel = current < 0 ? "Visualizando outro ano" : months[current] + " de " + selectedYear;

    // Cada mês usa a mesma regra, incluindo contratos encerrados no período.
    var monthlyMetrics = months.map(function (_, month) {
        return monthlyFinancialMetrics(units, selectedYear, month);
    });
    var currentMetrics = current < 0
        ? { expected: 0, received: 0, pending: 0, overdueBase: 0, overdueWithCharges: 0, overdueCount: 0 }
        : monthlyMetrics[current];
    var annual = monthlyMetrics.reduce(function (sum, metric) {
        return sum + metric.received;
    }, 0);
    var received = currentMetrics.received;
    var expected = currentMetrics.expected;
    var pending = currentMetrics.pending;
    var annualRevenueForecast = monthlyMetrics.reduce(function (sum, metric) {
        return sum + metric.expected;
    }, 0);

    var annualExpenses = scopedExpenses().reduce(function (sum, expense) {
        return sum + (expense.ym.slice(0, 4) === String(selectedYear) ? expense.amount : 0);
    }, 0);

    var currentExpenses = current < 0 ? 0 : scopedExpenses().reduce(function (sum, expense) {
        return sum + (expense.ym === monthKey(current) ? expense.amount : 0);
    }, 0);

    var annualNet = annual - annualExpenses;
    var currentNet = received - currentExpenses;
    var occupied = current < 0 ? 0 : units.filter(function (unit) {
        return isActive(unit, current) && String(unit.tenantName || "").trim();
    }).length;
    var occupancyRate = units.length ? Math.round((occupied / units.length) * 100) : 0;

    // A inadimplência anual usa os encargos estimados; o bloco "Este mês"
    // exibe somente o principal daquele mês para manter a conciliação visível.
    var overdueCount = monthlyMetrics.reduce(function (sum, metric) {
        return sum + metric.overdueCount;
    }, 0);
    var overdueTotal = monthlyMetrics.reduce(function (sum, metric) {
        return sum + metric.overdueWithCharges;
    }, 0);

    var reportRows = units.map(function (unit) {
        var openLate = 0;
        var paidLate = 0;
        months.forEach(function (_, i) {
            var lateLedger = unit.lateLedger && typeof unit.lateLedger === "object" ? unit.lateLedger : {};
            var recordedLate = lateLedger[monthKey(i)];
            if (effectiveStatus(unit, i) === "atrasado" || statusFor(unit, i) === "atrasado" || recordedLate === true || recordedLate === "open") openLate += 1;
            if (isPaidLate(unit, i) || recordedLate === "paid") paidLate += 1;
        });
        return {
            name: unit.name,
            tenantName: overdueTenantName(unit),
            enterprise: empreendimentoName(unit.empreendimentoId),
            openLate: openLate,
            paidLate: paidLate,
            total: openLate + paidLate
        };
    }).filter(function (row) {
        return row.total > 0;
    }).sort(function (a, b) {
        return b.total - a.total || a.name.localeCompare(b.name, "pt-BR");
    });

    var report = '<section class="summary-report late-dashboard">' +
        '<header class="late-dashboard-header"><div>' +
        '<p class="late-eyebrow">Controle financeiro</p>' +
        '<h3>Atrasos no ano</h3>' +
        '<p class="summary-report-intro">Acompanhe os atrasos em aberto e os pagamentos feitos depois do vencimento.</p>' +
        '</div></header>' +
        (reportRows.length
            ? '<div class="late-list">' + reportRows.map(function (row) {
                var detail = row.openLate + " em atraso " + row.paidLate + " pago" + (row.paidLate === 1 ? "" : "s") + " com atraso";
                var rowEnterprise = selectedEmpreendimentoId === "todos" ? " <small>(" + escapeHtml(row.enterprise) + ")</small>" : "";
                return '<div class="late-row"><div><strong>' + escapeHtml(row.name) + rowEnterprise + '</strong>' +
                    (row.tenantName ? '<div class="tenant-name">' + escapeHtml(row.tenantName) + '</div>' : '') +
                    '<span>' + detail + '</span></div><b class="late-count">' + row.total + '</b></div>';
            }).join("") + '</div>'
            : '<p class="summary-report-empty">Nenhum atraso no ano - todas as unidades em dia.</p>') +
        '</section>';

    var summaryContainer = document.getElementById("summary");
    if (summaryContainer) {
        summaryContainer.innerHTML =
            '<div id="summaryCards" class="summary-cards enterprise-dashboard-cards">' +
                '<section class="dashboard-card-group"><div class="dashboard-group-heading"><strong>Este mês</strong><span>' + monthLabel + '</span></div><div class="dashboard-group-cards">' +
                    '<article class="summary-card dashboard-card dashboard-card-primary"><div class="summary-label">Previsto</div><div class="summary-value">' + money(expected) + '</div><div class="summary-detail">Receita esperada</div></article>' +
                    '<article class="summary-card dashboard-card"><div class="summary-label">Recebido</div><div class="summary-value">' + money(received) + '</div><div class="summary-detail">Pagamentos baixados</div></article>' +
                    '<article class="summary-card summary-year dashboard-card"><div class="summary-label">A receber</div><div class="summary-value">' + money(pending) + '</div><div class="summary-detail">Parcelas ainda no prazo</div></article>' +
                    '<article class="summary-card dashboard-card"><div class="summary-label">Gastos</div><div class="summary-value">' + money(currentExpenses) + '</div><div class="summary-detail">Despesas de ' + monthLabel + '</div></article>' +
                    '<article class="summary-card dashboard-card ' + (currentNet < 0 ? 'summary-negative' : '') + '"><div class="summary-label">Lucro líquido</div><div class="summary-value">' + money(currentNet) + '</div><div class="summary-detail">Recebido menos gastos</div></article>' +
                '</div></section>' +
                '<section class="dashboard-card-group"><div class="dashboard-group-heading"><strong>No ano</strong><span>' + selectedYear + '</span></div><div class="dashboard-group-cards">' +
                    '<article class="summary-card dashboard-card dashboard-card-forecast"><div class="summary-label">Receita estimada</div><div class="summary-value">' + money(annualRevenueForecast) + '</div><div class="summary-detail">Contratos cadastrados</div></article>' +
                    '<article class="summary-card dashboard-card ' + (overdueCount ? 'summary-alert' : '') + '"><div class="summary-label">Inadimplência</div><div class="summary-value">' + money(overdueTotal) + '</div><div class="summary-detail">' + overdueCount + ' parcela' + (overdueCount === 1 ? '' : 's') + ' em aberto</div></article>' +
                    '<article class="summary-card summary-year dashboard-card"><div class="summary-label">Total recebido</div><div class="summary-value">' + money(annual) + '</div><div class="summary-detail">Ativos e encerrados</div></article>' +
                    '<article class="summary-card summary-year dashboard-card"><div class="summary-label">Total de gastos</div><div class="summary-value">' + money(annualExpenses) + '</div><div class="summary-detail">Despesas do período</div></article>' +
                    '<article class="summary-card summary-year dashboard-card ' + (annualNet < 0 ? 'summary-negative' : '') + '"><div class="summary-label">Lucro líquido</div><div class="summary-value">' + money(annualNet) + '</div><div class="summary-detail">Recebido menos gastos</div></article>' +
                '</div></section>' +
                '<section class="dashboard-card-group dashboard-card-group-portfolio"><div class="dashboard-group-heading"><strong>Carteira</strong><span>ocupação atual</span></div><div class="dashboard-group-cards">' +
                    '<article class="summary-card dashboard-card dashboard-card-occupancy"><div class="summary-label">Taxa de ocupação</div><div class="summary-value">' + occupancyRate + '%</div><div class="summary-detail">' + occupied + ' de ' + units.length + ' unidades ocupadas</div></article>' +
                '</div></section>' +
            '</div>';
    }

    var lateReport = document.getElementById("lateReport");
    var toggleFinancialReport = document.getElementById("toggleFinancialReport");
    if (lateReport) {
        lateReport.innerHTML = report;
        lateReport.hidden = !financialReportExpanded;
    }
    if (toggleFinancialReport) {
        toggleFinancialReport.textContent = financialReportExpanded ? "Ocultar" : "Mostrar";
    }

    var homeSnapshot = document.getElementById("homeSnapshot");
    if (homeSnapshot) {
        homeSnapshot.innerHTML =
            '<div class="home-snapshot-heading"><strong>Este mês</strong><span>' + escapeHtml(monthLabel) + '</span></div>' +
            '<div class="home-snapshot-grid">' +
                '<article class="home-snapshot-card"><span>Recebido</span><strong>' + money(received) + '</strong><small>Pagamentos baixados</small></article>' +
                '<article class="home-snapshot-card"><span>A receber</span><strong>' + money(pending) + '</strong><small>Parcelas ainda no prazo</small></article>' +
                '<article class="home-snapshot-card ' + (overdueCount ? 'is-alert' : '') + '"><span>Em atraso</span><strong>' + money(overdueTotal) + '</strong><small>' + overdueCount + ' parcela' + (overdueCount === 1 ? '' : 's') + ' em aberto</small></article>' +
                '<article class="home-snapshot-card"><span>Valores gastos</span><strong>' + money(currentExpenses) + '</strong><small>Despesas deste mês</small></article>' +
                '<article class="home-snapshot-card ' + (currentNet < 0 ? 'is-negative' : '') + '"><span>Lucro líquido</span><strong>' + money(currentNet) + '</strong><small>Recebido menos gastos</small></article>' +
                '<article class="home-snapshot-card home-snapshot-card-occupancy"><span>Ocupação</span><strong>' + occupancyRate + '%</strong><small>' + occupied + ' de ' + units.length + ' unidades ocupadas</small></article>' +
            '</div>';
    }

    var mobileMonthSummary = document.getElementById("mobileMonthSummary");
    if (mobileMonthSummary) {
        mobileMonthSummary.innerHTML =
            '<div class="mobile-month-heading"><strong>Este mês</strong><span>' + escapeHtml(monthLabel) + '</span></div>' +
            '<div class="mobile-month-metrics">' +
                '<span><small>Recebido</small><b>' + money(received) + '</b></span>' +
                '<span><small>A receber</small><b>' + money(pending) + '</b></span>' +
                '<span class="' + (overdueCount ? 'is-alert' : '') + '"><small>Em atraso</small><b>' + money(overdueTotal) + '</b></span>' +
                '<span><small>Gastos</small><b>' + money(currentExpenses) + '</b></span>' +
                '<span class="' + (currentNet < 0 ? 'is-alert' : '') + '"><small>Líquido</small><b>' + money(currentNet) + '</b></span>' +
                '<span><small>Ocupação</small><b>' + occupancyRate + '%</b></span>' +
            '</div>';
    }

    applySummaryCardsVisibility();
}
    function applySummaryCardsVisibility() {
        var cards = document.getElementById("summaryCards");
        var container = document.getElementById("summary");
        // Quando fechado, o próprio contêiner sai do fluxo. Assim não sobra
        // uma faixa vazia entre o cabeçalho financeiro e os gastos.
        if (cards) cards.hidden = !summaryCardsExpanded;
        if (container) container.hidden = !summaryCardsExpanded;
        var btn = document.getElementById("toggleSummaryCards");
        if (btn) btn.textContent = summaryCardsExpanded ? "Ocultar indicadores" : "Ver indicadores";
    }


    function renderTaxDashboard() {
        var detail = document.getElementById("taxDashboardDetail");
        var toggle = document.getElementById("toggleTaxDashboard");
        if (!detail || !toggle) return;

        var yearExpenses = scopedExpenses().filter(function (expense) {
            return expense.ym.slice(0, 4) === String(selectedYear);
        });
        var rentalReceived = scopedUnits().reduce(function (sum, unit) {
            return sum + months.reduce(function (monthSum, _, month) {
                return monthSum + historicalReceivedAmount(unit, selectedYear, month);
            }, 0);
        }, 0);
        var possibleDeductions = yearExpenses.filter(function (expense) {
            return expense.taxTreatment === "dedutivel";
        });
        var nonDeductible = yearExpenses.filter(function (expense) {
            return expense.taxTreatment === "nao_dedutivel";
        });
        var review = yearExpenses.filter(function (expense) {
            return expense.taxTreatment !== "dedutivel" && expense.taxTreatment !== "nao_dedutivel";
        });
        var deductibleTotal = possibleDeductions.reduce(function (sum, expense) { return sum + expense.amount; }, 0);
        var nonDeductibleTotal = nonDeductible.reduce(function (sum, expense) { return sum + expense.amount; }, 0);
        var reviewTotal = review.reduce(function (sum, expense) { return sum + expense.amount; }, 0);
        var base = Math.max(0, rentalReceived - deductibleTotal);

        detail.hidden = !taxDashboardExpanded;
        toggle.textContent = taxDashboardExpanded ? "Ocultar conferência" : "Ver conferência";
        toggle.onclick = function () {
            taxDashboardExpanded = !taxDashboardExpanded;
            renderTaxDashboard();
        };
        if (!taxDashboardExpanded) return;

        var reviewRows = review.slice().sort(function (a, b) {
            return String(b.date).localeCompare(String(a.date));
        }).slice(0, 6).map(function (expense) {
            return '<div class="tax-review-row"><div><strong>' + escapeHtml(expense.category || "Gasto") + '</strong><span>' + escapeHtml(formatExpenseDate(expense.date)) + (expense.description ? " · " + escapeHtml(expense.description) : "") + '</span></div><b>' + money(expense.amount) + '</b><button class="btn btn-ghost" type="button" data-tax-expense="' + escapeHtml(expense.id) + '">Classificar</button></div>';
        }).join("") || '<p class="operations-empty">Nenhum gasto aguardando classificação fiscal.</p>';

        detail.innerHTML =
            '<div class="tax-disclaimer">Esta é uma base de conferência, não um cálculo de imposto ou DARF. Confirme a classificação e os documentos com seu contador.</div>' +
            '<div class="tax-summary-grid">' +
                '<article><span>Aluguéis recebidos</span><strong>' + money(rentalReceived) + '</strong><small>Baixas registradas em ' + selectedYear + '</small></article>' +
                '<article class="is-deduction"><span>Possíveis deduções</span><strong>' + money(deductibleTotal) + '</strong><small>Classificadas pelo usuário</small></article>' +
                '<article class="is-base"><span>Base para conferência</span><strong>' + money(base) + '</strong><small>Recebido menos possíveis deduções</small></article>' +
                '<article><span>Não dedutíveis</span><strong>' + money(nonDeductibleTotal) + '</strong><small>Não reduzem a base</small></article>' +
                '<article class="' + (review.length ? "is-review" : "") + '"><span>A revisar</span><strong>' + money(reviewTotal) + '</strong><small>' + review.length + ' gasto' + (review.length === 1 ? "" : "s") + ' sem classificação</small></article>' +
            '</div>' +
            '<div class="tax-review-list"><div><h3>Gastos que precisam de classificação</h3><p>Marque cada lançamento como possível dedução, não dedutível ou para revisão.</p></div>' + reviewRows + '</div>';

        detail.querySelectorAll("[data-tax-expense]").forEach(function (button) {
            button.addEventListener("click", function () {
                openExpenseModal(button.dataset.taxExpense);
            });
        });
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

        var categoryTotals = yearExpenses.reduce(function (totals, expense) {
            var category = String(expense.category || "Sem categoria");
            totals[category] = (totals[category] || 0) + expense.amount;
            return totals;
        }, {});

        var topCategory = Object.keys(categoryTotals).sort(function (a, b) {
            return categoryTotals[b] - categoryTotals[a];
        })[0];

        expensesCount.textContent =
            yearExpenses.length +
            (yearExpenses.length === 1 ? " lançamento" : " lançamentos");

        expensesTopCategory.textContent = topCategory
            ? "Maior categoria: " + topCategory
            : "Sem categoria principal";

        if (!yearExpenses.length) {
            expensesPreview.innerHTML =
                '<p class="expenses-empty">Nenhum gasto registrado em ' +
                selectedYear +
                ".</p>";
            expensesList.innerHTML = "";
            expensesList.hidden = true;
            toggleExpensesButton.hidden = true;
            return;
        }

        var recentExpenses = yearExpenses
            .slice()
            .sort(function (a, b) {
                var byCreation = String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
                if (byCreation) return byCreation;
                return String(b.date || b.ym).localeCompare(String(a.date || a.ym));
            })
            .slice(0, 3);

        expensesPreview.innerHTML =
            '<div class="expenses-preview-heading">Últimos lançamentos</div>' +
            '<div class="expenses-preview-list">' +
            recentExpenses
                .map(function (expense) {
                    var dateLabel = expense.date
                        ? formatExpenseDate(expense.date)
                        : fullMonths[Number(expense.ym.slice(5, 7)) - 1];

                    return (
                        '<div class="expenses-preview-row">' +
                        '<div><strong>' +
                        escapeHtml(expense.category || "Sem categoria") +
                        "</strong>" +
                        '<span>' +
                        escapeHtml(dateLabel) +
                        (expense.description
                            ? " · " + escapeHtml(expense.description)
                            : "") +
                        "</span></div>" +
                        "<b>" +
                        money(expense.amount) +
                        "</b>" +
                        "</div>"
                    );
                })
                .join("") +
            "</div>";

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
                            dateLabel +
                            '<div class="expense-row-main">' +
                            enterprise +
                            "<strong>" +
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
    if (!requireWorkspacePermission("managePayments")) return;
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
    if (!requireWorkspacePermission("managePayments")) return;
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
        if (!requireWorkspacePermission("manageContracts")) return;
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
        renderChargeHistory(unit);
        renderUnitOverview(unit);
        suggestedRentAdjustment.textContent = "";

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



	
	
	

    /* Histórico de contratos: dados estruturados, linha do tempo e ações */
    var editingHistoryIndex = null;
    function newContractHistoryId(){return "contract-"+Date.now().toString(36)+Math.random().toString(36).slice(2)}
    function normalizeContractHistoryStatus(value){return ["encerrado","rescisao","pendente"].indexOf(value)>=0?value:"encerrado"}

    function contractHistoryStatusInfo(value){return{encerrado:["Encerrado normalmente","is-closed"],rescisao:["Rescisão antecipada","is-ended"],pendente:["Encerrado com pendências","is-pending"]}[normalizeContractHistoryStatus(value)]}
    function contractHistoryPeriod(contract){return(contract.startYm?ymLabel(contract.startYm):"Início não informado")+" até "+(contract.endYm?ymLabel(contract.endYm):"fim não informado")}
    function resetHistoryForm(){editingHistoryIndex=null;historyTenant.value="";historyStart.value="";historyEnd.value="";historyRent.value="";historyStatus.value="encerrado";historyReason.value="";addContractHistory.textContent="Adicionar ao histórico"}

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
        if (!requireWorkspacePermission("manageSettings")) return;
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
        if (!requireWorkspacePermission("manageSettings")) return;
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
        if (!canCreateWithinPlan("enterprises", state.empreendimentos.length)) {
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
        if (!requireWorkspacePermission("manageSettings")) return;
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
        if (!requireWorkspacePermission("manageExpenses")) return;
        editingExpenseId = id || null;
        var expense = state.expenses.find(function (item) {
            return item.id === editingExpenseId;
        });
        expenseModalTitle.textContent = expense ? "Editar gasto" : "Novo gasto";

        // Um novo lançamento deve partir da data real de hoje, inclusive o dia.
        // A data permanece totalmente editável para registrar despesas anteriores.
        expenseYm.value = expense
            ? expense.date || expense.ym + "-01"
            : localDateValue(new Date());
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
        expenseTaxTreatment.value = expense ? expense.taxTreatment || "revisar" : "revisar";
        expenseTaxProvider.value = expense ? expense.taxProvider || "" : "";
        expenseTaxDocument.value = expense ? expense.taxDocument || "" : "";
        expenseRepeat.checked = false;
        expenseRepeatCount.value = 1;
        recurrenceArea.hidden = !!expense;
        document.getElementById("expenseRecurrencePanel").hidden = !!expense;
        deleteExpenseButton.hidden = !expense;
        ModalManager.open(expenseModal);
        setTimeout(function () {
            expenseYm.focus();
        }, 0);
    }

    function closeExpenseModal() {
        ModalManager.close(expenseModal);
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
    if (!requireWorkspacePermission("manageExpenses")) return;
    var date = expenseYm.value;
    var ym = date.slice(0, 7);
    var amount = Number(expenseAmount.value);

    if (!isValidDateValue(date)) {
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
        date: date,
        ym: ym,
        empreendimentoId: expenseEmpreendimento.value,
        category: categoryValue !== "" ? categoryValue : "Outros",
        description: expenseDescription.value.trim(),
        amount: amount,
        taxTreatment: expenseTaxTreatment.value,
        taxProvider: expenseTaxProvider.value.trim(),
        taxDocument: expenseTaxDocument.value.trim(),
    };

    // Mantém o dia escolhido ao criar uma repetição mensal.
    var selectedDay = Number(date.slice(8, 10));

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
            
            // Preserva o dia escolhido sem criar datas inválidas, como 31/04.
            var fullDate = expenseDateForMonth(currentYm, selectedDay);

            state.expenses.push({
                id: newExpenseId(),
                ym: currentYm,
                date: fullDate, // Salva o dia exato do lançamento
                createdAt: new Date().toISOString(), // Registro do timestamp da criacao
                empreendimentoId: expenseData.empreendimentoId,
                category: expenseData.category,
                description: expenseData.description,
                amount: expenseData.amount,
                taxTreatment: expenseData.taxTreatment,
                taxProvider: expenseData.taxProvider,
                taxDocument: expenseData.taxDocument,
                recurrenceId: recurrenceId,
            });
        }
    }

    saveState();
    closeExpenseModal();
    render();
}

    function deleteExpense() {
        if (!requireWorkspacePermission("manageExpenses")) return;
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
        reminderDays.value = state.settings.reminderDays;
        overdueFollowUpDays.value = state.settings.overdueFollowUpDays;
        defaultAdjustmentPercent.value = state.settings.defaultAdjustmentPercent;

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
        pinCurrentSection.hidden = !lockConfig;
        pinChangePanel.open = false;
        removePinButton.hidden = !lockConfig;
        securityStatus.textContent = lockConfig
            ? "Um PIN protege o acesso neste dispositivo."
            : "Nenhum PIN configurado neste dispositivo.";
        securityStatus.style.color = "";
        updateBiometricUi();
        renderCategoryManager();
        renderEnterpriseManager();
        setCategoryStatus("Edite as opções disponíveis para os gastos.", false);
        finePercent.setCustomValidity("");
        dailyInterestPercent.setCustomValidity("");
        overdueFollowUpDays.setCustomValidity("");
        defaultAdjustmentPercent.setCustomValidity("");
        renderBackupHistory();
        ModalManager.open(settingsModal);
    }

    function closeSettings() {
        ModalManager.close(settingsModal);
        if (isMobileNavigation() && activeMobileShortcut === "settings") {
            activeMobileShortcut = "";
            renderAppNavigation();
        }
    }

    function saveSettings() {
        if (!requireWorkspacePermission("manageSettings")) return;
        var fine = Number(finePercent.value);
        var interest = Number(dailyInterestPercent.value);
        var reminder = Number(reminderDays.value);
        var followUp = Number(overdueFollowUpDays.value);
        var adjustment = Number(defaultAdjustmentPercent.value);
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
        if (!Number.isInteger(followUp) || followUp < 1 || followUp > 30) {
            overdueFollowUpDays.setCustomValidity("Informe de 1 a 30 dias."); overdueFollowUpDays.reportValidity(); overdueFollowUpDays.focus(); return;
        }
        if (!Number.isFinite(adjustment) || adjustment < -100 || adjustment > 1000) {
            defaultAdjustmentPercent.setCustomValidity("Informe um percentual válido."); defaultAdjustmentPercent.reportValidity(); defaultAdjustmentPercent.focus(); return;
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
            overdueFollowUpDays: followUp,
            defaultAdjustmentPercent: adjustment,
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
        pinCurrentSection.hidden = false;
        pinChangePanel.open = false;

        removePinButton.hidden = false;

        securityStatus.textContent = "PIN salvo neste dispositivo.";

        securityStatus.style.color = "#0f766e";
        await updateBiometricUi();
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
        pinCurrentSection.hidden = true;
        pinChangePanel.open = false;

        removePinButton.hidden = true;

        securityStatus.textContent = "PIN removido. O app abrirá sem senha.";

        securityStatus.style.color = "#0f766e";
        await updateBiometricUi();
    }

    function saveUnit() {
        if (!requireWorkspacePermission("manageContracts")) return;
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
            if (!canCreateWithinPlan("units", state.units.length)) {
                return;
            }
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

    function formatDate(value) {
        // Aceita Date, Timestamp do Firebase, milissegundos e texto ISO/aaaa-mm-dd.
        var date = value;
        if (date && typeof date.toDate === "function") date = date.toDate();
        else if (date && typeof date === "object" && typeof date.seconds === "number") date = new Date(date.seconds * 1000);
        else if (!(date instanceof Date)) {
            if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) date = new Date(date + "T12:00:00");
            else date = new Date(date);
        }
        if (!(date instanceof Date) || isNaN(date.getTime())) return "Data não informada";
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
        var scope = selectedEmpreendimentoId === "todos"
            ? "Todos os empreendimentos"
            : empreendimentoName(selectedEmpreendimentoId);

        var annualReceived = 0;
        var annualExpected = 0;
        var annualOverdue = 0;
        var annualOverdueCount = 0;
        var currentMonth = new Date().getFullYear() === selectedYear ? new Date().getMonth() : -1;
        var occupiedNow = currentMonth < 0 ? 0 : units.filter(function (unit) {
            return isActive(unit, currentMonth) && String(unit.tenantName || "").trim();
        }).length;

        var monthly = months.map(function (_, i) {
            var metrics = monthlyFinancialMetrics(units, selectedYear, i);
            var received = metrics.received;
            var expected = metrics.expected;
            var overdue = metrics.overdueWithCharges;
            var spent = expenses.reduce(function (sum, expense) {
                return sum + (expense.ym === monthKey(i) ? expense.amount : 0);
            }, 0);
            annualReceived += received;
            annualExpected += expected;
            annualOverdue += overdue;
            annualOverdueCount += metrics.overdueCount;
            return { received: received, expected: expected, overdue: overdue, expenses: spent, net: received - spent };
        });

        var annualExpenses = expenses.reduce(function (sum, expense) {
            return sum + (expense.ym.slice(0, 4) === yearText ? expense.amount : 0);
        }, 0);
        var annualNet = annualReceived - annualExpenses;

        var unitRows = units.slice().sort(function (a, b) {
            return a.name.localeCompare(b.name, "pt-BR");
        }).map(function (unit) {
            var paid = 0, paidLate = 0, overdueMonths = 0;
            var overdue = 0, received = 0, expected = 0;

            months.forEach(function (_, i) {
                var key = monthKey(i);
                var receivedForMonth = historicalReceivedAmount(unit, selectedYear, i);
                var ledger = unit.lateLedger && typeof unit.lateLedger === "object" ? unit.lateLedger : {};
                var recordedLate = ledger[key];
                var recordedOpenLate = recordedLate === true || recordedLate === "open";

                if (receivedForMonth > 0) {
                    received += receivedForMonth;
                    paid += 1;
                }
                if ((getPaymentRecord(unit, selectedYear, i) && Number(getPaymentRecord(unit, selectedYear, i).interestAmount) > 0) || isPaidLate(unit, i) || recordedLate === "paid") paidLate += 1;
                expected += scheduledRentForMonth(unit, selectedYear, i);

                if (effectiveStatus(unit, i) === "atrasado" || statusFor(unit, i) === "atrasado" || recordedOpenLate) {
                    overdueMonths += 1;
                    overdue += recordedOpenLate
                        ? historicLateRent(unit, key)
                        : (updatedAmount(unit, i) === null ? rentForMonth(unit, selectedYear, i) : updatedAmount(unit, i));
                }
            });

            var title = '<strong>' + escapeHtml(unit.name) + '</strong>';
            if (selectedEmpreendimentoId === "todos") title += '<small>' + escapeHtml(empreendimentoName(unit.empreendimentoId)) + '</small>';

            return '<tr><td>' + title + '</td>' +
                '<td class="num">' + money(expected) + '</td>' +
                '<td class="num">' + money(received) + '</td>' +
                '<td class="num">' + paid + '</td>' +
                '<td class="num">' + paidLate + '</td>' +
                '<td class="num ' + (overdue ? 'ar-neg' : '') + '">' +
                    (overdueMonths ? money(overdue) + '<small>' + overdueMonths + ' ' + (overdueMonths === 1 ? 'parcela' : 'parcelas') + '</small>' : '—') +
                '</td></tr>';
        }).join("");

        var totalCard = function (label, value, variant, detail) {
            return '<div class="ar-total ' + (variant || "") + '"><span>' + label + '</span><strong class="' + (variant === "is-negative" ? "ar-neg" : "") + '">' + value + '</strong>' + (detail ? '<small>' + detail + '</small>' : '') + '</div>';
        };

        return '<div class="annual-report">' +
            '<header class="ar-header"><div><p class="ar-eyebrow">Relatório financeiro</p><h1>Resumo do ano ' + selectedYear + '</h1><p class="ar-meta">' + escapeHtml(scope) + ' · Emitido em ' + escapeHtml(formatDate(new Date())) + (state.settings.receiverName ? ' · Recebedor: ' + escapeHtml(state.settings.receiverName) : '') + '</p></div></header>' +
            '<div class="ar-totals">' +
                totalCard("Previsto", money(annualExpected), "is-primary", "Contratos ativos no período") +
                totalCard("Recebido", money(annualReceived), "", "Baixas de contratos ativos e encerrados") +
                totalCard("Gastos", money(annualExpenses), "", "Despesas do período") +
                totalCard("Resultado líquido", money(annualNet), annualNet < 0 ? "is-negative" : "is-positive", "Recebido menos gastos") +
                totalCard("Inadimplência", money(annualOverdue), annualOverdue > 0 ? "is-negative" : "", annualOverdueCount + " mês(es) com atraso") +
            '</div>' +
            '<section class="ar-section"><div class="ar-section-heading"><div><p class="ar-eyebrow">Fluxo mensal</p><h3>Receitas, despesas e resultado</h3></div><p>Valores realizados; previsto e atraso ajudam a acompanhar a operação.</p></div>' +
            '<table class="ar-table ar-monthly-table"><thead><tr><th>Mês</th><th class="num">Previsto</th><th class="num">Recebido</th><th class="num">Em atraso</th><th class="num">Gastos</th><th class="num">Líquido</th></tr></thead><tbody>' +
            monthly.map(function (row, i) {
                return '<tr><td>' + fullMonths[i] + '</td><td class="num">' + money(row.expected) + '</td><td class="num">' + money(row.received) + '</td><td class="num ' + (row.overdue ? "ar-neg" : "") + '">' + money(row.overdue) + '</td><td class="num">' + money(row.expenses) + '</td><td class="num ' + (row.net < 0 ? "ar-neg" : "") + '">' + money(row.net) + '</td></tr>';
            }).join("") +
            '</tbody><tfoot><tr class="ar-total-row"><td>Total</td><td class="num">' + money(annualExpected) + '</td><td class="num">' + money(annualReceived) + '</td><td class="num ' + (annualOverdue ? "ar-neg" : "") + '">' + money(annualOverdue) + '</td><td class="num">' + money(annualExpenses) + '</td><td class="num ' + (annualNet < 0 ? "ar-neg" : "") + '">' + money(annualNet) + '</td></tr></tfoot></table></section>' +
            '<section class="ar-section"><div class="ar-section-heading"><div><p class="ar-eyebrow">Unidades</p><h3>Resumo consolidado por unidade</h3></div><p>Uma linha reúne todos os contratos da unidade no ano; não atribui o histórico ao inquilino atual.</p></div>' +
            '<table class="ar-table"><thead><tr><th>Unidade</th><th class="num">Previsto</th><th class="num">Recebido</th><th class="num">Baixas</th><th class="num">Pagos c/ atraso</th><th class="num">Em atraso</th></tr></thead><tbody>' +
            (unitRows || '<tr><td colspan="6">Nenhuma unidade cadastrada</td></tr>') +
            '</tbody></table></section>' +
            '<footer class="ar-footer"><span>Ocupação no mês de referência: <strong>' + occupiedNow + ' de ' + units.length + ' unidades</strong></span><span>Dados consolidados por unidade</span></footer>' +
            '</div>';
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

    function openAnnualReport() {
        var reportModal = document.getElementById("annualReportModal");
        var reportContainer = document.getElementById("annualReportContainer");
        if (!reportModal || !reportContainer) {
            printAnnualReport();
            return;
        }

        reportContainer.innerHTML = buildAnnualReportHtml();
        reportModal.style.display = "flex";
        document.body.classList.add("modal-open");
        history.pushState({ modal: true, id: "annualReportModal" }, "");
    }

    function closeAnnualReport(fromHistory) {
        var reportModal = document.getElementById("annualReportModal");
        if (!reportModal) return;
        reportModal.style.display = "none";
        document.body.classList.remove("modal-open");

        if (!fromHistory && history.state && history.state.modal && history.state.id === "annualReportModal") {
            history.replaceState(Object.assign({}, history.state, { modal: false, id: null }), "");
        }
    }

    window.addEventListener("popstate", function () {
        var reportModal = document.getElementById("annualReportModal");
        if (reportModal && reportModal.style.display !== "none") closeAnnualReport(true);
    });

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
							/* Layout do relatório anual */
                            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            body { margin: 0; padding: 28px; color: #173333; background: #f1f7f6; font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
                            body > .annual-report { display: block; }
                            .annual-report .annual-report { width: 100%; max-width: 980px; margin: 0 auto; padding: 30px; border: 1px solid #dbe9e7; border-radius: 20px; background: #fff; box-shadow: 0 10px 32px rgba(15, 94, 89, .10); }
                            .ar-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding-bottom: 20px; border-bottom: 1px solid #dbe9e7; }
                            .ar-eyebrow { margin: 0 0 5px; color: #0f766e; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
                            h1 { margin: 0; color: #115e59; font-size: 25px; line-height: 1.15; letter-spacing: -.03em; }
                            .ar-meta { margin: 7px 0 0; color: #647979; font-size: 12px; }
                            .ar-mark { display: grid; place-items: center; flex: 0 0 42px; width: 42px; height: 42px; border-radius: 14px; color: #ecfffb; background: #0f766e; font-size: 12px; font-weight: 900; }
                            .ar-totals { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin: 20px 0; }
                            .ar-total { min-width: 0; padding: 13px; border: 1px solid #dbe9e7; border-radius: 13px; background: #f9fcfb; }
                            .ar-total.is-primary { border-color: #b7ded5; background: #edf9f6; }
                            .ar-total.is-positive { border-color: #b7ded5; background: #f1faf7; }
                            .ar-total.is-negative { border-color: #f0bec5; background: #fff6f6; }
                            .ar-total span, .ar-total small { display: block; color: #647979; font-size: 10px; line-height: 1.35; }
                            .ar-total strong { display: block; margin: 5px 0 3px; color: #115e59; font-size: 16px; letter-spacing: -.02em; }
                            .ar-neg { color: #a52d3b !important; }
                            .ar-section { margin-top: 24px; }
                            .ar-section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 10px; }
                            h3 { margin: 0; color: #115e59; font-size: 15px; }
                            .ar-section-heading > p { max-width: 380px; margin: 0; color: #647979; font-size: 10px; line-height: 1.4; text-align: right; }
                            .ar-table { width: 100%; border-collapse: separate; border-spacing: 0; overflow: hidden; border: 1px solid #dbe9e7; border-radius: 13px; }
                            .ar-table th, .ar-table td { padding: 10px 9px; border-bottom: 1px solid #e7f0ee; color: #173333; font-size: 11px; text-align: left; vertical-align: middle; }
                            .ar-table th { color: #526565; background: #f5faf9; font-size: 10px; font-weight: 800; }
                            .ar-table td strong, .ar-table td small { display: block; }
                            .ar-table td small { margin-top:2px; color:#647979; font-size:9px; }
                            .ar-table tbody tr:nth-child(even) td { background: #fbfdfd; }
                            .ar-table tr:last-child td { border-bottom: 0; }
                            .ar-table th.num, .ar-table td.num { text-align: right; white-space: nowrap; }
                            .ar-total-row td { border-top: 1px solid #cce1dd; border-bottom: 0; color: #115e59; background: #eef8f5 !important; font-weight: 800; }
                            .ar-footer { display: flex; justify-content: space-between; gap: 12px; margin-top: 16px; color: #647979; font-size: 10px; }
                            .ar-footer strong { color: #115e59; }

                            @media (max-width: 760px) {
                                body { padding: 12px; }
                                .annual-report .annual-report { padding: 18px; border-radius: 14px; }
                                .ar-totals { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                                .ar-section-heading { align-items: flex-start; flex-direction: column; }
                                .ar-section-heading > p { text-align: left; }
                                .ar-table { display: block; overflow-x: auto; }
                            }
                            @media print {
                                @page { margin: 12mm; }
                                body { padding: 0; background: #fff; }
                                .annual-report .annual-report { max-width: none; padding: 0; border: 0; border-radius: 0; box-shadow: none; }
                                .ar-totals { grid-template-columns: repeat(5, minmax(0, 1fr)); }
                                .ar-section { break-inside: avoid; }
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

    document.querySelectorAll("[data-app-view]").forEach(function (button) {
        button.addEventListener("click", function () {
            var requestedView = button.dataset.appView;
            if (isMobileNavigation() && !mobileLauncherActive && activeMobileShortcut === requestedView) {
                closeMobileShortcut();
                return;
            }
            activeMobileShortcut = requestedView;
            actionCenterExpanded = false;
            showAppView(requestedView);
            renderActionCenter();
        });
    });

    document.getElementById("actionAlertNav").addEventListener("click", function () {
        if (isMobileNavigation() && !mobileLauncherActive && activeMobileShortcut === "alerts") {
            closeMobileShortcut();
            return;
        }
        activeMobileShortcut = "alerts";
        actionCenterExpanded = true;
        showAppView("home");
        renderActionCenter();
        window.setTimeout(function () {
            var panel = document.getElementById("actionCenter");
            if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
    });

    document.getElementById("mobileSettingsNav").addEventListener("click", function () {
        activeMobileShortcut = "settings";
        if (isMobileNavigation()) renderAppNavigation();
        openSettings();
    });

    document.getElementById("mobileExpensesNav").addEventListener("click", function () {
        if (isMobileNavigation() && !mobileLauncherActive && activeMobileShortcut === "expenses") {
            closeMobileShortcut();
            return;
        }
        activeMobileShortcut = "expenses";
        expensesExpanded = true;
        showAppView("financial");
        render();
        window.setTimeout(function () {
            var expenses = document.getElementById("expensesTitle") || document.getElementById("expensesList");
            if (expenses) expenses.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
    });

    document.getElementById("mobileTaxNav").addEventListener("click", function () {
        if (isMobileNavigation() && !mobileLauncherActive && activeMobileShortcut === "tax") {
            closeMobileShortcut();
            return;
        }
        activeMobileShortcut = "tax";
        taxDashboardExpanded = true;
        showAppView("tax");
        render();
        window.setTimeout(function () {
            var dashboard = document.getElementById("taxDashboard");
            if (dashboard) dashboard.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
    });

    document.getElementById("mobileChargesNav").addEventListener("click", function () {
        if (isMobileNavigation() && !mobileLauncherActive && activeMobileShortcut === "charges") {
            closeMobileShortcut();
            return;
        }
        activeMobileShortcut = "charges";
        actionCenterExpanded = true;
        showAppView("home");
        renderActionCenter();
        window.setTimeout(function () {
            var panel = document.getElementById("actionCenter");
            if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 0);
    });

    window.addEventListener("resize", function () {
        renderAppNavigation();
    });

    document.getElementById("nextYear").addEventListener("click", function () {
        selectedYear += 1;
        render();
    });

    var unitSearchRenderTimer = null;
    unitSearch.addEventListener("input", function () {
        clearTimeout(unitSearchRenderTimer);
        unitSearchRenderTimer = setTimeout(render, 120);
    });

    statusFilter.addEventListener("change", render);

    empreendimentoFilter.addEventListener("change", function () {
        selectedEmpreendimentoId = empreendimentoFilter.value;

        saveSelectedEmpreendimento();

        unitSearch.value = "";

        statusFilter.value = "todos";

        render();
    });

    document.getElementById("addUnit").addEventListener("click", function () {
        if (canCreateWithinPlan("units", state.units.length)) openModal();
    });
    document.getElementById("mobileAddUnit").addEventListener("click", function () {
        if (canCreateWithinPlan("units", state.units.length)) openModal();
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
    if (platformAdminButton) platformAdminButton.addEventListener("click", openPlatformAdmin);
    var closePlatformAdminButton = document.getElementById("closePlatformAdmin");
    if (closePlatformAdminButton) closePlatformAdminButton.addEventListener("click", closePlatformAdmin);
    if (platformAdminModal) platformAdminModal.addEventListener("click", function (event) {
        if (event.target === event.currentTarget) closePlatformAdmin();
    });
    var skipOnboardingButton = document.getElementById("skipOnboarding");
    var finishOnboardingButton = document.getElementById("finishOnboarding");
    if (skipOnboardingButton) skipOnboardingButton.addEventListener("click", function () { closeOnboarding(false); });
    if (finishOnboardingButton) finishOnboardingButton.addEventListener("click", function () { closeOnboarding(true); });
    var savePlatformPlanButton = document.getElementById("savePlatformPlan");
    if (savePlatformPlanButton) savePlatformPlanButton.addEventListener("click", savePlatformPlan);
    var platformSubscriptionFilter = document.getElementById("platformSubscriptionFilter");
    if (platformSubscriptionFilter) platformSubscriptionFilter.addEventListener("change", renderPlatformApprovals);

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
    authBiometric.addEventListener("click", showPinLogin);
    savePinButton.addEventListener("click", savePin);
    enableBiometricButton.addEventListener("click", enableBiometric);

    removePinButton.addEventListener("click", removePin);
    removeBiometricButton.addEventListener("click", removeBiometric);

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
        .addEventListener("click", openAnnualReport);

    document
        .getElementById("printAnnualReportButton")
        .addEventListener("click", printAnnualReport);

    document
        .getElementById("closeAnnualReport")
        .addEventListener("click", closeAnnualReport);

    document
        .getElementById("annualReportModal")
        .addEventListener("click", function (event) {
            if (event.target === event.currentTarget) closeAnnualReport();
        });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeAnnualReport();
    });

    document
        .getElementById("toggleSummaryCards")
        .addEventListener("click", function () {
            summaryCardsExpanded = !summaryCardsExpanded;
            applySummaryCardsVisibility();
        });

    document
        .getElementById("toggleFinancialReport")
        .addEventListener("click", function () {
            financialReportExpanded = !financialReportExpanded;
            renderSummary();
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

    function useAccountGateCredentials(action) {
        cloudEmail.value = String(accountGateEmail.value || "").trim();
        cloudPassword.value = accountGatePassword.value || "";
        runCloudAuth(action);
    }

    document.getElementById("accountGateSignIn").addEventListener("click", function () {
        useAccountGateCredentials("signin");
    });
    document.getElementById("accountGateSignUp").addEventListener("click", function () {
        useAccountGateCredentials("signup");
    });
    document.getElementById("accountGateGoogle").addEventListener("click", signInWithGoogle);
    document.getElementById("accountGateReset").addEventListener("click", function () {
        cloudEmail.value = String(accountGateEmail.value || "").trim();
        resetCloudPassword();
    });
    document.getElementById("accountGateSignOut").addEventListener("click", function () {
        if (!firebaseAuth) return;
        firebaseAuth.signOut().catch(function (error) {
            setCloudError(cloudErrorMessage(error));
        });
    });

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

    function runPwaShortcut() {
        if (!pendingPwaShortcut || !appUnlocked || ModalManager.getOpenModal()) return;
        var action = pendingPwaShortcut;
        pendingPwaShortcut = null;
        var url = new URL(window.location.href);
        url.searchParams.delete("action");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : "") + url.hash);
        if (action === "new-unit") openModal();
        if (action === "new-expense") openExpenseModal();
    }

    function showPwaStatus(message, actionLabel, action, variant) {
        if (!pwaStatus) return;
        pwaStatus.hidden = false;
        pwaStatus.classList.remove("is-update");
        if (variant) pwaStatus.classList.add(variant);
        pwaStatusText.textContent = message || "";
        pwaStatusAction.hidden = !actionLabel;
        pwaStatusAction.textContent = actionLabel || "";
        pwaStatusAction.onclick = action || null;
    }

    function hidePwaStatus() {
        if (pwaStatus) pwaStatus.hidden = true;
    }

    function offerPwaUpdate(registration) {
        if (!registration || !registration.waiting) return;
        pendingPwaUpdate = registration;
        showPwaStatus("Uma atualização está disponível.", "Atualizar agora", function () {
            pwaUpdateAccepted = true;
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }, "is-update");
    }

    window.addEventListener("online", function () {
        if (firebaseUser) {
            updateConnectionStatus();
            if (cloudHasPendingWrite) scheduleCloudWrite();
        }
        if (!pendingPwaUpdate) {
            showPwaStatus("Conexão restaurada.", "", null);
            window.setTimeout(hidePwaStatus, 2200);
        }
    });

    window.addEventListener("offline", function () {
        if (firebaseUser) setSyncStatus("Offline — alterações salvas localmente");
        showPwaStatus("Você está offline. Alterações serão sincronizadas quando a conexão voltar.", "", null);
    });

    window.addEventListener("beforeinstallprompt", function (event) {
        event.preventDefault();
        pendingPwaInstall = event;
        if (!pendingPwaUpdate) {
            showPwaStatus("Instale o app para abrir mais rápido pelo celular.", "Instalar", function () {
                if (!pendingPwaInstall) return;
                pendingPwaInstall.prompt();
                pendingPwaInstall.userChoice.then(function () {
                    pendingPwaInstall = null;
                    hidePwaStatus();
                });
            });
        }
    });

    window.addEventListener("appinstalled", function () {
        pendingPwaInstall = null;
        showPwaStatus("App instalado com sucesso.", "", null);
        window.setTimeout(hidePwaStatus, 2200);
    });

    if (pwaStatusDismiss) pwaStatusDismiss.addEventListener("click", hidePwaStatus);

    ["click", "keydown", "touchstart"].forEach(function (eventName) {
        document.addEventListener(eventName, registerAppActivity, { passive: eventName === "touchstart" });
    });
    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            // Mantém a sessão por alguns minutos ao alternar de aplicativo.
            clearTimeout(autoLockTimer);
        } else {
            checkSessionOnReturn();
        }
    });

    function closePaymentAdjustModal() {
        paymentAdjustContext = null;
        historicPaymentAdjustContext = null;
        ModalManager.close(document.getElementById("paymentAdjustModal"));
    }

    const dismissibleModals = [
        { element: modal, close: closeModal },
        { element: expenseModal, close: closeExpenseModal },
        { element: settingsModal, close: closeSettings },
        { element: receiptModal, close: closeReceipt },
        {
            element: document.getElementById("paymentAdjustModal"),
            close: closePaymentAdjustModal,
        },
        {
            element: document.getElementById("contractInstallmentsModal"),
            close: function () {
                ModalManager.close(document.getElementById("contractInstallmentsModal"));
            },
        },
    ];

    dismissibleModals.forEach(function (entry) {
        entry.element.addEventListener("click", function (event) {
            if (event.target === entry.element) entry.close();
        });
    });

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;

        for (var index = dismissibleModals.length - 1; index >= 0; index -= 1) {
            var entry = dismissibleModals[index];
            if (!entry.element.hidden) {
                entry.close();
                break;
            }
        }
    });

    window.addEventListener("pageshow", function () {
        collapseExpenseMonths();
        // No retorno do cache do navegador, respeita os cinco minutos de sessão
        // em vez de solicitar o PIN novamente logo após um desbloqueio.
        checkSessionOnReturn();

        requestAnimationFrame(function () {
            requestAnimationFrame(scrollPageToTop);
        });
    });

    updateCloudUi();

    initFirebase();

    initAuth();

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("controllerchange", function () {
            if (pwaUpdateAccepted) window.location.reload();
        });

        window.addEventListener("load", function () {
            navigator.serviceWorker
                .register("sw.js", { updateViaCache: "none" })
                .then(function (registration) {
                    offerPwaUpdate(registration);
                    registration.addEventListener("updatefound", function () {
                        var worker = registration.installing;
                        if (!worker) return;
                        worker.addEventListener("statechange", function () {
                            if (worker.state === "installed" && navigator.serviceWorker.controller) {
                                offerPwaUpdate(registration);
                            }
                        });
                    });
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

        // Parcela atual: só soma quando o status visível é Pago.
        if (isActive(unit, month) && statusFor(unit, month) === "pago") {
            var activeRent = Math.max(0, Number(rentForMonth(unit, year, month)) || 0);
            var paidDate = payment && payment.paidAt ? new Date(payment.paidAt) : null;
            var startDate = isValidDateValue(unit.startDate)
                ? new Date(unit.startDate + "T00:00:00")
                : null;
            var currentPayment = payment && !payment.historicContractId &&
                (!startDate || (paidDate && !isNaN(paidDate.getTime()) && paidDate >= startDate));
            return currentPayment
                ? Math.max(0, Number(payment.rentAmount) || activeRent)
                : activeRent;
        }

        // Parcela de contrato encerrado: respeita o status histórico "pago".
        var ledger = unit && unit.lateLedger && typeof unit.lateLedger === "object" ? unit.lateLedger : {};
        var activeStart = isActive(unit, month) && isValidDateValue(unit.startDate)
            ? new Date(unit.startDate + "T00:00:00")
            : null;
        var historicPaymentDate = payment && payment.paidAt ? new Date(payment.paidAt) : null;
        var paidBeforeNewContract = activeStart && historicPaymentDate &&
            !isNaN(historicPaymentDate.getTime()) && historicPaymentDate < activeStart;
        var historicPaid = ledger[key] === "paid" ||
            (payment && payment.historicContractId) ||
            paidBeforeNewContract ||
            (!isActive(unit, month) && paymentIsConfirmedForTotals(unit, key, payment));
        if (!historicPaid) return 0;
        var archived = archivedContractForMonth(unit, month);
        return Math.max(0, Number(payment && payment.rentAmount) || Number(archived && archived.rent) || 0);
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

    /*
     * Fonte única dos indicadores financeiros mensais.
     * Todos os valores de receita abaixo representam apenas o principal do aluguel:
     * multa e juros são acompanhados separadamente e não distorcem a conciliação.
     */
    function scheduledRentForMonth(unit, year, month) {
        if (!unit) return 0;
        var key = String(year) + "-" + String(month + 1).padStart(2, "0");

        if (isActive(unit, month)) {
            return Math.max(0, Number(rentForMonth(unit, year, month)) || 0);
        }

        var history = Array.isArray(unit.contractHistory) ? unit.contractHistory : [];
        var contract = history.slice().reverse().find(function (item) {
            if (!item) return false;
            var start = item.startYm || contractMonthValue(item.startDate);
            var end = item.endYm || contractMonthValue(item.endDate);
            return isValidStartYm(start) && isValidStartYm(end) && key >= start && key <= end;
        });

        return contract ? Math.max(0, Number(contract.rent) || 0) : 0;
    }

    /*
     * Regras do painel:
     * - Previsto: aluguéis de contratos ativos no mês.
     * - Recebido: parcelas com status Pago.
     * - A receber: parcelas ativas com status Pendente.
     * - Em atraso: parcelas com status Atrasado, ativas ou encerradas.
     */
    function monthlyFinancialMetrics(units, year, month) {
        var key = String(year) + "-" + String(month + 1).padStart(2, "0");
        var metrics = {
            expected: 0,
            received: 0,
            pending: 0,
            overdueBase: 0,
            overdueWithCharges: 0,
            overdueCount: 0
        };

        function addOpenLate(rent) {
            if (!rent) return;
            metrics.overdueCount += 1;
            metrics.overdueBase += rent;
            metrics.overdueWithCharges += rent;
        }

        (units || []).forEach(function (unit) {
            var active = isActive(unit, month);
            var payment = getPaymentRecord(unit, year, month);
            var ledger = unit.lateLedger && typeof unit.lateLedger === "object" ? unit.lateLedger : {};
            var ledgerStatus = ledger[key];
            var activeLateCounted = false;
            var historicLateCounted = false;

            // Contrato ativo: previsto, pago, pendente ou atrasado conforme o status da parcela.
            if (active) {
                var activeRent = Math.max(0, Number(rentForMonth(unit, year, month)) || 0);
                var activeStatus = statusFor(unit, month);
                metrics.expected += activeRent;

                if (activeStatus === "pago") {
                    var paidDate = payment && payment.paidAt ? new Date(payment.paidAt) : null;
                    var contractStart = isValidDateValue(unit.startDate)
                        ? new Date(unit.startDate + "T00:00:00")
                        : null;
                    var currentPayment = payment && !payment.historicContractId &&
                        (!contractStart || (paidDate && !isNaN(paidDate.getTime()) && paidDate >= contractStart));
                    metrics.received += currentPayment
                        ? Math.max(0, Number(payment.rentAmount) || activeRent)
                        : activeRent;
                } else if (activeStatus === "atrasado") {
                    addOpenLate(activeRent);
                    activeLateCounted = true;
                } else {
                    metrics.pending += activeRent;
                }
            }

            /*
             * Contratos encerrados: só entram se a parcela foi registrada
             * como paga ("paid") ou atrasada ("open"). Isso conserva o
             * histórico sem colocá-lo em "A receber".
             */
            var history = Array.isArray(unit.contractHistory) ? unit.contractHistory : [];
            history.forEach(function (contract) {
                if (!contract) return;
                var contractStartYm = contract.startYm || contractMonthValue(contract.startDate);
                var contractEndYm = contract.endYm || contractMonthValue(contract.endDate);
                if (!isValidStartYm(contractStartYm) || !isValidStartYm(contractEndYm) ||
                    key < contractStartYm || key > contractEndYm) return;

                var historicRent = Math.max(0, Number(contract.rent) || 0);
                if (!historicRent) return;

                var historicPaymentDate = payment && payment.paidAt ? new Date(payment.paidAt) : null;
                var activeStartDate = active && isValidDateValue(unit.startDate)
                    ? new Date(unit.startDate + "T00:00:00")
                    : null;
                var paidBeforeNewContract = activeStartDate && historicPaymentDate &&
                    !isNaN(historicPaymentDate.getTime()) &&
                    historicPaymentDate < activeStartDate;
                var historicPaid = ledgerStatus === "paid" ||
                    (payment && payment.historicContractId === contract.id) ||
                    paidBeforeNewContract ||
                    (!active && paymentIsConfirmedForTotals(unit, key, payment));

                if (ledgerStatus === true || ledgerStatus === "open") {
                    addOpenLate(historicRent);
                    historicLateCounted = true;
                } else if (historicPaid) {
                    metrics.received += Math.max(0, Number(payment && payment.rentAmount) || historicRent);
                }
            });

            /*
             * Dados legados podem ter somente status[ano-mês] = "atrasado".
             * Essa marca é suficiente para a parcela aparecer na foto de
             * inadimplência, mesmo sem ledger/contrato histórico completo.
             */
            if (!activeLateCounted && !historicLateCounted && statusFor(unit, month) === "atrasado") {
                var legacyLateRent = Math.max(0, Number(historicLateRent(unit, key)) || 0);
                if (!legacyLateRent && active) {
                    legacyLateRent = Math.max(0, Number(rentForMonth(unit, year, month)) || 0);
                }
                addOpenLate(legacyLateRent);
            }
        });

        return metrics;
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
        var ledger = unit && unit.lateLedger && typeof unit.lateLedger === "object" ? unit.lateLedger : {};

        // Só há juros recebidos quando a parcela está efetivamente paga com atraso.
        var paidLateCurrent = isActive(unit, month) &&
            statusFor(unit, month) === "pago" &&
            unit.paidLate && unit.paidLate[key] === true;
        var historicPaymentDate = payment && payment.paidAt ? new Date(payment.paidAt) : null;
        var activeStart = isActive(unit, month) && isValidDateValue(unit.startDate)
            ? new Date(unit.startDate + "T00:00:00")
            : null;
        var paidBeforeNewContract = activeStart && historicPaymentDate &&
            !isNaN(historicPaymentDate.getTime()) && historicPaymentDate < activeStart;
        var paidLateHistoric = ledger[key] === "paid" ||
            (payment && payment.historicContractId && paymentWasLate(unit, key)) ||
            paidBeforeNewContract && paymentWasLate(unit, key);

        if (!payment || (!paidLateCurrent && !paidLateHistoric)) return 0;
        return recordedInterestAmount(payment);
    }

    function ensureFinancialHistory(unit) {
        unit.status = unit.status && typeof unit.status === "object" ? unit.status : {};
        unit.paidLate = unit.paidLate && typeof unit.paidLate === "object" ? unit.paidLate : {};
        unit.lateLedger = unit.lateLedger && typeof unit.lateLedger === "object" ? unit.lateLedger : {};
        unit.paymentHistory = unit.paymentHistory && typeof unit.paymentHistory === "object" ? unit.paymentHistory : {};
    }

    function archiveCurrentContract() {
        if (!requireWorkspacePermission("manageContracts")) return;
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
    if (!requireWorkspacePermission("managePayments")) return;
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
        if (!requireWorkspacePermission("manageContracts")) return;
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
        if (!requireWorkspacePermission("manageContracts")) return;
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
        if (!requireWorkspacePermission("manageContracts")) return;
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

    /* Sincronização granular por workspace. */
    var cloudGranularUnsubscribes = [];
    var cloudGranularReloadTimer = null;
    var cloudGranularBaseline = null;
    var cloudFinancialMigrationNeeded = false;

    function granularMetaRef() {
        var workspace = firebaseUser && cloudWorkspaceId ? workspaceRef(cloudWorkspaceId) : null;
        return workspace ? workspace.collection("meta").doc("app") : null;
    }
    function granularUnitsRef() {
        var workspace = firebaseUser && cloudWorkspaceId ? workspaceRef(cloudWorkspaceId) : null;
        return workspace ? workspace.collection("units") : null;
    }
    function granularExpensesRef() {
        var workspace = firebaseUser && cloudWorkspaceId ? workspaceRef(cloudWorkspaceId) : null;
        return workspace ? workspace.collection("expenses") : null;
    }
    function granularPaymentsRef() {
        var workspace = firebaseUser && cloudWorkspaceId ? workspaceRef(cloudWorkspaceId) : null;
        return workspace ? workspace.collection("payments") : null;
    }
    function granularChargesRef() {
        var workspace = firebaseUser && cloudWorkspaceId ? workspaceRef(cloudWorkspaceId) : null;
        return workspace ? workspace.collection("charges") : null;
    }
    function granularClone(value) { return JSON.parse(JSON.stringify(value)); }
    function stableContractId(contract, index) {
        if (contract && typeof contract.id === "string" && contract.id && contract.id.indexOf("/") < 0) return contract.id;
        var source = String((contract && contract.tenantName) || "") + "|" +
            String((contract && (contract.startDate || contract.startYm)) || "") + "|" +
            String((contract && (contract.endDate || contract.endYm)) || "") + "|" + index;
        var hash = 0;
        for (var i = 0; i < source.length; i++) hash = ((hash << 5) - hash + source.charCodeAt(i)) | 0;
        return "legacy-" + index + "-" + Math.abs(hash).toString(36);
    }
    function granularSnapshot(value) {
        var copy = granularClone(normalizeState(value));
        var snapshot = { meta: granularClone(copy), units: {}, expenses: {}, contracts: {}, payments: {}, charges: {} };
        delete snapshot.meta.units; delete snapshot.meta.expenses;
        (copy.units || []).forEach(function (unit) {
            if (!unit || typeof unit.id !== "string" || !unit.id) return;
            var unitCopy = granularClone(unit), history = Array.isArray(unitCopy.contractHistory) ? unitCopy.contractHistory : [];
            snapshot.payments[unit.id] = {
                status: granularClone(unitCopy.status || {}),
                paidLate: granularClone(unitCopy.paidLate || {}),
                lateLedger: granularClone(unitCopy.lateLedger || {}),
                paymentHistory: granularClone(unitCopy.paymentHistory || {})
            };
            snapshot.charges[unit.id] = { chargeLog: granularClone(unitCopy.chargeLog || []) };
            delete unitCopy.contractHistory;
            delete unitCopy.status;
            delete unitCopy.paidLate;
            delete unitCopy.lateLedger;
            delete unitCopy.paymentHistory;
            delete unitCopy.chargeLog;
            snapshot.units[unit.id] = unitCopy;
            history.forEach(function (contract, index) {
                var data = granularClone(contract), id = stableContractId(data, index);
                data.id = id; data.order = index;
                snapshot.contracts[unit.id + "::" + id] = { unitId: unit.id, id: id, data: data };
            });
        });
        (copy.expenses || []).forEach(function (expense) {
            if (expense && typeof expense.id === "string" && expense.id) snapshot.expenses[expense.id] = granularClone(expense);
        });
        return snapshot;
    }
    function granularEqual(left, right) {
        return JSON.stringify(sortObject(left)) === JSON.stringify(sortObject(right));
    }

    function granularWriteOperations(current, force) {
        var baseline = cloudGranularBaseline || { meta: null, units: {}, expenses: {}, contracts: {}, payments: {}, charges: {} };
        var operations = [];
        if (force || !granularEqual(current.meta, baseline.meta || {})) {
            operations.push({ type: "set", ref: granularMetaRef(), data: { payload: current.meta, updatedAt: Date.now(), schemaVersion: 3 } });
        }
        var roots = {
            units: granularUnitsRef,
            expenses: granularExpensesRef,
            payments: granularPaymentsRef,
            charges: granularChargesRef
        };
        ["units", "expenses", "payments", "charges"].forEach(function (kind) {
            Object.keys(current[kind] || {}).forEach(function (id) {
                if (force || !granularEqual(current[kind][id], (baseline[kind] || {})[id])) {
                    operations.push({ type: "set", ref: roots[kind]().doc(id), data: current[kind][id] });
                }
            });
            Object.keys(baseline[kind] || {}).forEach(function (id) {
                if (!current[kind][id]) operations.push({ type: "delete", ref: roots[kind]().doc(id) });
            });
        });
        Object.keys(current.contracts).forEach(function (key) {
            var contract = current.contracts[key];
            if (force || !granularEqual(contract.data, (baseline.contracts || {})[key] && baseline.contracts[key].data)) {
                operations.push({ type: "set", ref: granularUnitsRef().doc(contract.unitId).collection("contracts").doc(contract.id), data: contract.data });
            }
        });
        Object.keys(baseline.contracts || {}).forEach(function (key) {
            if (!current.contracts[key]) {
                var contract = baseline.contracts[key];
                operations.push({ type: "delete", ref: granularUnitsRef().doc(contract.unitId).collection("contracts").doc(contract.id) });
            }
        });
        return operations;
    }
    function granularConflictError() {
        var error = new Error("Os dados foram alterados por outra pessoa.");
        error.code = "app/cloud-conflict";
        return error;
    }

    function verifyGranularWriteBase(current, force) {
        if (force) return Promise.resolve();
        var baseline = cloudGranularBaseline || { meta: null, units: {}, expenses: {}, contracts: {}, payments: {}, charges: {} };
        var checks = [];

        function check(ref, expected, read) {
            if (!ref) return;
            checks.push(ref.get().then(function (snapshot) {
                var remote = snapshot.exists ? read(snapshot.data() || {}) : null;
                if (!granularEqual(remote, expected || null)) throw granularConflictError();
            }));
        }

        if (!granularEqual(current.meta, baseline.meta || {})) {
            check(granularMetaRef(), baseline.meta || null, function (data) { return data.payload || null; });
        }
        var roots = {
            units: granularUnitsRef,
            expenses: granularExpensesRef,
            payments: granularPaymentsRef,
            charges: granularChargesRef
        };
        ["units", "expenses", "payments", "charges"].forEach(function (kind) {
            var ids = {};
            Object.keys(current[kind] || {}).forEach(function (id) { ids[id] = true; });
            Object.keys(baseline[kind] || {}).forEach(function (id) { ids[id] = true; });
            Object.keys(ids).forEach(function (id) {
                var now = current[kind][id] || null;
                var before = (baseline[kind] || {})[id] || null;
                if (!granularEqual(now, before)) {
                    check(roots[kind]().doc(id), before, function (data) { return data; });
                }
            });
        });
        var contractKeys = {};
        Object.keys(current.contracts || {}).forEach(function (key) { contractKeys[key] = true; });
        Object.keys(baseline.contracts || {}).forEach(function (key) { contractKeys[key] = true; });
        Object.keys(contractKeys).forEach(function (key) {
            var now = current.contracts[key] ? current.contracts[key].data : null;
            var before = baseline.contracts[key] ? baseline.contracts[key].data : null;
            if (!granularEqual(now, before)) {
                var source = current.contracts[key] || baseline.contracts[key];
                check(granularUnitsRef().doc(source.unitId).collection("contracts").doc(source.id), before, function (data) {
                    var copy = granularClone(data);
                    delete copy.order;
                    return copy;
                });
            }
        });
        return Promise.all(checks);
    }

    function commitGranularOperations(operations) {
        if (!operations.length) return Promise.resolve();
        var index = 0;
        function nextBatch() {
            if (index >= operations.length) return Promise.resolve();
            var batch = firebaseDb.batch();
            operations.slice(index, index + 400).forEach(function (operation) {
                if (operation.type === "delete") batch.delete(operation.ref); else batch.set(operation.ref, operation.data);
            });
            index += 400;
            return batch.commit().then(nextBatch);
        }
        return nextBatch();
    }
    function writeGranularState(force) {
        if (!firebaseDb || !firebaseUser || !cloudWorkspaceId) return Promise.resolve();
        var current = granularSnapshot(state);
        return verifyGranularWriteBase(current, !!force)
            .then(function () { return commitGranularOperations(granularWriteOperations(current, !!force)); })
            .then(function () { cloudGranularBaseline = current; });
    }

    function readGranularState() {
        cloudFinancialMigrationNeeded = false;
        var meta = granularMetaRef(), units = granularUnitsRef(), expenses = granularExpensesRef();
        var payments = granularPaymentsRef(), charges = granularChargesRef();
        if (!meta || !units || !expenses || !payments || !charges) return Promise.resolve(null);
        return Promise.all([meta.get(), units.get(), expenses.get(), payments.get(), charges.get()]).then(function (results) {
            var metaSnapshot = results[0], unitsSnapshot = results[1], expensesSnapshot = results[2];
            var paymentsSnapshot = results[3], chargesSnapshot = results[4];
            if (!metaSnapshot.exists || !(metaSnapshot.data() || {}).payload) return null;
            var base = granularClone((metaSnapshot.data() || {}).payload);
            base.units = []; base.expenses = [];
            var unitsById = {};
            unitsSnapshot.forEach(function (item) {
                var raw = item.data() || {};
                if (raw.status || raw.paidLate || raw.lateLedger || raw.paymentHistory || raw.chargeLog) {
                    cloudFinancialMigrationNeeded = true;
                }
                var unit = granularClone(raw); unit.id = unit.id || item.id;
                base.units.push(unit); unitsById[unit.id] = unit;
            });
            paymentsSnapshot.forEach(function (item) {
                var unit = unitsById[item.id];
                if (!unit) return;
                var data = item.data() || {};
                unit.status = granularClone(data.status || {});
                unit.paidLate = granularClone(data.paidLate || {});
                unit.lateLedger = granularClone(data.lateLedger || {});
                unit.paymentHistory = granularClone(data.paymentHistory || {});
            });
            chargesSnapshot.forEach(function (item) {
                var unit = unitsById[item.id];
                if (unit) unit.chargeLog = granularClone((item.data() || {}).chargeLog || []);
            });
            expensesSnapshot.forEach(function (item) {
                var expense = granularClone(item.data() || {}); expense.id = expense.id || item.id; base.expenses.push(expense);
            });
            return Promise.all(base.units.map(function (unit) {
                return units.doc(unit.id).collection("contracts").get().then(function (contracts) {
                    unit.contractHistory = [];
                    contracts.forEach(function (item) {
                        var contract = granularClone(item.data() || {});
                        contract.id = contract.id || item.id; unit.contractHistory.push(contract);
                    });
                    unit.contractHistory.sort(function (a, b) { return Number(a.order) - Number(b.order); });
                    unit.contractHistory.forEach(function (contract) { delete contract.order; });
                });
            })).then(function () { return normalizeState(base); });
        });
    }
    function applyRemoteState(payload) {
        cloudApplyingRemote = true;
        state = normalizeState(payload); expenseCategories = state.expenseCategories;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        cloudGranularBaseline = granularSnapshot(state);
        renderEmpreendimentoFilter(); render();
        cloudApplyingRemote = false;
    }

    function migrateSeparatedFinancialDataIfNeeded() {
        if (!cloudFinancialMigrationNeeded) return Promise.resolve();
        cloudFinancialMigrationNeeded = false;
        return writeGranularState(true);
    }
    function migrateLegacyCloudState() {
        return granularMetaRef().get().then(function (meta) {
            if (meta.exists) return false;
            return cloudDocRef().get().then(function (legacySnapshot) {
                var legacy = legacySnapshot.exists ? legacySnapshot.data() || {} : {};
                if (!legacy.payload) return writeGranularState(true).then(function () { return true; });
                var previous = state; state = normalizeState(legacy.payload);
                return writeGranularState(true).then(function () { state = previous; return true; });
            });
        });
    }

    function clearGranularSubscriptions() {
        cloudGranularUnsubscribes.forEach(function (unsubscribe) { unsubscribe(); });
        cloudGranularUnsubscribes = []; clearTimeout(cloudGranularReloadTimer);
    }
    function reloadGranularState() {
        if (cloudHasPendingWrite) return;
        readGranularState().then(function (remote) {
            if (!remote || cloudHasPendingWrite) return;
            if (!cloudStatesEqual(state, remote)) applyRemoteState(remote);
            setSyncStatus(navigator.onLine ? "Sincronizado" : "Offline — alterações salvas localmente");
        }).catch(function (error) { setCloudError(cloudErrorMessage(error)); });
    }
    function subscribeCloud() {
        if (firebaseUnsubscribe) { firebaseUnsubscribe(); firebaseUnsubscribe = null; }
        clearGranularSubscriptions();
        if (!firebaseUser || !cloudWorkspaceId) return;
        function scheduleReload() {
            clearTimeout(cloudGranularReloadTimer);
            cloudGranularReloadTimer = setTimeout(reloadGranularState, 180);
        }
        [granularMetaRef(), granularUnitsRef(), granularExpensesRef(), granularPaymentsRef(), granularChargesRef()].forEach(function (ref) {
            cloudGranularUnsubscribes.push(ref.onSnapshot(scheduleReload, function (error) { setCloudError(cloudErrorMessage(error)); }));
        });
    }
    function reconcileCloud() {
        if (!firebaseUser || !cloudWorkspaceId) return;
        updateConnectionStatus();
        migrateLegacyCloudState().then(readGranularState).then(function (remote) {
            if (!remote) return writeGranularState(true).then(function () {
                cloudHasPendingWrite = false; subscribeCloud(); setSyncStatus("Sincronizado");
            });
            if (cloudStatesEqual(state, remote)) {
                applyRemoteState(remote);
                return migrateSeparatedFinancialDataIfNeeded().then(function () {
                    finishCloudReconciliation(); updateConnectionStatus();
                });
            }
            if (state.units.length === 0 && state.expenses.length === 0) {
                applyRemoteState(remote);
                return migrateSeparatedFinancialDataIfNeeded().then(function () {
                    finishCloudReconciliation(); updateConnectionStatus();
                });
            }
            cloudPendingRemote = remote; setCloudReconcilePrompt(remote); setSyncStatus("Aguardando escolha");
        }).catch(function (error) {
            setCloudError(cloudErrorMessage(error)); setSyncStatus("Não sincronizado — salvo localmente");
        });
    }
    function writeCloudState() {
        if (!cloudHasPendingWrite || cloudWriteInFlight) return;
        if (!navigator.onLine) { setSyncStatus("Offline — alterações salvas localmente"); return; }
        var revision = cloudWriteRevision;
        cloudWriteInFlight = true; cloudWriteQueued = false;
        writeGranularState(false).then(function () {
            cloudHasPendingWrite = revision < cloudWriteRevision;
            cloudPendingRemote = null; cloudReconcile.hidden = true; cloudBanner.hidden = true;
            setCloudStatus("Conta conectada. Sincronização automática ativa.");
            setSyncStatus(cloudHasPendingWrite ? "Sincronizando..." : "Sincronizado");
        }).catch(function (error) {
            cloudHasPendingWrite = true;
            if (error && error.code === "app/cloud-conflict") {
                return readGranularState().then(function (remote) {
                    if (remote) {
                        cloudPendingRemote = remote;
                        setCloudReconcilePrompt(remote);
                    }
                    setCloudError("Outra pessoa alterou estes dados antes da sincronização. Escolha qual versão deseja manter.");
                    setSyncStatus("Conflito de sincronização — escolha uma versão");
                });
            }
            setCloudError(cloudErrorMessage(error));
            setSyncStatus("Não sincronizado — salvo localmente");
        }).then(function () {
            cloudWriteInFlight = false;
            if (cloudWriteQueued || cloudWriteRevision > revision) {
                cloudWriteQueued = false; clearTimeout(cloudWriteTimer);
                cloudWriteTimer = setTimeout(writeCloudState, 0);
            }
        });
    }

    function flushWorkspaceState() {
        if (!cloudHasPendingWrite) return Promise.resolve();
        return writeGranularState(false).then(function () {
            cloudHasPendingWrite = false;
        });
    }

    function activateWorkspace(workspaceId) {
        if (!firebaseUser || !workspaceId) return Promise.resolve();
        if (!cloudWorkspaces.some(function (item) { return item.id === workspaceId; })) {
            return Promise.reject(new Error("Você não tem acesso a esta área de trabalho."));
        }
        return flushWorkspaceState().then(function () {
            clearGranularSubscriptions();
            cloudWorkspaceId = workspaceId;
            cloudUpdatedAt = 0;
            return updateWorkspaceRole();
        }).then(function () {
            return readGranularState();
        }).then(function (remote) {
            if (!remote) throw new Error("Esta área ainda não possui dados sincronizados.");
            applyRemoteState(remote);
            return migrateSeparatedFinancialDataIfNeeded().then(function () {
                saveWorkspaceSelection();
                subscribeCloud();
            });
            setSyncStatus("Sincronizado");
            renderWorkspaceControls();
        });
    }


    document.addEventListener("click", function (event) {
        var chargeButton = event.target.closest("[data-charge-unit]");
        if (chargeButton) {
            event.preventDefault();
            openChargeModal(chargeButton.dataset.chargeUnit);
        }
    });
    document.getElementById("openChargeModal").addEventListener("click", function () {
        if (editingId) openChargeModal(editingId);
    });
    document.getElementById("cancelCharge").addEventListener("click", function () {
        chargeModalUnitId = null;
        ModalManager.close(chargeModal);
    });
    document.getElementById("saveCharge").addEventListener("click", function () { saveChargeRecord(false); });
    document.getElementById("saveChargeAndOpenWhatsapp").addEventListener("click", function () { saveChargeRecord(true); });

    applySuggestedRentAdjustment.addEventListener("click", suggestAdjustment);

})();
