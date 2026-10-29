export type SocialKey = 'facebook'|'instagram'|'tiktok'|'messenger'|'linkedin'|'youtube'|'whatsapp'|'website'|'twitter'
export type GalleryItem = { src: string; alt?: string }

export type Profile = {
  username: string
  name: string
  title?: string
  bio?: string
  about?: string
  hero_image?: string
  avatar_url?: string
  photoFocus?: string
  phone?: string
  email?: string
  address?: string
  mapsLink?: string
  accent_color?: string
  theme?: string
  galleryTitle?: string
  gallerySubtitle?: string
  gallery?: (GalleryItem|string)[]
  socials?: Partial<Record<SocialKey,string>>
  socials_visible?: Record<string, boolean>
  created_at?: string
}

export const THEMES = [
  { id: 'gold', name: 'Black Gold', hex: '#D4AF37', desc: 'Luxury default' },
  { id: 'purple', name: 'Midnight Purple', hex: '#a855f7', desc: 'Creative night' },
  { id: 'blue', name: 'Ocean Blue', hex: '#2563eb', desc: 'Trust & depth' },
  { id: 'green', name: 'Forest Green', hex: '#22c55e', desc: 'Growth' },
  { id: 'rose', name: 'Rose Gold', hex: '#f43f5e', desc: 'Bold' },
  { id: 'orange', name: 'Sunset Orange', hex: '#f97316', desc: 'Energy' },
] as const