import dynamic from 'next/dynamic';

// Dynamically import the client component
const AllJobsClient = dynamic(
  () => import('./AllJobsClient'),
  { 
    loading: () => (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading jobs...</div>
      </div>
    ) 
  }
);

export const metadata = {
  title: 'All Jobs | Sebenza AI',
  description: 'Browse and discover job opportunities that match your skills and preferences.',
};

export default function AllJobsPage() {
  return <AllJobsClient />;
}