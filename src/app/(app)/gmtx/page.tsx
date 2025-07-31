
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
        { name: 'Digital Literacy Level 1', image: 'https://content.gmetrix.net/images/ColorSVGIcons/IconIC3Level1.svg', hint: 'ic3 digital literacy' },
        { name: 'Digital Literacy Level 2', image: 'https://content.gmetrix.net/images/ColorSVGIcons/IconIC3Level2.svg', hint: 'ic3 digital literacy' },
        { name: 'Digital Literacy Level 3', image: 'https://content.gmetrix.net/images/ColorSVGIcons/IconIC3Level3.svg', hint: 'ic3 digital literacy' },
    ]
};

const mosCategory = {
    name: 'Microsoft Office Specialist',
    tests: [
        { name: 'Word 2016', image: 'https://images.credly.com/images/fd092703-61db-4e9f-9c7c-2211d44ca87d/MOS_Word.png', hint: 'mos logo word' },
        { name: 'Excel 2016', image: 'https://images.credly.com/images/9d2bcbe6-519f-4ed0-ad34-aca077421568/MOS_Excel.png', hint: 'mos logo excel' },
        { name: 'PowerPoint 2016', image: 'https://images.credly.com/images/ccfeac51-f472-404a-abf1-97ed89dda03b/twitter_thumb_201604_MOS_PowerPoint.png', hint: 'mos logo powerpoint' },
        { name: 'Access 2016', image: 'https://images.credly.com/images/cbcee0cb-3281-4c8d-b402-7dc8bcf81426/MOS_Access.png', hint: 'mos logo access' },
        { name: 'Outlook 2016', image: 'https://images.credly.com/images/20bcb721-dd1c-482d-832e-02ee7e72fbd0/MOS_Outlook.png', hint: 'mos logo outlook' },
        { name: 'Word 2016 Expert', image: 'https://images.credly.com/images/c9ab0811-5167-49b4-9459-7dd2e3d0a192/image.png', hint: 'mos logo word expert' },
        { name: 'Excel 2016 Expert', image: 'https://placehold.co/100x100.png', hint: 'mos logo excel expert' },
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
