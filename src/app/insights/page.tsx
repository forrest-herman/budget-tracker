import { MyResponsiveSankey } from '@/components/charts/CashFlowSankeyChart';
import { CategorySpendingByTimeBarChart } from '@/components/charts/CategorySpendingByTimeBarChart';
import { SpendingByMonthChart } from '@/components/charts/SpendingByMonthChart';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExpenseTransaction } from '@/utils/TransactionsValidator';
import { formatAsCurrency } from '@/utils/currencyUtils';
import { useSheetsClient } from '@/utils/hooks';

const InsightsPage = async () => {
  const sheets = await useSheetsClient();

  const today = new Date();
  const start_date = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  const end_date = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const MAX_SPENDINGS = 1000;

  //run this first to check if there is any data in the spreadsheet (no data will cause problems for other queries)
  let recent_transactions: ExpenseTransaction[] = [];
  let spending_by_period,
    earnings_by_period,
    food_spending_by_period,
    category_spending_by_period = [];
  let spending_by_category = {};
  let error = true;
  try {
    recent_transactions = await sheets.getTransactions({ sheet: 'Expenses', limit: 15 }); // TODO: fix this, it doesn't sort properly?? seems fine now
    if (recent_transactions.length > 0) {
      // these queries only work if the user has already added some data to the spreadsheet
      spending_by_category = await sheets.getCategorySpending({
        startDate: start_date,
        endDate: end_date,
      });
      spending_by_period = await sheets.getTotalsByPeriod({ sheet: 'Expenses' });

      // food_spending_by_period = await sheets.getTotalsByPeriod({ sheet: 'Expenses', where: { category: `= "Food"` } });
      category_spending_by_period = await sheets.getTotalsByPeriod({
        sheet: 'Expenses',
        pivotBy: 'category',
        startDate: start_date,
        endDate: end_date,
      });

      earnings_by_period = await sheets.getTotalsByPeriod({ sheet: 'Income' });
    }
    error = false;
  } catch (err) {
    console.error(err);

    //reset variables
    recent_transactions = [];
    spending_by_period = [];
    earnings_by_period = [];
    spending_by_category = {};
  }

  return (
    <div className="w-full h-full px-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Error loading transactions. Did you edit the spreadsheet?
          </AlertDescription>
        </Alert>
      )}

      <Select
      // onValueChange={(value) => {
      //   // setTimePeriod();
      // }}
      // value={value}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="3 Months" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="3">3 Months</SelectItem>
          <SelectItem value="6">6 Months</SelectItem>
          <SelectItem value="12">12 Months</SelectItem>
        </SelectContent>
      </Select>

      <section className="my-5 space-y-1">
        {/* pie chart circles to show each category*/}
        <h1 className="text-xl">Spending by Category</h1>
        {Object.keys(spending_by_category).map((c) => {
          return <p key={c}>{`${c} = ${spending_by_category[c]}`}</p>;
        })}
      </section>
      <section className="my-5 space-y-1">
        <h1 className="text-xl">Spending by Month</h1>
        <SpendingByMonthChart data={spending_by_period} />
      </section>
      <section className="my-5 space-y-1">
        <h1 className="text-xl">Category Spending by Month</h1>
        <CategorySpendingByTimeBarChart data={category_spending_by_period} />
        <h2 className="text-xl">Category Averages</h2>
        {/* TODO: pie chart? bar chart? */}
        {/* TODO: never include current month? */}
      </section>
      <section className="my-5 space-y-1">
        <h1 className="text-xl">Income by Month</h1>
        <SpendingByMonthChart data={earnings_by_period} />
      </section>
      <section className="my-5 space-y-1">
        <h1 className="text-xl">Spendings Cash Flow</h1>
        <MyResponsiveSankey />
      </section>
    </div>
  );
};

const getMonthlyTotals = () => {};

export default InsightsPage;
