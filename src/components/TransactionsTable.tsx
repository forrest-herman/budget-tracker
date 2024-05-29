"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Transaction } from "@/utils/TransactionsValidator";
import { DataTable } from "./DataTable";
import { Checkbox } from "./ui/checkbox";
import { formatRelativeDate } from "@/utils/dateUtils";

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

const columns: ColumnDef<Transaction>[] = [
    {
        header: "Date",
        accessorKey: "date",
        size: "auto" as unknown as number, // fix as per issue https://github.com/TanStack/table/discussions/4179
        cell: (props) => (
            // temporary basic tooltip
            <div>
                <span title={(props.getValue() as Date).toLocaleDateString(undefined, hoverDateFormat)}>{formatRelativeDate(fixDate(props.getValue() as Date))}</span>
            </div>
        ),
    },
    { header: "Merchant", accessorKey: "merchant_company" },
    {
        header: "Amount",
        accessorKey: "amount",
        cell: (props) => (
            <div>
                <span>{"$" + (props.getValue() as Number).toFixed(2)}</span>
            </div>
        ), // TODO: create a currency display function to add comman seperators, etc.
    },
    { header: "Description", accessorKey: "description" }, // TODO maxSize: 100 and add ellipsis
    { header: "Category", accessorKey: "category" },
    { header: "Payment Account", accessorKey: "payment_account" },
    { header: "Transaction Method", accessorKey: "transaction_method" },
];

const TransactionsTable = ({ transactions }: { transactions: Transaction[] }) => {
    return <DataTable columns={columns} data={transactions} />;
};

export default TransactionsTable;
