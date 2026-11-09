'use client';

import { formatAsCurrency } from '@/utils/currencyUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

type ChartProps = {
  data: any[];
  // data: {
  //   food: number;
  //   transportation: number;
  //   month: string;
  // }[];
};

export const CategorySpendingByTimeBarChart = ({ data }: ChartProps) => {
  const colors = [
    '#e6194b',
    '#3cb44b',
    '#ffe119',
    '#4363d8',
    '#f58231',
    '#911eb4',
    '#46f0f0',
    '#f032e6',
    '#bcf60c',
    '#fabebe',
    '#008080',
    '#e6beff',
    '#9a6324',
    '#fffac8',
    '#800000',
    '#82ca9d',
    '#808000',
    '#ffd8b1',
    '#000075',
    '#808080',
    '#ffffff',
    '#8884d8',
    '#008080',
    '#e6beff',
    '#9a6324',
    '#fffac8',
    '#800000',
    '#82ca9d',
    '#808000',
    '#ffd8b1',
    '#000075',
    '#808080',
    '#ffffff',
    '#8884d8',
    '#800000',
    '#82ca9d',
    '#808000',
    '#ffd8b1',
    '#000075',
    '#808080',
    '#ffffff',
    '#8884d8',
    '#008080',
    '#e6beff',
    '#9a6324',
    '#fffac8',
    '#800000',
    '#82ca9d',
    '#808000',
    '#ffd8b1',
    '#000075',
    '#808080',
    '#ffffff',
    '#8884d8',
  ];

  console.log('data bar chart', data);

  return (
    <ResponsiveContainer width="100%" minHeight={600}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        {/* <Tooltip cursor={{ fill: 'rgba(10,10,10,0.2)' }} /> */}
        <Legend />
        {Object.keys(data[0]).map((key, i) => {
          if (!key.includes('value')) return;
          return (
            <Bar key={key} dataKey={key} stackId="a" fill={colors[i]} isAnimationActive={false}>
              <LabelList dataKey={key} style={{ fill: 'black' }} formatter={formatLabel} />
            </Bar>
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );
};

const formatLabel = (value) => {
  if (value === null) return '';
  if (value < 50) return '';
  return formatAsCurrency(value);
};
