import { z } from "zod";

export const date_regex = /^\d\d\d\d-\d\d-\d\d$/;
// export const amount_regex = /^-?\$?\d{1,3}([, ]\d{3})*\.\d\d?$/;
export const amount_regex = /^[-+]?\d+\.\d\d?$/;

// TODO: merge zod objects
export const TransactionFormSchema = z.object({
    transaction_type: z.string(), // expense or income
    date: z.coerce.date({ required_error: "Transaction date is required" }),
    merchant_company: z.string(),
    // merchant_bank_description: z.string().optional(),
    amount: z.string().regex(amount_regex),
    description: z.string(),
    category: z.string(),
    // subcategory: z.string().optional(),
    transaction_method: z.string(),
    payment_account: z.string().optional(),
    reimbursed: z.boolean().default(false),
});
export type TransactionForm = z.infer<typeof TransactionFormSchema>;

// DATE,	MERCHANT/COMPANY,	AMOUNT,	DESCRIPTION,	CATEGORY,	SUBCATEGORY,	PAYMENT ACCOUNT,	TRANSACTION METHOD,	REIMBURSED
export const TransactionSchema = z.object({
    date: z.coerce.date(),
    merchant_company: z.string(),
    // merchant_bank_description: z.string().optional(),
    amount: z.coerce.number(),
    description: z.string(),
    category: z.string(),
    // subcategory: z.string().optional(),
    transaction_method: z.string(),
    payment_account: z.string().optional(),
    reimbursed: z.boolean(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export function validateTransactions(transactions: unknown) {
    // console.log(transactions);
    return z.array(TransactionSchema).parse(transactions);
}
