
import { HomeHeader } from '@/components/home/HomeHeader';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import sections that are likely below the fold
const FeaturesSection = dynamic(() => import('@/components/home/FeaturesSection').then(mod => mod.FeaturesSection), { 
  loading: () => <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
});
const WorkflowSection = dynamic(() => import('@/components/home/WorkflowSection').then(mod => mod.WorkflowSection), {
  loading: () => <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
});
const EducatorCtaSection = dynamic(() => import('@/components/home/EducatorCtaSection').then(mod => mod.EducatorCtaSection), {
  loading: () => <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
});
const NewsletterSection = dynamic(() => import('@/components/home/NewsletterSection').then(mod => mod.NewsletterSection), {
  loading: () => <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>,
  // ssr: false removed - NewsletterSection is a Client Component, Next.js handles it.
});

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      <HomeHeader />
      <FeaturesSection />
      <WorkflowSection />
      <EducatorCtaSection />
      <NewsletterSection />
    </div>
  );
}

