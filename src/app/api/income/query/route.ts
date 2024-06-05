import { useSheetsClient } from "@/utils/hooks";

export async function POST(req: Request) {
    const body = await req.json();
    const { limit, where, orderBy } = body;

    const sheets_client = await useSheetsClient();
    try {
        const transactions = await sheets_client.getTransactions({ sheet: "Income", limit: limit, where: where });
        return Response.json(transactions);
    } catch (err) {
        console.log(err);
        return Response.json("server error", { status: 500 });
    }
}
