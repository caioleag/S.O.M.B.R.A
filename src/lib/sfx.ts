export type SfxName =
  | 'click'
  | 'navigate'
  | 'success'
  | 'error'
  | 'mission'
  | 'submit'
  | 'undo'
  | 'secret'
  | 'morse'

const SFX_SRC: Record<SfxName, string> = {
  // Small UI tap — buttons, toggles, selections
  click: '/audio/click-small.mp3',
  // Medium click — nav transitions, tab changes
  navigate: '/audio/click-medium.mp3',
  // Synth tone — mission completion, operation started
  success: '/audio/synth-tone.wav',
  // Impulse hit — rejection, errors, failed actions
  error: '/audio/impulse.wav',
  // Gentle open — mission assigned, new operation
  mission: '/audio/menu-open.wav',
  // Gentle open — form submissions
  submit: '/audio/menu-open.wav',
  // Soft click — undo / leave / cancel
  undo: '/audio/undo.wav',
  // Secret discovery
  secret: '/audio/secret.mp3',
  // Morse code ambiance
  morse: '/audio/morse-signomas.wav',
}

const baseAudio = new Map<SfxName, HTMLAudioElement>()

function getAudio(name: SfxName): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null

  const existing = baseAudio.get(name)
  if (existing) return existing

  const audio = new Audio(SFX_SRC[name])
  audio.preload = 'auto'
  baseAudio.set(name, audio)
  return audio
}

export function playSfx(name: SfxName, volume = 0.35) {
  const base = getAudio(name)
  if (!base) return

  const audio = base.cloneNode(true) as HTMLAudioElement
  audio.volume = volume
  audio.play().catch(() => undefined)
}
