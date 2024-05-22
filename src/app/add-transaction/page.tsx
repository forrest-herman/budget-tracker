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
    const [categories, setCategories] = useState({});
    const [paymentMethods, setPaymentMethods] = useState({});

    const form = useForm<TransactionForm>({
        resolver: zodResolver(TransactionFormSchema),
        defaultValues: {
            transaction_type: "expense",
            date: new Date(),
            merchant_company: "",
            amount: undefined,
            description: "",
            category: "",
            subcategory: "",
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

    function loadCategories() {
        // TODO: run on page load
        fetch("/api/categories", {
            method: "get",
            headers: {
                "content-type": "application/json",
                accept: "application/json",
            },
        })
            .then(async (resp) => {
                const body = await resp.json();
                // store the categories in state
                setCategories(body);
            })
            .catch((resp) => {
                // console.log(resp)
            });
    }

    function loadPaymentMethods() {
        // TODO: run on page load
        fetch("/api/paymentMethods", {
            method: "get",
            headers: {
                "content-type": "application/json",
                accept: "application/json",
            },
        })
            .then(async (resp) => {
                const body = await resp.json();
                // store the payment methods in state
                setPaymentMethods(body);
            })
            .catch((resp) => {
                // console.log(resp)
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
                                {/* TODO: auto-complete from previous entries */}
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
                                        // inputMode='numeric'
                                        // pattern='[0-9]*'
                                        type='text'
                                        placeholder='0.00'
                                        {...field}
                                        // onChange={(e) => {
                                        //     field.onChange(e);
                                        //     console.log("format:", e.target.value);
                                        // }}
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
                    <div className='flex'>
                        <FormField
                            control={form.control}
                            name='category'
                            render={({ field }) => (
                                <FormItem className='flex-auto'>
                                    <FormLabel>Transaction Category</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            form.resetField("subcategory");
                                        }}
                                        value={field.value}
                                        onOpenChange={(isOpening) => {
                                            // debounce
                                            if (isOpening) loadCategories();
                                        }}
                                    >
                                        <FormControl>
                                            <SelectTrigger className='w-[180px]'>
                                                <SelectValue placeholder='Select Category' />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {/* TODO: type and autocomplete fuzzy */}
                                            {Object.keys(categories).map((key, index) => (
                                                <SelectItem key={index} value={key}>
                                                    {key}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {categories[form.getValues().category]?.length > 0 && (
                            <FormField
                                control={form.control}
                                name='subcategory'
                                render={({ field }) => (
                                    <FormItem className='flex-auto'>
                                        <FormLabel>Subcategory</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                            }}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className='w-[180px]'>
                                                    <SelectValue placeholder='Select Subcategory' />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {/* TODO: type and autocomplete fuzzy */}
                                                {categories[form.getValues().category]?.map((key, index) => (
                                                    <SelectItem key={index} value={key}>
                                                        {key}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                    <div className='flex'>
                        <FormField
                            control={form.control}
                            name='transaction_method'
                            render={({ field }) => (
                                <FormItem className='flex-auto'>
                                    <FormLabel>Payment Method</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            form.resetField("payment_account");
                                        }}
                                        value={field.value}
                                        onOpenChange={() => {
                                            loadPaymentMethods();
                                        }}
                                    >
                                        <FormControl>
                                            <SelectTrigger className='w-[180px]'>
                                                <SelectValue placeholder='Choose a payment method' />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {/* TODO: type and autocomplete fuzzy */}
                                            {Object.keys(paymentMethods).map((key, index) => (
                                                <SelectItem key={index} value={key}>
                                                    {key}
                                                </SelectItem>
                                            ))}
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
                                <FormItem className='flex-auto'>
                                    <FormLabel>Payment Account</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className='w-[180px]'>
                                                <SelectValue placeholder='Choose a payment account' />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {/* TODO: autoselect? */}
                                            {paymentMethods[form.getValues().transaction_method]?.map((key, index) => (
                                                <SelectItem key={index} value={key}>
                                                    {key}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
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
