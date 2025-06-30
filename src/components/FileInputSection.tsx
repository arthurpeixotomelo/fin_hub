import type { ChangeEvent, ReactNode, RefObject } from "react";
import type { ProcessingState } from "../utils/types.ts";
import { formatFileSize } from "../utils/validation.ts";

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
    const isDisabled = processing.status === "processing";

    return (
        <label htmlFor="fileInput" className="dropZone">
            <h2>Upload de Dados Financeiros</h2>
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={onFileChange}
                disabled={isDisabled}
                className="fileInput"
                id="fileInput"
            />
            {file
                ? (
                    <div className="fileInfo">
                        <p>
                            <strong>Arquivo selecionado:</strong>{" "}
                            {file.name}
                        </p>
                        <p>
                            <strong>Tamanho:</strong>{" "}
                            {formatFileSize(file.size)}
                        </p>
                    </div>
                )
                : (
                    <div className="dropZoneContent">
                        <div className="dropZoneIcon">📄</div>
                        <p className="dropZoneText">
                            Arraste e solte um arquivo .xlsx aqui ou clique
                            para selecionar
                        </p>
                        <button
                            type="button"
                            className="selectFileButton"
                            disabled={isDisabled}
                        >
                            Selecionar Arquivo
                        </button>
                    </div>
                )}
        </label>
    );
}
