
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Test } from '@/lib/types';
import { FileText, Edit, Share2, Trash2, KeyRound, Eye, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TestListItemProps {
  test: Test;
  onDeleteRequest: (test: Test) => void;
  onCloneRequest: (testId: string) => void;
}

export function TestListItem({ test, onDeleteRequest, onCloneRequest }: TestListItemProps) {
  const { toast } = useToast();
  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}/test/${test.id}` : '';

  const handleShare = async () => {
    if (!shareLink) {
        toast({ title: "Error", description: "Could not generate share link.", variant: "destructive" });
        return;
    }
    try {
      if (navigator.share) {
        await navigator.share({
          title: test.title,
          text: `Take the test: ${test.title}`,
          url: shareLink,
        });
         toast({ title: "Shared!", description: "Test link shared successfully."});
      } else {
        await navigator.clipboard.writeText(shareLink);
        toast({ title: "Copied!", description: "Test link copied to clipboard."});
      }
    } catch (error) {
      console.error('Error sharing/copying:', error);
      try { // Fallback to clipboard if navigator.share fails for any reason
        await navigator.clipboard.writeText(shareLink);
        toast({ title: "Copied!", description: "Share failed, link copied to clipboard instead."});
      } catch (copyError) {
        toast({ title: "Error", description: "Could not share or copy link.", variant: "destructive" });
      }
    }
  };
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-1">
          <CardTitle className="text-xl font-semibold flex items-center text-primary">
            <FileText className="mr-2 h-5 w-5" />
            {test.title}
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground space-x-2">
          <span>{test.questions.length} question{test.questions.length === 1 ? '' : 's'}</span>
          <span>&bull;</span>
          <span>Created: {format(new Date(test.createdAt), 'PP')}</span>
          {test.password && (
            <>
              <span>&bull;</span>
              <span className="inline-flex items-center font-medium text-amber-600 dark:text-amber-500">
                <KeyRound className="h-3 w-3 mr-1" />
                Protected
              </span>
            </>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow pt-2 pb-4">
        {test.description ? (
          <p className="text-sm text-foreground/80 line-clamp-3">{test.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No description provided.</p>
        )}
      </CardContent>
      
      <TooltipProvider delayDuration={100}>
        <CardFooter className="flex flex-wrap justify-end gap-2 pt-3 border-t border-border/50 mt-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleShare} 
                aria-label={`Share ${test.title}`}
                className="transition-transform duration-150 hover:scale-110"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share Test</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => onCloneRequest(test.id)} 
                aria-label={`Clone ${test.title}`}
                className="transition-transform duration-150 hover:scale-110"
              >
                <Copy className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clone Test</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                asChild 
                aria-label={`Edit ${test.title}`}
                className="transition-transform duration-150 hover:scale-110"
              >
                <Link href={`/admin/edit/${test.id}`}>
                  <Edit className="h-5 w-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Test</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="destructive" 
                size="icon" 
                onClick={() => onDeleteRequest(test)} 
                aria-label={`Delete ${test.title}`}
                className="transition-transform duration-150 hover:scale-110"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Test</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="default" 
                size="icon" 
                asChild 
                aria-label={`View ${test.title}`}
                className="transition-transform duration-150 hover:scale-110"
              >
                <Link href={`/test/${test.id}`} target="_blank">
                  <Eye className="h-5 w-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Test</p>
            </TooltipContent>
          </Tooltip>
        </CardFooter>
      </TooltipProvider>
    </Card>
  );
}
