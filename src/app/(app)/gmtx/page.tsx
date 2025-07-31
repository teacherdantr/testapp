'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shapes } from 'lucide-react';

export default function GmtxPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8 px-4 flex items-center justify-center min-h-[calc(100vh-250px)]">
      <Card className="w-full">
        <CardHeader className="text-center">
          <Shapes className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold text-primary">GMTX Page</CardTitle>
           <CardDescription className="text-lg text-muted-foreground pt-1">
            UI to be provided later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            This page is ready for your custom UI components and logic.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
