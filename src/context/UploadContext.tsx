import { createContext, useContext, useReducer, useRef } from 'react';
import type { Dispatch, ReactNode, RefObject } from 'react';
import type { FinancialData } from '../utils/types';

type UploadStatus = 'idle' | 'uploading' | 'reading' | 'processing' | 'validating' | 'done' | 'error';

interface UploadState {
  progress: number;
  status: UploadStatus;
  error: string | null;
  file: File | null;
  jobId: string | null;
}

type UploadAction =
  | { type: 'START'; payload: { file: File; jobId: string } }
  | { type: 'PROGRESS'; payload: { progress: number; status: UploadStatus } }
  | { type: 'ERROR'; payload: string }
  | { type: 'DONE'; payload: { progress: number; status: 'done' } }
  | { type: 'RESET' };

const initialState: UploadState = {
  progress: 0,
  status: 'idle',
  error: null,
  file: null,
  jobId: null
};

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        file: action.payload.file,
        jobId: action.payload.jobId,
      };
    case 'PROGRESS':
      return { ...state, progress: action.payload.progress, status: action.payload.status };
    case 'ERROR':
      return { ...state, status: 'error', error: action.payload };
    case 'DONE':
      return { ...state, progress: action.payload.progress, status: action.payload.status };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface UploadContextType {
  state: UploadState;
  dispatch: Dispatch<UploadAction>;
  dataRef: RefObject<Record<string, FinancialData[]> | null>;
}

export const UploadContext = createContext<UploadContextType | null>(null);

export function useUploadContext() {
    const context = useContext(UploadContext);
    if (!context) {
      throw new Error('UploadContext must be used within an UploadProvider');
    }
    return context;
}

export function UploadProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uploadReducer, initialState);
  const dataRef = useRef<Record<string, FinancialData[]> | null>(null);
  return (
    <UploadContext value={{state, dispatch, dataRef}}>
      {children}
    </UploadContext>
  );
}
