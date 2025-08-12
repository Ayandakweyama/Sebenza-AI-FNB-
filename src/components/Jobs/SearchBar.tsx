'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export function SearchBar() {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        type="search"
        placeholder="Search jobs..."
        className="w-full pl-9 pr-4 py-2"
      />
      <Button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 h-8">
        Search
      </Button>
    </div>
  );
}
