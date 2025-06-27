import type { ReactNode } from "react";
import type { ProcessingState, ValidationResult } from "../utils/types.ts";

interface ActionButtonsProps {
    validation: ValidationResult;
    processing: ProcessingState;
    file: File | null;
    onSubmit: () => void;
    onReset: () => void;
}

export default function ActionButtons({
    validation,
    processing,
    file,
    onSubmit,
    onReset,
}: ActionButtonsProps): ReactNode {
    return (
        <div className="actionButtons">
            {validation.isValid && processing.status === "validated" && (
                <button
                    type="button"
                    onClick={onSubmit}
                    className="btnSubmit"
                >
                    Enviar Dados
                </button>
            )}
            {file && (
                <button
                    type="button"
                    onClick={onReset}
                    className="btnReset"
                >
                    Resetar
                </button>
            )}
        </div>
    );
}
