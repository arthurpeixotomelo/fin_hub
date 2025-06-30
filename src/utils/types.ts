import { z } from "astro:schema";
import type { ChangeEvent, RefObject } from "react";

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface FinancialData {
    cod: number;
    seg: string;
    file: string;
    sheet: string;
    [key: string]: unknown;
}

export interface UnpivotedData {
    cod: number;
    seg: string;
    file: string;
    sheet: string;
    month: string;
    value: number;
}

export interface BusinessValidationConfig {
    maxMonthlyVariation: number;
    allowDuplicateCodSeg: boolean;
    minimumNonZeroMonths: number;
}

export interface ProcessingProgress {
    stage:
        | "reading"
        | "parsing"
        | "validating_structure"
        | "validating_data"
        | "transforming"
        | "complete"
        | "error";
    progress: number;
    message: string;
    sheetName?: string;
}

export interface ProcessingState {
    status: "idle" | "processing" | "validated" | "error" | "ready";
    progress: number;
    message: string;
    stage?: string;
    currentSheet?: string;
}

export interface ProcessingResult {
    success: boolean;
    rawData: Map<string, FinancialData[]>;
    unpivotedData: UnpivotedData[];
    validation: ValidationResult;
    monthColumns: string[];
    error?: string;
}

export interface WorkerMessage {
    type: "process_file";
    file: ArrayBuffer;
    fileName: string;
}

export interface WorkerProgressResponse {
    type: "progress";
    data: ProcessingProgress;
}

export interface WorkerCompleteResponse {
    type: "complete";
    data: ProcessingResult;
}

export interface WorkerErrorResponse {
    type: "error";
    data: { error: string };
}

export type WorkerResponse =
    | WorkerProgressResponse
    | WorkerCompleteResponse
    | WorkerErrorResponse;

export interface FileProcessingHookResult {
    file: File | null;
    rawData: Map<string, FinancialData[]>;
    unpivotedData: UnpivotedData[];
    monthColumns: string[];
    validation: ValidationResult;
    processing: ProcessingState;
    fileInputRef: RefObject<HTMLInputElement>;
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleSubmit: () => void;
    resetForm: () => void;
}

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

export const ColumnsSchema = z.enum(REQUIRED_COLUMNS);
export const SegmentSchema = z.enum(REQUIRED_SEGMENTS);
export const FileSchema = z.enum(REQUIRED_FILES);
export const SheetSchema = z.enum(REQUIRED_SHEETS);

export const financialRowSchema = z.object({
    cod: z.number().int().positive()
        .describe("Código da linha BP"),
    seg: SegmentSchema
        .describe("Segmento de negócio (Select, Especial, etc.)"),
    file: FileSchema
        .describe("Área de Negócio (Cartões, Créditos, etc.)"),
    sheet: SheetSchema
        .describe("Planilha de Origem"),
});

export type ColumnType = z.infer<typeof ColumnsSchema>;
export type SegmentType = z.infer<typeof SegmentSchema>;
export type FileType = z.infer<typeof FileSchema>;
export type SheetType = z.infer<typeof SheetSchema>;

// Date validation configuration
export interface DateValidationConfig {
    expectedYear: number;
    allowedYears?: number[];
}

// Month format type
export interface MonthNameMapping {
    [key: string]: number;
}
