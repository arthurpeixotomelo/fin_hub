import { createContext, useContext, use, useReducer, useRef } from 'react';
import type { Dispatch, ReactNode, MutableRefObject } from 'react';
import type { FinancialData } from '../utils/types';

type UploadStatus = 'idle' | 'processing' | 'uploading' | 'validating' | 'done' | 'error' | 'aborted';

interface UploadState {
  progress: number;
  status: UploadStatus;
  error: string | null;
  aborted: boolean;
  file: File | null;
}

type UploadAction =
  | { type: 'START'; payload: File }
  | { type: 'PROGRESS'; payload: number }
  | { type: 'ABORT' }
  | { type: 'ERROR'; payload: string }
  | { type: 'DONE' }
  | { type: 'RESET' };

const initialState: UploadState = {
  progress: 0,
  status: 'idle',
  error: null,
  aborted: false,
  file: null,
};

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        status: 'uploading',
        progress: 0,
        error: null,
        aborted: false,
        file: action.payload,
      };
    case 'PROGRESS':
      return { ...state, progress: action.payload };
    case 'ABORT':
      return { ...state, status: 'aborted', aborted: true };
    case 'ERROR':
      return { ...state, status: 'error', error: action.payload };
    case 'DONE':
      return { ...state, status: 'done', progress: 100 };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export const UploadContext = createContext<
  [UploadState, Dispatch<UploadAction>, MutableRefObject<Record<string, FinancialData[]> | null>] | null
>(null);

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
