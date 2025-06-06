
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";
import { BarChart3 } from 'lucide-react';

interface SubmissionChartData {
  testTitle: string;
  count: number;
}

interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

interface SubmissionsStatsChartProps {
  submissionChartData: SubmissionChartData[];
  chartConfig: ChartConfig;
}

export function SubmissionsStatsChart({ submissionChartData, chartConfig }: SubmissionsStatsChartProps) {
  if (submissionChartData.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <BarChart3 className="mr-2 h-5 w-5 text-primary"/>
          Submissions per Test
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full aspect-video">
          <BarChart accessibilityLayer data={submissionChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="testTitle"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
            />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
