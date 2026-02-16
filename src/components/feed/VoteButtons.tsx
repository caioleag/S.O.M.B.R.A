'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';

interface VoteButtonsProps {
  submissionId: string;
  currentUserId: string;
  submitterId: string;
  votes: {
    user_id: string;
    vote: 'approve' | 'reject';
  }[];
  onVote: (submissionId: string, vote: 'approve' | 'reject') => Promise<void>;
}

export function VoteButtons({ submissionId, currentUserId, submitterId, votes, onVote }: VoteButtonsProps) {
  const [isVoting, setIsVoting] = useState(false);
  const isOwnSubmission = currentUserId === submitterId;
  const userVote = votes.find(v => v.user_id === currentUserId);

  const approveCount = votes.filter(v => v.vote === 'approve').length;
  const rejectCount = votes.filter(v => v.vote === 'reject').length;

  const handleVote = async (vote: 'approve' | 'reject') => {
    if (isOwnSubmission || isVoting) return;

    setIsVoting(true);
    try {
      await onVote(submissionId, vote);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  if (isOwnSubmission) {
    return (
      <div className="pt-3 border-t border-[#1a1a1a]">
        <div className="text-center py-2">
          <span className="text-[#3a3632] font-['Inter'] text-xs">
            SUA EVIDÊNCIA
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-3 border-t border-[#1a1a1a]">
      <div className="flex gap-2">
        <button
          onClick={() => handleVote('approve')}
          disabled={isVoting || !!userVote}
          className={`flex-1 py-2 px-3 rounded-sm border transition-colors flex items-center justify-center gap-2 ${
            userVote?.vote === 'approve'
              ? 'border-[#4a8c4a] text-[#4a8c4a]'
              : 'border-[#242424] text-[#e8e4d9] hover:border-[#4a8c4a] hover:text-[#4a8c4a]'
          } ${userVote && userVote.vote !== 'approve' ? 'opacity-30' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Check className="w-4 h-4" strokeWidth={1.5} />
          <span className="font-['Inter'] text-sm">APROVAR</span>
          <span className="font-['Inter'] text-xs font-mono text-[#6b6660]">({approveCount})</span>
        </button>

        <button
          onClick={() => handleVote('reject')}
          disabled={isVoting || !!userVote}
          className={`flex-1 py-2 px-3 rounded-sm border transition-colors flex items-center justify-center gap-2 ${
            userVote?.vote === 'reject'
              ? 'border-[#c94040] text-[#c94040]'
              : 'border-[#242424] text-[#e8e4d9] hover:border-[#c94040] hover:text-[#c94040]'
          } ${userVote && userVote.vote !== 'reject' ? 'opacity-30' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
          <span className="font-['Inter'] text-sm">REJEITAR</span>
          <span className="font-['Inter'] text-xs font-mono text-[#6b6660]">({rejectCount})</span>
        </button>
      </div>
    </div>
  );
}
