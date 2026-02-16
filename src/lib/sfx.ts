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
  | 'nav-morse'

const SFX_SRC: Record<SfxName, string> = {
  click: '/audio/ui-click.wav',
  navigate: '/audio/hi-tech-click.wav',
  success: '/audio/snap-click.wav',
  error: '/audio/undo.wav',
  mission: '/audio/button-click.mp3',
  submit: '/audio/gol-morse.mp3',
  undo: '/audio/undo.wav',
  secret: '/audio/secret.mp3',
  morse: '/audio/morse-signomas.wav',
  'nav-morse': '/audio/morsert.wav',
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
