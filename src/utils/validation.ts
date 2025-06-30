import { z } from "astro:schema";
import { capitalize, filter, map, pipe } from "remeda";
import type {
    DateValidationConfig,
    MonthNameMapping,
    ValidationResult,
} from "./types.ts";
import {
    financialRowSchema,
    REQUIRED_COLUMNS,
    REQUIRED_FILES,
    REQUIRED_SEGMENTS,
    REQUIRED_SHEETS,
} from "./types.ts";

export function validateFileType(file: File): boolean {
    return file.name.endsWith(".xlsx")
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

const DEFAULT_DATE_CONFIG: DateValidationConfig = {
    expectedYear: 2025,
    allowedYears: [2025],
};

export function createDateConfig(
    year: number,
    additionalYears?: number[],
): DateValidationConfig {
    return {
        expectedYear: year,
        allowedYears: additionalYears ? [year, ...additionalYears] : [year],
    };
}

export function getDefaultDateConfig(): DateValidationConfig {
    return DEFAULT_DATE_CONFIG;
}

function generateMonthNamesMap(): MonthNameMapping {
    const locales = ["pt-BR", "en-US"];
    const formats = [
        { month: "long" as const },
        { month: "short" as const },
    ];
    const monthMap = {};
    for (const locale of locales) {
        for (const format of formats) {
            for (let month = 0; month < 12; month++) {
                const date = new Date(2025, month, 1);
                const formatter = new Intl.DateTimeFormat(locale, format);
                const monthName = formatter.format(date).toLowerCase().replace(/\./g, "");
                monthMap[monthName] = month;
            }
        }
    }
    return monthMap;
}

const MONTH_NAMES_MAP = generateMonthNamesMap();

export function dateToMonthYear(
    date: Date,
    _config: DateValidationConfig = DEFAULT_DATE_CONFIG,
): string {
    const dateFormat = Intl.DateTimeFormat("pt-BR", {
        month: "short",
        year: "2-digit",
    });
    const formatted = capitalize(dateFormat.format(date));
    return formatted.replace(/\./g, "");
}

export function standardMonthYearFormat(
    config: DateValidationConfig = DEFAULT_DATE_CONFIG,
): z.ZodType<string> {
    const allowedYearsShort = (config.allowedYears || [config.expectedYear])
        .map((year) => year.toString().slice(-2));

    return z.string().refine(
        (value) => {
            if (value.length !== 6 || value.charAt(3) !== "/") {
                return false;
            }
            const monthPart = value.substring(0, 3).toLowerCase();
            const yearPart = value.substring(4, 6);
            if (!allowedYearsShort.includes(yearPart)) {
                return false;
            }
            const monthAbbr = pipe(
                Object.keys(MONTH_NAMES_MAP),
                filter((m) => m.length === 3),
                map((m) => m.toLowerCase()),
            );
            return monthAbbr.includes(monthPart);
        },
        {
            message:
                `Invalid month/year format. Expected format: 'Mmm/YY' for year ${config.expectedYear} (e.g., 'Jan/${
                    config.expectedYear.toString().slice(-2)
                }')`,
        },
    );
}

export function parseDate(
    dateStr: string,
    config: DateValidationConfig = DEFAULT_DATE_CONFIG,
): Date | null {
    if (!dateStr) return null;
    const cleanStr = dateStr.trim();
    const monthYearPattern = /^([a-z]{3})\/(\d{2})$/i;
    const monthYearMatch = cleanStr.match(monthYearPattern);
    if (monthYearMatch) {
        const [, monthText, yearText] = monthYearMatch;
        const monthLower = monthText.toLowerCase();
        if (monthLower in MONTH_NAMES_MAP) {
            const monthIndex = MONTH_NAMES_MAP[monthLower];
            const fullYear = parseInt(`20${yearText}`);
            const allowedYears = config.allowedYears || [config.expectedYear];
            if (allowedYears.includes(fullYear)) {
                return new Date(fullYear, monthIndex, 1);
            }
        }
    }
    const isoPattern = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
    const isoMatch = cleanStr.match(isoPattern);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        const fullYear = parseInt(year);
        const allowedYears = config.allowedYears || [config.expectedYear];

        if (allowedYears.includes(fullYear)) {
            const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    }
    const brazilianPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const brazilianMatch = cleanStr.match(brazilianPattern);
    if (brazilianMatch) {
        const [, day, month, year] = brazilianMatch;
        const fullYear = parseInt(year);
        const allowedYears = config.allowedYears || [config.expectedYear];
        if (allowedYears.includes(fullYear)) {
            const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    }
    const usPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const usMatch = cleanStr.match(usPattern);
    if (usMatch) {
        const [, month, day, year] = usMatch;
        const fullYear = parseInt(year);
        const allowedYears = config.allowedYears || [config.expectedYear];
        if (allowedYears.includes(fullYear)) {
            const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    }
    try {
        const date = new Date(cleanStr);
        if (!isNaN(date.getTime())) {
            const allowedYears = config.allowedYears || [config.expectedYear];
            if (allowedYears.includes(date.getFullYear())) {
                return date;
            }
        }
    } catch {
        // Ignore parsing errors
    }

    return null;
}

export function normalizeMonthColumn(
    column: string,
    config: DateValidationConfig = DEFAULT_DATE_CONFIG,
): string | null {
    if (!column || typeof column !== "string") return null;
    const result = standardMonthYearFormat(config).safeParse(column);
    if (result.success) {
        return column;
    }
    const date = parseDate(column, config);
    if (date && !isNaN(date.getTime())) {
        return dateToMonthYear(date, config);
    }
    return null;
}

export function detectMonthColumns(
    row: Record<string, unknown>,
    config: DateValidationConfig = DEFAULT_DATE_CONFIG,
): string[] {
    return pipe(
        Object.keys(row),
        map((col) => normalizeMonthColumn(col, config)),
        filter((col): col is string => col !== null),
    );
}

export function validateRequiredColumns(
    data: Record<string, unknown>[],
    requiredColumns: string[] = REQUIRED_COLUMNS as unknown as string[],
    config: DateValidationConfig = DEFAULT_DATE_CONFIG,
): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (data.length === 0) {
        errors.push("Arquivo não contém dados");
        return { isValid: false, errors, warnings };
    }
    const actualColumns = Object.keys(data[0]);
    const missingColumns = requiredColumns.filter((col) =>
        !actualColumns.includes(col)
    );
    if (missingColumns.length > 0) {
        errors.push(
            `Colunas obrigatórias não encontradas: ${
                missingColumns.join(", ")
            }`,
        );
    }
    const extraColumns = actualColumns.filter(
        (col) =>
            !requiredColumns.includes(col) &&
            !normalizeMonthColumn(col, config),
    );
    if (extraColumns.length > 0) {
        warnings.push(`Colunas extra encontradas: ${extraColumns.join(", ")}`);
    }
    return { isValid: errors.length === 0, errors, warnings };
}

export function validateDataTypes(
    data: Record<string, unknown>[],
    monthColumns: string[],
): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fieldOptions = {
        seg: REQUIRED_SEGMENTS.join(", "),
        file: REQUIRED_FILES.join(", "),
        sheet: REQUIRED_SHEETS.join(", "),
    };
    data.forEach((row, index) => {
        const rowNum = index + 2;
        const parseResult = financialRowSchema.safeParse(row);
        if (!parseResult.success) {
            parseResult.error.errors.forEach((e) => {
                const path = e.path.join(".");
                let errorMsg = `Linha ${rowNum}: ${path} - ${e.message}`;
                if (path in fieldOptions && typeof row[path] === "string") {
                    errorMsg += `. Valores esperados: [${
                        fieldOptions[path as keyof typeof fieldOptions]
                    }]`;
                }
                errors.push(errorMsg);
            });
        }
        monthColumns.forEach((month) => {
            const value = row[month];
            if (value === undefined || value === null) {
                return;
            }
            if (typeof value !== "number" || isNaN(value)) {
                errors.push(
                    `Linha ${rowNum}: '${month}' deve ser um valor numérico, encontrado '${typeof value}'`,
                );
            }
        });
    });
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}
