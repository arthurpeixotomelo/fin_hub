import type { ReactNode } from "react";
import type { ProcessingState } from '../utils/types'

export default function ProgressIndicator(
    { processing }: { processing: ProcessingState},
): ReactNode {
    if (processing.status === "idle") {
        return null;
    }
    return (
        <div className="processingSection">
            <div className="progressBar">
                <div
                    className="progressFill"
                    style={{ width: `${processing.progress}%` }}
                />
            </div>
            <div className="processingInfo">
                <p className="processingMessage">
                    {processing.message}
                </p>
                {processing.stage && (
                    <p className="processingStage">
                        Etapa: {processing.stage}
                        {processing.currentSheet &&
                            ` (${processing.currentSheet})`}
                    </p>
                )}
                <p className="processingProgress">
                    {processing.progress}% concluído
                </p>
            </div>
        </div>
    );
}
