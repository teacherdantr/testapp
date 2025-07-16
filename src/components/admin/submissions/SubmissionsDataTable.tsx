
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { AlertTriangle, User, BookOpenText, CalendarDays, Percent, ArrowUp, ArrowDown, Timer, Zap, Users, Search, Eye, Trash2, ChevronLeft, ChevronRight, Rocket, ClipboardList } from 'lucide-react';
import type { StoredTestResult } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { deleteUserScoreByIds } from '@/lib/actions/userActions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


type SortableKeys = 'testTitle' | 'userId' | 'percentage' | 'submittedAt' | 'timeTaken' | 'testMode';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortableKeys | null;
  direction: SortDirection;
}

interface SubmissionsDataTableProps {
  submissions: StoredTestResult[];
  onSubmissionDeleted: (submission: StoredTestResult) => void;
}

const RECORDS_PER_PAGE = 30;

const formatTimeTaken = (seconds?: number): string => {
  if (seconds === undefined || seconds === null) return 'N/A';
  if (seconds < 0) return 'N/A';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

export function SubmissionsDataTable({ submissions, onSubmissionDeleted }: SubmissionsDataTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'submittedAt', direction: 'descending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<StoredTestResult | null>(null);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);

  const sortedAndFilteredSubmissions = useMemo(() => {
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

  const totalPages = Math.ceil(sortedAndFilteredSubmissions.length / RECORDS_PER_PAGE);
  const currentItemsToDisplay = sortedAndFilteredSubmissions.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const requestSort = (key: SortableKeys) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page on sort change
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

  const getModeDisplay = (mode?: 'training' | 'testing' | 'race') => {
    if (!mode) return <span className="text-xs text-muted-foreground italic ml-1.5">N/A</span>;
    const Icon = mode === 'training' ? Users : (mode === 'race' ? Rocket : Zap); // Zap for testing
    const text = mode.charAt(0).toUpperCase() + mode.slice(1);
    let bgColor = "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"; // Default for testing
    if (mode === 'training') bgColor = "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
    if (mode === 'race') bgColor = "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";


    return (
      <span className={cn(
        "inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full ml-1.5",
        bgColor
      )}>
        <Icon className="h-3 w-3 mr-1" />
        {text}
      </span>
    );
  };

  const handleViewDetails = (submission: StoredTestResult) => {
    console.log("[SubmissionsDataTable] View Details clicked for:", submission);
    toast({
        title: `Details for ${submission.userId}'s Test`,
        description: (
            <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 overflow-x-auto">
                <code className="text-white text-xs">
                    {JSON.stringify({
                        testTitle: submission.testTitle,
                        score: `${submission.score}/${submission.totalPoints}`,
                        submittedAt: format(new Date(submission.submittedAt), 'PPpp'),
                        timeTaken: formatTimeTaken(submission.timeTaken),
                        mode: submission.testMode || "N/A"
                    }, null, 2)}
                </code>
            </pre>
        ),
        duration: 10000,
    });
  };

  const handleDeleteRequest = (submission: StoredTestResult) => {
    console.log("[SubmissionsDataTable] Delete request for submission:", submission);
    setSubmissionToDelete(submission);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSubmission = async () => {
    if (!submissionToDelete) return;
    console.log("[SubmissionsDataTable] Confirming delete for submission:", submissionToDelete);

    const result = await deleteUserScoreByIds({
      userId: submissionToDelete.userId,
      testId: submissionToDelete.testId,
      submittedAt: submissionToDelete.submittedAt,
    });
    console.log("[SubmissionsDataTable] Delete action result:", result);

    if (result.success) {
      onSubmissionDeleted(submissionToDelete);
    } else {
      toast({
        title: "Error Deleting Submission",
        description: result.error || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
    setSubmissionToDelete(null);
  };

  const renderContent = () => {
    if (submissions.length === 0) {
      return (
        <Alert variant="default" className="mt-0">
          <ClipboardList className="h-5 w-5" />
          <AlertTitle>No Submissions Yet</AlertTitle>
          <AlertDescription>There are no test submissions recorded on the platform.</AlertDescription>
        </Alert>
      );
    }

    if (sortedAndFilteredSubmissions.length === 0 && searchTerm.trim() !== '') {
      return (
        <Alert variant="default" className="mt-0">
          <Search className="h-5 w-5" />
          <AlertTitle>No Matching Records</AlertTitle>
          <AlertDescription>Your search for "{searchTerm}" did not match any test submissions.</AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%] min-w-[200px]">
                  <Button variant="ghost" onClick={() => requestSort('testTitle')} className="px-1 py-0.5 h-auto hover:bg-accent/80">
                    <BookOpenText className="inline-block mr-2 h-5 w-5 text-muted-foreground" />Test Title / Mode
                    {getSortIcon('testTitle')}
                  </Button>
                </TableHead>
                <TableHead className="w-[15%] min-w-[120px]">
                  <Button variant="ghost" onClick={() => requestSort('userId')} className="px-1 py-0.5 h-auto hover:bg-accent/80">
                    <User className="inline-block mr-2 h-5 w-5 text-muted-foreground" />User ID
                    {getSortIcon('userId')}
                  </Button>
                </TableHead>
                <TableHead className="text-right w-[15%] min-w-[150px]">
                   <Button variant="ghost" onClick={() => requestSort('percentage')} className="px-1 py-0.5 h-auto hover:bg-accent/80 float-right">
                    <Percent className="inline-block mr-2 h-5 w-5 text-muted-foreground" />Score / %
                    {getSortIcon('percentage')}
                  </Button>
                </TableHead>
                <TableHead className="text-right w-[12%] min-w-[120px]">
                  <Button variant="ghost" onClick={() => requestSort('timeTaken')} className="px-1 py-0.5 h-auto hover:bg-accent/80 float-right">
                    <Timer className="inline-block mr-2 h-5 w-5 text-muted-foreground" />Time
                    {getSortIcon('timeTaken')}
                  </Button>
                </TableHead>
                <TableHead className="text-right w-[18%] min-w-[180px]">
                  <Button variant="ghost" onClick={() => requestSort('submittedAt')} className="px-1 py-0.5 h-auto hover:bg-accent/80 float-right">
                    <CalendarDays className="inline-block mr-2 h-5 w-5 text-muted-foreground" />Submitted
                    {getSortIcon('submittedAt')}
                  </Button>
                </TableHead>
                <TableHead className="text-center w-[15%] min-w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItemsToDisplay.map((result) => (
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
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(result)} className="hover:text-primary">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>View Details</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRequest(result)} className="hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Submission</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Delete Submission</p></TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div>
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by Test Title or User ID..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full max-w-md pl-10 h-11"
              disabled={submissions.length === 0}
            />
          </div>
        </div>
        
        {renderContent()}

        {submissionToDelete && (
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-6 w-6 text-destructive" />
                  Confirm Deletion
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the submission by '{submissionToDelete.userId}' for test "{submissionToDelete.testTitle}" taken on {format(new Date(submissionToDelete.submittedAt), 'PPp')}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteSubmission}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Submission
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </TooltipProvider>
  );
}
