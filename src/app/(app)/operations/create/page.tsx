'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TopBar } from '@/components/layout/TopBar';
import { Typewriter } from '@/components/ui/Typewriter';
import { playSfx } from '@/lib/sfx';

export default function CreateOperationPage() {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState<7 | 14 | 30>(7);
  const [resetHour, setResetHour] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Digite um nome para a operação');
      playSfx('error', 0.3);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          duration_days: duration,
          daily_reset_hour: resetHour
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao criar operação');
        playSfx('error', 0.3);
        setIsLoading(false);
        return;
      }

      playSfx('mission', 0.3);
      router.push(`/operations/${data.id}/lobby`);
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
        title="NOVA OPERACAO"
      />

      <div className="p-4">
        <Card className="max-w-md mx-auto">
          <div className="space-y-6">
            <div>
              <Typewriter text="Configure a missao, agente." speed={20} delay={150} className="block font-['Inter'] text-sm text-[#6b6660] mb-4" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase tracking-wider mb-2">
                  Designação da Operação
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Operação Café Infiltrado"
                  className="w-full bg-[#111111] border border-[#242424] text-[#e8e4d9] px-4 py-3 rounded-sm font-['Inter'] text-sm placeholder:text-[#3a3632] focus:outline-none focus:border-[#c9a227] transition-colors"
                  disabled={isLoading}
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase tracking-wider mb-3">
                  Duração
                </label>
                <div className="flex gap-2">
                  {([7, 14, 30] as const).map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDuration(days)}
                      className={`flex-1 py-2.5 rounded-sm border font-['Special_Elite'] text-sm transition-colors ${
                        duration === days
                          ? 'border-[#c9a227] text-[#c9a227]'
                          : 'border-[#242424] text-[#6b6660]'
                      }`}
                      disabled={isLoading}
                    >
                      {days} DIAS
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase tracking-wider mb-2">
                  Hora da Virada
                </label>
                <select
                  value={resetHour}
                  onChange={(e) => setResetHour(Number(e.target.value))}
                  className="w-full bg-[#111111] border border-[#242424] text-[#e8e4d9] px-4 py-3 rounded-sm font-['Inter'] text-sm focus:outline-none focus:border-[#c9a227] transition-colors"
                  disabled={isLoading}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
                <p className="mt-2 font-['Inter'] text-xs text-[#3a3632]">
                  Missões expiram neste horário.
                </p>
              </div>

              {error && (
                <p className="text-[#c94040] font-['Inter'] text-sm">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? 'CRIANDO...' : 'CRIAR OPERAÇÃO'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </>
  );
}
