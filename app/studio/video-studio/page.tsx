'use client';

import dynamic from 'next/dynamic';

// Disable SSR for the Video Studio (uses browser APIs)
const VideoStudioApp = dynamic(() => import('./VideoStudioApp'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/80">Loading Video Studio...</p>
      </div>
    </div>
  ),
});

export default function VideoStudioPage() {
  return <VideoStudioApp />;
}
