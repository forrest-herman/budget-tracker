"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format, formatRelative } from "date-fns";
import { formatRelativeDate } from "@/utils/dateUtils";

import { cn } from "@/utils/shadcn";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TransactionFormSchema } from "@/utils/TransactionsValidator";
import type { TransactionForm } from "@/utils/TransactionsValidator";
import { useState } from "react";

const AddTransactionForm = () => {
    const [calendarOpen, setCalendarOpen] = useState(false);

    const form = useForm<TransactionForm>({
        resolver: zodResolver(TransactionFormSchema),
        defaultValues: {
            transaction_type: "expense",
            date: new Date(),
            merchant_company: "",
            amount: "",
            description: "",
            category: "",
            transaction_method: "credit",
            payment_account: "",
            reimbursed: false,
        },
    });

    function onSubmit(values: TransactionForm) {
        console.log("form submitted with ", values);
        toast({
            title: "You submitted the following values:",
            description: (
                <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
                    <code className='text-white'>{JSON.stringify(values, null, 2)}</code>
                </pre>
            ),
        });

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
                // TODO: redirect to dashboard home
            })
            .catch((resp) => {
                //TODO: handle error
            });
    }

    return (
        // TODO: vertical padding and scroll
        <div className='w-5/6 h-full'>
            <h1 className='text-3xl pt-4'>New Transaction</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8 py-5'>
                    <FormField
                        control={form.control}
                        name='transaction_type'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Transaction Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className='w-[180px]'>
                                            <SelectValue placeholder='Expense/Income' />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value='expense'>Expense -$</SelectItem>
                                        <SelectItem value='income'>Income +$</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <hr></hr>
                    <FormField
                        control={form.control}
                        name='date'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date</FormLabel>
                                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal flex", !field.value && "text-muted-foreground")}>
                                                {field.value ? formatRelativeDate(field.value) : <span>Select a date</span>}
                                                <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className='w-auto p-0' align='start'>
                                        <Calendar
                                            mode='single'
                                            selected={field.value}
                                            onSelect={(event) => {
                                                field.onChange(event);
                                                setCalendarOpen(false);
                                            }}
                                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name='merchant_company'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Merchant / Company</FormLabel>
                                {/* TODO: auto-complete */}
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                {/* <FormDescription>Business name</FormDescription> */}
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
                                    <Input
                                        type='number'
                                        step='0.01'
                                        placeholder='0.00'
                                        {...field}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            console.log("format:", e.target.value);
                                        }}
                                    />
                                    {/* TODO: add better auto-formatting to the $ amount. Maybe use this? https://gist.github.com/Sutil/5285f2e5a912dcf14fc23393dac97fed */}
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {/* TODO: add currency selector (Select), which looks up the current conversion rates and displays the equivalent amount in CAD which is then used to save to database */}
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
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className='w-[180px]'>
                                            <SelectValue placeholder='Select Category' />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {/* TODO: retrieve from excel */}
                                        <SelectItem value='food'>Food</SelectItem>
                                        <SelectItem value='transportation'>Transportation</SelectItem>
                                        <SelectItem value='housing'>Housing</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder='Choose a payment method' />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {/* TODO: retrieve options from excel */}
                                        <SelectItem value='credit'>Credit</SelectItem>
                                        <SelectItem value='e-transfer'>E-Transfer</SelectItem>
                                        <SelectItem value='debit'>Debit</SelectItem>
                                        <SelectItem value='cash'>Cash</SelectItem>
                                        <SelectItem value='cheque'>Cheque</SelectItem>
                                        <SelectItem value='direct_deposit'>Direct Deposit</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder='Choose a payment account' />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {/* TODO: retrieve from excel and filter based on transaction_method */}
                                        <SelectItem value='1'>Tangerine MasterCard</SelectItem>
                                        <SelectItem value='2'>Scotiabank VISA</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name='reimbursed'
                        render={({ field }) => (
                            <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md'>
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
