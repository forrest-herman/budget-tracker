import { validateIncomeTransactions, validateTransactions } from "@/utils/TransactionsValidator";
import { useSheetsClient } from "@/utils/hooks";

export async function POST(req: Request) {
    const body = await req.json();
    const transactions = validateIncomeTransactions(body);
    const sheets_client = await useSheetsClient();
    try {
        // const new_transactions = await sheets_client.compareTransactions(transactions);
        await sheets_client.appendTransactions(transactions, false); // TODO: fix ordering by overwriting
        return Response.json("done");
    } catch (err) {
        console.log(err);
        return Response.json("server error", { status: 500 });
    }
}
