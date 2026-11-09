'use client';

import { formatAsCurrency } from '@/utils/currencyUtils';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type SpendingChartProps = {
  data: {
    value: number;
    month: string;
  }[];
};

export const SpendingByMonthChart = ({ data }: SpendingChartProps) => {
  return (
    <ResponsiveContainer width={'100%'} minHeight={300}>
      <LineChart data={data}>
        {/* <CartesianGrid stroke="#555" /> */}
        <XAxis dataKey="date" />
        <YAxis tickFormatter={(tick) => formatAsCurrency(tick)} />
        <Tooltip
          formatter={(value, name) => [formatAsCurrency(value as number), 'Amount']}
          itemStyle={{ color: 'black' }}
          labelStyle={{ color: 'black' }}
          contentStyle={{ padding: 4, border: 0 }}
        />
        <Line dataKey="value" type={'monotone'} name="Spending by Month" />
      </LineChart>
    </ResponsiveContainer>
  );
};
