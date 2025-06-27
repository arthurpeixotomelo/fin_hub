import { z } from "astro:schema";

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
        | "validating_business"
        | "cross_validating"
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