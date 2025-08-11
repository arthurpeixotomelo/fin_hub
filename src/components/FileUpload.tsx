import '../styles/FileUpload.css';
import DataTable from './DataTable';
import FileInput from './FileInput';
import type { ReactNode } from 'react';
import FileUploadActions from './FileUploadActions';
import ProgressIndicator from './ProgressIndicator';
import { UploadProvider } from '../context/UploadContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function FileUpload(): ReactNode {
    return (
        <QueryClientProvider client={queryClient}>
            <UploadProvider>
                <FileInput />
                <ProgressIndicator />
                <DataTable />
                <FileUploadActions />
            </UploadProvider>
        </QueryClientProvider>
    );
}
