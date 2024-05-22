import { OAuth2Client } from "google-auth-library";
import { google, sheets_v4 } from "googleapis";
import { extractDataFromQueryResponse, initGoogleAuth, initSheetsClient } from "./googleUtils";
import { Transaction } from "./TransactionsValidator";
import { format } from "date-fns";

export default class SheetsClient {
    private auth: OAuth2Client;
    private sheets: sheets_v4.Sheets;
    private spreadsheet_id: string;

    user: { [key: string]: string | undefined };

    constructor(access_token: string, spreadsheet_id: string, user: { [key: string]: string | undefined }) {
        this.auth = initGoogleAuth(access_token);
        this.sheets = initSheetsClient(this.auth);
        this.spreadsheet_id = spreadsheet_id;
        this.user = user;
    }

    //add data filtering get methods
    //what other operations should it support?

    async getAllTransactions() {
        console.log("get all transactions");

        // TODO: get all expenses and income

        const res = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheet_id,
            range: "Transactions!A2:Z", // TODO: Sheet name
        });
        //make them into objects
        if (!res.data.values) return [];
        return res.data.values.map((row: any) => {
            return {
                date: row[0],
                bank_description: row[1],
                description: row[2],
                amount: row[3],
                category: row[4],
                account: row[5],
            };
        });
    }

    /* 
    compares given transactions with the ones already in the sheet to ensure they are inserted in order
    */
    async compareTransactions(transactions: Transaction[]): Promise<Transaction[]> {
        // TODO: double check this function
        console.log("comparing:", transactions);
        // sort the transactions by date
        transactions.sort((a: any, b: any) => {
            if (a["date"] > b["date"]) return -1;
            if (a["date"] < b["date"]) return 1;
            return b.amount - a.amount;
        });

        const end_date = new Date(transactions[0]["date"]);
        const start_date = new Date(transactions[transactions.length - 1]["date"]);
        const sheet_transactions = await this.getTransactions({ start_date, end_date });

        //sort using the same algorithm
        sheet_transactions.sort((a: any, b: any) => {
            if (a["date"] > b["date"]) return -1;
            if (a["date"] < b["date"]) return 1;
            return b.amount - a.amount;
        });

        //compare the two
        let iter_a = 0,
            iter_b = 0;
        const new_transactions: any[] = [];
        while (iter_a < transactions.length && iter_b < sheet_transactions.length) {
            if (transactions[iter_a]["date"] === sheet_transactions[iter_b]["date"]) {
                if (Math.abs(transactions[iter_a]["amount"] - sheet_transactions[iter_b]["amount"]) < 0.001) {
                    iter_a++;
                    iter_b++;
                } else if (transactions[iter_a]["amount"] > sheet_transactions[iter_b]["amount"]) {
                    new_transactions.push(transactions[iter_a]);
                    iter_a++;
                } else {
                    iter_b++;
                }
            } else if (transactions[iter_a]["date"] > sheet_transactions[iter_b]["date"]) {
                new_transactions.push(transactions[iter_a]);
                iter_a++;
            } else {
                iter_b++;
            }
        }

        while (iter_a < transactions.length) {
            new_transactions.push(transactions[iter_a]);
            iter_a++;
        }

        return new_transactions;
    }

    async appendTransactions(transactions: any[]) {
        const res = await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheet_id,
            range: "A1:Z",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: transactions.map((transaction) => [
                    // TODO: modify columns to match the sheet
                    transaction.date.toLocaleDateString() || "", // Used to show Month
                    transaction.date.toLocaleDateString() || "", // Used to show full date
                    transaction.merchant_company || "",
                    transaction.amount || "",
                    transaction.description || "",
                    transaction.category || "",
                    transaction.subcategory || "",
                    transaction.payment_account || "",
                    transaction.transaction_method || "",
                    transaction.reimbursed || false,
                ]),
            },
        });
    }

    // TODO: edit/remove transaction

    async getTransactions(options?: { start_date?: Date; end_date?: Date; limit?: number }): Promise<Transaction[]> {
        console.log("fetching Transactions");

        let query = "select *";

        query += " WHERE B IS NOT NULL";

        if (options?.start_date && options?.end_date) {
            // Both dates are provided
            query += ` AND date '${options.start_date.toISOString().substring(0, 10)}' <= B and B <= date '${options.end_date.toISOString().substring(0, 10)}'`;
        } else if (options?.start_date) {
            // Only start date is provided
            query += ` AND date '${options.start_date.toISOString().substring(0, 10)}' <= B`;
        } else if (options?.end_date) {
            // Only end date is provided
            query += ` AND B <= date '${options.end_date.toISOString().substring(0, 10)}'`;
        }

        query += " ORDER BY B desc";

        if (options?.limit) {
            query += ` limit ${options.limit}`;
        }

        const res = await this.query(query);

        //convert dates to date objects
        const transactions = res.map((entry: any) => {
            // TODO parse the date into a proper date object?
            //Date usually has the form "Date(year,month,date)" (if the user didn't change anything)
            let [year, monthIndex, day] = entry["DATE"].substring(5, entry["DATE"].length - 1).split(",");
            monthIndex = parseInt(monthIndex);
            const month = monthIndex + 1;
            let date = new Date(year, monthIndex, day);
            let dateLocal = date.toLocaleDateString();

            return {
                date: date, // `${year}-${month < 10 ? "0" + month : month}-${day < 10 ? "0" + day : day}`,
                merchant_company: entry["MERCHANT/COMPANY"],
                amount: entry["AMOUNT"] || 0,
                description: entry["DESCRIPTION"],
                category: entry["CATEGORY"],
                payment_account: entry["PAYMENT ACCOUNT"],
                transaction_method: entry["TRANSACTION METHOD"],
                reimbursed: entry["REIMBURSED"],
            };
        });
        return transactions.map((transaction) => ({
            ...transaction,
            date: new Date(transaction.date), // TODO: ensure proper timezone
        }));
    }

    // Categories

    async getCategories() {
        console.log("get categories");

        const res = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheet_id,
            range: "CONFIG: Categories!A:Z",
        });

        if (!res.data.values) return [];

        var categories: Record<string, string[]> = {};
        res.data.values.forEach((row: any, index: number, array: any[][]) => {
            if (index === 0) return; // don't include headers

            let headers = array[0];
            headers.forEach((value: string, i: number) => {
                if (!categories.hasOwnProperty(value)) {
                    categories[value] = [];
                }
                if (row[i]) categories[value].push(row[i]);
            });
        });

        return categories;
    }

    async getTotalSpending(options?: { startDate?: Date; endDate?: Date }): Promise<number> {
        let query = "select sum(D)";

        if (options?.startDate && options?.endDate) {
            // Both dates are provided
            query += ` where date '${options.startDate.toISOString().substring(0, 10)}' <= B and B <= date '${options.endDate.toISOString().substring(0, 10)}'`;
        } else if (options?.startDate) {
            // Only start date is provided
            query += ` where date '${options.startDate.toISOString().substring(0, 10)}' <= B`;
        } else if (options?.endDate) {
            // Only end date is provided
            query += ` where B <= date '${options.endDate.toISOString().substring(0, 10)}'`;
        }

        const res = await this.query(query);
        if (res.length > 0) {
            return res[0]["sum AMOUNT"];
        } else {
            return 0;
        }
    }

    async getCategorySpending(options?: { startDate?: Date; endDate?: Date }): Promise<{ [category: string]: number }> {
        let query = "select F, sum(D)";
        if (options?.startDate && options?.endDate) {
            // Both dates are provided
            query += ` where date '${options.startDate.toISOString().substring(0, 10)}' <= B and B <= date '${options.endDate.toISOString().substring(0, 10)}'`;
        } else if (options?.startDate) {
            // Only start date is provided
            query += ` where date '${options.startDate.toISOString().substring(0, 10)}' <= B`;
        } else if (options?.endDate) {
            // Only end date is provided
            query += ` where B <= date '${options.endDate.toISOString().substring(0, 10)}'`;
        }
        query += "group by F";

        const res = await this.query(query);
        const spendingByCategory: { [category: string]: number } = {};
        res.forEach((entry: any) => {
            const category = entry["CATEGORY"] || "Uncategorized";
            const spending = entry["sum AMOUNT"];
            spendingByCategory[category] = spending;
        });
        if ("hidden" in spendingByCategory) {
            delete spendingByCategory["hidden"];
        }
        return spendingByCategory;
    }

    // Payment Methods

    async getPaymentMethods() {
        console.log("get payment methods");

        const res = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheet_id,
            range: "CONFIG: Payment Methods!A:Z",
        });

        if (!res.data.values) return [];

        var paymentMethods: Record<string, string[]> = {};
        res.data.values.forEach((row: any, i: number, array: any[][]) => {
            if (i === 0) return; // don't include headers

            let headers = array[0];
            headers.forEach((value: string, i: number) => {
                if (!paymentMethods.hasOwnProperty(value)) {
                    paymentMethods[value] = [];
                }
                if (row[i]) paymentMethods[value].push(row[i]);
            });
        });

        return paymentMethods;
    }

    // general query

    async query(query: string): Promise<any[]> {
        const url =
            "https://docs.google.com/spreadsheets" +
            `/d/${this.spreadsheet_id}/gviz/tq` +
            `?tq=${encodeURIComponent(query)}` +
            `&access_token=${encodeURIComponent((await this.auth.getAccessToken()).token as string)}`;

        const resp = await fetch(url);

        if (!resp.ok) {
            console.error("Query fetch not OK");
            throw "Query fetch not OK";
        }

        let jsonData = extractDataFromQueryResponse(await resp.text()); //could throw an error

        if (jsonData.status === "error") {
            console.log(`Query received error response: ${JSON.stringify(jsonData.errors)}`);
            throw `Query received error response`;
        }

        const tableData = jsonData.table;
        const columns = tableData.cols.map((col: any) => col.label);

        // console.log(tableData);

        //if the column labels are empty, then there is only a single row of column titles in the sheet
        if (columns.every((label: string) => label === "")) {
            console.log("Data incorectly formatted");
            return []; //sheets had no transactions
        }

        const rows = tableData.rows.map((row: any) => {
            const ret: any = {};
            row.c.forEach((cell: any, i: number) => {
                ret[columns[i]] = cell?.v || null;
            });
            return ret;
        });

        return rows;
    }
}