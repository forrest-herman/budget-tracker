import TransactionsTable from "@/components/TransactionsTable";
import { Progress } from "@/components/ui/progress";
import { useSheetsClient } from "@/utils/hooks";
import { ExpenseTransaction } from "@/utils/TransactionsValidator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DashboardPage = async () => {
    const sheets = await useSheetsClient();

    const today = new Date();
    const start_date = new Date(today.getFullYear(), today.getMonth(), 1);
    const end_date = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const MAX_SPENDINGS = 500;

    //run this first to check if there is any data in the spreadsheet (no data will cause problems for other queries)
    let recent_transactions: ExpenseTransaction[] = [];
    let total_spending = 0;
    let spending_by_category = {};
    let error = true;
    try {
        recent_transactions = await sheets.getTransactions({ limit: 5 }); // TODO: fix this, it doesn't sort properly
        if (recent_transactions.length > 0) {
            // these queries only work if the user has already added some data to the spreadsheet
            spending_by_category = await sheets.getCategorySpending({ startDate: start_date, endDate: end_date });
            total_spending = Math.abs(await sheets.getTotalSpending({ startDate: start_date, endDate: end_date }));
        }
        error = false;
    } catch (err) {
        console.error(err);

        //reset variables
        recent_transactions = [];
        total_spending = 0;
        spending_by_category = {};
    }

    return (
        <div className='w-full h-full px-5'>
            {error && (
                <Alert variant='destructive'>
                    <AlertDescription>Error loading transactions. Did you edit the spreadsheet?</AlertDescription>
                </Alert>
            )}
            <section className='my-5 space-y-1'>
                {/* TODO: add google account first name welcome and maybe profile icon? */}
                <h1 className='text-3xl'>Hi {sheets.user.name}</h1>
                <h1 className='text-lg py-1'>This month, you&apos;ve spent</h1>
                <h1 className='text-6xl'>${total_spending.toFixed(2)}</h1>
                <div>
                    <Progress value={(total_spending / MAX_SPENDINGS) * 100} className='h-3 w-full' />
                    <div className='w-full flex flex-row justify-between'>
                        <p>$0</p>
                        <p>${MAX_SPENDINGS.toFixed(2)}</p>
                    </div>
                </div>
            </section>
            <section className='my-5 space-y-1'>
                {/* pie chart circles to show each category*/}
                <h1 className='text-xl'>Spending by Category</h1>
            </section>
            <section className='my-5'>
                <h1 className='text-xl'>Recently Added Transactions</h1>
                <div>
                    {/* TODO: show less columns on mobile */}
                    <TransactionsTable transactions={recent_transactions} />
                </div>
            </section>
        </div>
    );
};

export default DashboardPage