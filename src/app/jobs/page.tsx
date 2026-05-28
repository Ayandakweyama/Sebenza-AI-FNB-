import { Metadata } from 'next';
import JobsClient from './JobsClient';

export const metadata: Metadata = {
  title: 'Job Portal | Sebenza AI',
  description: 'Your AI Career Command Center — discover opportunities, analyze the market, and automate applications.',
};

export default function JobsPage() {
  return (
    <JobsClient />
  );
}
