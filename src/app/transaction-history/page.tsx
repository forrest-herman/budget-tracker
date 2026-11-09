import TransactionsTable from "@/components/TransactionsTable";
import { useSheetsClient } from "@/utils/hooks";
import { ExpenseTransaction } from "@/utils/TransactionsValidator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { FilterBar } from "@/components/FilterBar";

const HistoryPage = async () => {
    const sheets = await useSheetsClient();

    let all_transactions: ExpenseTransaction[] = [];
    let error = true;
    try {
        all_transactions = await sheets.getTransactions({ sheet: "Expenses" });
        error = false;
    } catch (err) {
        console.error(err);
        //reset variables
        all_transactions = [];
    }

    return (
        <div className='w-full h-full max-h-lvh p-5'>
            {error && (
                <Alert variant='destructive'>
                    <AlertDescription>Error loading transactions. Did you edit the spreadsheet?</AlertDescription>
                </Alert>
            )}
            <section className='flex flex-col h-full'>
                <h1 className='text-3xl'>Transactions History</h1>
                {/* <FilterBar /> */}
                <TransactionsTable transactions={all_transactions} showFilters />
            </section>
        </div>
    );
};

export default HistoryPage;
