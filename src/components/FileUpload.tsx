
import FileInput from './FileInput';
import type { ReactNode } from 'react';
import ProgressIndicator from './ProgressIndicator';
import { UploadProvider } from '../context/UploadContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../styles/FileUpload.css';
import FileUploadActions from './FileUploadActions';
import SimpleDataTable from './SimpleDataTable';

const queryClient = new QueryClient();

export default function FileUpload(): ReactNode {
    return (
        <QueryClientProvider client={queryClient}>
            <UploadProvider>
                <FileInput />
                <ProgressIndicator />
                <SimpleDataTable />
                <FileUploadActions />
            </UploadProvider>
        </QueryClientProvider>
    );
}
