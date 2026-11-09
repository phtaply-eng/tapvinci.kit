/**
 * Shared profile options for the professional dashboard and the student
 * editor. Keeping these in one place means the two edit flows can never
 * drift apart (same social keys, same visibility defaults, same themes).
 */

export const DEFAULT_SOCIALS: Record<string, string> = {
  facebook: 'https://facebook.com/',
  instagram: 'https://instagram.com/',
  tiktok: 'https://www.tiktok.com/',
  messenger: 'https://m.me/',
  linkedin: '',
  youtube: '',
  whatsapp: '',
  website: '',
}

export const DEFAULT_VISIBLE: Record<string, boolean> = {
  facebook: true,
  instagram: true,
  tiktok: true,
  messenger: true,
  linkedin: true,
  youtube: true,
  whatsapp: true,
  website: true,
  google_maps: true,
  call: true,
  text: true,
  email_btn: true,
  save_contact: true,
  share_card: true,
  gcash_qr: true,
  maya_qr: true,
}

export const SOCIALS_CONFIG = [
  { key: 'facebook', label: 'Facebook', icon: 'fa-brands fa-facebook-f', color: 'text-blue-400', placeholder: 'https://facebook.com/...' },
  { key: 'instagram', label: 'Instagram', icon: 'fa-brands fa-instagram', color: 'text-pink-400', placeholder: 'https://instagram.com/...' },
  { key: 'tiktok', label: 'TikTok', icon: 'fa-brands fa-tiktok', color: 'text-white', placeholder: 'https://tiktok.com/@...' },
  { key: 'messenger', label: 'Messenger', icon: 'fa-brands fa-facebook-messenger', color: 'text-blue-400', placeholder: 'https://m.me/...' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'fa-brands fa-linkedin-in', color: 'text-blue-300', placeholder: 'https://linkedin.com/in/...' },
  { key: 'youtube', label: 'YouTube', icon: 'fa-brands fa-youtube', color: 'text-red-400', placeholder: 'https://youtube.com/@...' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'fa-brands fa-whatsapp', color: 'text-green-400', placeholder: 'https://wa.me/639...' },
  { key: 'website', label: 'Website', icon: 'fa-solid fa-globe', color: 'text-zinc-400', placeholder: 'https://yourwebsite.com' },
]

export const THEMES = [
  { id: 'gold', name: 'Black Gold', hex: '#D4AF37', desc: 'Default luxury' },
  { id: 'purple', name: 'Midnight Purple', hex: '#a855f7', desc: 'Creative / Tour' },
  { id: 'blue', name: 'Ocean Blue', hex: '#2563eb', desc: 'Professional' },
  { id: 'green', name: 'Forest Green', hex: '#22c55e', desc: 'Fresh / Nature' },
  { id: 'pink', name: 'Sunset Pink', hex: '#ec4899', desc: 'Bold / Creator' },
  { id: 'orange', name: 'Sunrise Orange', hex: '#f97316', desc: 'Energetic' },
]

export const SPOTIFY_URL_PATTERN =
  /^(spotify:(track|album|playlist|episode|show|artist):[A-Za-z0-9]+|https?:\/\/(?:open|play)\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?(track|album|playlist|episode|show|artist)\/[A-Za-z0-9]+)/i

export const isValidSpotifyUrl = (value: string) =>
  !value.trim() || SPOTIFY_URL_PATTERN.test(value.trim())
