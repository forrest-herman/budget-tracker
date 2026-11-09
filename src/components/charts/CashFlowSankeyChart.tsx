'use client';

import { ResponsiveSankey } from '@nivo/sankey';

interface Node {
  id: string;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface SankeyData {
  nodes: Node[];
  links: Link[];
}

// make sure parent container have a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
// website examples showcase many properties,
// you'll often use just a few of them.
export const MyResponsiveSankey = ({ data2 }: { data2?: SankeyData }) => {
  const data: SankeyData = {
    nodes: [
      { id: 'Income' },
      { id: 'Expenses' },
      { id: 'Savings' },
      { id: 'Salary' },
      { id: 'Investments' },
      { id: 'Food' },
      { id: 'Rent' },
      { id: 'Transportation' },
    ],
    links: [
      { source: 'Salary', target: 'Income', value: 5025 },
      { source: 'Investments', target: 'Income', value: 125 },
      { source: 'Income', target: 'Expenses', value: 3000 },
      { source: 'Expenses', target: 'Food', value: 1000 },
      { source: 'Expenses', target: 'Rent', value: 900 },
      { source: 'Expenses', target: 'Transportation', value: 400 },
      { source: 'Income', target: 'Savings', value: 800 },
    ],
  };

  return (
    <div style={{ height: '500px' }}>
      <ResponsiveSankey
        data={data}
        margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
        align="justify"
        colors={{ scheme: 'category10' }}
        nodeOpacity={1}
        nodeHoverOthersOpacity={0.35}
        nodeThickness={18}
        nodeSpacing={24}
        nodeBorderWidth={0}
        nodeBorderColor={{
          from: 'color',
          modifiers: [['darker', 0.8]],
        }}
        nodeBorderRadius={3}
        linkOpacity={0.5}
        linkHoverOthersOpacity={0.3}
        linkContract={3}
        enableLinkGradient={true}
        labelPosition="outside"
        labelOrientation="vertical"
        labelPadding={16}
        labelTextColor={{
          from: 'color',
          modifiers: [['darker', 1]],
        }}
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'column',
            translateX: 130,
            itemWidth: 100,
            itemHeight: 14,
            itemDirection: 'right-to-left',
            itemsSpacing: 2,
            itemTextColor: '#999',
            symbolSize: 14,
            effects: [
              {
                on: 'hover',
                style: {
                  itemTextColor: '#000',
                },
              },
            ],
          },
        ]}
      />
    </div>
  );
};
