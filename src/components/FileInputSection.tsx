import type { ChangeEvent, ReactNode, RefObject } from "react";
import { REQUIRED_SHEETS } from "../utils/validation.ts";
import type { ProcessingState } from "../utils/types.ts";

interface FileInputSectionProps {
    file: File | null;
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    processing: ProcessingState;
    fileInputRef: RefObject<HTMLInputElement>;
}

export default function FileInputSection({
    file,
    onFileChange,
    processing,
    fileInputRef,
}: FileInputSectionProps): ReactNode {
    return (
        <div className="uploadSection">
            <h2>Upload de Dados Financeiros</h2>
            <p className="description">
                Faça upload de um arquivo Excel (.xlsx) contendo as seguintes
                planilhas:
            </p>
            <ul className="requiredSheets">
                {REQUIRED_SHEETS.map((sheet) => <li key={sheet}>{sheet}</li>)}
            </ul>

            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={onFileChange}
                disabled={processing.status === "processing"}
                className="fileInput"
            />

            {file && (
                <div className="fileInfo">
                    <p>
                        <strong>Arquivo selecionado:</strong> {file.name}
                    </p>
                    <p>
                        <strong>Tamanho:</strong>{" "}
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                </div>
            )}
        </div>
    );
}
