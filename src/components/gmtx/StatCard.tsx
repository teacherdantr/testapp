
'use client';

import { Card } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  subLabel?: string;
  value: number | string;
}

export function StatCard({ label, subLabel, value }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Card className="w-24 h-24 flex items-center justify-center shadow-md">
        <span className="text-4xl font-bold text-gray-800">{value}</span>
      </Card>
      <div className="text-sm font-medium text-gray-600">
        {subLabel || label}
        {subLabel && <div className="text-xs text-muted-foreground">{label}</div>}
      </div>
    </div>
  );
}
