
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, FileText, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Test } from '@/lib/types';
import { getAllTests, deleteTestById } from '@/lib/actions/testActions';
import { TestListItem } from '@/components/admin/TestListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
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

// Removed metadata export as this is a client component
// export const metadata: Metadata = {
//   title: 'Admin Dashboard - TestWave',
//   description: 'Manage tests, view results, and configure settings on the TestWave platform.',
// };

export default function AdminDashboardPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const { toast } = useToast();

  const loadTests = async () => {
    setIsLoading(true);
    try {
      const fetchedTests = await getAllTests();
      setTests(fetchedTests);
    } catch (error) {
      console.error("Failed to fetch tests:", error);
      toast({
        title: "Error",
        description: "Failed to load tests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  const handleDeleteRequest = (test: Test) => {
    setTestToDelete(test);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTest = async () => {
    if (!testToDelete) return;

    const result = await deleteTestById(testToDelete.id);
    if (result.success) {
      toast({
        title: "Test Deleted",
        description: `"${testToDelete.title}" has been successfully deleted.`,
      });
      setTests(prevTests => prevTests.filter(test => test.id !== testToDelete.id));
    } else {
      toast({
        title: "Error Deleting Test",
        description: result.error || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
    setTestToDelete(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <FileText className="mr-3 h-8 w-8" />
          Admin Dashboard
        </h1>
        <Button asChild size="lg">
          <Link href="/admin/create">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Test
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Existing Tests</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="shadow-md">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 pt-4">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : tests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <TestListItem key={test.id} test={test} onDeleteRequest={handleDeleteRequest} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-card rounded-lg shadow">
            <p className="text-muted-foreground text-lg">No tests found.</p>
            <p className="mt-2">Why not create your first test?</p>
            <Button asChild className="mt-4">
              <Link href="/admin/create">
                <PlusCircle className="mr-2 h-5 w-5" /> Create Test
              </Link>
            </Button>
          </div>
        )}
      </div>

      {testToDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-6 w-6 text-destructive" />
                Confirm Deletion
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the test "{testToDelete.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteTest}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Test
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
