import { OAuth2Client } from "google-auth-library";
import { google, sheets_v4 } from "googleapis";
import { extractDataFromQueryResponse, initGoogleAuth, initSheetsClient } from "./googleUtils";
import { ExpenseTransaction, IncomeTransaction, MasterTransaction } from "./TransactionsValidator";
import { dateFromSheetsCell } from "./dateUtils";

// TODO: use named ranges for sheets https://developers.google.com/sheets/api/guides/concepts#cell
const expenseSheet = "Expenses";
const incomeSheet = "Income";

export default class SheetsClient {
    private auth: OAuth2Client;
    private sheets: sheets_v4.Sheets;
    private spreadsheet_id: string;

    // for now keep this up to date manually
    columnIds: { [key: string]: string } = {
        // shared
        date: "B",
        merchant_company: "C",
        location: "D",
        amount: "E",
        description: "F",
        category: "G",
        subcategory: "H",
        payment_account: "I",
        transaction_method: "J",
        // expense specific
        reimbursed_amount: "K",
        unit_count: "L",
        unit_type: "M",
        unit_price: "N",
        // income specific
        pay_period_start: "K",
        pay_period_end: "L",
    };

    user: { [key: string]: string | undefined };

    constructor(access_token: string, spreadsheet_id: string, user: { [key: string]: string | undefined }) {
        this.auth = initGoogleAuth(access_token);
        this.sheets = initSheetsClient(this.auth);
        this.spreadsheet_id = spreadsheet_id;
        this.user = user;
        // TODO: pull columnIds automatically in order for each sheet by column name
    }

