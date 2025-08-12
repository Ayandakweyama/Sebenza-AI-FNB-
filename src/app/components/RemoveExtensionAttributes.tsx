'use client';

import { useEffect } from 'react';

export default function RemoveExtensionAttributes() {
  useEffect(() => {
    // Remove common extension attributes that cause hydration mismatches
    document.body.removeAttribute('data-new-gr-c-s-check-loaded');
    document.body.removeAttribute('data-gr-ext-installed');
  }, []);
  
  return null;
}
