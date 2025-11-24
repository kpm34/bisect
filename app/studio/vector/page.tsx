'use client';

import dynamic from 'next/dynamic';

const VectorEditor = dynamic(() => import('./components/VectorEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-neutral-900 text-white">
      Loading Vector Studio...
    </div>
  ),
});

export default function Page() {
  return <VectorEditor />;
}
