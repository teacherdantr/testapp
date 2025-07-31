
'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Image from 'next/image';

const categories = [
    {
        name: 'IC3 GS4',
        tests: [
            { name: 'Computing Fundamentals (GS4)', image: '/images/gmetrix-in-development.png', hint: 'gmetrix logo' },
            { name: 'Key Applications (GS4)', image: '/images/ic3-key-applications.png', hint: 'ic3 logo key' },
            { name: 'Living Online (GS4)', image: '/images/ic3-living-online.png', hint: 'ic3 logo online' },
        ]
    },
    {
        name: 'IC3 GS5',
        tests: [
            { name: 'Computing Fundamentals', image: '/images/ic3-computing-fundamentals-2013.png', hint: 'ic3 logo 2013' },
            { name: 'Computing Fundamentals (Office 2016)', image: '/images/ic3-computing-fundamentals-2016.png', hint: 'ic3 logo 2016' },
            { name: 'IC3 Fast Track', image: '/images/ic3-fast-track.png', hint: 'ic3 logo fasttrack' },
            { name: 'IC3 GS5 Spark', image: '/images/ic3-spark.png', hint: 'ic3 logo spark' },
        ]
    },
     {
        name: 'Microsoft Office Specialist',
        tests: [
            { name: 'MOS Access 2016', image: '/images/mos-access-2016.png', hint: 'mos logo access' },
            { name: 'MOS Excel 2016', image: '/images/mos-excel-2016.png', hint: 'mos logo excel' },
            { name: 'MOS Outlook 2016', image: '/images/mos-outlook-2016.png', hint: 'mos logo outlook' },
            { name: 'MOS PowerPoint 2016', image: '/images/mos-powerpoint-2016.png', hint: 'mos logo powerpoint' },
        ]
    }
];

const TestCard = ({ name, image, hint }: { name: string, image: string, hint: string }) => (
    <div className="flex flex-col items-center gap-2 cursor-pointer group">
        <Card className="w-full aspect-[16/10] flex items-center justify-center p-4 shadow-md hover:shadow-lg hover:border-primary transition-all duration-200">
             <div className="relative w-full h-full">
                <Image src={image} alt={name} fill style={{ objectFit: 'contain' }} data-ai-hint={hint} />
             </div>
        </Card>
        <p className="text-sm font-medium text-center text-gray-600 group-hover:text-primary transition-colors">{name}</p>
    </div>
);


export default function GmtxPage() {
  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <header className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
            <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">Sort By</label>
            <Select>
                <SelectTrigger id="sort-by" className="w-[180px]">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search" className="pl-9" />
        </div>
      </header>
      
      <main className="flex-1 p-6 space-y-8 overflow-y-auto">
        {categories.map((category) => (
            <section key={category.name}>
                <h2 className="text-xl font-bold text-gray-800 mb-4">{category.name}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                   {category.tests.map(test => (
                       <TestCard key={test.name} name={test.name} image={test.image} hint={test.hint} />
                   ))}
                </div>
            </section>
        ))}
      </main>
    </div>
  );
}
