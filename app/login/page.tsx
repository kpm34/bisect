'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { login, signup, signInWithGoogle } from './actions';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Code } from 'lucide-react';

// Dev bypass token - only works in development mode
const DEV_BYPASS_TOKEN = 'bisect-dev-2024';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams?.get('message') ?? null;

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDevBypass, setShowDevBypass] = useState(false);
  const [devToken, setDevToken] = useState('');

  const isDev = process.env.NODE_ENV === 'development';

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const action = isSignUp ? signup : login;
    const result = await action(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    const result = await signInWithGoogle();
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  // Dev bypass handler
  function handleDevBypass() {
    if (devToken === DEV_BYPASS_TOKEN) {
      // Set dev bypass cookie and redirect
      document.cookie = `bisect_dev_bypass=${DEV_BYPASS_TOKEN}; path=/; max-age=86400`; // 24 hours
      router.push('/dashboard');
    } else {
      setError('Invalid dev token');
    }
  }

  return (
    <div className="min-h-screen bg-ash-grey-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/assets/bisect_logo.png"
              alt="Bisect"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-2xl font-bold text-ash-grey-900">Bisect</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-ash-grey-200 p-8">
          <h1 className="text-2xl font-semibold text-ash-grey-900 text-center mb-2">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-ash-grey-500 text-center mb-6">
            {isSignUp
              ? 'Start creating amazing 3D content'
              : 'Sign in to continue to your dashboard'}
          </p>

          {/* Message */}
          {message && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              {message}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-ash-grey-300 rounded-lg text-ash-grey-700 hover:bg-ash-grey-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ash-grey-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-ash-grey-400">or</span>
            </div>
          </div>

          {/* Form */}
          <form action={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ash-grey-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ash-grey-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-ash-grey-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cta-orange focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ash-grey-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ash-grey-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-12 py-3 border border-ash-grey-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cta-orange focus:border-transparent"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ash-grey-400 hover:text-ash-grey-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cta-orange hover:bg-cta-orange-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <p className="mt-6 text-center text-sm text-ash-grey-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-cta-orange hover:text-cta-orange-hover font-medium"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          {/* Dev Bypass - Only shown in development */}
          {isDev && (
            <div className="mt-6 pt-6 border-t border-ash-grey-200">
              {!showDevBypass ? (
                <button
                  type="button"
                  onClick={() => setShowDevBypass(true)}
                  className="w-full flex items-center justify-center gap-2 text-xs text-ash-grey-400 hover:text-ash-grey-600"
                >
                  <Code className="w-3 h-3" />
                  Dev Mode
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-ash-grey-500 text-center">Enter dev token to bypass auth</p>
                  <input
                    type="password"
                    value={devToken}
                    onChange={(e) => setDevToken(e.target.value)}
                    placeholder="Dev token"
                    className="w-full px-3 py-2 text-sm border border-ash-grey-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleDevBypass()}
                  />
                  <button
                    type="button"
                    onClick={handleDevBypass}
                    className="w-full px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Bypass Auth (Dev Only)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-ash-grey-400">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-ash-grey-600">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-ash-grey-600">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
