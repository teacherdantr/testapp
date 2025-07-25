
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    title: 'Easy Test Creation',
    description: 'Intuitive tools for educators to build comprehensive tests with various question types.',
    imageSrc: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyMHx8dGVzdCUyMHdlYiUyMGFwcHxlbnwwfHx8fDE3NDgzMTMwNjd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    dataAiHint: 'test creation',
    aosDelay: '0',
  },
  {
    title: 'Online Test Taking',
    description: 'Seamless experience for students to take tests online from anywhere, on any device.',
    imageSrc: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxvbmxpbmUlMjBsZWFybmluZ3xlbnwwfHx8fDE3NTIyNjI5MDF8MA&ixlib=rb-4.0.3&q=80&w=1080',
    dataAiHint: 'online learning',
    aosDelay: '100',
  },
   {
    title: 'Instant Results',
    description: 'Immediate feedback and detailed score reports upon test completion for quick insights.',
    imageSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxhbmFseXRpY3MlMjBkYXNoYm9hcmR8ZW58MHx8fHwxNzUyMjYyOTgwfDA&ixlib=rb-4.0.3&q=80&w=1080',
    dataAiHint: 'analytics dashboard',
    aosDelay: '200',
  },
  {
    title: 'Secure & Fair',
    description: 'Optional password protection and AI-powered bias prevention for fair assessments.',
    imageSrc: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxzZWN1cml0eSUyMHNoaWVsZHxlbnwwfHx8fDE3NTIyNjMwNDB8MA&ixlib=rb-4.0.3&q=80&w=1080',
    dataAiHint: 'security shield',
    aosDelay: '300',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24 bg-card w-full overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-primary mb-16 md:mb-20" data-aos="fade-up">
          Why Choose TestWave?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="text-center shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group hover:scale-105 overflow-hidden rounded-lg"
              data-aos="fade-up"
              data-aos-delay={feature.aosDelay}
            >
              <div className="relative w-full h-48">
                <Image
                  src={feature.imageSrc}
                  alt={`${feature.title} illustrative image`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                  data-ai-hint={feature.dataAiHint}
                />
              </div>
              <CardHeader className="pt-6 pb-3">
                <CardTitle className="text-2xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow pt-0 pb-6 px-6">
                <p className="text-muted-foreground text-base leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
