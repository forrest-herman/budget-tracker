"use client"

import { useEffect, useState } from "react";

import { ColumnDef, ColumnFiltersState, flexRender, getCoreRowModel, getFacetedRowModel, getFacetedUniqueValues, getFilteredRowModel, useReactTable } from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { FilterBar } from "./FilterBar";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    showFilters: boolean;
}

export function DataTable<TData, TValue>({ columns, data, showFilters = false }: DataTableProps<TData, TValue>) {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(), // TODO: https://tanstack.com/table/v8/docs/guide/column-faceting
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            columnFilters,
        },
    });

    useEffect(() => {
        console.log("table.getState().columnFilters", table.getState().columnFilters);
    }, [table]);

    // TODO: add table formatting options for date like relative date

    return (
        <div>
            {showFilters && <FilterBar columns={table.getAllColumns()} />}
            <p>{JSON.stringify({ columnFilters: table.getState().columnFilters }, null, 2)}</p>
            <ScrollArea className='flex-1 h-96 rounded-md border overflow-x-auto'>
                <TableView table={table} columns={columns} />
                <ScrollBar orientation='horizontal' />
            </ScrollArea>
        </div>
    );
}

const TableView = ({ table, columns }) => {
    return (
        <Table>
            <TableHeader className="sticky">
                {/* display column titles */}
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                            return <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>;
                        })}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} style={{ whiteSpace: "nowrap" }}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={columns.length} className='h-24 text-center'>
                            No results.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            <TableFooter>
                {table.getFooterGroups().map((footerGroup) => {
                    return (<TableRow key={footerGroup.id}>
                        {footerGroup.headers.map((header) => {
                            return <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}</TableHead>;
                        })}
                    </TableRow>)
                })}
                {/* <TableRow>
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className='text-right'>$2,500.00</TableCell>
                </TableRow> */}
            </TableFooter>
        </Table>
    );
};