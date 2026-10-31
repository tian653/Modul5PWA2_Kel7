import { ShoppingCart } from 'lucide-react'
import { useCart } from '../../hooks/useCart'

/**
 * CartButton — floating cart icon with item count badge.
 */
export default function CartButton({ onClick }) {
  const { totalCount } = useCart()

  return (
    <button
      type="button"
      className={`cart-btn-header ${totalCount > 0 ? 'cart-btn-header--active' : ''}`}
      onClick={onClick}
      title={`Keranjang (${totalCount} item)`}
      aria-label={`Buka keranjang, ${totalCount} item`}
    >
      <ShoppingCart size={18} />
      {totalCount > 0 && (
        <span className="cart-badge">{totalCount > 99 ? '99+' : totalCount}</span>
      )}
    </button>
  )
}
