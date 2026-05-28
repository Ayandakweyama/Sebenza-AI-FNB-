'use client';

import dynamic from 'next/dynamic';

const JobPortalClient = dynamic(() => import('./JobPortalClient'), { ssr: false });

export default function JobsClient() {
  return <JobPortalClient />;
}

