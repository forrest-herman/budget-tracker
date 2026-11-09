"use client";

import { useEffect } from "react";
import moment from "moment";
import { format, differenceInDays, add } from "date-fns";
import { cn } from "@/utils/shadcn";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Tag } from "lucide-react";
import { CaretSortIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";

import { Column } from "@tanstack/react-table";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuGroup,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Select, SelectContent, SelectItem, SelectLabel, SelectGroup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { CreditCard, LogOut, Search } from "lucide-react";

// { onSelectDateRange }: { onSelectDateRange: (range: any) => void }
export const FilterBar = ({ columns }: { columns: Column<any, unknown>[] }) => {
    return (
        <div className='my-5 flex justify-between w-full'>
            <div className='w-full flex justify-start gap-3 flex-wrap'>
                {columns.map((col) => {
                    return col.getCanFilter() && <Filter key={col.id} column={col} />;
                })}
            </div>
            <div className='relative'>
                <Input type='text' placeholder='Search' className='pr-7' />
                {/* TODO: hide input field until click on search icon when screen width is narrow */}
                <Search className='w-4 absolute right-0 top-0 m-2.5 h-4 text-muted-foreground user-select-none cursor-pointer' />
            </div>
        </div>
    );
};

const Filter = ({ column }: { column: Column<any, unknown> }) => {
    const columnFilterValue = column.getFilterValue(); // TODO: use this instead of local variables?

    const { filterVariant } = column.columnDef.meta ?? {};

    switch (filterVariant) {
        case "date-range":
            return <DateFilter column={column} />;
        case "select":
            return <SelectFilter column={column} />;
    }
};

const SelectFilter = ({ column }: {column: Column<any, unknown>}) => {
    // temp
    const category_config = {
      name: "Food",
      subcategories: ["Temp 1", "Temp 2"],
      icon: "food",
    }

    // TODO: memo this?
    const facetedValues = Array.from(new Map(Array.from(column.getFacetedUniqueValues()).sort((a,b)=>a[1]-b[1])).keys())

    console.log('column', column.columnDef.header, 'facetedValues', facetedValues)

    const categories = ["Food", "Transportation", "Personal Care", "Credit Card", "BMO Cashback Mastercard"] // TODO: faceted from column data

    const [selectedOptions, setSelectedOptions] = useState<boolean[]>(facetedValues.map(v => false));

    useEffect(() => {
        column.setFilterValue(facetedValues.filter((item, i) => selectedOptions[i]).map((v) => v));
    }, [selectedOptions]);

    console.log('selectedOptions', selectedOptions)

    const toggleItem = (index: number) => {
        setSelectedOptions(selectedOptions.map((v,i)=>i==index ? !v : v))
    }
    
    const modifyAll = (value: boolean) => {
        setSelectedOptions(selectedOptions.map(v=>value))
        console.log('swapping')
    }

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant='outline'>
                    <Tag className='mr-2 h-4 w-4' />
                    {column.columnDef.header}
                    <CaretSortIcon className='ml-2 h-4 w-4 opacity-50' />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56 overflow-y-scroll' style={{height: '70svh'}}>
                <DropdownMenuCheckboxItem onCheckedChange={() => modifyAll(true)}>
                    <span>Select All</span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem onCheckedChange={() => modifyAll(false)}>
                    <span>Deselect All</span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {facetedValues.map((value, index) => {
                        return (
                            <DropdownMenuCheckboxItem
                                key={value}
                                checked={selectedOptions[index]}
                                onCheckedChange={() => toggleItem(index)}
                            >
                                <span>{value}</span>
                            </DropdownMenuCheckboxItem>
                            // <>
                            // <DropdownMenuSub key={category}>
                            //     <DropdownMenuSubTrigger>
                            //         <span>{category}</span>
                            //         {/* TODO: show checked, partial check, unchecked */}
                            //     </DropdownMenuSubTrigger>
                            //     <DropdownMenuPortal>
                            //         <DropdownMenuSubContent>
                            //             <DropdownMenuCheckboxItem onCheckedChange={() => setSelectedOptions(categories.map((v, i) => (i == index ? true : selectedOptions[i])))}>
                            //                 <span>Select All</span>
                            //             </DropdownMenuCheckboxItem>
                            //             <DropdownMenuCheckboxItem onCheckedChange={() => setSelectedOptions(categories.map((v, i) => (i == index ? false : selectedOptions[i])))}>
                            //                 <span>Deselect All</span>
                            //             </DropdownMenuCheckboxItem>
                            //             <DropdownMenuSeparator />
                            //             {category_config?.subcategories.map((value, subIndex) => {
                            //                 return (
                            //                     <DropdownMenuCheckboxItem
                            //                         key={value}
                            //                         checked={selectedOptions[index]}
                            //                         // onCheckedChange={() => setSelectedOptions(selectedOptions.map((v, i) => (i == index ? !v : v)))}
                            //                     >
                            //                         <span>{value}</span>
                            //                     </DropdownMenuCheckboxItem>
                            //                 );
                            //             })}
                            //         </DropdownMenuSubContent>
                            //     </DropdownMenuPortal>
                            // </DropdownMenuSub>
                            // </>
                        );
                    })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

type DateRange = { from: Date, to: Date }

const DateFilter = ({ column }: {column: Column<any, unknown>}) => {
    const [rangeCalendarOpen, setRangeCalendarOpen] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange>({ from: moment().subtract(1, "months").toDate(), to: moment().toDate() });

    const handleDateRange = (range: DateRange) => {
        setDateRange(range);
        column.setFilterValue(range);
    };

    return (
        <Popover open={rangeCalendarOpen} onOpenChange={setRangeCalendarOpen}>
            <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("pl-3 text-left font-normal flex", !dateRange && "text-muted-foreground")}>
                    {dateRange.from ? (
                        dateRange.to ? (
                            <>
                                {format(dateRange.from, "LLL d, y")} - {format(dateRange.to, "LLL d, y")}
                            </>
                        ) : (
                            format(dateRange.from, "LLL d, y")
                        )
                    ) : (
                        <span>Pick a date</span>
                    )}
                    <CalendarIcon className='ml-3 h-4 w-4 opacity-50' />
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
                <Calendar mode='range' selected={dateRange} onSelect={handleDateRange} disabled={(date) => date > new Date()} initialFocus defaultMonth={dateRange.from} numberOfMonths={2} />
            </PopoverContent>
        </Popover>
    );
};
