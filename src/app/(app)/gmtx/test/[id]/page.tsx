
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAdminTestById } from '@/lib/actions/test/getTests';
import type { Test } from '@/lib/types';
import { Loader2, ShieldCheck, FileText } from 'lucide-react';
import { GmtxPasswordPrompt } from '@/components/gmtx/test/GmtxPasswordPrompt';
import { verifyGmtxTestPassword } from '@/lib/actions/gmtxActions';
import { GmtxTestInterface } from './GmtxTestInterface';


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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
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
  
  if (test && isPasswordVerified) {
    return <GmtxTestInterface test={test} />;
  }

  // Fallback for when test is null after loading but password is not required (e.g. test not found)
  // Or when verification is stuck somehow.
  return (
     <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h2 className="text-2xl font-bold text-red-600">Error</h2>
        <p className="text-gray-700">Could not display the test. Please try again.</p>
      </div>
  )
}
