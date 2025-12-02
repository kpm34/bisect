import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-bg">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-display font-bold text-text-primary">404</h1>
        <p className="text-xl text-text-secondary">Page not found</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
