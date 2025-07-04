
import FileInput from './FileInput';
import ProgressIndicator from './ProgressIndicator';
import { UploadProvider } from '../context/UploadContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../styles/FileUpload.css';

const queryClient = new QueryClient();

export default function FileUpload(): ReactNode {
    return (
        <QueryClientProvider client={queryClient}>
            <UploadProvider>
                <FileInput />
                <ProgressIndicator />    
            </UploadProvider>
        </QueryClientProvider>
    );
}
