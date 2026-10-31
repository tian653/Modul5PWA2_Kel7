import { useState } from 'react'
import {
  ArrowLeft, Star, Send, Loader, Share2, Check, ShoppingCart,
  ThumbsUp, ThumbsDown, Pencil, Trash2, X, Archive, RotateCcw,
} from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { useReviews, useCreateReview, useUpdateReview, useDeleteReview } from '../../hooks/useReviews'
import { getUserIdentifier } from '../../services/userService'
import reviewService from '../../services/reviewService'
import { formatPrice, averageRating } from '../../utils/helpers'
import { useCart } from '../../hooks/useCart'
import gunService from '../../services/gunService'

/**
 * Full-screen product detail view.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onBack    — return to catalog
 * @param {Function} [props.onEdit]  — navigate to edit page
 * @param {Function} [props.onDelete]— trigger delete flow
 * @param {Function} [props.onArchive]— trigger archive flow
 */
export default function GunDetail({ gun, onBack, onEdit, onDelete, onArchive }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0
  const currentUserId = getUserIdentifier()

  // ---- Reviews ----
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  const { updateReview, loading: updating } = useUpdateReview()
  const { deleteReview, loading: deletingReview } = useDeleteReview()

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // Edit review state
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')

  // Thumbs state (local)
  const [thumbsState, setThumbsState] = useState({}) // { [reviewId]: { thumbs_up, thumbs_down, user_thumb } }

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  // ---- Share ----
  const [shareCopied, setShareCopied] = useState(false)
  const handleShare = async () => {
    const shareUrl = gun.id
      ? `${window.location.origin}${window.location.pathname}#gun/${gun.id}`
      : window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: gun.name, text: `Check out ${gun.name}`, url: shareUrl })
        return
      } catch {
        // fallback
      }
    }
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2500)
    })
  }

  // ---- Cart ----
  const { addToCart, isInCart } = useCart()
  const inCart = isInCart(gun.id)

  // ---- Archive state ----
  const [isArchived, setIsArchived] = useState(() => gunService.isArchived(gun.id))

  // ---- Submit new review ----
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }

    const result = await createReview(gun.id, {
      user_identifier: currentUserId,
      rating,
      comment: comment.trim(),
    })

    if (result) {
      setReviewSuccess('Review submitted!')
      setComment('')
      setRating(5)
      refetchReviews()
    } else {
      setReviewError('Could not submit review. The server may be unavailable.')
    }
  }

  // ---- Edit review ----
  const handleStartEdit = (rev) => {
    setEditingReviewId(rev.id)
    setEditRating(rev.rating)
    setEditComment(rev.comment || '')
  }

  const handleCancelEdit = () => {
    setEditingReviewId(null)
    setEditRating(5)
    setEditComment('')
  }

  const handleSaveEdit = async (reviewId) => {
    const result = await updateReview(reviewId, { rating: editRating, comment: editComment }, gun.id)
    if (result !== null) {
      setEditingReviewId(null)
      refetchReviews()
    }
  }

  // ---- Delete review ----
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return
    const ok = await deleteReview(reviewId, gun.id)
    if (ok) refetchReviews()
  }

  // ---- Thumbs ----
  const handleThumb = (reviewId, direction) => {
    const updated = reviewService.toggleThumb(reviewId, direction)
    setThumbsState((prev) => ({ ...prev, [reviewId]: updated }))
  }

  const getThumb = (rev) => {
    return thumbsState[rev.id] || {
      thumbs_up: rev.thumbs_up || 0,
      thumbs_down: rev.thumbs_down || 0,
      user_thumb: rev.user_thumb || null,
    }
  }

  // ---- Archive ----
  const handleArchiveToggle = () => {
    if (isArchived) {
      gunService.restoreGun(gun.id)
      setIsArchived(false)
    } else {
      if (onArchive) {
        onArchive(gun)
      } else {
        gunService.archiveGun(gun.id)
        setIsArchived(true)
      }
    }
  }

  return (
    <div className="detail">
      {/* Back button */}
      <div className="detail-top-bar">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Catalog
        </button>
        <div className="detail-top-actions">
          {/* Share */}
          <button
            type="button"
            className={`btn btn--outline btn--sm ${shareCopied ? 'share-copied' : ''}`}
            onClick={handleShare}
            title={shareCopied ? 'Link copied!' : 'Share this gun'}
          >
            {shareCopied ? <Check size={15} /> : <Share2 size={15} />}
            {shareCopied ? 'Copied!' : 'Share'}
          </button>
          {/* Add to cart */}
          <button
            type="button"
            className={`btn btn--sm ${inCart ? 'btn--outline' : 'btn--primary'}`}
            onClick={() => addToCart(gun)}
            title={inCart ? 'Already in cart' : 'Add to cart'}
          >
            <ShoppingCart size={15} />
            {inCart ? 'In Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="detail-hero">
        <img className="detail-img" src={imgSrc} alt={gun.name} loading="lazy" />
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          <div className="detail-actions">
            <FavoriteButton gunId={gun.id || gun.name} />
            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                Edit
              </button>
            )}
            {/* Archive / Restore */}
            {gun.id && (
              <button
                type="button"
                className={`btn ${isArchived ? 'btn--outline' : 'btn--outline'} btn--sm`}
                onClick={handleArchiveToggle}
                title={isArchived ? 'Restore from archive' : 'Archive this item'}
              >
                {isArchived ? <RotateCcw size={15} /> : <Archive size={15} />}
                {isArchived ? 'Restore' : 'Archive'}
              </button>
            )}
            {onDelete && (
              <button type="button" className="btn btn--danger" onClick={() => onDelete(gun)}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>
                {step.instruction || step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section */}
      <section className="detail-section">
        <h2>Reviews</h2>

        {/* Submit review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a short review (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !gun.id}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Submitting…</>
            ) : (
              <><Send size={16} /> Submit Review</>
            )}
          </button>

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          {!gun.id && (
            <p className="form-hint">
              Reviews require a server-generated product ID. This product is local-only.
            </p>
          )}
        </form>

        {/* Existing reviews */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => {
              const thumb = getThumb(rev)
              const isMyReview = rev.user_identifier && rev.user_identifier.includes(currentUserId.substring(0, 8))
              const isEditing = editingReviewId === rev.id

              return (
                <li key={rev.id} className="review-item">
                  {isEditing ? (
                    /* Edit mode */
                    <div className="review-edit-form">
                      <div className="review-stars">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className="star-btn"
                            onClick={() => setEditRating(n)}
                          >
                            <Star
                              size={18}
                              fill={n <= editRating ? 'var(--brass)' : 'none'}
                              stroke={n <= editRating ? 'var(--brass)' : 'var(--steel)'}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="review-input"
                        rows="2"
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        maxLength={500}
                      />
                      <div className="review-edit-actions">
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => handleSaveEdit(rev.id)}
                          disabled={updating}
                        >
                          {updating ? <Loader size={14} className="spin" /> : <Check size={14} />}
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={handleCancelEdit}
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
                    <>
                      <div className="review-head">
                        <span className="review-user">{rev.user_identifier || 'Anonymous'}</span>
                        <span className="review-stars-display">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < rev.rating ? 'var(--brass)' : 'none'}
                              stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                            />
                          ))}
                        </span>
                      </div>
                      {rev.comment && <p className="review-comment">{rev.comment}</p>}

                      {/* Thumbs + actions */}
                      <div className="review-footer">
                        <div className="review-thumbs">
                          <button
                            type="button"
                            className={`thumb-btn ${thumb.user_thumb === 'up' ? 'thumb-btn--active-up' : ''}`}
                            onClick={() => handleThumb(rev.id, 'up')}
                            title="Thumbs up"
                          >
                            <ThumbsUp size={14} />
                            {thumb.thumbs_up > 0 && <span>{thumb.thumbs_up}</span>}
                          </button>
                          <button
                            type="button"
                            className={`thumb-btn ${thumb.user_thumb === 'down' ? 'thumb-btn--active-down' : ''}`}
                            onClick={() => handleThumb(rev.id, 'down')}
                            title="Thumbs down"
                          >
                            <ThumbsDown size={14} />
                            {thumb.thumbs_down > 0 && <span>{thumb.thumbs_down}</span>}
                          </button>
                        </div>

                        {/* CRUD actions for own reviews */}
                        {isMyReview && (
                          <div className="review-crud">
                            <button
                              type="button"
                              className="review-action-btn"
                              onClick={() => handleStartEdit(rev)}
                              title="Edit review"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              className="review-action-btn review-action-btn--danger"
                              onClick={() => handleDeleteReview(rev.id)}
                              disabled={deletingReview}
                              title="Delete review"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  )
}
