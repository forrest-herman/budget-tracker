import type { OAuth2Client } from "google-auth-library";
import type { drive_v3, sheets_v4 } from "googleapis";
import { google } from "googleapis"
const { GOOGLE_ID, GOOGLE_SECRET } = process.env;

export function initGoogleAuth(access_token: string) {
    const auth = new google.auth.OAuth2({
        clientId: GOOGLE_ID,
        clientSecret: GOOGLE_SECRET,
    });
    auth.setCredentials({
        access_token: access_token,
    });
    return auth;
}
export function initDriveClient(auth: OAuth2Client) {
    return google.drive({
        version: "v3",
        auth: auth,
    });
}

export function initSheetsClient(auth: OAuth2Client) {
    return google.sheets({
        version: "v4",
        auth: auth,
    });
}

//could fail due to auth error
export async function findOrCreateSpreadsheet(auth: OAuth2Client) {
    //find the sheet if it exists
    const drive = initDriveClient(auth);
    let sheetId = await findSpreadsheet(drive);
    if (sheetId != null) {
        return sheetId;
    }

    //create a sheet if it doesn't
    const sheets = initSheetsClient(auth);
    return await createSpreadsheet(sheets);
}

//could fail due to auth error
/*
test cases
- auth error
- files length == 0
- files lenght == 1, but none of them are spreadsheets (this shouldn't happen but should still test)
- multiple files
 */
export async function findSpreadsheet(drive: drive_v3.Drive): Promise<string | null> {
    const response = await drive.files.list();

    console.log("FILES: \n\n", response);

    // find and return the spreadsheet id
    const files = response.data.files;
    if (!files || files.length == 0) return null;
    const spreadsheets = files.filter((file) => {
        return file["mimeType"] == "application/vnd.google-apps.spreadsheet";
    });

    if (spreadsheets.length == 0) return null;
    if (spreadsheets[0].id) return spreadsheets[0].id;
    else return null;
}

