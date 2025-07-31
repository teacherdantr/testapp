
'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface SessionCardProps {
  lastSaved: string;
  mode: 'Testing' | 'Training';
  progress: number;
}

export function SessionCard({ lastSaved, mode, progress }: SessionCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Last Saved: {lastSaved}</span>
          <span>Chế độ: {mode}</span>
        </div>
        <div>
          <span className="text-sm font-medium">Tiến độ: {progress}%</span>
          <Progress value={progress} className="mt-1 h-2" />
        </div>
      </CardContent>
      <CardFooter className="p-2 pt-0">
        <Button className="w-full">Resume Test</Button>
      </CardFooter>
    </Card>
  );
}
