import { useContext, type ReactNode } from "react";
import { UploadContext } from "../context/UploadContext";

export default function ProgressIndicator(): ReactNode {
    const { state } = useContext(UploadContext);
    if (state.status === "idle") {
        return null;
    }
    return (
        <div className="processingSection">
            <div className="progressBar">
                <div
                    className="progressFill"
                    style={{ width: `${state.progress}%` }}
                />
            </div>
            <div className="processingInfo">
                {/* <p className="processingMessage">
                    {state.message}
                </p> */}
                {state.status && (
                    <p className="processingStage">
                        Etapa: {state.status}
                    </p>
                )}
                <p className="processingProgress">
                    {state.progress}% concluído
                </p>
            </div>
        </div>
    );
}
