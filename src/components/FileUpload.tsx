import type { ReactNode } from "react";
import { formatFileSize } from "../utils/validation.ts";
import useFileProcessing from "../hooks/useFileProcessing.ts";
import "../styles/FileUpload.css";

export default function FileUpload(): ReactNode {
    const {
        file,
        processing,
        validation,
        fileInputRef,
        handleFileChange,
        handleSubmit,
        resetForm,
    } = useFileProcessing();
    
    const isFileSelected = file !== null;
    const isProcessing = processing.status === "processing";
    const isFileValid = validation.isValid && processing.status === "validated"
    
    return (
        <section>
            <label htmlFor="fileInput">
                <input
                    id="fileInput"
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    disabled={isFileSelected}
                    required
                />
                {file ? (
                    <div className="content">
                        <p>
                            <span>
                                <strong>Arquivo: </strong>
                                {file.name}
                            </span>
                            <br/>
                            <span>
                                <strong>Tamanho: </strong>
                                {formatFileSize(file.size)}
                            </span>
                        </p>
                    </div>
                ) : (
                    <div className="content">
                        <p>
                            Arraste e solte um arquivo excel ou clique para
                            selecionar
                        </p>
                    </div>
                )}
            </label>
            <div className={`actions ${isFileSelected ? "" : "disabled"}`}>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="btnSubmit"
                    disabled={!isFileValid}
                >
                    Enviar
                </button>
                <button
                    type="button"
                    onClick={resetForm}
                    className="btnReset"
                    disabled={!isProcessing}
                >
                    Cancelar
                </button>
            </div>
        </section>
    );
}
