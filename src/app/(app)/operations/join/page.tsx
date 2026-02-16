'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TopBar } from '@/components/layout/TopBar';
import { playSfx } from '@/lib/sfx';

export default function JoinOperationPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setError('Digite o código de acesso');
      playSfx('error', 0.3);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/operations/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError('Código inválido');
        } else if (response.status === 403) {
          setError('Operação completa — limite de agentes atingido');
        } else {
          setError(data.error || 'Erro ao entrar na operação');
        }
        playSfx('error', 0.3);
        setIsLoading(false);
        return;
      }

      playSfx('mission', 0.3);
      router.push(`/operations/${data.operation_id}/lobby`);
    } catch (err) {
      console.error('Error:', err);
      setError('Erro inesperado. Tente novamente.');
      playSfx('error', 0.3);
      setIsLoading(false);
    }
  };

  return (
    <>
      <TopBar
        left={
          <Link
            href="/operations"
            aria-label="Voltar"
            className="flex items-center justify-center -ml-1 mr-1 p-1 text-[#6b6660] hover:text-[#c9a227] transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
          </Link>
        }
        title="INFILTRACAO"
      />

      <div className="min-h-[calc(100vh-48px-56px)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="font-['Special_Elite'] text-lg text-[#e8e4d9] mb-2 tracking-wide">
                CÓDIGO DE ACESSO
              </h2>
              <p className="font-['Inter'] text-sm text-[#6b6660]">
                Insira o código fornecido pelo criador
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC-123"
                className="w-full bg-[#111111] border border-[#242424] text-[#e8e4d9] text-center px-4 py-4 rounded-sm font-['Inter'] text-2xl font-mono tracking-[0.3em] uppercase placeholder:text-[#3a3632] focus:outline-none focus:border-[#c9a227] transition-colors"
                disabled={isLoading}
                maxLength={7}
              />

              {error && (
                <p className="text-[#c94040] font-['Special_Elite'] text-xs text-center uppercase tracking-wider">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading || !code.trim()}
              >
                {isLoading ? 'INFILTRANDO...' : 'INFILTRAR'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </>
  );
}
