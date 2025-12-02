'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-bg">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-display font-bold text-text-primary">500</h1>
        <p className="text-xl text-text-secondary">Something went wrong</p>
        <button
          onClick={() => reset()}
          className="inline-block px-6 py-3 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
