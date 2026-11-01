'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Fraunces, DM_Sans } from 'next/font/google'
import { supabase } from '../../lib/supabase'
import SiteFooter from '../../components/SiteFooter'

const fraunces = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-fraunces', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dmsans', display: 'swap' })

type Review = {
  id: string
  name: string
  rating: number
  comment: string
  created_at: string
  approved: boolean
}

function Stars({ rating, size = 16, interactive = false, onSelect, hoverRating }: { rating: number, size?: number, interactive?: boolean, onSelect?: (r: number) => void, hoverRating?: number }) {
  const display = hoverRating || rating
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1,2,3,4,5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => interactive && onSelect?.(s)}
          onMouseEnter={() => {}}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: interactive ? 'pointer' : 'default',
            transition: 'transform 0.2s ease',
          }}
          onMouseOver={(e) => { if(interactive) e.currentTarget.style.transform = 'scale(1.2)' }}
          onMouseOut={(e) => { if(interactive) e.currentTarget.style.transform = 'scale(1)' }}
        >
          <i
            className="fa-solid fa-star"
            style={{
              fontSize: `${size}px`,
              color: s <= display ? '#D4AF37' : '#1E1E20',
              textShadow: s <= display ? '0 0 8px rgba(212,175,55,0.5)' : 'none',
              WebkitTextStroke: s <= display ? '0' : '1px #2A2A2A',
            }}
          />
        </button>
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [avgRating, setAvgRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)

  // Form state
  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')

  const fetchReviews = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setReviews(data as Review[])
      const total = data.length
      setTotalReviews(total)
      if (total > 0) {
        const avg = data.reduce((sum, r: any) => sum + r.rating, 0) / total
        setAvgRating(Math.round(avg * 10) / 10)
      } else {
        setAvgRating(0)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    if (rating === 0) {
      setError('Please select a star rating')
      return
    }
    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters')
      return
    }
    if (comment.length > 500) {
      setError('Review must be under 500 characters')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('reviews').insert({
      name: name.trim(),
      rating,
      comment: comment.trim(),
      approved: true,
    })

    setSubmitting(false)
    if (error) {
      setError('Failed to submit review. Please try again.')
      return
    }

    setShowSuccess(true)
    setName('')
    setRating(0)
    setComment('')
    fetchReviews()
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <main className={`${fraunces.variable} ${dmSans.variable} tv-reviews-page tv-home`} style={{ background: '#050505' }}>
  <div className="tv-vignette" aria-hidden="true" />
      {/* Header */}
      <header className="tv-reviews-header">
        <div className="tv-wrap tv-reviews-header-inner">
          <Link href="/" className="tv-reviews-logo">
            <img src="/logo.png" alt="TapVinci" onError={(e) => { (e.target as HTMLImageElement).src = '/tapvinci-logo.png' }} />
          </Link>
          <Link href="/" className="tv-reviews-back">
            <i className="fa-solid fa-arrow-left"></i> Back to Home
          </Link>
        </div>
      </header>

      {/* Hero - Average Rating */}
      <section className="tv-reviews-hero">
        <div className="tv-wrap">
          <p className="tv-label" style={{ justifyContent: 'center' }}>
            <span className="tv-label-line" />GET IN TOUCH • REVIEWS
          </p>
          <h1 className="tv-reviews-title">What People Say About TapVinci</h1>
          
          <div className="tv-reviews-avg-card">
            <div className="tv-reviews-avg-number">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</div>
            <div className="tv-reviews-avg-stars">
              <Stars rating={Math.round(avgRating)} size={20} />
            </div>
            <p className="tv-reviews-avg-count">
              {totalReviews > 0 ? `${totalReviews} review${totalReviews !== 1 ? 's' : ''}` : 'No reviews yet'}
            </p>
            <p className="tv-tagline" style={{ marginTop: '16px' }}>A NEW STANDARD OF INTRODUCTION • MADE TO CONNECT • PHILIPPINES 2026</p>
          </div>
        </div>
      </section>

      <div className="tv-wrap tv-reviews-grid">
        {/* Write a Review Form */}
        <section className="tv-reviews-form-section">
          <div className="tv-reviews-form-card">
            <h2 className="tv-reviews-form-title">Write a Review</h2>
            <p className="tv-reviews-form-sub">Share your experience with TapVinci</p>

            <form onSubmit={handleSubmit} className="tv-reviews-form">
              <div className="tv-reviews-field">
                <label>YOUR NAME *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="tv-reviews-input"
                  maxLength={50}
                />
              </div>

              <div className="tv-reviews-field">
                <label>YOUR RATING *</label>
                <div 
                  className="tv-reviews-stars-select"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1,2,3,4,5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      className={`tv-star-btn ${s <= (hoverRating || rating) ? 'active' : ''}`}
                    >
                      <i className="fa-solid fa-star"></i>
                    </button>
                  ))}
                </div>
                <p className="tv-reviews-rating-hint">
                  {rating === 0 ? 'Click to rate' : rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                </p>
              </div>

              <div className="tv-reviews-field">
                <label>YOUR REVIEW * <span className="tv-char-count">{comment.length}/500</span></label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What do you think about TapVinci? Your NFC card experience?"
                  className="tv-reviews-textarea"
                  rows={4}
                  maxLength={500}
                />
              </div>

              {error && <p className="tv-reviews-error">{error}</p>}

              <button type="submit" disabled={submitting} className="tv-reviews-submit">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>

              <p className="tv-reviews-privacy">We don't share your information. Ever.</p>
            </form>
          </div>

          {showSuccess && (
            <div className="tv-reviews-success">
              <div className="tv-reviews-success-icon">✓</div>
              <h3>Thank you! Your review is live.</h3>
              <p>Your feedback helps us craft better NFC experiences.</p>
            </div>
          )}
        </section>

        {/* Read Reviews List */}
        <section className="tv-reviews-list-section">
          <h2 className="tv-reviews-list-title">Customer Reviews</h2>
          
          {loading ? (
            <div className="tv-reviews-skeleton">
              {[1,2,3].map((i) => (
                <div key={i} className="tv-review-card skeleton">
                  <div className="skeleton-line w-32"></div>
                  <div className="skeleton-line w-24"></div>
                  <div className="skeleton-line w-full"></div>
                  <div className="skeleton-line w-5/6"></div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="tv-reviews-empty">
              <div className="tv-reviews-empty-icon">★</div>
              <h3>No reviews yet</h3>
              <p>Be the first to review TapVinci and help others discover premium NFC cards.</p>
            </div>
          ) : (
            <div className="tv-reviews-list">
              {reviews.map((r) => (
                <div key={r.id} className="tv-review-card">
                  <div className="tv-review-top">
                    <div className="tv-review-user">
                      <div className="tv-review-avatar">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="tv-review-name">{r.name}</p>
                        <p className="tv-review-date">{formatDate(r.created_at)}</p>
                      </div>
                    </div>
                    <Stars rating={r.rating} size={14} />
                  </div>
                  <p className="tv-review-comment">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Footer - COPIED FROM MAIN SITE - EXACT SAME */}
      <SiteFooter />
    </main>
  )
}