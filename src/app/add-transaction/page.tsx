"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { formatRelativeDate, convertLocalDateToUTCIgnoringTimezone, convertUTCToLocalDateIgnoringTimezone } from "@/utils/dateUtils";

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
import { useEffect, useState } from "react";
import { format, differenceInDays, add } from "date-fns";

const AddTransactionForm = () => {
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [rangeCalendarOpen, setRangeCalendarOpen] = useState(false);
    const [activeCategories, setActiveCategories] = useState({});
    const [allCategories, setAllCategories] = useState<{ [key: string]: Object }>({ expense: {}, income: {} });
    const [paymentMethods, setPaymentMethods] = useState({});
    const [lastPayPeriod, setLastPayPeriod] = useState<{ [key: string]: Date }>({});

    // load sheet data on page render
    useEffect(() => {
        // TODO: make these functions async and in parallel
        loadCategories();
        loadPaymentMethods();
        loadLastPayPeriod();
    }, []);

    const form = useForm<TransactionForm>({
        resolver: zodResolver(TransactionFormSchema),
        defaultValues: {
            transaction_type: "expense",
            date: new Date(new Date().setHours(0, 0, 0, 0)), // midnight today
            merchant_company: "",
            location: "",
            amount: "" as unknown as number, // necessary for form reset to work
            description: "",
            unit_count: "" as unknown as number, // necessary for form reset to work
            unit_type: "",
            category: "",
            subcategory: "",
            transaction_method: "Credit Card",
            payment_account: "",
            reimbursed_amount: "" as unknown as number, // necessary for form reset to work
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

        // format the date to UTC for server processing and add unit price column
        const transactionValues = {
            ...values,
            date: convertLocalDateToUTCIgnoringTimezone(values.date),
            unit_price: values.unit_count ? values.amount / values.unit_count : undefined,
            pay_period_start: values.pay_period_range?.from ? convertLocalDateToUTCIgnoringTimezone(values.pay_period_range.from) : undefined,
            pay_period_end: values.pay_period_range?.to ? convertLocalDateToUTCIgnoringTimezone(values.pay_period_range.to) : undefined,
        };
        console.log("form values: ", transactionValues);

        let url: string;
        if (values.transaction_type === "income") {
            url = "/api/income";
        } else url = "/api/transactions";

        // TODO: show errors
        fetch(url, {
            method: "post",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify([transactionValues]),
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
                setAllCategories(body);
                if (form.getValues("transaction_type") === "income") setActiveCategories(body?.income);
                else setActiveCategories(body?.expense);
            })
            .catch((resp) => {
                // console.log(resp)
            });
    }

    function loadPaymentMethods() {
        fetch("/api/payment-methods", {
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

    function loadLastPayPeriod() {
        // find last income transaction with a pay period
        const payload: { [key: string]: any } = {
            where: { pay_period_start: "IS NOT NULL" },
            limit: 1,
        };

        fetch("/api/income/query", {
            method: "post",
            headers: {
                "content-type": "application/json",
                accept: "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then(async (resp) => {
                const body = await resp.json();
                if (body.length === 0) return;

                const lastPeriodStart: Date = convertUTCToLocalDateIgnoringTimezone(new Date(body[0].pay_period_start));
                const lastPeriodEnd: Date = convertUTCToLocalDateIgnoringTimezone(new Date(body[0].pay_period_end));
                setLastPayPeriod({ start: lastPeriodStart, end: lastPeriodEnd });
            })
            .catch((resp) => {
                console.log(resp);
            });
    }

    function insertNewPayPeriod() {
        if (Object.keys(lastPayPeriod).length === 0) return;
        // take the last pay period and estimate the new one
        const periodLength = differenceInDays(lastPayPeriod.end.getTime(), lastPayPeriod.start.getTime());
        const newPeriodStart = add(lastPayPeriod.end, { days: 1 });
        form.setValue("pay_period_range", { from: newPeriodStart, to: add(newPeriodStart, { days: periodLength }) });
    }

    return (
        // TODO: vertical padding and scroll, especially on mobile
        <div className='w-5/6 h-full'>
            <h1 className='text-3xl pt-4'>New {form.getValues("transaction_type")} Transaction</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8 py-5'>
                    <FormField
                        control={form.control}
                        name='transaction_type'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Transaction Type</FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        form.setValue("transaction_method", value === "income" ? "Direct Deposit" : "Credit Card");
                                        setActiveCategories(allCategories[value]);
                                        form.resetField("category");
                                    }}
                                    value={field.value}
                                >
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
                                            disabled={(date) => date > new Date()}
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
                        name='location'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location</FormLabel>
                                {/* TODO: auto-complete from previous entries and add ability to get device location */}
                                <FormControl>
                                    <Input {...field} />
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
                                            {Object.keys(activeCategories).map((key, index) => (
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
                        {(activeCategories as Record<string, string[]>)[form.getValues().category as string]?.length > 0 && (
                            <FormField
                                control={form.control}
                                name='subcategory'
                                render={({ field }) => (
                                    <FormItem className='flex-auto'>
                                        <FormLabel>Subcategory</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                if (value === "Gas") form.setValue("unit_type", "litres");
                                                else form.setValue("unit_type", "");
                                                if (value === "Salary") insertNewPayPeriod();
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
                                                {(activeCategories as Record<string, string[]>)[form.getValues().category as string]?.map((key, index) => (
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
                    {(form.getValues().subcategory as string) === "Gas" && (
                        <div className='flex'>
                            <FormField
                                control={form.control}
                                name='unit_count'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit Count</FormLabel>
                                        <FormControl>
                                            <Input
                                                // inputMode='numeric'
                                                // pattern='[0-9]*'
                                                type='text'
                                                placeholder='eg 23.4'
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
                            <FormField
                                control={form.control}
                                name='unit_type'
                                render={({ field }) => (
                                    <FormItem className='flex-auto'>
                                        <FormLabel>Units</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className='w-[60px]'>
                                                    <SelectValue placeholder='Units' />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {/* TODO: pull from public database of units */}
                                                <SelectItem value='litres'>L</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                    {(form.getValues().category as string) === "Employment" && (
                        <div className='flex'>
                            <FormField
                                control={form.control}
                                name='pay_period_range'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pay Period</FormLabel>
                                        <Popover open={rangeCalendarOpen} onOpenChange={setRangeCalendarOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal flex", !field.value && "text-muted-foreground")}>
                                                        {field.value?.from ? (
                                                            field.value?.to ? (
                                                                <>
                                                                    {format(field.value.from, "LLL d, y")} - {format(field.value.to, "LLL d, y")}
                                                                </>
                                                            ) : (
                                                                format(field.value.from, "LLL d, y")
                                                            )
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className='w-auto p-0' align='start'>
                                                <Calendar
                                                    mode='range'
                                                    selected={field.value}
                                                    onSelect={(event) => {
                                                        field.onChange(event);
                                                        // if (field.value?.from && field.value?.to) setRangeCalendarOpen(false);
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
                        </div>
                    )}
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
                                        onOpenChange={(isOpening) => {
                                            if (isOpening) loadPaymentMethods();
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
                                            {(paymentMethods as Record<string, string[]>)[form.getValues().transaction_method]?.map((key, index) => (
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
