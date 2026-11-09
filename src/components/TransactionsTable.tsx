"use client";
import { ColumnDef } from "@tanstack/react-table";
import { ExpenseTransaction } from "@/utils/TransactionsValidator";
import { DataTable } from "./DataTable";
import { DataTableColumnHeader } from "./DataTableColumnHeader";
import { formatRelativeDate } from "@/utils/dateUtils";
import { formatAsCurrency } from "@/utils/currencyUtils";
import { MoreHorizontal } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FilterBar } from "./FilterBar";

const hoverDateFormat: { [id: string]: string } = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
};

const fixDate = (date: Date) => {
    // display date relative to UTC
    const hoursOff = date.getTimezoneOffset() / 60;
    const newDate = new Date(date.setHours(date.getHours() + hoursOff));
    return newDate;
};

const columns: ColumnDef<ExpenseTransaction>[] = [
    {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Date' />,
        accessorKey: "date",
        size: "auto" as unknown as number, // fix as per issue https://github.com/TanStack/table/discussions/4179
        cell: (props) => (
            // temporary basic tooltip
            <div>
                <span title={(props.getValue() as Date).toLocaleDateString(undefined, hoverDateFormat)}>{formatRelativeDate(fixDate(props.getValue() as Date))}</span>
            </div>
        ),
        meta: {
            filterVariant: "date-range",
        },
        filterFn: "inNumberRange"
    },
    { header: "Merchant", accessorKey: "merchant_company" },
    {
        header: "Amount",
        accessorKey: "amount",
        cell: (props) => (
            <div className='flex flex-1 justify-end'>
                <span>{formatAsCurrency(props.getValue() as number)}</span>
            </div>
        ), // TODO: create a currency display function to add comman seperators, etc.
        footer: ({ table }) => table.getFilteredRowModel().rows.reduce((total, row) => total + row.getValue('amount'), 0),
    },
    { header: "Description", accessorKey: "description" }, // TODO maxSize: 100 and add ellipsis
    {
        header: "Category",
        accessorKey: "category",
        meta: {
            filterVariant: "select",
        },
        filterFn: "arrIncludesSome", // use built-in filter function
    },
    {
        header: "Subcategory",
        accessorKey: "subcategory",
        filterFn: "arrIncludesSome", // use built-in filter function
    },
    { header: "Payment Account", 
        accessorKey: "payment_account",
        meta: {
            filterVariant: "select",
        },
        filterFn: "arrIncludesSome", // use built-in filter function
    },
    {
        header: "Transaction Method",
        accessorKey: "transaction_method",
        meta: {
            filterVariant: "select",
        },
        filterFn: "arrIncludesSome", // use built-in filter function
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant='ghost' className='h-8 w-8 p-0'>
                            <span className='sr-only'>Open menu</span>
                            <MoreHorizontal className='h-4 w-4' />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => console.log("testing click")}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log("testing click")}>Log Reimbursement</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Search Similar</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem style={{ color: "red" }}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

const TransactionsTable = ({ transactions, showFilters = false }: { transactions: ExpenseTransaction[]; showFilters?: boolean }) => {
    return <DataTable columns={columns} data={transactions} showFilters={showFilters} />;
    // TODO: https://tanstack.com/table/v8/docs/framework/react/examples/virtualized-rows
};

export default TransactionsTable;
