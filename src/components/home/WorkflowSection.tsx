
import { FilePlus2, Share2, Users, BarChart3 } from 'lucide-react';

const workflowSteps = [
  {
    icon: FilePlus2,
    title: 'Create Tests',
    description: 'Educators design tests with various question types using our intuitive admin interface.',
  },
  {
    icon: Share2,
    title: 'Share Links',
    description: 'Distribute unique test links or IDs to students easily and securely.',
  },
  {
    icon: Users,
    title: 'Students Take Tests',
    description: 'Test-takers complete assessments online, from any device with internet access.',
  },
  {
    icon: BarChart3,
    title: 'View Results',
    description: 'Get instant scores and detailed answer breakdowns upon test completion.',
  },
];

export function WorkflowSection() {
  return (
    <section className="py-16 md:py-24 bg-background w-full">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-primary mb-16 md:mb-20">
          How TestWave Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {workflowSteps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-6">
                <step.icon className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-primary mb-3">{step.title}</h3>
              <p className="text-muted-foreground text-base leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
