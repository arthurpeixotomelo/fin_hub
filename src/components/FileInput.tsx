import { actions } from 'astro:actions';
import type { ReactNode, ChangeEvent } from "react";
import { formatFileSize } from "../utils/validation";
import { use, useContext, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query'; 
import { UploadContext, useUploadContext, UploadProvider } from '../context/UploadContext';

export default function FileInput() {
    const { state, dispatch, dataRef } = useContext(UploadContext);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const file = state.file;
    const isFileSelected = !!file;
    const isFileValid = state.status === 'done';
    const isProcessing = state.status !== 'uploading';
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        const isXLSX = selected.name.endsWith('.xlsx') 
        // && selected.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        if (!isXLSX) {
        dispatch({ type: 'ERROR', payload: 'Formato inválido. Envie um arquivo .xlsx.' });
        return;
        }
        dispatch({ type: 'START', payload: selected });
    };
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const res = await actions.uploadExcel({ file });
            return res.jobId;
        },
        onSuccess: (jobId) => {
            dispatch({ type: 'START', payload: state.file! });
            setJobId(jobId);
        },
        onError: () => {
            dispatch({ type: 'ERROR', payload: 'Falha no envio.' });
        },
    });
    const [jobId, setJobId] = useState<string | null>(null);
    const { data: progressData } = useQuery({
        queryKey: ['progress', jobId],
        queryFn: async () => {
            const res = await fetch(`/progress/${jobId}`);
            return res.json();
        },
        enabled: !!jobId,
        refetchInterval: 1000,
        onSuccess: (data) => {
            dispatch({ type: 'PROGRESS', payload: data.progress });
            if (data.status === 'done') {
                dispatch({ type: 'DONE' });
            }
        },
    });
    const handleSubmit = () => { if (state.file) uploadMutation.mutate(state.file); }
    const resetForm = () => {
        fileInputRef.current?.value && (fileInputRef.current.value = '');
        dispatch({ type: 'RESET' });
    };
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
                    disabled={isProcessing}
                >
                    Cancelar
                </button>
            </div>
        </section>
    )
}