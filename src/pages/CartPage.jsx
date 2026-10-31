import { useState } from 'react'
import { ShoppingCart, Trash2, Plus, Minus, MessageCircle, PackageOpen, ArrowLeft } from 'lucide-react'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../utils/helpers'

/**
 * CartPage — Shopping cart with WhatsApp checkout.
 */
export default function CartPage({ onBack, onNavigateCatalog }) {
  const { cartItems, totalCount, totalPrice, removeFromCart, updateQuantity, clearCart, checkout } = useCart()
  const [checking, setChecking] = useState(false)

  const handleCheckout = () => {
    if (cartItems.length === 0) return
    setChecking(true)
    checkout()
    setTimeout(() => setChecking(false), 1500)
  }

  return (
    <div className="cart-page">
      <section className="masthead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="display">Keranjang Belanja</h1>
          <p className="lede">
            {totalCount > 0
              ? `${totalCount} item siap di-checkout via WhatsApp.`
              : 'Keranjang kosong. Tambahkan item dari katalog.'}
          </p>
        </div>
        <button type="button" className="btn btn--outline btn--sm" onClick={onBack}>
          <ArrowLeft size={15} /> Kembali
        </button>
      </section>

      {cartItems.length === 0 ? (
        <div className="state-box" style={{ marginTop: '32px' }}>
          <PackageOpen size={40} stroke="var(--steel)" />
          <h3>Keranjang Kosong</h3>
          <p className="lede">Belum ada item yang ditambahkan ke keranjang.</p>
          {onNavigateCatalog && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={onNavigateCatalog}
              style={{ marginTop: '16px' }}
            >
              Jelajahi Katalog
            </button>
          )}
        </div>
      ) : (
        <div className="cart-content">
          {/* Cart items */}
          <ul className="cart-list">
            {cartItems.map((item) => (
              <li key={item.id} className="cart-item">
                <img
                  src={item.image_url || '/guns/pistol.svg'}
                  alt={item.name}
                  className="cart-item-img"
                  loading="lazy"
                />
                <div className="cart-item-info">
                  <p className="cart-item-name display">{item.name}</p>
                  <p className="cart-item-type">
                    {item.type}{item.caliber ? ` · ${item.caliber}` : ''}
                  </p>
                  <p className="cart-item-price">{formatPrice(item.price)}</p>
                </div>
                <div className="cart-item-qty">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                    disabled={(item.quantity || 1) <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-val">{item.quantity || 1}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="cart-item-subtotal">
                  {formatPrice(item.price * (item.quantity || 1))}
                </div>
                <button
                  type="button"
                  className="cart-remove-btn"
                  onClick={() => removeFromCart(item.id)}
                  title="Hapus dari keranjang"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>

          {/* Summary */}
          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>Subtotal ({totalCount} item)</span>
              <strong>{formatPrice(totalPrice)}</strong>
            </div>
            <p className="cart-summary-note">
              Harga di atas belum termasuk ongkos kirim. Konfirmasi melalui WhatsApp.
            </p>

            <div className="cart-actions">
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => { if (window.confirm('Hapus semua item dari keranjang?')) clearCart() }}
              >
                Kosongkan Keranjang
              </button>
              <button
                type="button"
                className="btn btn--wa"
                onClick={handleCheckout}
                disabled={checking}
              >
                {checking ? (
                  <>Membuka WhatsApp…</>
                ) : (
                  <>
                    <MessageCircle size={18} /> Checkout via WhatsApp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
