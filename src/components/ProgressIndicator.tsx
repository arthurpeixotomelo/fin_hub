import type { ReactNode } from "react";
import { useUploadContext } from "../context/UploadContext";

export default function ProgressIndicator(): ReactNode {
    const { state, dataRef } = useUploadContext();
    const value = state.progress || 0;
    const isProcessing = state.status !== "idle" && state.status !== "done";
    if (dataRef.current) {console.log(dataRef.current);}
    if (state.status === "idle") return null;
    return (
        <section id='upload-progress' aria-busy={isProcessing}>
            <label>
                <progress
                role='progressbar' 
                tabIndex={-1}
                aria-describedby="upload-progress" 
                value={value}
                aria-valuenow={value}
                max='100'
                >
                </progress>
                <span>
                    Etapa: {state.status}
                </span>
                <span>
                    {value}% concluído
                </span>
            </label>
        </section>
    );
}
