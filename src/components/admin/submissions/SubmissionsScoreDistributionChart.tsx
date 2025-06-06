
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PieChartIcon } from 'lucide-react';

interface ScoreDataPoint {
  name: string; // e.g., "0-25%", "26-50%"
  value: number; // count of submissions in this bracket
  fill: string; // color for this slice
}

interface SubmissionsScoreDistributionChartProps {
  scoreData: ScoreDataPoint[];
}

export function SubmissionsScoreDistributionChart({ scoreData }: SubmissionsScoreDistributionChartProps) {
  if (!scoreData || scoreData.length === 0) return null;

  const chartConfig = scoreData.reduce((acc, curr) => {
    acc[curr.name] = { label: curr.name, color: curr.fill };
    return acc;
  }, {} as Record<string, {label: string, color: string}>);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <PieChartIcon className="mr-2 h-5 w-5 text-primary"/>
          Score Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full aspect-square mx-auto max-w-xs">
          <RechartsPieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel indicator="line" nameKey="name" />}
            />
            <Pie
              data={scoreData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              labelLine={false}
              label={({ name, percent, value }) => `${name} (${value}, ${(percent * 100).toFixed(0)}%)`}
            >
              {scoreData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Pie>
            {/* Consider a simpler legend or rely on labels if space is tight */}
            {/* <Legend verticalAlign="bottom" height={36} content={
                 <ChartLegendContent nameKey="name" />
            }/> */}
          </RechartsPieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
