
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

const gs6Category = {
    name: 'IC3 GS6',
    tests: [
        { name: 'Digital Literacy Level 1', image: '/images/ic3-digital-literacy-1.png', hint: 'ic3 digital literacy' },
        { name: 'Digital Literacy Level 2', image: '/images/ic3-digital-literacy-2.png', hint: 'ic3 digital literacy' },
        { name: 'Digital Literacy Level 3', image: '/images/ic3-digital-literacy-3.png', hint: 'ic3 digital literacy' },
    ]
};

const mosCategory = {
    name: 'Microsoft Office Specialist',
    tests: [
        { name: 'Word 2016', image: '/images/mos-word-2016.png', hint: 'mos logo word' },
        { name: 'Excel 2016', image: '/images/mos-excel-2016.png', hint: 'mos logo excel' },
        { name: 'PowerPoint 2016', image: '/images/mos-powerpoint-2016.png', hint: 'mos logo powerpoint' },
        { name: 'Access 2016', image: '/images/mos-access-2016.png', hint: 'mos logo access' },
        { name: 'Outlook 2016', image: '/images/mos-outlook-2016.png', hint: 'mos logo outlook' },
        { name: 'Word 2016 Expert', image: '/images/mos-word-expert-2016.png', hint: 'mos logo word expert' },
        { name: 'Excel 2016 Expert', image: '/images/mos-excel-expert-2016.png', hint: 'mos logo excel expert' },
    ]
};

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
        <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">{gs6Category.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                {gs6Category.tests.map(test => (
                    <TestCard key={test.name} name={test.name} image={test.image} hint={test.hint} />
                ))}
            </div>
        </section>

        <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">{mosCategory.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                {mosCategory.tests.map(test => (
                    <TestCard key={test.name} name={test.name} image={test.image} hint={test.hint} />
                ))}
            </div>
        </section>
      </main>
    </div>
  );
}