export async function createSpreadsheet(sheets: sheets_v4.Sheets) {
    console.log("Creating a new spreadsheet");
    const header_format = {
        backgroundColorStyle: {
            rgbColor: {
                red: 60 / 255,
                green: 120 / 255,
                blue: 216 / 255,
            },
        },
        textFormat: {
            foregroundColorStyle: {
                rgbColor: {
                    red: 1,
                    green: 1,
                    blue: 1,
                },
            },
        },
        horizontalAlignment: "CENTER",
        verticalAlignment: "MIDDLE",
    };
    const header_format_expenses = {
        backgroundColorStyle: {
            rgbColor: {
                red: 255 / 255,
                green: 118 / 255,
                blue: 20 / 255,
            }, // orange
        },
        textFormat: {
            foregroundColorStyle: {
                rgbColor: {
                    red: 1,
                    green: 1,
                    blue: 1,
                },
            },
        },
        horizontalAlignment: "CENTER",
        verticalAlignment: "MIDDLE",
    };
    const header_format_income = {
        backgroundColorStyle: {
            rgbColor: {
                red: 0 / 255,
                green: 155 / 255,
                blue: 100 / 255,
            }, // green
        },
        textFormat: {
            foregroundColorStyle: {
                rgbColor: {
                    red: 1,
                    green: 1,
                    blue: 1,
                },
            },
        },
        horizontalAlignment: "CENTER",
        verticalAlignment: "MIDDLE",
    };

    try {
        const response = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: "Financial Transactions and Budget",
                },
                sheets: [
                    {
                        properties: {
                            title: "Expenses",
                            gridProperties: {
                                frozenRowCount: 1,
                            },
                        },
                        data: [
                            {
                                startRow: 0,
                                startColumn: 0,
                                rowData: [
                                    {
                                        values: [
                                            { userEnteredValue: { stringValue: "MONTH" }, userEnteredFormat: header_format_expenses },
                                            { userEnteredValue: { stringValue: "DATE" }, userEnteredFormat: header_format_expenses },
                                            { userEnteredValue: { stringValue: "MERCHANT/COMPANY" }, userEnteredFormat: header_format_expenses },
                                            { userEnteredValue: { stringValue: "AMOUNT" }, userEnteredFormat: header_format_expenses },
                                            { userEnteredValue: { stringValue: "DESCRIPTION" }, userEnteredFormat: header_format_expenses },
                                            { userEnteredValue: { stringValue: "CATEGORY" }, userEnteredFormat: header_format_expenses },
                                            { userEnteredValue: { stringValue: "SUBCATEGORY" }, userEnteredFormat: header_format_expenses },
                                            { userEnteredValue: { stringValue: "PAYMENT ACCOUNT" }, userEnteredFormat: header_format_expenses }, // credit card, bank account, cash,
                                            { userEnteredValue: { stringValue: "TRANSACTION METHOD" }, userEnteredFormat: header_format_expenses }, // direct deposit, cash, debit, credit, etransfer, cheque
                                            { userEnteredValue: { stringValue: "REIMBURSED" }, userEnteredFormat: header_format_expenses },
                                        ],
                                    },
                                ],
                                rowMetadata: [{ pixelSize: 40 }],
                            },
                            {
                                startRow: 0,
                                startColumn: 3,
                                columnMetadata: [{ pixelSize: 50 }],
                            },
                            {
                                startRow: 0,
                                startColumn: 5,
                                columnMetadata: [{ pixelSize: 60 }],
                            },
                        ],
                        // conditionalFormats: [
                        //     {
                        //         ranges: [
                        //             {
                        //                 startRowIndex: 1,
                        //                 startColumnIndex: 9,
                        //                 endColumnIndex: 10,
                        //             },
                        //         ],
                        //         booleanRule: {
                        //             condition: {
                        //                 type: "BOOLEAN",
                        //             },
                        //             // format: {
                        //             //   object (CellFormat)
                        //             // }
                        //         },
                        //     },
                        // ],
                    },
                    {
                        properties: {
                            title: "Income",
                            gridProperties: {
                                frozenRowCount: 1,
                            },
                        },
                        data: [
                            {
                                startRow: 0,
                                startColumn: 0,
                                rowData: [
                                    {
                                        values: [
                                            { userEnteredValue: { stringValue: "MONTH" }, userEnteredFormat: header_format_income },
                                            { userEnteredValue: { stringValue: "DATE" }, userEnteredFormat: header_format_income },
                                            { userEnteredValue: { stringValue: "MERCHANT/COMPANY" }, userEnteredFormat: header_format_income },
                                            { userEnteredValue: { stringValue: "AMOUNT" }, userEnteredFormat: header_format_income },
                                            { userEnteredValue: { stringValue: "DESCRIPTION" }, userEnteredFormat: header_format_income },
                                            { userEnteredValue: { stringValue: "CATEGORY" }, userEnteredFormat: header_format_income }, // Work, Business, Personal, CRA, Misc
                                            { userEnteredValue: { stringValue: "SUBCATEGORY" }, userEnteredFormat: header_format_income }, // Salary, Bonus, Gift, Refund, Interest, Sale, Grant
                                            { userEnteredValue: { stringValue: "PAYMENT ACCOUNT" }, userEnteredFormat: header_format_income }, // credit card, bank account, cash,
                                            { userEnteredValue: { stringValue: "TRANSACTION METHOD" }, userEnteredFormat: header_format_income }, // direct deposit, cash, debit, credit, etransfer, cheque
                                        ],
                                    },
                                ],
                                rowMetadata: [{ pixelSize: 40 }],
                            },
                            {
                                startRow: 0,
                                startColumn: 3,
                                columnMetadata: [{ pixelSize: 50 }],
                            },
                            {
                                startRow: 0,
                                startColumn: 5,
                                columnMetadata: [{ pixelSize: 60 }],
                            },
                        ],
                    },
                    {
                        properties: {
                            title: "CONFIG: Categories",
                        },
                        data: [
                            {
                                startRow: 0,
                                startColumn: 0,
                                rowData: [
                                    {
                                        values: [
                                            { userEnteredValue: { stringValue: "Type" }, userEnteredFormat: header_format },
                                            { userEnteredValue: { stringValue: "Category" }, userEnteredFormat: header_format },
                                            // { userEnteredValue: { stringValue: "Subcategory" }, userEnteredFormat: header_format },
                                        ],
                                    },
                                ],
                                rowMetadata: [{ pixelSize: 35 }],
                            },
                        ],
                        // conditionalFormats: [
                        //     {
                        //         ranges: [
                        //             {
                        //                 startRowIndex: 1,
                        //                 startColumnIndex: 0,
                        //                 endColumnIndex: 1,
                        //             },
                        //         ],
                        //         booleanRule: {
                        //             condition: {
                        //                 type: "BOOLEAN",
                        //                 values: [{ userEnteredValue: "Income" }, { userEnteredValue: "Expense" }],
                        //             },
                        //         },
                        //     },
                        // ],
                    },
                    {
                        properties: {
                            title: "CONFIG: Payment Methods",
                        },
                        data: [
                            {
                                startRow: 0,
                                startColumn: 0,
                                rowData: [
                                    {
                                        values: [
                                            { userEnteredValue: { stringValue: "Transaction Account" }, userEnteredFormat: header_format },
                                            { userEnteredValue: { stringValue: "Payment Method" }, userEnteredFormat: header_format },
                                        ],
                                    },
                                ],
                                rowMetadata: [{ pixelSize: 35 }],
                            },
                        ],
                    },
                ],
            },
        });
        console.log(response.data);
        return response.data.spreadsheetId;
    } catch (err) {
        console.error("Error creating spreadsheet: ", err);
        throw new Error("Error creating spreadsheet");
    }
}

export function extractDataFromQueryResponse(text: string): any {
    // Find the JSON object in the text
    const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);

    if (!jsonMatch || jsonMatch.length < 2) {
        throw new Error("No valid JSON data found in the text");
    }

    // Parse the JSON data
    const jsonData = JSON.parse(jsonMatch[1]);
    return jsonData;
}