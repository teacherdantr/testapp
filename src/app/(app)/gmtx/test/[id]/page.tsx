
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAdminTestById } from '@/lib/actions/test/getTests';
import type { Test } from '@/lib/types';
import { Loader2, ShieldCheck, FileText } from 'lucide-react';
import { GmtxPasswordPrompt } from '@/components/gmtx/test/GmtxPasswordPrompt';
import { verifyGmtxTestPassword } from '@/lib/actions/gmtxActions';


export default function GmtxTestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  
  const loadTest = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const testData = await fetchAdminTestById(testId);
    if (testData) {
      setTest(testData);
      if (!testData.password) {
        setIsPasswordVerified(true);
      }
    } else {
      setError('Test not found.');
    }
    setIsLoading(false);
  }, [testId]);

  useEffect(() => {
    loadTest();
  }, [loadTest]);
  
  const handleVerifyPassword = async (password: string) => {
    const result = await verifyGmtxTestPassword(testId, password);
    if (result.authorized) {
        setIsPasswordVerified(true);
    } else {
        setError(result.error || "Incorrect password.");
    }
    return result.authorized;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="mt-4 text-lg text-gray-600">Loading Test...</p>
      </div>
    );
  }

  if (error && !test) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="text-gray-700">{error}</p>
      </div>
    );
  }

  if (test && !isPasswordVerified && test.password) {
    return (
        <GmtxPasswordPrompt 
            onVerify={handleVerifyPassword}
            error={error}
            onClose={() => router.back()}
        />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white shadow-lg rounded-xl">
        <ShieldCheck className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h1 className="text-3xl font-bold text-gray-800">Test Ready!</h1>
        <p className="text-gray-600 mt-2">The test-taking interface will be implemented here.</p>
        <div className="mt-4 text-left bg-gray-100 p-4 rounded-md text-sm text-gray-700">
            <h3 className="font-semibold flex items-center"><FileText className="h-4 w-4 mr-2"/>Test Details</h3>
            <p><strong>ID:</strong> {test?.id}</p>
            <p><strong>Title:</strong> {test?.title}</p>
        </div>
      </div>
    </div>
  );
}