    // deprecated
    async getAllTransactions() {
        console.log("get all transactions");

        // TODO: get all expenses and income
        const expensesResult = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheet_id,
            range: expenseSheet,
        });

        const incomeResult = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheet_id,
            range: incomeSheet,
        });

        const expenses = expensesResult.data.values;
        const incomeItems = incomeResult.data.values;

        // TODO: split off column headers and make them into objects
        console.log(expenses);
        console.log(incomeItems);

        // make them into objects
        // if (!res.data.values) return [];
        // return res.data.values.map((row: any) => {
        //     return {
        //         // TODO: named ranges
        //         date: row[1],
        //         bank_description: row[1],
        //         description: row[2],
        //         amount: row[3],
        //         category: row[4],
        //         account: row[5],
        //     };
        // });
    }

    /* 
    compares given transactions with the ones already in the sheet to ensure they are inserted in order
    */
    async compareTransactions(transactions: ExpenseTransaction[] | IncomeTransaction[], type: "expense" | "income" = "expense"): Promise<ExpenseTransaction[] | IncomeTransaction[]> {
        // TODO: double check this function
        // TODO: add income ability too
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

    async appendTransactions(transactions: any[], isExpense: boolean = true) {
        const res = await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheet_id,
            range: isExpense ? expenseSheet : incomeSheet,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: transactions.map((transaction) => [
                    // order columns to match the sheet layout
                    transaction.date.toLocaleDateString() || "", // Used to show Month
                    transaction.date.toLocaleDateString() || "", // Used to show full date
                    transaction.merchant_company || "",
                    transaction.location || "",
                    transaction.amount || "",
                    transaction.description || "",
                    transaction.category || "",
                    transaction.subcategory || "",
                    transaction.payment_account || "",
                    transaction.transaction_method || "",
                    isExpense ? transaction.reimbursed_amount : transaction.pay_period_start.toLocaleDateString(),
                    isExpense ? transaction.unit_count : transaction.pay_period_end.toLocaleDateString(),
                    isExpense ? transaction.unit_type : "",
                    isExpense ? transaction.unit_price : "",
                ]),
            },
        });
        if (res.status !== 200) {
            console.error("Error appending transactions");
            throw "Error appending transactions";
        } else {
            console.log("Transactions appended");
        }
    }

    // TODO: edit/remove transaction

    // TODO: add data filtering get methods
    async getTransactions(options?: { sheet?: string; start_date?: Date; end_date?: Date; limit?: number; where?: { [key: string]: string } }): Promise<MasterTransaction[]> {
        console.log("fetching Transactions");

        let query = "select *";

        query += ` WHERE ${this.columnIds.date} IS NOT NULL`;

        if (options?.start_date && options?.end_date) {
            // Both dates are provided
            query += ` AND date '${options.start_date.toISOString().substring(0, 10)}' <= ${this.columnIds.date} and ${this.columnIds.date} <= date '${options.end_date
                .toISOString()
                .substring(0, 10)}'`;
        } else if (options?.start_date) {
            // Only start date is provided
            query += ` AND date '${options.start_date.toISOString().substring(0, 10)}' <= ${this.columnIds.date}`;
        } else if (options?.end_date) {
            // Only end date is provided
            query += ` AND ${this.columnIds.date} <= date '${options.end_date.toISOString().substring(0, 10)}'`;
        } else if (options?.where) {
            query += ` AND ${buildSqlWhere(options.where, this.columnIds)}`;
        }

        // TODO: could add options optional param for `order by` if needed
        query += ` ORDER BY ${this.columnIds.date} desc`;

        if (options?.limit) {
            query += ` limit ${options.limit}`;
        }

        console.log("query", query);

        const res = await this.query(query, options?.sheet);

        //convert dates to date objects
        const transactions = res.map((entry: any) => {
            return {
                date: dateFromSheetsCell(entry["DATE"]) as Date,
                merchant_company: entry["MERCHANT/COMPANY"],
                location: entry["LOCATION"],
                amount: entry["AMOUNT"] || 0,
                description: entry["DESCRIPTION"],
                category: entry["CATEGORY"],
                payment_account: entry["PAYMENT ACCOUNT"],
                transaction_method: entry["TRANSACTION METHOD"],
                reimbursed: entry["REIMBURSED"],
                reimbursed_amount: entry["REIMBURSED"],
                unit_count: entry["UNIT COUNT"],
                unit_type: entry["UNIT TYPE"],
                unit_price: entry["PRICE/UNIT"],
                pay_period_start: dateFromSheetsCell(entry["PAY PERIOD START"]),
                pay_period_end: dateFromSheetsCell(entry["PAY PERIOD END"]),
            };
        });
        return transactions;
    }

    // Categories
    // TODO: type these functions
    async getCategories(type: "expense" | "income" = "expense") {
        console.log("get categories" + type);

        let range: string;
        if (type === "expense") {
            range = "CONFIG: Categories";
        } else {
            range = "CONFIG: Income Categories";
        }

        const res = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheet_id,
            range: range,
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
        let query = `select sum(${this.columnIds.amount})`;

        if (options?.startDate && options?.endDate) {
            // Both dates are provided
            query += ` where date '${options.startDate.toISOString().substring(0, 10)}' <= ${this.columnIds.date} and ${this.columnIds.date} <= date '${options.endDate
                .toISOString()
                .substring(0, 10)}'`;
        } else if (options?.startDate) {
            // Only start date is provided
            query += ` where date '${options.startDate.toISOString().substring(0, 10)}' <= ${this.columnIds.date}`;
        } else if (options?.endDate) {
            // Only end date is provided
            query += ` where ${this.columnIds.date} <= date '${options.endDate.toISOString().substring(0, 10)}'`;
        }

        const res = await this.query(query);
        if (res.length > 0) {
            return res[0]["sum AMOUNT"];
        } else {
            return 0;
        }
    }

    async getCategorySpending(options?: { startDate?: Date; endDate?: Date }): Promise<{ [category: string]: number }> {
        let query = `select ${this.columnIds.category}, sum(${this.columnIds.amount})`;
        if (options?.startDate && options?.endDate) {
            // Both dates are provided
            query += ` where date '${options.startDate.toISOString().substring(0, 10)}' <= ${this.columnIds.date} and ${this.columnIds.date} <= date '${options.endDate
                .toISOString()
                .substring(0, 10)}'`;
        } else if (options?.startDate) {
            // Only start date is provided
            query += ` where date '${options.startDate.toISOString().substring(0, 10)}' <= ${this.columnIds.date}`;
        } else if (options?.endDate) {
            // Only end date is provided
            query += ` where ${this.columnIds.date} <= date '${options.endDate.toISOString().substring(0, 10)}'`;
        }
        query += ` group by ${this.columnIds.category}`;

        const res = await this.query(query, "Expenses");
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
            range: "CONFIG: Payment Methods",
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
    async query(query: string, sheet: string = ""): Promise<any[]> {
        const url =
            "https://docs.google.com/spreadsheets" +
            `/d/${this.spreadsheet_id}/gviz/tq` +
            `?tq=${encodeURIComponent(query)}` +
            `&sheet=${sheet}` +
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

function buildSqlWhere(where: { [key: string]: string }, columnIds: { [key: string]: string }) {
    let where_query: string = "";
    for (const key in where) {
        if (where_query) {
            where_query += ` AND ${key} = ${where[key]}`;
        } else {
            where_query = `${columnIds[key]} ${where[key]}`;
        }
    }
    return where_query;
}