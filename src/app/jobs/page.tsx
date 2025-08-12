import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Job Portal | Sebenza AI',
  description: 'Find and manage your job opportunities with Sebenza AI',
};

export default async function JobsPage() {
  // Redirect to /jobs/all as the default jobs page
  redirect('/jobs/all');
}
