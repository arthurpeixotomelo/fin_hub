import { z } from "astro:schema";
import { detectMonthColumns, normalizeMonthColumn } from "./dateUtils.ts";
import type { ValidationResult } from "./types.ts";

export const REQUIRED_COLUMNS = [
    "cod",
    "seg",
    "file",
] as const;

export const REQUIRED_SEGMENTS = [
    "E1",
    "E2",
    "E3",
    "E4",
    "E5",
    "E6",
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
] as const;

export const REQUIRED_FILES = [
    "Cards",
    "Loans",
    "Insurance",
    "Investments",
    "Savings",
    "Payments",
] as const;

export const REQUIRED_SHEETS = [
    "RESULTADO",
    "CONTABIL",
    "FICTICIO",
    "SALDO_MEDIO",
    "SALDO_PONTA",
] as const;

export const ColumnsType = z.enum(REQUIRED_COLUMNS);
export const SegmentType = z.enum(REQUIRED_SEGMENTS);
export const FileType = z.enum(REQUIRED_FILES);
export const SheetType = z.enum(REQUIRED_SHEETS);

export const financialRowSchema = z.object({
    cod: z.number().int().positive()
        .describe("Código da linha BP"),
    seg: SegmentType
        .describe("Segmento de negócio (Select, Especial, etc.)"),
    file: FileType
        .describe("Área de Negócio (Cartões, Créditos, etc.)"),
    sheet: SheetType
        .describe("Planilha de Origem"),
});

export function validateRequiredColumns(
    data: Record<string, unknown>[],
    requiredColumns: string[],
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

    const extraColumns = actualColumns.filter((col) =>
        !requiredColumns.includes(col) &&
        !normalizeMonthColumn(col)
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

export { detectMonthColumns, normalizeMonthColumn };
