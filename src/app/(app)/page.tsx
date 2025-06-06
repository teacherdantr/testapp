
'use client';

import { HomeHeader } from '@/components/home/HomeHeader';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { WorkflowSection } from '@/components/home/WorkflowSection';
import { EducatorCtaSection } from '@/components/home/EducatorCtaSection';
import { NewsletterSection } from '@/components/home/NewsletterSection';

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
