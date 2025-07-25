'use client';

import { useMemo } from 'react';
import type { StoredTestResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, BookOpenCheck, Users, Percent } from 'lucide-react';

interface SubmissionsStatsCardsProps {
  submissions: StoredTestResult[];
}

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    description: string;
}

const StatCard = ({ title, value, icon: Icon, description }: StatCardProps) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);


export function SubmissionsStatsCards({ submissions }: SubmissionsStatsCardsProps) {
  const stats = useMemo(() => {
    if (!submissions || submissions.length === 0) {
      return {
        totalSubmissions: 0,
        uniqueTests: 0,
        uniqueTakers: 0,
        averageScore: 0,
      };
    }

    const totalSubmissions = submissions.length;
    const uniqueTests = new Set(submissions.map(s => s.testId)).size;
    const uniqueTakers = new Set(submissions.map(s => s.userId)).size;
    
    const totalPercentage = submissions.reduce((acc, sub) => {
      if (sub.totalPoints > 0) {
        return acc + (sub.score / sub.totalPoints) * 100;
      }
      return acc;
    }, 0);
    
    const averageScore = totalSubmissions > 0 ? totalPercentage / totalSubmissions : 0;

    return {
      totalSubmissions,
      uniqueTests,
      uniqueTakers,
      averageScore,
    };
  }, [submissions]);

  if (submissions.length === 0) {
    return null; // Don't render stat cards if there's no data
  }


  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
            title="Total Submissions"
            value={stats.totalSubmissions.toLocaleString()}
            icon={ClipboardList}
            description="Total number of tests taken."
        />
        <StatCard 
            title="Unique Tests"
            value={stats.uniqueTests.toLocaleString()}
            icon={BookOpenCheck}
            description="Tests with at least one submission."
        />
         <StatCard 
            title="Unique Takers"
            value={stats.uniqueTakers.toLocaleString()}
            icon={Users}
            description="Unique identifiers who took tests."
        />
        <StatCard 
            title="Average Score"
            value={`${stats.averageScore.toFixed(1)}%`}
            icon={Percent}
            description="Platform-wide average score."
        />
    </div>
  );
}
