(function (root, factory) {
    var api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    if (root) root.EnergyCalculations = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    function number(value) {
        var parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function roundMoney(value) {
        return Math.round((number(value) + Number.EPSILON) * 100) / 100;
    }

    function calculateAllocation(rows, invoiceAmount) {
        var errors = [];
        var readings = (rows || []).map(function (row) {
            var previousReading = Math.max(0, number(row.previousReading));
            var meterReading = Math.max(0, number(row.meterReading));
            var hasPrevious = row.previousReading !== "" && row.previousReading !== null && row.previousReading !== undefined;
            var hasCurrent = row.meterReading !== "" && row.meterReading !== null && row.meterReading !== undefined;
            var hasValues = hasPrevious && hasCurrent;
            if (!hasValues) {
                errors.push({ unitId: row.unitId, message: "Informe a leitura anterior e a leitura atual de todas as unidades." });
            } else if (meterReading < previousReading) {
                errors.push({ unitId: row.unitId, message: "A leitura atual não pode ser menor que a anterior." });
            }
            return Object.assign({}, row, {
                previousReading: previousReading,
                meterReading: meterReading,
                kwh: hasValues ? Math.max(0, meterReading - previousReading) : 0,
                amount: 0
            });
        });
        var totalKwh = readings.reduce(function (sum, row) { return sum + row.kwh; }, 0);
        var totalInvoice = Math.max(0, number(invoiceAmount));
        var rate = totalKwh ? totalInvoice / totalKwh : 0;
        var positive = readings.filter(function (row) { return row.kwh > 0; });
        var allocated = 0;
        positive.forEach(function (row, index) {
            row.amount = index === positive.length - 1
                ? roundMoney(totalInvoice - allocated)
                : roundMoney(row.kwh * rate);
            allocated += row.amount;
        });
        return {
            invoiceAmount: totalInvoice,
            totalKwh: totalKwh,
            rate: rate,
            readings: readings,
            errors: errors,
            distributedAmount: roundMoney(readings.reduce(function (sum, row) { return sum + row.amount; }, 0))
        };
    }

    function anomaly(history, currentKwh, threshold) {
        var values = (history || []).map(number).filter(function (value) { return value > 0; });
        if (values.length < 2 || number(currentKwh) <= 0) return null;
        var average = values.reduce(function (sum, value) { return sum + value; }, 0) / values.length;
        var variation = average ? (number(currentKwh) - average) / average : 0;
        if (Math.abs(variation) < (threshold || 0.3)) return null;
        return { average: average, variation: variation, direction: variation > 0 ? "above" : "below" };
    }

    function dueStatus(dueDate, paid, today) {
        if (paid) return "paid";
        if (!dueDate) return "pending";
        return String(dueDate) < String(today) ? "overdue" : "pending";
    }

    function billingSummary(allocations, today) {
        var summary = { paid: 0, pending: 0, overdue: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 };
        (allocations || []).forEach(function (allocation) {
            (allocation.readings || []).forEach(function (reading) {
                var status = dueStatus(allocation.dueDate, reading.paid === true, today);
                summary[status] = roundMoney(summary[status] + number(reading.amount));
                summary[status + "Count"] += 1;
            });
        });
        return summary;
    }

    return {
        calculateAllocation: calculateAllocation,
        anomaly: anomaly,
        dueStatus: dueStatus,
        billingSummary: billingSummary,
        roundMoney: roundMoney
    };
});
