'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { playSfx } from '@/lib/sfx';

export default function OnboardingPage() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (username.length < 3) {
      setError('Codinome deve ter pelo menos 3 caracteres');
      playSfx('error', 0.3);
      return;
    }

    if (username.length > 20) {
      setError('Codinome deve ter no máximo 20 caracteres');
      playSfx('error', 0.3);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Use apenas letras, números e underscores');
      playSfx('error', 0.3);
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Sessão expirada. Faça login novamente.');
        playSfx('error', 0.3);
        router.push('/login');
        return;
      }

      // Update profile with username
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: username.toLowerCase() })
        .eq('id', user.id);

      if (updateError) {
        if (updateError.code === '23505') {
          setError('Este codinome já está em uso');
        } else {
          setError('Erro ao criar codinome. Tente novamente.');
        }
        playSfx('error', 0.3);
        setIsLoading(false);
        return;
      }

      // Success - redirect to home
      playSfx('success', 0.3);
      router.push('/');
    } catch (err) {
      console.error('Error:', err);
      setError('Erro inesperado. Tente novamente.');
      playSfx('error', 0.3);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="font-['Special_Elite'] text-xl text-[#e8e4d9] tracking-wider uppercase">
              Identificação do Agente
            </h1>
            <p className="font-['Inter'] text-sm text-[#6b6660]">
              Escolha seu codinome de operação.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: agente_fantasma"
                className="w-full bg-[#111111] border border-[#242424] text-[#e8e4d9] px-4 py-3 rounded-sm font-['Inter'] text-sm placeholder:text-[#3a3632] focus:outline-none focus:border-[#c9a227] transition-colors"
                disabled={isLoading}
              />
              {error && (
                <p className="mt-2 text-[#c94040] font-['Inter'] text-xs">
                  {error}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading || !username}
            >
              {isLoading ? 'PROCESSANDO...' : 'CONFIRMAR'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
