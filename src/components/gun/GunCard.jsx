import { useState, useRef, useEffect } from 'react'
import { Share2, Check, ShoppingCart } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { formatPrice, truncate } from '../../utils/helpers'
import { useCart } from '../../hooks/useCart'

/**
 * Product card used in the catalog grid.
 * Features: Lazy loading image, Share link button, Add to Cart.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onSelect  — called with the gun when clicked
 * @param {Function} [props.onEdit]  — called when Edit is clicked (admin)
 * @param {Function} [props.onDelete]— called when Delete is clicked (admin)
 * @param {Function} [props.onArchive]— called when Archive is clicked
 */
export default function GunCard({ gun, onSelect, onEdit, onDelete, onArchive }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Lazy loading
  const imgRef = useRef(null)
  const [imgVisible, setImgVisible] = useState(false)
  useEffect(() => {
    const el = imgRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImgVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '150px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Share link
  const [copied, setCopied] = useState(false)
  const handleShare = async (e) => {
    e.stopPropagation()
    const shareUrl = gun.id
      ? `${window.location.origin}${window.location.pathname}#gun/${gun.id}`
      : window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title: gun.name, text: `Check out ${gun.name}`, url: shareUrl })
      } catch {
        // User cancelled or not supported — fallback to clipboard
        copyToClipboard(shareUrl)
      }
    } else {
      copyToClipboard(shareUrl)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = text
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Cart
  const { addToCart, isInCart } = useCart()
  const inCart = isInCart(gun.id)

  const handleAddToCart = (e) => {
    e.stopPropagation()
    addToCart(gun)
  }

  return (
    <li className="card">
      <button
        type="button"
        className="card-btn"
        onClick={() => onSelect(gun)}
        aria-label={`View ${gun.name}`}
      >
        {/* Lazy-loaded image */}
        <div ref={imgRef} className="card-img-wrap">
          {imgVisible ? (
            <img
              className="card-img"
              src={imgSrc}
              alt={gun.name}
              width="240"
              height="180"
              loading="lazy"
            />
          ) : (
            <div className="card-img card-img-placeholder" aria-hidden="true" />
          )}
        </div>

        <span className="name display">{gun.name}</span>

        <span className="type">
          {category}
          {caliber ? ` · ${caliber}` : ''}
        </span>

        {gun.description && (
          <span className="card-desc">{truncate(gun.description, 72)}</span>
        )}

        <span className="price">{formatPrice(price)}</span>
      </button>

      {/* Floating actions row */}
      <div className="card-actions">
        <FavoriteButton gunId={gun.id || gun.name} />

        {/* Add to Cart */}
        <button
          type="button"
          className={`card-act-btn ${inCart ? 'card-act-btn--active' : ''}`}
          onClick={handleAddToCart}
          aria-label={inCart ? `${gun.name} in cart` : `Add ${gun.name} to cart`}
          title={inCart ? 'In cart' : 'Add to cart'}
        >
          <ShoppingCart size={14} />
        </button>

        {/* Share button */}
        <button
          type="button"
          className="card-act-btn"
          onClick={handleShare}
          aria-label={`Share ${gun.name}`}
          title={copied ? 'Link copied!' : 'Share link'}
        >
          {copied ? <Check size={14} color="#27ae60" /> : <Share2 size={14} />}
        </button>

        {onEdit && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => { e.stopPropagation(); onEdit(gun) }}
            aria-label={`Edit ${gun.name}`}
            title="Edit"
          >
            ✏️
          </button>
        )}

        {onArchive && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => { e.stopPropagation(); onArchive(gun) }}
            aria-label={`Archive ${gun.name}`}
            title="Archive"
          >
            🗄️
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="card-act-btn card-act-btn--danger"
            onClick={(e) => { e.stopPropagation(); onDelete(gun) }}
            aria-label={`Delete ${gun.name}`}
            title="Delete"
          >
            🗑️
          </button>
        )}
      </div>
    </li>
  )
}
