import { validateTransactions } from "@/utils/TransactionsValidator";
import { useSheetsClient } from "@/utils/hooks";

export async function POST(req: Request) {
    const transactions = validateTransactions(await req.json());
    const sheets_client = await useSheetsClient();
    try {
        console.log("transactions:", transactions);
        const new_transactions = await sheets_client.compareTransactions(transactions); // TODO this is unecessary for single transactions
        await sheets_client.appendTransactions(new_transactions);
        await sheets_client.sortSheet("Expenses", { sortColumnLabel: "date" });
        return Response.json("done");
    } catch (err) {
        console.log(err);
        return Response.json("server error", { status: 500 });
    }
}

export async function GET(req: Request) {
    const sheets_client = await useSheetsClient();
    try {
        const transactions = await sheets_client.getAllTransactions();
        return Response.json(transactions);
    } catch (err) {
        console.log(err);
        return Response.json("server error", { status: 500 });
    }
}
