'use client';

import { Toaster } from 'sonner';

export default function AppToaster() {
  return (
    <Toaster
      theme="dark"
      position="bottom-center"
      toastOptions={{
        style: {
          background: 'rgba(5, 6, 21, 0.72)',
          border: '1px solid rgba(255,255,255,0.10)',
          color: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        },
      }}
    />
  );
}

