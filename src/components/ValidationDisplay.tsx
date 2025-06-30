import type { ReactNode } from "react";
import type { ValidationResult } from "../utils/types.ts";

export default function ValidationDisplay(
    { validation }: { validation: ValidationResult },
): ReactNode {
    if (validation.errors.length === 0 && validation.warnings.length === 0) {
        return null;
    }
    return (
        <>
            {validation.errors.length > 0 && (
                <div className="validationErrors">
                    <h3>Erros de Validação:</h3>
                    <ul>
                        {validation.errors.map((
                            error: string,
                            index: number,
                        ) => (
                            <li key={index} className="error">
                                {error}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {validation.warnings.length > 0 && (
                <div className="validationWarnings">
                    <h3>Avisos:</h3>
                    <ul>
                        {validation.warnings.map((
                            warning: string,
                            index: number,
                        ) => (
                            <li key={index} className="warning">
                                {warning}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}
