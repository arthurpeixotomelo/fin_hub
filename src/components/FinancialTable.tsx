import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
    createColumnHelper,
    type ExpandedState,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getGroupedRowModel,
    getSortedRowModel,
    type GroupingState,
    type SortingState,
    useReactTable,
} from "@tanstack/react-table";
import type { FinancialData } from "../utils/types.ts";
import {
    calculatePeriodChange,
    calculateYoY,
    calculateYTD,
    getSortedMonths,
    type GroupingPeriod,
    groupMonthsByPeriod,
} from "../utils/dateGrouping.ts";
import { getDefaultDateConfig } from "../utils/validation.ts";
import styles from "../styles/FinancialTable.module.css";

interface FinancialTableProps {
    data: FinancialData[];
    monthColumns: string[];
    loading?: boolean;
}

interface EnhancedFinancialData extends FinancialData {
    _calculatedColumns?: Record<string, number | null>;
}

const columnHelper = createColumnHelper<EnhancedFinancialData>();

export default function FinancialTable({
    data,
    monthColumns,
    loading = false,
}: FinancialTableProps): ReactNode {
    // State for table features
    const [sorting, setSorting] = useState<SortingState>([]);
    const [grouping, setGrouping] = useState<GroupingState>([]);
    const [expanded, setExpanded] = useState<ExpandedState>({});
    const [groupingPeriod, setGroupingPeriod] = useState<GroupingPeriod>(
        "month",
    );
    const [showCalculations, setShowCalculations] = useState(false);

    const dateConfig = getDefaultDateConfig();

    const sortedMonths = useMemo(
        () => getSortedMonths(monthColumns, dateConfig),
        [monthColumns, dateConfig],
    );

    const _periodGroups = useMemo(
        () => groupMonthsByPeriod(sortedMonths, groupingPeriod, dateConfig),
        [sortedMonths, groupingPeriod, dateConfig],
    );

    const enhancedData = useMemo((): EnhancedFinancialData[] => {
        if (!showCalculations) return data;

        return data.map((row) => {
            const calculatedColumns: Record<string, number | null> = {};

            sortedMonths.forEach((month, index) => {
                const currentValue = row[month] as number | null | undefined;

                if (index > 0) {
                    const previousMonth = sortedMonths[index - 1];
                    const previousValue = row[previousMonth] as
                        | number
                        | null
                        | undefined;
                    calculatedColumns[`${month}_MoM`] = calculatePeriodChange(
                        currentValue,
                        previousValue,
                    );
                }

                calculatedColumns[`${month}_YTD`] = calculateYTD(
                    row,
                    sortedMonths,
                    month,
                    dateConfig,
                );

                calculatedColumns[`${month}_YoY`] = calculateYoY(
                    row,
                    sortedMonths,
                    month,
                    dateConfig,
                );
            });

            return {
                ...row,
                _calculatedColumns: calculatedColumns,
            };
        });
    }, [data, sortedMonths, showCalculations, dateConfig]);

    const columns = useMemo(() => {
        const allColumns = [];

        allColumns.push(
            columnHelper.accessor("cod", {
                id: "cod",
                header: "Código",
                cell: (info) => info.getValue(),
                size: 80,
                enableGrouping: false,
                meta: { type: "metadata" },
            }),
            columnHelper.accessor("seg", {
                id: "seg",
                header: "Segmento",
                cell: (info) => info.getValue(),
                size: 100,
                enableGrouping: true,
                meta: { type: "metadata" },
            }),
            columnHelper.accessor("file", {
                id: "file",
                header: "Arquivo",
                cell: (info) => info.getValue(),
                size: 120,
                enableGrouping: true,
                meta: { type: "metadata" },
            }),
            columnHelper.accessor("sheet", {
                id: "sheet",
                header: "Planilha",
                cell: (info) => info.getValue(),
                size: 120,
                enableGrouping: true,
                meta: { type: "metadata" },
            }),
        );

        sortedMonths.forEach((month) => {
            allColumns.push(
                columnHelper.accessor(month, {
                    id: month,
                    header: month,
                    cell: (info) => {
                        const value = info.getValue() as
                            | number
                            | null
                            | undefined;
                        return formatCurrencyCell(value);
                    },
                    size: 100,
                    meta: { type: "month" },
                }),
            );

            if (showCalculations) {
                const sortedIndex = sortedMonths.indexOf(month);

                if (sortedIndex > 0) {
                    allColumns.push(
                        columnHelper.display({
                            id: `${month}_MoM`,
                            header: `${month} MoM %`,
                            cell: (info) => {
                                const value = info.row.original
                                    ._calculatedColumns?.[`${month}_MoM`];
                                return formatPercentageCell(value);
                            },
                            size: 90,
                            meta: { type: "calculation" },
                        }),
                    );
                }

                allColumns.push(
                    columnHelper.display({
                        id: `${month}_YTD`,
                        header: `${month} YTD`,
                        cell: (info) => {
                            const value = info.row.original._calculatedColumns
                                ?.[`${month}_YTD`];
                            return formatCurrencyCell(value);
                        },
                        size: 100,
                        meta: { type: "calculation" },
                    }),
                    columnHelper.display({
                        id: `${month}_YoY`,
                        header: `${month} YoY %`,
                        cell: (info) => {
                            const value = info.row.original._calculatedColumns
                                ?.[`${month}_YoY`];
                            return formatPercentageCell(value);
                        },
                        size: 90,
                        meta: { type: "calculation" },
                    }),
                );
            }
        });

        return allColumns;
    }, [sortedMonths, showCalculations]);

    const table = useReactTable({
        data: enhancedData,
        columns,
        state: {
            sorting,
            grouping,
            expanded,
        },
        onSortingChange: setSorting,
        onGroupingChange: setGrouping,
        onExpandedChange: setExpanded,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getGroupedRowModel: getGroupedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        enableGrouping: true,
        enableSorting: true,
        enableExpanding: true,
        defaultColumn: {
            size: 100,
            minSize: 50,
            maxSize: 300,
        },
    });

    const handleGroupingPeriodChange = useCallback(
        (event: React.ChangeEvent<HTMLSelectElement>) => {
            const newPeriod = event.target.value as GroupingPeriod;
            setGroupingPeriod(newPeriod);
            setGrouping([]);
            setExpanded({});
        },
        [],
    );

    const handleCalculationsToggle = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setShowCalculations(event.target.checked);
        },
        [],
    );

    if (loading) {
        return (
            <div className={styles.financialTableContainer}>
                <div className={styles.loadingState}>
                    <p>Carregando dados da tabela...</p>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className={styles.financialTableContainer}>
                <div className={styles.emptyState}>
                    <div className={styles.icon}>📊</div>
                    <div className={styles.message}>Nenhum dado disponível</div>
                    <div className={styles.description}>
                        Faça upload de um arquivo Excel para visualizar os dados
                        financeiros.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.financialTableContainer}>
            {/* Table Controls */}
            <div className={styles.tableControls}>
                <div className={styles.groupingSelector}>
                    <label htmlFor="grouping-period">Agrupamento:</label>
                    <select
                        id="grouping-period"
                        value={groupingPeriod}
                        onChange={handleGroupingPeriodChange}
                    >
                        <option value="month">Mensal</option>
                        <option value="quarter">Trimestral</option>
                        <option value="semester">Semestral</option>
                        <option value="year">Anual</option>
                    </select>
                </div>

                <div className={styles.calculationsToggle}>
                    <input
                        type="checkbox"
                        id="show-calculations"
                        checked={showCalculations}
                        onChange={handleCalculationsToggle}
                    />
                    <label htmlFor="show-calculations">
                        Exibir cálculos (MoM, YTD, YoY)
                    </label>
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableWrapper}>
                <table className={styles.financialTable}>
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const meta = header.column.columnDef.meta as
                                        | { type?: string }
                                        | undefined;
                                    const columnType = meta?.type || "default";

                                    return (
                                        <th
                                            key={header.id}
                                            className={`${styles.tableHeader} ${
                                                columnType === "group"
                                                    ? styles.tableHeaderGroup
                                                    : columnType === "metadata"
                                                    ? styles.metadataColumn
                                                    : columnType === "month"
                                                    ? styles.monthColumn
                                                    : columnType ===
                                                            "calculation"
                                                    ? styles.calculationColumn
                                                    : ""
                                            } ${
                                                header.column.getCanSort()
                                                    ? styles.sortable
                                                    : ""
                                            } ${
                                                header.column.getIsSorted()
                                                    ? `${styles.sorted} ${
                                                        header.column
                                                                .getIsSorted() ===
                                                                "desc"
                                                            ? styles.desc
                                                            : styles.asc
                                                    }`
                                                    : ""
                                            }`}
                                            style={{
                                                width: `${header.getSize()}px`,
                                            }}
                                            onClick={header.column
                                                .getToggleSortingHandler()}
                                            colSpan={header.colSpan}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext(),
                                                )}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                className={`${styles.tableRow} ${
                                    row.getIsGrouped() ? styles.groupRow : ""
                                }`}
                            >
                                {row.getVisibleCells().map((cell) => {
                                    const meta = cell.column.columnDef.meta as {
                                        type?: string;
                                    } | undefined;
                                    const columnType = meta?.type || "default";

                                    return (
                                        <td
                                            key={cell.id}
                                            className={`${styles.tableCell} ${
                                                columnType === "metadata"
                                                    ? styles.metadataColumn
                                                    : columnType === "month"
                                                    ? styles.currencyCell
                                                    : columnType ===
                                                            "calculation"
                                                    ? styles.calculationColumn
                                                    : ""
                                            }`}
                                            style={{
                                                width:
                                                    `${cell.column.getSize()}px`,
                                            }}
                                        >
                                            {cell.getIsGrouped()
                                                ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className={`${styles.groupToggle} ${
                                                                row.getIsExpanded()
                                                                    ? styles
                                                                        .expanded
                                                                    : ""
                                                            }`}
                                                            onClick={row
                                                                .getToggleExpandedHandler()}
                                                        />
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext(),
                                                        )}{" "}
                                                        ({row.subRows.length})
                                                    </>
                                                )
                                                : cell.getIsAggregated()
                                                ? (
                                                    flexRender(
                                                        cell.column.columnDef
                                                            .aggregatedCell ??
                                                            cell.column
                                                                .columnDef.cell,
                                                        cell.getContext(),
                                                    )
                                                )
                                                : cell.getIsPlaceholder()
                                                ? null
                                                : (
                                                    flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext(),
                                                    )
                                                )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Table Summary */}
            <div className={styles.tableSummary}>
                <div className={styles.summaryInfo}>
                    <div className={styles.summaryItem}>
                        <span className={styles.label}>Registros:</span>
                        <span className={styles.value}>
                            {table.getFilteredRowModel().rows.length}
                        </span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.label}>Colunas de Mês:</span>
                        <span className={styles.value}>
                            {sortedMonths.length}
                        </span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.label}>Agrupamento:</span>
                        <span className={styles.value}>
                            {groupingPeriod === "month"
                                ? "Mensal"
                                : groupingPeriod === "quarter"
                                ? "Trimestral"
                                : groupingPeriod === "semester"
                                ? "Semestral"
                                : "Anual"}
                        </span>
                    </div>
                    {showCalculations && (
                        <div className={styles.summaryItem}>
                            <span className={styles.label}>Cálculos:</span>
                            <span className={styles.value}>Habilitados</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Format number as Brazilian currency
 */
function formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

/**
 * Format currency cell with proper styling
 */
function formatCurrencyCell(value: number | null | undefined): ReactNode {
    if (value === undefined || value === null) {
        return <span className={styles.emptyCell}>-</span>;
    }

    const formatted = formatCurrency(value);
    const className = value >= 0 ? styles.positive : styles.negative;

    return <span className={className}>{formatted}</span>;
}

function formatPercentageCell(value: number | null | undefined): ReactNode {
    if (value === undefined || value === null) {
        return <span className={styles.emptyCell}>-</span>;
    }

    const formatted = new Intl.NumberFormat("pt-BR", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value / 100);

    const className = `${styles.percentageCell} ${
        value >= 0 ? styles.positive : styles.negative
    }`;

    return <span className={className}>{formatted}</span>;
}
