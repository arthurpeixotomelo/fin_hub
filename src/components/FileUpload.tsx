import type { ReactNode } from "react";
import useFileProcessing from "../hooks/useFileProcessing.ts";
import FileInputSection from "./FileInputSection.tsx";
import ProgressIndicator from "./ProgressIndicator.tsx";
import ValidationDisplay from "./ValidationDisplay.tsx";
import DataPreview from "./DataPreview.tsx";
import ActionButtons from "./ActionButtons.tsx";
import "../styles/FileUpload.css";

export default function FileUpload(): ReactNode {
    const {
        file,
        rawData,
        unpivotedData: _unpivotedData,
        monthColumns,
        validation,
        processing,
        fileInputRef,
        handleFileChange,
        handleSubmit,
        resetForm,
    } = useFileProcessing();

    return (
        <div className="fileUploadContainer">
            <FileInputSection
                file={file}
                onFileChange={handleFileChange}
                processing={processing}
                fileInputRef={fileInputRef}
            />

            <ProgressIndicator processing={processing} />

            <ValidationDisplay validation={validation} />

            <DataPreview
                rawData={rawData}
                monthColumns={monthColumns}
            />

            <ActionButtons
                validation={validation}
                processing={processing}
                file={file}
                onSubmit={handleSubmit}
                onReset={resetForm}
            />
        </div>
    );
}
