'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { playSfx } from '@/lib/sfx';

function getRedirectTarget() {
  if (typeof window === 'undefined') return '/'
  const value = new URLSearchParams(window.location.search).get('redirect') || '/'
  return value.startsWith('/') ? value : '/'
}

function getAuthOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured?.startsWith('http://') || configured?.startsWith('https://')) {
    return configured.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const checkUser = async () => {
      const redirectTarget = getRedirectTarget()
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .limit(1);

        if (profile?.[0]?.username) {
          router.push(redirectTarget);
        } else {
          router.push('/onboarding');
        }
      }
    };

    checkUser();
  }, [supabase, router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    playSfx('secret', 0.25);
    const redirectTarget = getRedirectTarget()
    const authOrigin = getAuthOrigin()
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${authOrigin}/auth/callback?next=${encodeURIComponent(redirectTarget)}`
        }
      });

      if (error) {
        console.error('Error logging in:', error);
        playSfx('error', 0.3);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      playSfx('error', 0.3);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="font-['Special_Elite'] text-4xl text-[#c9a227] tracking-[0.3em]">
            S.O.M.B.R.A
          </h1>
          <p className="font-['Special_Elite'] text-[10px] text-[#6b6660] tracking-[0.2em] leading-relaxed uppercase max-w-xs mx-auto">
            Serviço Operacional de Missões Bizarras, Ridículas e Absurdamente Inúteis
          </p>
        </div>

        <div className="h-px bg-[#242424] max-w-xs mx-auto" />

        <div className="space-y-4">
          <p className="font-['Special_Elite'] text-xs text-[#8b1a1a] tracking-wider">
            [CLASSIFICADO]
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full max-w-xs mx-auto flex items-center justify-center gap-3 bg-[#111111] border border-[#3d3520] text-[#e8e4d9] py-3 px-6 rounded-sm hover:border-[#c9a227] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="font-['Inter'] text-sm">
              {isLoading ? 'AUTENTICANDO...' : 'ENTRAR COM GOOGLE'}
            </span>
          </button>
        </div>

        <p className="font-['Inter'] text-[10px] text-[#3a3632] tracking-wide uppercase">
          Acesso restrito — Agentes autorizados
        </p>
      </div>
    </div>
  );
}
