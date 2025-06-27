import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type {
    FinancialData,
    ProcessingProgress,
    ProcessingResult,
    ProcessingState,
    UnpivotedData,
    ValidationResult,
    WorkerMessage,
    WorkerResponse
} from "../utils/types.ts";

interface FileProcessingHookResult {
    file: File | null;
    rawData: Map<string, FinancialData[]>;
    unpivotedData: UnpivotedData[];
    monthColumns: string[];
    validation: ValidationResult;
    processing: ProcessingState;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleSubmit: () => void;
    resetForm: () => void;
}

export default function useFileProcessing(): FileProcessingHookResult {
    const [file, setFile] = useState<File | null>(null);
    const [rawData, setRawData] = useState<Map<string, FinancialData[]>>(
        new Map(),
    );
    const [unpivotedData, setUnpivotedData] = useState<UnpivotedData[]>([]);
    const [monthColumns, setMonthColumns] = useState<string[]>([]);
    const [validation, setValidation] = useState<ValidationResult>({
        isValid: false,
        errors: [],
        warnings: [],
    });
    const [processing, setProcessing] = useState<ProcessingState>({
        status: "idle",
        progress: 0,
        message: "",
    });
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Create a new worker instance
        workerRef.current = new Worker(
            new URL('../workers/fileProcessor.worker.ts', import.meta.url),
            { type: 'module' }
        );
        
        // Make sure workerRef.current is not null before accessing it
        if (workerRef.current) {
            workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
                const { type, data } = event.data;

            if (type === "progress" && "progress" in data && "message" in data) {
                const progressData = data as ProcessingProgress;
                setProcessing({
                    status: "processing",
                    progress: progressData.progress,
                    message: progressData.message,
                    stage: progressData.stage,
                    currentSheet: progressData.sheetName,
                });
            } else if (type === "complete" && "success" in data) {
                const result = data as ProcessingResult;

                if (result.success) {
                    setRawData(result.rawData);
                    setUnpivotedData(result.unpivotedData);
                    setValidation(result.validation);
                    setMonthColumns(result.monthColumns);

                    setProcessing({
                        status: result.validation.isValid
                            ? "validated"
                            : "error",
                        progress: 100,
                        message: result.validation.isValid
                            ? "Arquivo processado com sucesso!"
                            : "Arquivo processado com erros de validação",
                    });
                } else {
                    setProcessing({
                        status: "error",
                        progress: 0,
                        message: result.error || "Erro durante o processamento",
                    });
                    setValidation({
                        isValid: false,
                        errors: [result.error || "Erro desconhecido"],
                        warnings: [],
                    });
                }
            } else if (type === "error" && "error" in data) {
                const errorData = data as { error: string };
                setProcessing({
                    status: "error",
                    progress: 0,
                    message: errorData.error,
                });
                setValidation({
                    isValid: false,
                    errors: [errorData.error],
                    warnings: [],
                });
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        if (!selectedFile.name.endsWith(".xlsx")) {
            setValidation({
                isValid: false,
                errors: ["Por favor, selecione um arquivo .xlsx"],
                warnings: [],
            });
            return;
        }
        setFile(selectedFile);
        setRawData(new Map());
        setUnpivotedData([]);
        setMonthColumns([]);
        setValidation({ isValid: false, errors: [], warnings: [] });
        setProcessing({
            status: "processing",
            progress: 5,
            message: "Iniciando processamento...",
        });

        try {
            const fileBuffer = await selectedFile.arrayBuffer();

            const message: WorkerMessage = {
                type: "process_file",
                file: fileBuffer,
                fileName: selectedFile.name,
            };

            if (workerRef.current) {
                workerRef.current.postMessage(message);
            } else {
                throw new Error("Worker não inicializado");
            }
        } catch (error) {
            setProcessing({
                status: "error",
                progress: 0,
                message: "Erro ao ler arquivo",
            });
            setValidation({
                isValid: false,
                errors: [
                    error instanceof Error
                        ? error.message
                        : "Erro desconhecido",
                ],
                warnings: [],
            });
        }
    };

    const handleSubmit = () => {
        if (!validation.isValid) return;

        setProcessing({
            status: "ready",
            progress: 100,
            message: "Dados prontos para envio!",
        });

        console.log("Raw data by sheet:", Object.fromEntries(rawData));
        console.log("Unpivoted data for database:", unpivotedData);

        // TODO: Implement API call to submit data
        // await submitData(unpivotedData)
    };

    const resetForm = () => {
        setFile(null);
        setRawData(new Map());
        setUnpivotedData([]);
        setMonthColumns([]);
        setValidation({ isValid: false, errors: [], warnings: [] });
        setProcessing({ status: "idle", progress: 0, message: "" });
        
        // Reset the file input element
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return {
        file,
        rawData,
        unpivotedData,
        monthColumns,
        validation,
        processing,
        fileInputRef,
        handleFileChange,
        handleSubmit,
        resetForm
    };
}
