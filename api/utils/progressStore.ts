interface JobStatus {
  progress: number;
  status: 'processing' | 'done' | 'error';
  sheets?: Record<string, FinancialData[]>;
  error?: string;
}

export const progressStore = new Map<string, JobStatus>();
