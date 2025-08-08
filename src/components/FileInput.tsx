import type { ChangeEvent, ReactNode } from "react";
import { formatFileSize } from "../utils/validation";
import { useMutation } from "@tanstack/react-query";
import { useUploadProgress } from "../hooks/useUploadProgress";
import { useUploadContext } from "../context/UploadContext";

export default function FileInput(): ReactNode {
  const { state, dispatch, dataRef } = useUploadContext();
  const file = state.file;
  const isFileSelected = !!file;
  const isProcessing = state.status !== "idle" || state.status !== "done";

  useUploadProgress(state.jobId, isProcessing);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, jobId }: { file: File; jobId: string }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("jobId", jobId);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Erro ao enviar arquivo");
      return res.json();
    },
    onSuccess: (data) => {
      if (data?.sheets) {
        dataRef.current = data.sheets;
      } else {
        dispatch({ type: "ERROR", payload: "Nenhum dado processado." });
      }
    },
    onError: () => {
      dispatch({ type: "ERROR", payload: "Falha no envio do arquivo." });
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const isXLSX = selected.name.endsWith(".xlsx") &&
      selected.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (!isXLSX) {
      dispatch({
        type: "ERROR",
        payload: "Formato inválido. Envie um arquivo .xlsx.",
      });
      return;
    }
    const jobId = crypto.randomUUID();
    dispatch({ type: "START", payload: { file: selected, jobId } });
    uploadMutation.mutate({ file: selected, jobId: jobId });
  };

  return (
    <section>
      <label htmlFor="fileInput">
        <input
          id="fileInput"
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          disabled={isFileSelected}
          required
        />
        {file
          ? (
            <div className="content">
              <p>
                <span>
                  <strong>Arquivo:</strong>
                  {file.name}
                </span>
                <br />
                <span>
                  <strong>Tamanho:</strong>
                  {formatFileSize(file.size)}
                </span>
              </p>
            </div>
          )
          : (
            <div className="content">
              <p>
                Arraste e solte um arquivo excel ou clique para selecionar
              </p>
            </div>
          )}
      </label>
    </section>
  );
}
