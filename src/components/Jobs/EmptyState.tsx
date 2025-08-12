import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonHref?: string;
}

export function EmptyState({ 
  title, 
  description, 
  buttonText = 'Browse Jobs',
  buttonHref = '/jobs'
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-50">
        <FileText className="h-8 w-8 text-blue-500" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {buttonText && buttonHref && (
        <div className="mt-6">
          <Link href={buttonHref}>
            <Button>
              {buttonText}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
