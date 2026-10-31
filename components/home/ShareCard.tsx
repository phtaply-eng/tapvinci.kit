'use client'
import { useRef, useState } from 'react'

export default function ShareCard({ url }: { url: string }) {
  const [msg, setMsg] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const say = (m: string) => {
    setMsg(m)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(''), 2200)
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); say('Link copied!') }
    catch { say('Select the link and copy it manually') }
  }
  const share = async () => {
    const data = { title: 'TapVinci', text: 'Tap. Connect. Remember. - TapVinci NFC digital cards', url }
    if (navigator.share) {
      try { await navigator.share(data) } catch (e) { if ((e as Error)?.name !== 'AbortError') say("Couldn't share") }
    } else {
      copy()
    }
  }
  return (
    <div className="tv-share tv-rise">
      <p className="tv-label">Share this card</p>
      <h3>Send it to someone</h3>
      <p className="tv-share-sub">Copy the link or share it from your phone. You can also turn this link into a QR code with any QR generator.</p>
      <input className="tv-share-input" readOnly value={url} aria-label="TapVinci link" onFocus={(e) => e.currentTarget.select()} />
      <div className="tv-share-btns">
        <button type="button" className="tv-btn tv-btn-light" onClick={copy}><i className="fa-regular fa-copy" aria-hidden="true" /> Copy link</button>
        <button type="button" className="tv-btn tv-btn-glass" onClick={share}><i className="fa-solid fa-share-nodes" aria-hidden="true" /> Share...</button>
      </div>
      <p className="tv-share-msg" role="status" aria-live="polite">{msg}</p>
    </div>
  )
}
