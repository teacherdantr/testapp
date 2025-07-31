
'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePenLine, MoreVertical, CheckCircle2 } from 'lucide-react';

interface PracticeExamItemProps {
  name: string;
  passed: boolean;
}

export function PracticeExamItem({ name, passed }: PracticeExamItemProps) {
  return (
    <Card className="p-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <FilePenLine className="h-5 w-5 text-purple-600 shrink-0" />
        <p className="font-medium text-gray-700 truncate">{name}</p>
      </div>

      <div className="hidden md:flex items-center gap-6 text-sm text-gray-600 ml-4">
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500">Passed</span>
          {passed ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500">Ngày hết hạn</span>
          <span>4 thg 11, 2025</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500">Last Activity</span>
          <span>Hôm qua</span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <Button>Bắt đầu</Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
}
