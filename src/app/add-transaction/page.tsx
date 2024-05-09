"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TransactionFormSchema } from "@/utils/TransactionsValidator";
import type { TransactionForm } from "@/utils/TransactionsValidator";

const AddTransactionForm = () => {
    const form = useForm<TransactionForm>({
        resolver: zodResolver(TransactionFormSchema),
        defaultValues: {
            date: format(new Date(), "yyyy-MM-dd"),
            transaction_type: "income",
            amount: "",
            description: "",
        },
    });

    function onSubmit(values: TransactionForm) {
        console.log("form submitted with ", values);
        // Do something with the form values.
        //show errors and
        fetch("/api/transactions", {
            method: "post",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify([values]),
        })
            .then((resp) => {
                //TODO: handle response
                form.reset();
            })
            .catch((resp) => {
                //TODO: handle error
            });
    }

    return (
        <div className='w-5/6'>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
                    <FormField
                        control={form.control}
                        name='transaction_type'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Transaction Type</FormLabel>
                                <FormControl>
                                    <Select defaultValue='expense'>
                                        <SelectTrigger className='w-[180px]'>
                                            <SelectValue placeholder='Expense/Income' {...field} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='expense'>Expense -$</SelectItem>
                                            <SelectItem value='income'>Income +$</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <hr></hr>
                    <FormField
                        control={form.control}
                        name='date'
                        render={({ field }) => (
                            // TODO: date picker
                            <FormItem>
                                <FormLabel>Date</FormLabel>
                                <FormControl>
                                    <Input placeholder='YYYY-MM-DD' {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name='amount'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                    <Input placeholder='0.00' {...field} />
                                </FormControl>
                                <FormDescription>Add &quot;-&quot; to amount if you&apos;ve spent money (e.g. -1.00)</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name='description'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder='What did you spend your money on?' {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name='category'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Transaction Category</FormLabel>
                                <FormControl>
                                    <Select>
                                        <SelectTrigger className='w-[180px]'>
                                            <SelectValue placeholder='Transaction Category' {...field} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* TODO: retrieve from excel */}
                                            <SelectItem value='food'>Food</SelectItem>
                                            <SelectItem value='Transportation'>Transportation</SelectItem>
                                            <SelectItem value='housing'>Housing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {/* TODO: put both transaction_method and payment account side by side */}
                    <FormField
                        control={form.control}
                        name='transaction_method'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Method</FormLabel>
                                <FormControl>
                                    <Select defaultValue='credit'>
                                        <SelectTrigger>
                                            <SelectValue placeholder='Choose a payment method' {...field} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* TODO: retrieve from excel */}
                                            <SelectItem value='credit'>Credit</SelectItem>
                                            <SelectItem value='e-transfer'>E-Transfer</SelectItem>
                                            <SelectItem value='debit'>Debit</SelectItem>
                                            <SelectItem value='cash'>Cash</SelectItem>
                                            <SelectItem value='cheque'>Cheque</SelectItem>
                                            <SelectItem value='direct_deposit'>Direct Deposit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name='payment_account'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Account</FormLabel>
                                <FormControl>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder='Choose a payment account' {...field} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* TODO: retrieve from excel and filter based on transaction_method */}
                                            <SelectItem value='1'>Tangerine MasterCard</SelectItem>
                                            <SelectItem value='2'>Scotiabank VISA</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name='reimbursed'
                        render={({ field }) => (
                            <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                                <FormLabel>Reimbursed?</FormLabel>
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button className='w-full' type='submit'>
                        Submit
                    </Button>
                </form>
            </Form>
        </div>
    );
};
export default AddTransactionForm;
