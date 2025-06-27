import type { ReactNode } from "react";
import styles from "../styles/DataTable.module.css";

interface DataTableProps<T = Record<string, unknown>> {
    data: T[];
    columns: string[];
    maxRows?: number;
    title?: string;
    formatValue?: (value: unknown, column: string) => string;
}

const defaultFormatValue = (value: unknown, column: string): string => {
    if (typeof value === "number") {
        if (column.includes("/")) {
            return value.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        }
        return value.toLocaleString("pt-BR");
    }
    return String(value);
};

export default function DataTable<T = Record<string, unknown>>({
    data,
    columns,
    maxRows = 5,
    title,
    formatValue = defaultFormatValue,
}: DataTableProps<T>): ReactNode {
    const displayData = data.slice(0, maxRows);
    const hasMoreData = data.length > maxRows;

    return (
        <div className={styles.dataTableContainer}>
            {title && (
                <h3 className={styles.tableTitle}>
                    {title} ({data.length} registros)
                </h3>
            )}

            <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col} className={styles.tableHeader}>
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.map((row, index) => (
                            <tr key={index} className={styles.tableRow}>
                                {columns.map((col) => (
                                    <td key={col} className={styles.tableCell}>
                                        {formatValue(
                                            (row as Record<string, unknown>)[
                                                col
                                            ],
                                            col,
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {hasMoreData && (
                <p className={styles.tableNote}>
                    Mostrando apenas os primeiros {maxRows} registros de{" "}
                    {data.length} total...
                </p>
            )}
        </div>
    );
}
