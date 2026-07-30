(function () {
    "use strict";

    var STORAGE_KEY = "controle-alugueis-v1";
    var LOCK_STORAGE_KEY = "controle-alugueis-lock";

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
        dailyInterestPercent: 0.3,
        receiverName: "",
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
    var editingExpenseId = null;
    var expensesExpanded = false;
	var didInitialScroll = false;
    var lastGridScrollLeft = 0;
    var receiptContext = null;
    var lockConfig = loadLockConfig();
    var appUnlocked = !lockConfig;

    var grid = document.getElementById("grid");
    var tableWrap = grid.parentElement;
    var empty = document.getElementById("empty");
    var filterEmpty = document.getElementById("filterEmpty");
    var unitSearch = document.getElementById("unitSearch");
    var statusFilter = document.getElementById("statusFilter");
    var summary = document.getElementById("summary");
    var expensesList = document.getElementById("expensesList");
	var toggleExpensesButton =  document.getElementById("toggleExpenses");
    var expensesTotal = document.getElementById("expensesTotal");
    var expensesYear = document.getElementById("expensesYear");
    var lockScreen = document.getElementById("lockScreen");
    var unlockForm = document.getElementById("unlockForm");
    var unlockPin = document.getElementById("unlockPin");
    var unlockBiometric = document.getElementById("unlockBiometric");
    var lockError = document.getElementById("lockError");
    var modal = document.getElementById("modal");
    var settingsModal = document.getElementById("settingsModal");
    var receiptModal = document.getElementById("receiptModal");
    var receiptPreview = document.getElementById("receiptPreview");
    var printReceipt = document.getElementById("printReceipt");
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
    var rentChangesList = document.getElementById("rentChangesList");
    var rentChangeYm = document.getElementById("rentChangeYm");
    var rentChangePercent = document.getElementById("rentChangePercent");
    var rentChangeAbsolute = document.getElementById("rentChangeAbsolute");
    var addRentChangeButton = document.getElementById("addRentChange");
    var finePercent = document.getElementById("finePercent");

    //--------------------------------------------------------------------------------------------

    var dailyInterestPercent = document.getElementById("dailyInterestPercent");
    var receiverName = document.getElementById("receiverName");
    var securityStatus = document.getElementById("securityStatus");
    var currentPinLabel = document.getElementById("currentPinLabel");
    var currentPin = document.getElementById("currentPin");
    var newPin = document.getElementById("newPin");
    var confirmPin = document.getElementById("confirmPin");
    var savePinButton = document.getElementById("savePin");
    var removePinButton = document.getElementById("removePin");
    var biometricArea = document.getElementById("biometricArea");
    var biometricToggle = document.getElementById("biometricToggle");
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
    var cloudError = document.getElementById("cloudError");
    var syncStatus = document.getElementById("syncStatus");
    var cloudReconcile = document.getElementById("cloudReconcile");
    var cloudReconcileText = document.getElementById("cloudReconcileText");
    var useCloudData = document.getElementById("useCloudData");
    var useLocalData = document.getElementById("useLocalData");
    var firebaseAuth = null;
    var firebaseDb = null;
    var firebaseUser = null;
    var firebaseUnsubscribe = null;
    var cloudWriteTimer = null;
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
                    ? Number(settings.dailyInterestPercent)
                    : DEFAULT_SETTINGS.dailyInterestPercent,
            receiverName:
                settings && typeof settings.receiverName === "string"
                    ? settings.receiverName.trim()
                    : DEFAULT_SETTINGS.receiverName,
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
        unit.startYm = isValidStartYm(unit.startYm) ? unit.startYm : null;
        unit.endYm = isValidStartYm(unit.endYm) ? unit.endYm : null;
        unit.rent =
            Number.isFinite(Number(unit.rent)) && Number(unit.rent) >= 0
                ? Number(unit.rent)
                : 0;
        unit.rentChanges = normalizeRentChanges(unit.rentChanges);
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

    function cloudDocRef() {
        return firebaseDb && firebaseUser
            ? firebaseDb.collection("users").doc(firebaseUser.uid)
            : null;
    }

    function scheduleCloudWrite() {
        if (!firebaseUser || !firebaseDb || cloudApplyingRemote) return;

        setSyncStatus("Sincronizando...");

        clearTimeout(cloudWriteTimer);

        cloudWriteTimer = setTimeout(writeCloudState, 800);
    }

    function writeCloudState() {
        var ref = cloudDocRef();

        if (!ref) return;

        var updatedAt = Date.now();

        cloudUpdatedAt = Math.max(cloudUpdatedAt, updatedAt);

        ref.set({
            payload: state,
            updatedAt: updatedAt,
        })
            .then(function () {
                cloudUpdatedAt = updatedAt;
                cloudPendingRemote = null;
                cloudReconcile.hidden = true;

                setCloudStatus(
                    "Conta conectada. Sincronização automática ativa."
                );
                setSyncStatus("Sincronizado");
            })
            .catch(function (error) {
                setCloudError(cloudErrorMessage(error));

                setSyncStatus(
                    navigator.onLine
                        ? "Não sincronizado — salvo localmente"
                        : "Offline — alterações salvas localmente"
                );
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
        cloudPendingRemote = null;

        setCloudStatus("Conta conectada. Sincronização automática ativa.");
        setSyncStatus("Sincronizado");

        subscribeCloud();
    }

    function reconcileCloud() {
        var ref = cloudDocRef();

        if (!ref) return;

        setSyncStatus("Sincronizando...");

        ref.get()
            .then(function (snapshot) {
                var data = snapshot.exists ? snapshot.data() || {} : null;

                var remoteState =
                    data && data.payload ? normalizeState(data.payload) : null;

                cloudUpdatedAt = data ? Number(data.updatedAt) || 0 : 0;

                if (!remoteState) {
                    writeCloudState();

                    subscribeCloud();

                    return;
                }

                var localEmpty =
                    state.units.length === 0 && state.expenses.length === 0;

                if (localEmpty) {
                    applyRemoteState(remoteState);

                    finishCloudReconciliation();

                    return;
                }

                if (cloudStatesEqual(state, remoteState)) {
                    finishCloudReconciliation();
                    setSyncStatus("Sincronizado");
                    return;
                }

                cloudPendingRemote = remoteState;

                cloudReconcileText.textContent =
                    "Há dados diferentes entre a nuvem (" +
                    cloudCounts(remoteState) +
                    ") e este aparelho (" +
                    cloudCounts(state) +
                    "). Escolha qual versão deseja manter.";

                cloudReconcile.hidden = false;

                setSyncStatus("Aguardando escolha");

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
                            sortObject(
                                normalizeState(JSON.parse(JSON.stringify(left)))
                            )
                        ) ===
                        JSON.stringify(
                            sortObject(
                                normalizeState(
                                    JSON.parse(JSON.stringify(right))
                                )
                            )
                        )
                    );
                }
            })
            .catch(function (error) {
                setCloudError(cloudErrorMessage(error));

                setSyncStatus("Não sincronizado — salvo localmente");
            });
    }

    function chooseCloudData() {
        if (!cloudPendingRemote) return;

        applyRemoteState(cloudPendingRemote);

        finishCloudReconciliation();

        setSyncStatus("Sincronizado");
    }

    function chooseLocalData() {
        cloudReconcile.hidden = true;
        cloudPendingRemote = null;

        cloudUpdatedAt = Date.now();

        writeCloudState();

        subscribeCloud();
    }

    function updateCloudUi() {
        var signedIn = !!firebaseUser;

        cloudSignedOut.hidden = signedIn;

        cloudSignedIn.hidden = !signedIn;

        cloudUserEmail.textContent = signedIn ? firebaseUser.email || "" : "";

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

        request.catch(function (error) {
            setCloudError(cloudErrorMessage(error));
        });
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
        //--------------------------------------------------------------------------------------------
    }

    async function isBiometricAvailable() {
        if (
            !window.PublicKeyCredential ||
            !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
        )
            return false;
        try {
            return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch (error) {
            return false;
        }
    }

    function randomBytes(length) {
        var bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return bytes;
    }

    function hideLockScreen() {
        lockScreen.hidden = true;
        appUnlocked = true;
    }

    function showLockError(message) {
        lockError.textContent = message;
    }

    async function unlockWithPin(pin) {
        if (!isValidPin(pin)) {
            showLockError("Digite um PIN numérico com pelo menos 4 dígitos.");
            return false;
        }
        if (!(await verifyPin(pin, lockConfig))) {
            showLockError("PIN incorreto. Tente novamente.");
            unlockPin.select();
            return false;
        }
        hideLockScreen();
        render();
        return true;
    }

    async function createBiometricCredential() {
        if (
            !lockConfig ||
            !window.PublicKeyCredential ||
            !navigator.credentials ||
            !navigator.credentials.create
        )
            throw new Error("Biometria indisponível.");
        var credential = await navigator.credentials.create({
            publicKey: {
                challenge: randomBytes(32),
                rp: { name: "Controle de Aluguéis" },
                user: {
                    id: randomBytes(16),
                    name: "controle-alugueis",
                    displayName: "Controle de Aluguéis",
                },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 },
                    { type: "public-key", alg: -257 },
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required",
                },
                timeout: 60000,
            },
        });
        if (!credential)
            throw new Error("Não foi possível criar a credencial.");
        lockConfig.credentialId = bytesToBase64Url(
            new Uint8Array(credential.rawId)
        );
        saveLockConfig(lockConfig);
    }
    //--------------------------------------------------------------------------------------------
    async function unlockWithBiometric() {
        if (
            !lockConfig ||
            !lockConfig.credentialId ||
            !navigator.credentials ||
            !navigator.credentials.get
        )
            return;
        try {
            var assertion = await navigator.credentials.get({
                publicKey: {
                    challenge: randomBytes(32),
                    allowCredentials: [
                        {
                            type: "public-key",
                            id: base64UrlToBytes(lockConfig.credentialId),
                        },
                    ],
                    userVerification: "required",
                    timeout: 60000,
                },
            });
            if (!assertion) throw new Error("Biometria não confirmada.");
            hideLockScreen();
            render();
        } catch (error) {
            showLockError("Não foi possível confirmar a biometria. Use o PIN.");
        }
    }

    async function updateBiometricVisibility() {
        var available = await isBiometricAvailable();
        biometricArea.hidden = !available;
        biometricToggle.disabled = !lockConfig;
        unlockBiometric.hidden =
            !available || !lockConfig || !lockConfig.credentialId;
        if (available)
            biometricToggle.checked = !!(lockConfig && lockConfig.credentialId);
        return available;
    }

    async function initializeLock() {
        if (!lockConfig) {
            hideLockScreen();
            render();
            return;
        }
        if (!hasSubtleCrypto()) {
            showLockError(
                "Este navegador não oferece criptografia segura para desbloquear."
            );
            return;
        }
        updateBiometricVisibility();
        unlockPin.focus();
    }

    function exportBackup() {
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

    function importBackup(event) {
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

    function isActive(unit, month) {
        var key = monthKey(month);
        return (
            (!isValidStartYm(unit.startYm) || key >= unit.startYm) &&
            (!isValidStartYm(unit.endYm) || key <= unit.endYm)
        );
    }

    function statusFor(unit, month) {
        return statusOrder.indexOf(unit.status[monthKey(month)]) >= 0
            ? unit.status[monthKey(month)]
            : "pendente";
    }

    function dueDateFor(unit, month) {
        if (
            !Number.isInteger(unit.dueDay) ||
            unit.dueDay < 1 ||
            unit.dueDay > 31
        )
            return null;
        var lastDay = new Date(selectedYear, month + 1, 0).getDate();
        return new Date(selectedYear, month, Math.min(unit.dueDay, lastDay));
    }

    function daysOverdue(unit, month) {
        if (!isActive(unit, month)) return null;
        var dueDate = dueDateFor(unit, month);
        if (!dueDate) return null;
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var days = Math.floor((today - dueDate) / 86400000);
        return days > 0 ? days : null;
    }

    function updatedAmount(unit, month) {
        var days = daysOverdue(unit, month);
        if (days === null) return null;
        var rent = rentForMonth(unit, selectedYear, month);
        return (
            rent *
            (1 +
                state.settings.finePercent / 100 +
                (state.settings.dailyInterestPercent / 100) * days)
        );
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

    function tenantActions(unit) {
        var actions = "";
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
        renderGrid(visibleUnits);
        if (didInitialScroll && visibleUnits.length > 0)
            tableWrap.scrollLeft = lastGridScrollLeft;
        renderSummary();
        renderExpenses();
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
                            status === "atrasado" ? daysOverdue(unit, i) : null;
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
                        var receipt =
                            status === "pago" || status === "pago-atrasado"
                                ? '<button class="receipt-btn" type="button" data-receipt-unit="' +
                                  escapeHtml(unit.id) +
                                  '" data-receipt-month="' +
                                  i +
                                  '" aria-label="Gerar recibo">🧾</button>'
                                : "";
                        return (
                            '<td class="' +
                            (i === currentMonth ? "month-current" : "") +
                            '"><div class="status-cell"><button class="status-btn chip-' +
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
                            "</div></td>"
                        );
                    })
                    .join("");
                var dueDay =
                    Number.isInteger(unit.dueDay) &&
                    unit.dueDay >= 1 &&
                    unit.dueDay <= 31
                        ? '<span class="due-day">Vence dia ' +
                          unit.dueDay +
                          "</span>"
                        : "";
                var tenant = unit.tenantName
                    ? '<span class="tenant-name">' +
                      escapeHtml(unit.tenantName) +
                      "</span>"
                    : "";
                var now = new Date();
                var currentRent = rentForMonth(
                    unit,
                    now.getFullYear(),
                    now.getMonth()
                );

                var enterprise =
                    '<span class="enterprise-name">' +
                    escapeHtml(empreendimentoName(unit.empreendimentoId)) +
                    "</span>";

                return (
                    '<tr><th scope="row"><div class="unit-cell" data-edit="' +
                    escapeHtml(unit.id) +
                    '" role="button" tabindex="0"><span class="unit-name">' +
                    escapeHtml(unit.name) +
                    "</span>" +
                    enterprise +
                    tenant +
                    '<span class="rent">' +
                    money(currentRent) +
                    "</span>" +
                    dueDay +
                    '<span class="tenant-actions">' +
                    tenantActions(unit) +
                    "</span></div></th>" +
                    cells +
                    "</tr>"
                );
            })
            .join("");
        grid.querySelector("tfoot").innerHTML =
            '<tr><th scope="row">Total recebido</th>' +
            months
                .map(function (_, i) {
                    var total = scopedUnits().reduce(function (sum, unit) {
                        return (
                            sum +
                            (isActive(unit, i) && statusFor(unit, i) === "pago"
                                ? rentForMonth(unit, selectedYear, i)
                                : 0)
                        );
                    }, 0);
                    return "<td>" + money(total) + "</td>";
                })
                .join("") +
            "</tr>";
        grid.querySelectorAll(".unit-cell").forEach(function (button) {
            button.addEventListener("click", function () {
                openModal(button.dataset.edit);
            });
            button.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openModal(button.dataset.edit);
                }
            });
            //--------------------------------------------------------------------------------------------
        });
        grid.querySelectorAll("[data-tenant-action]").forEach(function (link) {
            link.addEventListener("click", function (event) {
                event.stopPropagation();
            });
            link.addEventListener("keydown", function (event) {
                event.stopPropagation();
            });
        });
        grid.querySelectorAll(".status-btn").forEach(function (button) {
            button.addEventListener("click", function () {
                toggleStatus(button.dataset.unit, Number(button.dataset.month));
            });
        });
        grid.querySelectorAll(".receipt-btn").forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.stopPropagation();
                openReceipt(
                    button.dataset.receiptUnit,
                    Number(button.dataset.receiptMonth)
                );
            });
        });
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

    function renderSummary() {
        var annual = scopedUnits().reduce(function (sum, unit) {
            return (
                sum +
                months.reduce(function (monthSum, _, i) {
                    return (
                        monthSum +
                        (isActive(unit, i) && statusFor(unit, i) === "pago"
                            ? rentForMonth(unit, selectedYear, i)
                            : 0)
                    );
                }, 0)
            );
        }, 0);
        var now = new Date();
        var current = now.getFullYear() === selectedYear ? now.getMonth() : -1;
        var received =
            current < 0
                ? 0
                : scopedUnits().reduce(function (sum, unit) {
                      return (
                          sum +
                          (isActive(unit, current) &&
                          statusFor(unit, current) === "pago"
                              ? rentForMonth(unit, selectedYear, current)
                              : 0)
                      );
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
            months.forEach(function (_, i) {
                if (
                    isActive(unit, i) &&
                    effectiveStatus(unit, i) === "atrasado"
                ) {
                    overdueCount += 1;
                    overdueTotal +=
                        updatedAmount(unit, i) === null
                            ? rentForMonth(unit, selectedYear, i)
                            : updatedAmount(unit, i);
                    //--------------------------------------------------------------------------------------------
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
                    if (
                        isActive(unit, i) &&
                        effectiveStatus(unit, i) === "atrasado"
                    )
                        openLate += 1;
                    if (isPaidLate(unit, i)) paidLate += 1;
                });
                return {
                    name: unit.name,
                    enterprise: empreendimentoName(unit.empreendimentoId),
                    openLate: openLate,
                    paidLate: paidLate,
                    total: openLate + paidLate,
                };
            })
			
			.filter(function (row) { return row.total > 0; })
			
            .sort(function (a, b) {
                return (
                    b.total - a.total || a.name.localeCompare(b.name, "pt-BR")
                );
            });
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
                              "</strong><span>" +
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
        summary.innerHTML =
            overdueAlert +
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
            '</div><div class="summary-detail">Recebido menos gastos</div></div>' +
            report;
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

                return (
                    '<details class="expense-month" open>' +
                    '<summary class="expense-month-header">' +
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
		toggleExpensesButton.textContent = expensesExpanded ? "Ocultar meses" : "Mostrar meses";
		expensesList.hidden = hasGroups && !expensesExpanded;
	}

	function toggleExpensesVisibility() {
		expensesExpanded = !expensesExpanded;
		if (!expensesExpanded) {
			expenseMonths().forEach(function (item) { item.open = false; });
		}
		applyExpensesVisibility();
	}
	function updateToggleExpensesButton() {
	  var months = expenseMonths();
	  toggleExpensesButton.hidden = months.length < 2;
	  var allOpen = months.length > 0 && Array.prototype.every.call(months, function (item) { return item.open; });
	  toggleExpensesButton.textContent = allOpen ? "Recolher tudo" : "Expandir tudo";
	}

	function toggleAllExpenseMonths() {
	  var months = expenseMonths();
	  var allOpen = months.length > 0 && Array.prototype.every.call(months, function (item) { return item.open; });
	  months.forEach(function (item) { item.open = !allOpen; });
	  updateToggleExpensesButton();
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
        unit.status[key] =
            next === "pago-atrasado" || next === "pago" ? "pago" : next;
        unit.paidLate =
            unit.paidLate && typeof unit.paidLate === "object"
                ? unit.paidLate
                : {};
        if (next === "pago-atrasado") unit.paidLate[key] = true;
        else delete unit.paidLate[key];
        saveState();
        render();
    }

    function collapseExpenseMonths() {
        expensesList
            .querySelectorAll("details.expense-month[open]")
            .forEach(function (item) {
                item.open = false;
            });
		applyExpensesVisibility()	
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
        unitRent.value = unit ? unit.rent : "";
        pendingRentChanges = unit
            ? (unit.rentChanges || []).map(function (change) {
                  return { fromYm: change.fromYm, rent: change.rent };
              })
            : [];
        unitDueDay.value =
            unit && Number.isInteger(unit.dueDay) ? unit.dueDay : "";
        unitStartYm.value =
            unit && isValidStartYm(unit.startYm) ? unit.startYm : "";
        unitEndYm.value = unit && isValidStartYm(unit.endYm) ? unit.endYm : "";
        tenantName.value = unit ? unit.tenantName : "";
        tenantPhone.value = unit ? unit.tenantPhone : "";
        tenantEmail.value = unit ? unit.tenantEmail : "";
        tenantNotes.value = unit ? unit.tenantNotes : "";
        unitDueDay.setCustomValidity("");
        unitStartYm.setCustomValidity("");
        unitEndYm.setCustomValidity("");
        rentChangeYm.value = "";
        rentChangePercent.value = "";
        rentChangeAbsolute.value = "";
        rentChangeYm.setCustomValidity("");
        rentChangeAbsolute.setCustomValidity("");
        renderRentChanges();
        document.getElementById("deleteUnit").hidden = !unit;
        modal.hidden = false;
        setTimeout(function () {
            unitName.focus();
        }, 0);
    }

    function closeModal() {
        modal.hidden = true;
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
        expenseModal.hidden = false;
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
            expenseDate.focus();
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
        var expenseData = {
            ym: ym,
            empreendimentoId: expenseEmpreendimento.value,
            category:
                expenseCategory.value && expenseCategory.value.trim()
                    ? expenseCategory.value
                    : "Outros",
            description: expenseDescription.value.trim(),
            amount: amount,
        };
        if (editingExpenseId) {
            var existing = state.expenses.find(function (expense) {
                return expense.id === editingExpenseId;
            });
            if (existing) Object.assign(existing, expenseData);
        } else {
            var recurrenceId = repeatCount > 1 ? newExpenseId() : null;
            for (var i = 0; i < repeatCount; i += 1) {
                state.expenses.push({
                    id: newExpenseId(),
                    ym: addMonthsYm(expenseData.ym, i),
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
        receiverName.value = state.settings.receiverName;
        currentPin.value = "";
        newPin.value = "";
        confirmPin.value = "";
        currentPinLabel.hidden = !lockConfig;
        removePinButton.hidden = !lockConfig;
        //securityStatus.textContent = lockConfig ? "Um PIN protege o acesso neste dispositivo." : "Nenhum PIN configurado neste dispositivo.";
        securityStatus.style.color = "";
        renderCategoryManager();
        renderEnterpriseManager();
        setCategoryStatus("Edite as opções disponíveis para os gastos.", false);
        updateBiometricVisibility();
        finePercent.setCustomValidity("");
        dailyInterestPercent.setCustomValidity("");
        settingsModal.hidden = false;
        setTimeout(function () {
            finePercent.focus();
        }, 0);
    }

    function closeSettings() {
        settingsModal.hidden = true;
    }

    function saveSettings() {
        var fine = Number(finePercent.value);
        var interest = Number(dailyInterestPercent.value);
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
        finePercent.setCustomValidity("");
        dailyInterestPercent.setCustomValidity("");
        state.settings = {
            finePercent: fine,
            dailyInterestPercent: interest,
            receiverName: receiverName.value.trim(),
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
            //--------------------------------------------------------------------------------------------
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
        var config = {
            salt: salt,
            hash: await hashPin(newPin.value, salt),
            credentialId: lockConfig ? lockConfig.credentialId : null,
        };
        saveLockConfig(config);
        currentPin.value = "";
        newPin.value = "";
        confirmPin.value = "";
        currentPinLabel.hidden = false;
        removePinButton.hidden = false;
        securityStatus.textContent = "PIN salvo neste dispositivo.";
        securityStatus.style.color = "#0f766e";
        updateBiometricVisibility();
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
        if (navigator.credentials && navigator.credentials.preventSilentAccess)
            navigator.credentials.preventSilentAccess().catch(function () {});
        currentPin.value = "";
        newPin.value = "";
        confirmPin.value = "";
        currentPinLabel.hidden = true;
        removePinButton.hidden = true;
        securityStatus.textContent =
            "PIN removido. O acesso não está mais bloqueado.";
        securityStatus.style.color = "#0f766e";
        updateBiometricVisibility();
    }

    async function toggleBiometric() {
        if (!biometricToggle.checked) {
            if (lockConfig) {
                lockConfig.credentialId = null;
                //--------------------------------------------------------------------------------------------
                saveLockConfig(lockConfig);
            }
            unlockBiometric.hidden = true;
            securityStatus.textContent = "Biometria desativada.";
            securityStatus.style.color = "#0f766e";
            return;
        }
        if (!lockConfig) {
            biometricToggle.checked = false;
            securityStatus.textContent =
                "Salve um PIN antes de ativar a biometria.";
            securityStatus.style.color = "#a52d3b";
            return;
        }
        try {
            await createBiometricCredential();
            unlockBiometric.hidden = false;
            securityStatus.textContent = "Biometria ativada.";
            securityStatus.style.color = "#0f766e";
        } catch (error) {
            biometricToggle.checked = false;
            securityStatus.textContent = "Não foi possível ativar a biometria.";
            securityStatus.style.color = "#a52d3b";
        }
    }

    function saveUnit() {
        var name = unitName.value.trim();
        var rent = Number(unitRent.value);
        var dueDayValue = unitDueDay.value.trim();
        var dueDay = dueDayValue === "" ? null : Number(dueDayValue);
        var startYm = unitStartYm.value || null;
        var endYm = unitEndYm.value || null;
        if (!name) {
            unitName.focus();
            return;
        }
        if (!Number.isFinite(rent) || rent < 0) {
            unitRent.focus();
            return;
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
        if (startYm !== null && !isValidStartYm(startYm)) {
            unitStartYm.setCustomValidity("Informe um mês de início válido.");
            unitStartYm.reportValidity();
            unitStartYm.focus();
            return;
        }
        unitStartYm.setCustomValidity("");
        if (endYm !== null && !isValidStartYm(endYm)) {
            unitEndYm.setCustomValidity("Informe um mês de fim válido.");
            unitEndYm.reportValidity();
            unitEndYm.focus();
            return;
        }
        if (startYm && endYm && endYm < startYm) {
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
                existing.name = name;
                existing.empreendimentoId = unitEmpreendimento.value;
                existing.rent = rent;
                existing.rentChanges = normalizeRentChanges(pendingRentChanges);
                existing.dueDay = dueDay;
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
                dueDay: dueDay,
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
        return {
            unit: unit,
            month: month,
            year: selectedYear,
            status: displayStatus(unit, month),
            monthName: fullMonths[month],
            issuedAt: formatDate(new Date()),
            amount: rentForMonth(unit, selectedYear, month),
        };
    }

    function receiptMarkup(data) {
        var receiver = state.settings.receiverName
            ? '<div class="receipt-line"><strong>Recebedor</strong><span>' +
              escapeHtml(state.settings.receiverName) +
              "</span></div>"
            : "";

        var lateNote =
            data.status === "pago-atrasado"
                ? '<p class="receipt-note">Pagamento efetuado em atraso.</p>'
                : "";

        return (
            '<div class="receipt-paper"><h3>Recibo de Aluguel</h3>' +
            receiver +
            '<div class="receipt-line"><strong>Unidade</strong><span>' +
            escapeHtml(data.unit.name) +
            "</span></div>" +
            '<div class="receipt-line"><strong>Valor do aluguel</strong><span>' +
            money(data.amount) +
            "</span></div>" +
            '<div class="receipt-line"><strong>Referência</strong><span>' +
            data.monthName +
            " de " +
            data.year +
            "</span></div>" +
            '<div class="receipt-line"><strong>Data de emissão</strong><span>' +
            data.issuedAt +
            "</span></div>" +
            '<p class="receipt-text">Recebi de forma integral a importância de ' +
            money(data.amount) +
            " referente ao aluguel da " +
            escapeHtml(data.unit.name) +
            " no mês de " +
            data.monthName +
            " de " +
            data.year +
            ".</p>" +
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
        receiptPreview.innerHTML = receiptMarkup(receiptContext);
        receiptModal.hidden = false;
    }

    function closeReceipt() {
        receiptModal.hidden = true;
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

    function drawReceiptCanvas(data) {
        var canvas = document.createElement("canvas");
        canvas.width = 1000;
        canvas.height = 1400;

        var context = canvas.getContext("2d");
        var left = 90;
        var width = canvas.width - left * 2;

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = "#115e59";
        context.fillRect(0, 0, canvas.width, 24);

        context.fillStyle = "#173333";
        context.font = "700 46px sans-serif";
        context.fillText("Recibo de Aluguel", left, 120);

        var y = 205;

        context.font = "700 25px sans-serif";
        context.fillStyle = "#647979";

        if (state.settings.receiverName) {
            context.fillText("Recebedor", left, y);

            context.font = "400 28px sans-serif";
            context.fillStyle = "#173333";
            context.fillText(state.settings.receiverName, left + 250, y);

            y += 62;
        }

        [
            ["Unidade", data.unit.name],
            ["Valor do aluguel", money(data.amount)],
            ["Referência", data.monthName + " de " + data.year],
            ["Data de emissão", data.issuedAt],
        ].forEach(function (line) {
            context.font = "700 25px sans-serif";
            context.fillStyle = "#647979";
            context.fillText(line[0], left, y);

            context.font = "400 28px sans-serif";
            context.fillStyle = "#173333";
            context.fillText(line[1], left + 250, y);

            y += 62;
        });

        y += 35;

        context.font = "400 31px sans-serif";
        context.fillStyle = "#173333";

        y = wrapCanvasText(
            context,
            "Recebi de forma integral a importância de " +
                money(data.amount) +
                " referente ao aluguel da " +
                data.unit.name +
                " no mês de " +
                data.monthName +
                " de " +
                data.year +
                ".",
            left,
            y,
            width,
            48
        );

        if (data.status === "pago-atrasado") {
            y += 20;
            context.font = "700 26px sans-serif";
            context.fillStyle = "#a45b05";
            context.fillText("Pagamento efetuado em atraso.", left, y);
        }

        // ================= ASSINATURA =================

        var signatureWidth = 320;
        var signatureCenter = left + width / 2;
        var signatureLeft = signatureCenter - signatureWidth / 2;
        var signatureRight = signatureCenter + signatureWidth / 2;

        context.textAlign = "center";

        // Nome do recebedor
        context.font = "italic 34px serif";
        context.fillStyle = "#173333";
        context.fillText(
            state.settings.receiverName || "Recebedor",
            signatureCenter,
            1160
        );

        // Linha abaixo do nome
        context.strokeStyle = "#b7cfcb";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(signatureLeft, 1185);
        context.lineTo(signatureRight, 1185);
        context.stroke();

        // Legenda
        context.font = "400 24px sans-serif";
        context.fillStyle = "#647979";
        context.fillText("Assinatura do recebedor", signatureCenter, 1235);

        context.textAlign = "left";

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

    function printReceiptDocument() {
        if (!receiptContext) return;

        printReceipt.innerHTML = receiptMarkup(receiptContext);

        window.print();

        setTimeout(function () {
            printReceipt.innerHTML = "";
        }, 0);
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

    unlockForm.addEventListener("submit", function (event) {
        event.preventDefault();

        unlockWithPin(unlockPin.value);
    });

    unlockBiometric.addEventListener("click", unlockWithBiometric);

    savePinButton.addEventListener("click", savePin);

    removePinButton.addEventListener("click", removePin);

    biometricToggle.addEventListener("change", toggleBiometric);

    document
        .getElementById("cancelReceipt")
        .addEventListener("click", closeReceipt);

    document
        .getElementById("downloadReceipt")
        .addEventListener("click", downloadReceipt);

    document
        .getElementById("printReceiptButton")
        .addEventListener("click", printReceiptDocument);

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

    window.addEventListener("online", function () {
        if (firebaseUser) setSyncStatus("Sincronizando...");
    });

    window.addEventListener("offline", function () {
        if (firebaseUser)
            setSyncStatus("Offline — alterações salvas localmente");
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

    window.addEventListener("pageshow", collapseExpenseMonths);

    updateCloudUi();

    initFirebase();

    initializeLock();

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
})();
