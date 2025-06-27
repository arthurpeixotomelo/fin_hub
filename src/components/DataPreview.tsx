import { useState } from "react";
import type { ReactNode } from "react";
import type { FinancialData } from "../utils/types.ts";
import DataTable from "./DataTable.tsx";

interface DataPreviewProps {
    rawData: Map<string, FinancialData[]>;
    monthColumns: string[];
}

export default function DataPreview(
    { rawData, monthColumns }: DataPreviewProps,
): ReactNode {
    const [selectedSheet, setSelectedSheet] = useState<string>(
        Array.from(rawData.keys())[0] || "RESULTADO",
    );

    if (rawData.size === 0) {
        return null;
    }

    const currentSheetData = rawData.get(selectedSheet) || [];
    const currentColumns = currentSheetData.length > 0
        ? Object.keys(currentSheetData[0]).filter((key) => key !== "sheet")
        : [];

    const totalRecordsPivot = Array.from(rawData.values()).reduce(
        (total, data) => total + data.length,
        0,
    );

    // Calculate total unpivoted records
    const totalRecordsUnpivot = Array.from(rawData.entries()).reduce(
        (total, [_, sheetData]) => {
            return total + sheetData.reduce((sheetTotal, row) => {
                const validMonthValues = monthColumns.filter(
                    (month) =>
                        typeof row[month] === "number" &&
                        !isNaN(row[month] as number),
                ).length;
                return sheetTotal + validMonthValues;
            }, 0);
        },
        0,
    );

    return (
        <div className="dataPreview">
            <div className="sheetSelector">
                <h3>Prévia dos Dados</h3>
                <div className="sheetTabs">
                    {Array.from(rawData.keys()).map((sheetName) => (
                        <button
                            key={sheetName}
                            type="button"
                            onClick={() => setSelectedSheet(sheetName)}
                            className={`sheetTab ${
                                selectedSheet === sheetName ? "active" : ""
                            }`}
                        >
                            {sheetName}
                            <span className="recordCount">
                                ({rawData.get(sheetName)?.length || 0})
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <DataTable
                data={currentSheetData}
                columns={currentColumns}
                title={`Planilha: ${selectedSheet}`}
                maxRows={10}
                formatValue={(value: unknown, column: string) => {
                    if (typeof value === "number") {
                        return monthColumns.includes(column)
                            ? value.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })
                            : value.toLocaleString("pt-BR");
                    }
                    return String(value);
                }}
            />

            <div className="dataSummary">
                <h4>Resumo dos Dados:</h4>
                <ul>
                    <li>
                        <strong>Total de planilhas:</strong> {rawData.size}
                    </li>
                    <li>
                        <strong>Total de registros (pivot):</strong>{" "}
                        {totalRecordsPivot}
                    </li>
                    <li>
                        <strong>Total de registros (unpivot):</strong>{" "}
                        {totalRecordsUnpivot}
                    </li>
                    <li>
                        <strong>Colunas de mês detectadas:</strong>{" "}
                        {monthColumns.length}
                    </li>
                </ul>
            </div>
        </div>
    );
}
