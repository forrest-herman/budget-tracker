import { useSheetsClient } from "@/utils/hooks";

export async function GET(req: Request) {
    const sheets_client = await useSheetsClient(); // TODO: don't make new client
    try {
        const expenseCategories = await sheets_client.getCategories("expense");
        const incomeCategories = await sheets_client.getCategories("income");
        return Response.json({ expense: expenseCategories, income: incomeCategories });
    } catch (err) {
        console.log(err);
        return Response.json("server error", { status: 500 });
    }
}
