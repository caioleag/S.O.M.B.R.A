import Image from 'next/image'
import type { OperationMember } from '@/lib/supabase/types'

interface MemberListProps {
  members: OperationMember[]
  maxMembers?: number
  creatorId?: string
}

export function MemberList({ members, maxMembers = 5, creatorId }: MemberListProps) {
  const slots = Array.from({ length: maxMembers }, (_, i) => members[i] || null)

  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-ink-muted text-xs mb-1">
        {members.length} / {maxMembers} AGENTES
      </p>
      {slots.map((member, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-[#1a1a1a] last:border-0">
          {member ? (
            <>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-elevated flex-shrink-0">
                {member.profiles?.avatar_url ? (
                  <Image
                    src={member.profiles.avatar_url}
                    alt={member.profiles.username || 'Agente'}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-elevated flex items-center justify-center text-ink-faint text-xs font-spy">
                    {(member.profiles?.username || 'A')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span className="font-spy text-ink text-sm">
                {member.profiles?.username || 'Agente'}
              </span>
              {(member.role === 'creator' || member.user_id === creatorId) && (
                <span className="ml-auto font-spy text-[10px] text-red-dark uppercase tracking-wider border border-red-dark px-1.5 py-0.5 rounded-sm">
                  CRIADOR
                </span>
              )}
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-elevated flex-shrink-0" />
              <span className="redacted text-xs w-24 h-4" />
              <span className="font-spy text-ink-faint text-xs ml-auto">AGUARDANDO...</span>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
