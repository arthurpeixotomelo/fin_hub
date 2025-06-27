import { read, utils } from "xlsx";
import type {
    FinancialData,
    ProcessingResult,
    UnpivotedData,
    ValidationResult,
    WorkerMessage,
    WorkerProgressResponse,
    WorkerResponse,
} from "../utils/types.ts";
import {
    detectMonthColumns,
    normalizeMonthColumn,
    REQUIRED_COLUMNS,
    REQUIRED_SHEETS,
    validateDataTypes,
    validateRequiredColumns,
} from "../utils/validation.ts";
import {
    defaultBusinessConfig,
    validateBusinessRules,
} from "../utils/businessValidation.ts";

const processFile = (
    file: ArrayBuffer,
    _fileName: string,
): ProcessingResult => {
    console.log("Processing file...");
    try {
        self.postMessage({
            type: "progress",
            data: {
                stage: "reading",
                progress: 10,
                message: "Lendo arquivo Excel...",
            },
        } as WorkerProgressResponse);
        console.log("Reading file...");
        const workbook = read(file);
        self.postMessage({
            type: "progress",
            data: {
                stage: "parsing",
                progress: 20,
                message: "Analisando planilhas...",
            },
        } as WorkerProgressResponse);
        const availableSheets = workbook.SheetNames;
        const missingSheets = REQUIRED_SHEETS.filter((sheet) =>
            !availableSheets.includes(sheet)
        );

        if (missingSheets.length > 0) {
            throw new Error(
                `Planilhas obrigatórias não encontradas: ${
                    missingSheets.join(", ")
                }`,
            );
        }

        const allSheetsData = new Map<string, FinancialData[]>();
        let monthColumns: string[] = [];
        const totalValidation: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
        };

        for (let i = 0; i < REQUIRED_SHEETS.length; i++) {
            const sheetName = REQUIRED_SHEETS[i];
            const worksheet = workbook.Sheets[sheetName];

            self.postMessage({
                type: "progress",
                data: {
                    stage: "parsing",
                    progress: 25 + (i * 10),
                    message: `Processando planilha ${sheetName}...`,
                    sheetName,
                },
            } as WorkerProgressResponse);

            if (!worksheet) {
                throw new Error(`Planilha ${sheetName} não encontrada`);
            }

            const jsonData = utils.sheet_to_json(worksheet) as Record<
                string,
                unknown
            >[];

            if (jsonData.length === 0) {
                totalValidation.warnings.push(
                    `Planilha ${sheetName} está vazia`,
                );
                continue;
            }

            if (i === 0) {
                monthColumns = detectMonthColumns(jsonData);
                if (monthColumns.length === 0) {
                    throw new Error(
                        "Nenhuma coluna de mês encontrada no formato esperado",
                    );
                }
            }

            self.postMessage({
                type: "progress",
                data: {
                    stage: "validating_structure",
                    progress: 30 + (i * 8),
                    message: `Validando estrutura da planilha ${sheetName}...`,
                    sheetName,
                },
            } as WorkerProgressResponse);

            const requiredColumns = [...REQUIRED_COLUMNS, ...monthColumns];
            const structureValidation = validateRequiredColumns(
                jsonData,
                requiredColumns,
            );

            if (!structureValidation.isValid) {
                structureValidation.errors = structureValidation.errors.map((
                    error: string,
                ) => `${sheetName}: ${error}`);
                totalValidation.errors.push(...structureValidation.errors);
                totalValidation.isValid = false;
            }
            totalValidation.warnings.push(
                ...structureValidation.warnings.map((warning: string) =>
                    `${sheetName}: ${warning}`
                ),
            );

            const sheetData = jsonData.map((row) => ({
                ...row,
                sheet: sheetName,
            })) as FinancialData[];

            allSheetsData.set(sheetName, sheetData);
        }

        self.postMessage({
            type: "progress",
            data: {
                stage: "validating_data",
                progress: 70,
                message: "Validando tipos de dados...",
            },
        } as WorkerProgressResponse);

        for (const [sheetName, sheetData] of allSheetsData) {
            const dataValidation = validateDataTypes(sheetData, monthColumns);

            if (!dataValidation.isValid) {
                dataValidation.errors = dataValidation.errors.map((
                    error: string,
                ) => `${sheetName}: ${error}`);
                totalValidation.errors.push(...dataValidation.errors);
                totalValidation.isValid = false;
            }
            totalValidation.warnings.push(
                ...dataValidation.warnings.map((warning: string) =>
                    `${sheetName}: ${warning}`
                ),
            );
        }

        self.postMessage({
            type: "progress",
            data: {
                stage: "validating_business",
                progress: 80,
                message: "Validando regras de negócio...",
            },
        } as WorkerProgressResponse);

        for (const [sheetName, sheetData] of allSheetsData) {
            const businessValidation = validateBusinessRules(
                sheetData,
                monthColumns,
                defaultBusinessConfig,
            );

            if (!businessValidation.isValid) {
                businessValidation.errors = businessValidation.errors.map(
                    (error) => `${sheetName}: ${error}`,
                );
                totalValidation.errors.push(...businessValidation.errors);
                totalValidation.isValid = false;
            }
            totalValidation.warnings.push(
                ...businessValidation.warnings.map((warning) =>
                    `${sheetName}: ${warning}`
                ),
            );
        }

        self.postMessage({
            type: "progress",
            data: {
                stage: "cross_validating",
                progress: 85,
                message: "Validando consistência entre planilhas...",
            },
        } as WorkerProgressResponse);

        // const crossValidation = validateCrossSheet(allSheetsData, monthColumns);
        // totalValidation.warnings.push(...crossValidation.warnings);
        // if (!crossValidation.isValid) {
        //     totalValidation.errors.push(...crossValidation.errors);
        //     totalValidation.isValid = false;
        // }

        self.postMessage({
            type: "progress",
            data: {
                stage: "transforming",
                progress: 90,
                message: "Transformando dados...",
            },
        } as WorkerProgressResponse);

        const unpivotedData: UnpivotedData[] = [];

        for (const [sheetName, sheetData] of allSheetsData) {
            sheetData.forEach((row) => {
                monthColumns.forEach((month) => {
                    const value = row[month];
                    if (typeof value === "number" && !isNaN(value)) {
                        const normalizedMonth = normalizeMonthColumn(month);
                        // Only add if we have a valid month format
                        if (normalizedMonth) {
                            unpivotedData.push({
                                cod: row.cod,
                                seg: row.seg,
                                file: row.file,
                                sheet: sheetName,
                                month: normalizedMonth,
                                value,
                            });
                        }
                    }
                });
            });
        }

        self.postMessage({
            type: "progress",
            data: {
                stage: "complete",
                progress: 100,
                message:
                    `Processamento concluído! ${unpivotedData.length} registros processados.`,
            },
        } as WorkerProgressResponse);

        return {
            success: true,
            rawData: allSheetsData,
            unpivotedData,
            validation: totalValidation,
            monthColumns,
        };
    } catch (error) {
        console.error("Erro ao processar arquivo:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "Erro desconhecido durante o processamento";

        self.postMessage({
            type: "progress",
            data: {
                stage: "error",
                progress: 0,
                message: errorMessage,
            },
        } as WorkerProgressResponse);

        return {
            success: false,
            rawData: new Map(),
            unpivotedData: [],
            validation: {
                isValid: false,
                errors: [errorMessage],
                warnings: [],
            },
            monthColumns: [],
            error: errorMessage,
        };
    }
};

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
    const { type, file, fileName } = event.data;
    if (type === "process_file") {
        const result = await processFile(file, fileName);
        self.postMessage({
            type: "complete",
            data: result,
        } as WorkerResponse);
    }
};
