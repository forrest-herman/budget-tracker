import { z } from "zod";

export const date_regex = /^\d\d\d\d-\d\d-\d\d$/;
// export const amount_regex = /^-?\$?\d{1,3}([, ]\d{3})*\.\d\d?$/;
export const amount_regex = /^[-+]?\d+\.\d\d?$/;

const BaseTransaction = z.object({
    date: z.coerce.date(),
    merchant_company: z.string().trim().min(1),
    location: z.string().optional(),
    amount: z.coerce.number(),
    description: z.string().optional(),
    category: z.string().trim().min(1, { message: "Required" }),
    subcategory: z.string().optional(),
    transaction_method: z.string().trim().min(1, { message: "Required" }),
    payment_account: z.string().optional(),
});

export const ExpenseSchema = BaseTransaction.extend({
    reimbursed: z.boolean().optional(), // TODO: remove
    reimbursed_amount: z.coerce.number().optional().nullable(),
    unit_count: z.coerce.number().optional().nullable(),
    unit_type: z.string().optional(),
    unit_price: z.coerce.number().optional().nullable(),
});
export type ExpenseTransaction = z.infer<typeof ExpenseSchema>;

export const IncomeSchema = BaseTransaction.extend({
    pay_period_start: z.coerce.date().optional().nullable(),
    pay_period_end: z.coerce.date().optional().nullable(),
});
export type IncomeTransaction = z.infer<typeof IncomeSchema>;

const MasterTransactionSchema = ExpenseSchema.merge(IncomeSchema);
export type MasterTransaction = z.infer<typeof MasterTransactionSchema>;

export const TransactionFormSchema = ExpenseSchema.merge(IncomeSchema).extend({
    transaction_type: z.string(), // expense or income
    pay_period_range: z
        .object({
            from: z.date(),
            to: z.date(),
        })
        .optional(),
});
export type TransactionForm = z.infer<typeof TransactionFormSchema>;

export function validateTransactions(transactions: unknown) {
    return z.array(ExpenseSchema).parse(transactions);
}

export function validateIncomeTransactions(transactions: unknown) {
    return z.array(IncomeSchema).parse(transactions);
}