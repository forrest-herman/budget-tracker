import { useSheetsClient } from "@/utils/hooks";

export async function GET(req: Request) {
    const sheets_client = await useSheetsClient(); // TODO: don't make new client
    try {
        const categories = await sheets_client.getPaymentMethods();
        return Response.json(categories);
    } catch (err) {
        console.log(err);
        return Response.json("server error", { status: 500 });
    }
}
