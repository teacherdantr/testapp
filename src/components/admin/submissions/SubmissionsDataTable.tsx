
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { AlertTriangle, User, BookOpenText, CalendarDays, Percent, ArrowUp, ArrowDown, Timer, Zap, Users, Search } from 'lucide-react';
import type { StoredTestResult } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type SortableKeys = 'testTitle' | 'userId' | 'percentage' | 'submittedAt' | 'timeTaken' | 'testMode';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableKeys | null;
  direction: SortDirection;
}

interface SubmissionsDataTableProps {
  submissions: StoredTestResult[];
  isLoading: boolean; // Retained for potential future internal loading states
  error: string | null;
}

const formatTimeTaken = (seconds?: number): string => {
  if (seconds === undefined || seconds === null) return 'N/A';
  if (seconds < 0) return 'N/A'; // Should not happen
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

export function SubmissionsDataTable({ submissions, isLoading, error }: SubmissionsDataTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'submittedAt', direction: 'descending' });
  const [searchTerm, setSearchTerm] = useState('');

  const sortedSubmissions = useMemo(() => {
    let filteredItems = [...submissions];

    if (searchTerm.trim() !== '') {
      const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
      filteredItems = filteredItems.filter(submission =>
        submission.testTitle.toLowerCase().includes(lowercasedSearchTerm) ||
        submission.userId.toLowerCase().includes(lowercasedSearchTerm)
      );
    }

    let sortableItems = [...filteredItems];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key === 'percentage') {
          aValue = a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0;
          bValue = b.totalPoints > 0 ? (b.score / b.totalPoints) * 100 : 0;
        } else if (sortConfig.key === 'submittedAt') {
          aValue = new Date(a.submittedAt).getTime();
          bValue = new Date(b.submittedAt).getTime();
        } else if (sortConfig.key === 'timeTaken') {
          aValue = a.timeTaken ?? Infinity;
          bValue = b.timeTaken ?? Infinity;
        } else if (sortConfig.key === 'testMode') {
          aValue = a.testMode || '';
          bValue = b.testMode || '';
        } else {
          aValue = a[sortConfig.key!];
          bValue = b[sortConfig.key!];
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
             if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
             if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
             return 0;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [submissions, sortConfig, searchTerm]);

  const requestSort = (key: SortableKeys) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortableKeys) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const getScoreColorClass = (score: number, totalPoints: number): string => {
    if (totalPoints === 0) return 'text-muted-foreground';
    const percentage = (score / totalPoints) * 100;
    if (percentage < 50) return 'text-red-600 dark:text-red-400';
    if (percentage < 75) return 'text-amber-600 dark:text-amber-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getModeDisplay = (mode?: 'training' | 'testing') => {
    if (!mode) return <span className="text-xs text-muted-foreground italic ml-1.5">N/A</span>;
    const Icon = mode === 'training' ? Users : Zap;
    const text = mode.charAt(0).toUpperCase() + mode.slice(1);
    return (
      <span className={cn(
        "inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full ml-1.5",
        mode === 'training' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
      )}>
        <Icon className="h-3 w-3 mr-1" />
        {text}
      </span>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by Test Title or User ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md pl-10 h-11"
          />
        </div>
      </div>

      {error && submissions.length === 0 && !isLoading && (
        <Alert variant={error === 'No test submissions found yet.' ? 'default' : 'destructive'} className="mt-0">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>{error === 'No test submissions found yet.' ? 'Information' : 'Error'}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && submissions.length > 0 && sortedSubmissions.length === 0 && searchTerm.trim() !== '' && (
        <Alert variant="default" className="mt-0">
          <Search className="h-5 w-5" />
          <AlertTitle>No Matching Records</AlertTitle>
          <AlertDescription>Your search for "{searchTerm}" did not match any test submissions.</AlertDescription>
        </Alert>
      )}
      
      {!isLoading && submissions.length > 0 && sortedSubmissions.length === 0 && searchTerm.trim() === '' && error && (
         <Alert variant="default" className="mt-0">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {sortedSubmissions.length > 0 && !isLoading && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%]">
                <Button variant="ghost" onClick={() => requestSort('testTitle')} className="px-1 py-0.5 h-auto hover:bg-accent/80">
                  <BookOpenText className="inline-block mr-2 h-5 w-5 text-muted-foreground" />Test Title / Mode
                  {getSortIcon('testTitle')}
                </Button>
              </TableHead>
              <TableHead className="w-[15%]">
                <Button variant="ghost" onClick={() => requestSort('userId')} className="px-1 py-0.5 h-auto hover:bg-accent/80">
                  <User className="inline-block mr-2 h-5 w-5 text-muted-foreground" />User ID
                  {getSortIcon('userId')}
                </Button>
              </TableHead>
              <TableHead className="text-right w-[15%]">
                 <Button variant="ghost" onClick={() => requestSort('percentage')} className="px-1 py-0.5 h-auto hover:bg-accent/80 float-right">
                  <Percent className="inline-block mr-2 h-5 w-5 text-muted-foreground" />Score / %
                  {getSortIcon('percentage')}
                </Button>
              </TableHead>
              <TableHead className="text-right w-[15%]">
                <Button variant="ghost" onClick={() => requestSort('timeTaken')} className="px-1 py-0.5 h-auto hover:bg-accent/80 float-right">
                  <Timer className="inline-block mr-2 h-5 w-5 text-muted-foreground" />Time Taken
                  {getSortIcon('timeTaken')}
                </Button>
              </TableHead>
              <TableHead className="text-right w-[20%]">
                <Button variant="ghost" onClick={() => requestSort('submittedAt')} className="px-1 py-0.5 h-auto hover:bg-accent/80 float-right">
                  <CalendarDays className="inline-block mr-2 h-5 w-5 text-muted-foreground" />Submitted At
                  {getSortIcon('submittedAt')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSubmissions.map((result) => (
              <TableRow key={`${result.testId}-${result.userId}-${result.submittedAt}`}>
                <TableCell className="font-medium text-primary">
                  {result.testTitle}
                  {getModeDisplay(result.testMode)}
                </TableCell>
                <TableCell>{result.userId}</TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold",
                    getScoreColorClass(result.score, result.totalPoints)
                  )}
                >
                  {result.score} / {result.totalPoints}
                  <span className="ml-2 text-muted-foreground text-xs font-normal">
                    ({result.totalPoints > 0 ? ((result.score / result.totalPoints) * 100).toFixed(0) : 0}%)
                  </span>
                </TableCell>
                <TableCell className="text-right">{formatTimeTaken(result.timeTaken)}</TableCell>
                <TableCell className="text-right">{format(new Date(result.submittedAt), 'PPp')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
