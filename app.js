(function () {
    "use strict";

    var STORAGE_KEY = "controle-alugueis-v1";
    var months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago",
        "Set", "Out", "Nov", "Dez"];
    var statusOrder = ["pendente", "pago", "atrasado"];
    var state = loadState();
    var selectedYear = new Date().getFullYear();
    var editingId = null;

    var grid = document.getElementById("grid");
    var empty = document.getElementById("empty");
    var summary = document.getElementById("summary");
    var modal = document.getElementById("modal");
    var unitName = document.getElementById("unitName");
    var unitRent = document.getElementById("unitRent");
    var unitDueDay = document.getElementById("unitDueDay");
    var backupFile = document.getElementById("backupFile");
	
	function loadState() {
    try {
        var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (saved && Array.isArray(saved.units)) {
            saved.units.forEach(function (unit) {
                unit.status = unit.status && typeof unit.status === "object"
                    ? unit.status : {};
            });
            return saved;
        }
    } catch (error) {
        /* use a clean state when storage is unavailable
           or malformed */
    }
    return { units: [] };
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function exportBackup() {
    var date = new Date().toISOString().slice(0, 10);
    var blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json"
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
    var file = event.target.files[0];
    event.target.value = "";
    if (!file) return;

    var reader = new FileReader();

    reader.onload = function () {
        var imported;

        try {
            imported = JSON.parse(reader.result);
        } catch (error) {
            window.alert("Não foi possível importar: o arquivo não contém um JSON válido.");
            return;
        }

        if (!imported || typeof imported !== "object" ||
            Array.isArray(imported) ||
            !Array.isArray(imported.units) ||
            !imported.units.every(function (unit) {
                return unit && typeof unit === "object" && !Array.isArray(unit);
            })) {

            window.alert("Não foi possível importar: o backup não tem um formato reconhecido.");
            return;
        }
		
		if (!window.confirm("Importar este backup substituirá todos os dados atuais. Deseja continuar?")) return;

imported.units.forEach(function (unit) {
    unit.status = unit.status && typeof unit.status === "object" &&
        !Array.isArray(unit.status) ? unit.status : {};
});

state = imported;
saveState();
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
        currency: "BRL"
    });
}

function monthKey(month) {
    return selectedYear + "-" + String(month + 1).padStart(2, "0");
}

function statusFor(unit, month) {
    return statusOrder.indexOf(unit.status[monthKey(month)]) >= 0
        ? unit.status[monthKey(month)]
        : "pendente";
}

function render() {
    document.getElementById("yearLabel").textContent = selectedYear;

    var hasUnits = state.units.length > 0;
    grid.hidden = !hasUnits;
    empty.hidden = hasUnits;

    renderGrid();
    renderSummary();
}

function renderGrid() {
    var currentMonth = new Date().getFullYear() === selectedYear
        ? new Date().getMonth()
        : -1;

    var head = "<tr><th scope=\"col\">Unidade</th>" +
        months.map(function (month, i) {
            return "<th scope=\"col\" class=\"" +
                (i === currentMonth ? "month-current" : "") +
                "\">" + month + "</th>";
        }).join("") + "</tr>";

    grid.querySelector("thead").innerHTML = head;

    grid.querySelector("tbody").innerHTML = state.units.map(function (unit) {

        var cells = months.map(function (_, i) {
            var status = statusFor(unit, i);
            var icon = status === "pago" ? "✓"
                : status === "atrasado" ? "!"
                : "-";

            var label = status === "pago"
                ? "Pago"
                : status === "atrasado"
                ? "Atrasado"
                : "Pendente";

            return "<td class=\"" +
                (i === currentMonth ? "month-current" : "") +
                "\"><button class=\"status-btn chip-" + status +
                "\" data-unit=\"" + unit.id +
                "\" data-month=\"" + i +
                "\" aria-label=\"" + label +
                "\">" + icon +
                "<span class=\"status-label\">" + label +
                "</span></button></td>";
        }).join("");
		
		        var dueDay = Number.isInteger(unit.dueDay) &&
            unit.dueDay >= 1 && unit.dueDay <= 31
            ? "<span class=\"due-day\">Vence dia " + unit.dueDay + "</span>"
            : "";

        return "<tr><th scope=\"row\"><button class=\"unit-cell\" data-edit=\"" +
            unit.id + "\"><span class=\"unit-name\">" +
            escapeHtml(unit.name) + "</span><span class=\"rent\">" +
            money(unit.rent) + "</span>" + dueDay +
            "</button></th>" + cells + "</tr>";
    }).join("");

    grid.querySelector("tfoot").innerHTML =
        "<tr><th scope=\"row\">Total recebido</th>" +
        months.map(function (_, i) {
            var total = state.units.reduce(function (sum, unit) {
                return sum + (statusFor(unit, i) === "pago"
                    ? Number(unit.rent)
                    : 0);
            }, 0);

            return "<td>" + money(total) + "</td>";
        }).join("") + "</tr>";

    grid.querySelectorAll(".unit-cell").forEach(function (button) {
        button.addEventListener("click", function () {
            openModal(button.dataset.edit);
        });
    });

    grid.querySelectorAll(".status-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            toggleStatus(
                button.dataset.unit,
                Number(button.dataset.month)
            );
        });
    });
}

