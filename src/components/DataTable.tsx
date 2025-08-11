import { useMemo } from "react";
import type { ReactNode } from "react";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { useUploadContext } from "../context/UploadContext";

export default function SimpleDataTable(): ReactNode {
    const { dataRef } = useUploadContext();
    // dataRef.current is an object: { sheetName: array, ... }
    const raw = dataRef.current;
    let data: object[] = [];
    if (raw && typeof raw === "object") {
        data = Object.entries(raw).flatMap(([sheet, arr]) =>
            Array.isArray(arr) ? arr.map((row) => ({ ...row, sheet })) : []
        );
    }

    const columnHelper = useMemo(() => createColumnHelper<object>(), []);
    const columns = useMemo(() => {
        if (!data.length) return [];
        return Object.keys(data[0]).map((key) =>
            columnHelper.accessor(key as keyof object, {
                id: key,
                header: key,
                cell: (info) => String(info.getValue() ?? ""),
            })
        );
    }, [data, columnHelper]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    // if (!data.length) {
    //     return <div>Nenhum dado disponível</div>;
    // }

    return (
        <div style={{ overflowX: "auto" }}>
            <table>
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th key={header.id}>
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext(),
                                    )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id}>
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext(),
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
