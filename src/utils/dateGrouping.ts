import type { DateValidationConfig } from "./types.ts";
import { dateToMonthYear, parseDate } from "./validation.ts";

export type GroupingPeriod = "month" | "quarter" | "semester" | "year";

export interface DateGroup {
    period: GroupingPeriod;
    label: string;
    months: string[];
    startDate: Date;
    endDate: Date;
}

export interface FinancialPeriod {
    id: string;
    label: string;
    months: string[];
    order: number;
}

function getQuarter(month: number): number {
    return Math.floor(month / 3) + 1;
}

function getSemester(month: number): number {
    return Math.floor(month / 6) + 1;
}

export function parseMonthColumn(
    monthStr: string,
    config?: DateValidationConfig,
): Date | null {
    return parseDate(monthStr, config);
}

export function groupMonthsByPeriod(
    monthColumns: string[],
    period: GroupingPeriod,
    config?: DateValidationConfig,
): FinancialPeriod[] {
    const parsedMonths = monthColumns
        .map((month) => ({
            original: month,
            date: parseMonthColumn(month, config),
        }))
        .filter((item) => item.date !== null)
        .sort((a, b) => a.date!.getTime() - b.date!.getTime());

    const groups = new Map<string, FinancialPeriod>();

    parsedMonths.forEach(({ original, date }) => {
        if (!date) return;

        const year = date.getFullYear();
        const month = date.getMonth();

        let groupId: string;
        let groupLabel: string;
        let order: number;

        switch (period) {
            case "month": {
                groupId = `${year}-${month.toString().padStart(2, "0")}`;
                groupLabel = dateToMonthYear(date, config);
                order = year * 12 + month;
                break;
            }

            case "quarter": {
                const quarter = getQuarter(month);
                groupId = `${year}-Q${quarter}`;
                groupLabel = `Q${quarter} ${year}`;
                order = year * 4 + quarter - 1;
                break;
            }

            case "semester": {
                const semester = getSemester(month);
                groupId = `${year}-S${semester}`;
                groupLabel = `${semester}º Sem ${year}`;
                order = year * 2 + semester - 1;
                break;
            }

            case "year": {
                groupId = year.toString();
                groupLabel = year.toString();
                order = year;
                break;
            }

            default:
                throw new Error(`Unsupported period: ${period}`);
        }

        if (!groups.has(groupId)) {
            groups.set(groupId, {
                id: groupId,
                label: groupLabel,
                months: [],
                order,
            });
        }

        groups.get(groupId)!.months.push(original);
    });

    return Array.from(groups.values()).sort((a, b) => a.order - b.order);
}

export function calculatePeriodChange(
    currentValue: number | null | undefined,
    previousValue: number | null | undefined,
): number | null {
    if (typeof currentValue !== "number" || typeof previousValue !== "number") {
        return null;
    }

    if (previousValue === 0) {
        return currentValue === 0 ? 0 : null;
    }

    return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
}

export function calculateYTD(
    data: Record<string, unknown>,
    monthColumns: string[],
    targetMonth: string,
    config?: DateValidationConfig,
): number | null {
    const targetDate = parseMonthColumn(targetMonth, config);
    if (!targetDate) return null;

    const targetYear = targetDate.getFullYear();

    let sum = 0;
    let hasValidData = false;

    for (const month of monthColumns) {
        const monthDate = parseMonthColumn(month, config);
        if (!monthDate) continue;

        if (monthDate.getFullYear() === targetYear && monthDate <= targetDate) {
            const value = data[month];
            if (typeof value === "number") {
                sum += value;
                hasValidData = true;
            }
        }
    }

    return hasValidData ? sum : null;
}

export function calculateYoY(
    data: Record<string, unknown>,
    _monthColumns: string[],
    targetMonth: string,
    config?: DateValidationConfig,
): number | null {
    const targetDate = parseMonthColumn(targetMonth, config);
    if (!targetDate) return null;

    const previousYearDate = new Date(targetDate);
    previousYearDate.setFullYear(previousYearDate.getFullYear() - 1);
    const previousYearMonth = dateToMonthYear(previousYearDate, config);

    const currentValue = data[targetMonth];
    const previousYearValue = data[previousYearMonth];

    const currentNum = typeof currentValue === "number" ? currentValue : null;
    const previousNum = typeof previousYearValue === "number"
        ? previousYearValue
        : null;

    return calculatePeriodChange(currentNum, previousNum);
}

export function getSortedMonths(
    monthColumns: string[],
    config?: DateValidationConfig,
): string[] {
    return monthColumns
        .map((month) => ({
            original: month,
            date: parseMonthColumn(month, config),
        }))
        .filter((item) => item.date !== null)
        .sort((a, b) => a.date!.getTime() - b.date!.getTime())
        .map((item) => item.original);
}

export function getPreviousPeriod(
    monthStr: string,
    period: GroupingPeriod,
    config?: DateValidationConfig,
): string | null {
    const date = parseMonthColumn(monthStr, config);
    if (!date) return null;

    const previousDate = new Date(date);

    switch (period) {
        case "month":
            previousDate.setMonth(previousDate.getMonth() - 1);
            break;
        case "quarter":
            previousDate.setMonth(previousDate.getMonth() - 3);
            break;
        case "semester":
            previousDate.setMonth(previousDate.getMonth() - 6);
            break;
        case "year":
            previousDate.setFullYear(previousDate.getFullYear() - 1);
            break;
    }

    return dateToMonthYear(previousDate, config);
}