function renderSummary() {
    var annual = state.units.reduce(function (sum, unit) {
        return sum + months.reduce(function (monthSum, _, i) {
            return monthSum + (statusFor(unit, i) === "pago"
                ? Number(unit.rent)
                : 0);
        }, 0);
    }, 0);

    var now = new Date();
    var current = now.getFullYear() === selectedYear
        ? now.getMonth()
        : -1;

    var received = current < 0
        ? 0
        : state.units.reduce(function (sum, unit) {
            return sum + (statusFor(unit, current) === "pago"
                ? Number(unit.rent)
                : 0);
        }, 0);

    var atrasado = current < 0
        ? 0
        : state.units.reduce(function (sum, unit) {
            return sum + (statusFor(unit, current) === "atrasado"
                ? Number(unit.rent)
                : 0);
        }, 0);
		
    var pending = current < 0
        ? 0
        : state.units.reduce(function (sum, unit) {
            return sum + (statusFor(unit, current) === "pendente"
                ? Number(unit.rent)
                : 0);
        }, 0);

    summary.innerHTML =
        "<div class=\"summary-card\"><div class=\"summary-label\">Total recebido em " +
        selectedYear +
        "</div><div class=\"summary-value\">" + money(annual) +
        "</div><div class=\"summary-detail\">Soma dos pagamentos marcados como recebidos</div></div>" +

        "<div class=\"summary-card\"><div class=\"summary-label\">Recebido neste mês</div><div class=\"summary-value\">" +
        money(received) +
        "</div><div class=\"summary-detail\">" +
        (current < 0
            ? "Visualizando outro ano"
            : months[current] + " de " + selectedYear) +
        "</div></div>" +
		
        "<div class=\"summary-card\"><div class=\"summary-label\">Atrasado neste mês</div><div class=\"summary-value\">" +
        money(atrasado) +
        "</div><div class=\"summary-detail\">" +
        (current < 0
            ? "Visualizando outro ano"
            : months[current] + " de " + selectedYear) +
        "</div></div>" +		

        "<div class=\"summary-card\"><div class=\"summary-label\">Pendente neste mês</div><div class=\"summary-value\">" +
        money(pending) +
        "</div><div class=\"summary-detail\">Valores ainda não recebidos</div></div>";
}

function toggleStatus(id, month) {
    var unit = state.units.find(function (item) {
        return item.id === id;
    });

    if (!unit) return;

    var current = statusFor(unit, month);

    unit.status[monthKey(month)] =
        statusOrder[(statusOrder.indexOf(current) + 1) % statusOrder.length];

    saveState();
    render();
}

function openModal(id) {
    editingId = id || null;

    var unit = state.units.find(function (item) {
        return item.id === editingId;
    });

    document.getElementById("modalTitle").textContent =
        unit ? "Editar unidade" : "Nova unidade";

    unitName.value = unit ? unit.name : "";
    unitRent.value = unit ? unit.rent : "";
    unitDueDay.value =
        unit && Number.isInteger(unit.dueDay) ? unit.dueDay : "";

    unitDueDay.setCustomValidity("");
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

function saveUnit() {
    var name = unitName.value.trim();
    var rent = Number(unitRent.value);
    var dueDayValue = unitDueDay.value.trim();
    var dueDay = dueDayValue === "" ? null : Number(dueDayValue);

    if (!name) {
        unitName.focus();
        return;
    }

    if (!Number.isFinite(rent) || rent < 0) {
        unitRent.focus();
        return;
    }

    if (dueDay !== null && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) {
        unitDueDay.setCustomValidity("Informe um dia inteiro entre 1 e 31.");
        unitDueDay.reportValidity();
        unitDueDay.focus();
        return;
    }

    unitDueDay.setCustomValidity("");

    if (editingId) {
        var existing = state.units.find(function (unit) {
            return unit.id === editingId;
        });

        if (existing) {
            existing.name = name;
            existing.rent = rent;
            existing.dueDay = dueDay;
        }
    } else {
        state.units.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            name: name,
            rent: rent,
            dueDay: dueDay,
            status: {}
        });
    }

    saveState();
    closeModal();
    render();
}

function deleteUnit() {
    if (!editingId || !window.confirm("Excluir esta unidade e seus registros?")) return;

    state.units = state.units.filter(function (unit) {
        return unit.id !== editingId;
    });

    saveState();
    closeModal();
    render();
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        return ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#039;"
        })[character];
    });
}

document.getElementById("prevYear").addEventListener("click", function () {
    selectedYear -= 1;
    render();
});

document.getElementById("nextYear").addEventListener("click", function () {
    selectedYear += 1;
    render();
});

document.getElementById("addUnit").addEventListener("click", function () {
    openModal();
});

document.getElementById("cancelModal").addEventListener("click", closeModal);

document.getElementById("saveUnit").addEventListener("click", saveUnit);

document.getElementById("deleteUnit").addEventListener("click", deleteUnit);

document.getElementById("exportBackup").addEventListener("click", exportBackup);

document.getElementById("importBackup").addEventListener("click", function () {
    backupFile.click();
});

backupFile.addEventListener("change", importBackup);

modal.addEventListener("click", function (event) {
    if (event.target === modal) {
        closeModal();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hidden) {
        closeModal();
    }
});

render();

if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function () {});
    });
}

})();
