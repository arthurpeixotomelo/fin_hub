import { useUploadContext } from "../context/UploadContext";
import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";

export default function FileUploadActions(): ReactNode {
    const { state, dispatch } = useUploadContext();
    const file = state.file;
    const isFileSelected = !!file;
    const canSubmit = state.status === "done";
    const isProcessing = state.status !== "idle" || state.status !== "done";

    // if (state.status === 'idle') return null;

    const uploadToDBMutation = useMutation({
        mutationFn: async ({ file }: { file: File }) => {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/uploadToDB", {
            method: "POST",
            body: form,
        });
        if (!res.ok) throw new Error("Erro ao enviar para o Databricks");
        return res.json();
        },
        onSuccess: (_data) => {
        // dispatch({ type: 'SUCCESS', payload: 'Arquivo enviado ao Databricks!' })
        },
        onError: (err) => {
        console.error(err);
        dispatch({
            type: "ERROR",
            payload: "Falha ao enviar para o Databricks.",
        });
        },
    });
    
    const handleSubmit = () => {
        if (!file) return;
        uploadToDBMutation.mutate({ file: file });
    };

    const handleReset = () => {
        dispatch({ type: "RESET" });
    };

    return (
        <div className={`actions ${isFileSelected ? "" : "disabled"}`}>
            <button
                type="button"
                onClick={handleSubmit}
                className="btnSubmit"
                disabled={!canSubmit}
            >
                Enviar
            </button>
            <button
                type="button"
                onClick={handleReset}
                className="btnReset"
                disabled={!isProcessing}
            >
                Cancelar
            </button>
        </div>
    );
}
