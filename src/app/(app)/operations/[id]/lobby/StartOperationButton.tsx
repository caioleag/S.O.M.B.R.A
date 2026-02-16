'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { playSfx } from '@/lib/sfx';

interface StartOperationButtonProps {
  operationId: string;
}

export function StartOperationButton({ operationId }: StartOperationButtonProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleStart = async () => {
    setError('');
    setIsStarting(true);

    try {
      const response = await fetch(`/api/operations/${operationId}/start`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao iniciar operação');
        playSfx('error', 0.3);
        setIsStarting(false);
        return;
      }

      playSfx('morse', 0.3);
      router.push(`/operations/${operationId}`);
    } catch (err) {
      console.error('Error:', err);
      setError('Erro inesperado. Tente novamente.');
      playSfx('error', 0.3);
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="primary"
        className="w-full"
        onClick={handleStart}
        disabled={isStarting}
      >
        {isStarting ? 'INICIANDO...' : 'INICIAR OPERAÇÃO'}
      </Button>

      {error && (
        <p className="text-[#c94040] font-['Inter'] text-sm text-center">
          {error}
        </p>
      )}
    </div>
  );
}
