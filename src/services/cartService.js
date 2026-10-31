// ---------------------------------------------------------------------------
// cartService.js — Shopping cart persisted in localStorage
// Manages gun items for checkout via WhatsApp
// ---------------------------------------------------------------------------

const CART_KEY = 'bore_barrel_cart'

const WA_NUMBER = '6281234567890' // Ganti dengan nomor WA pribadi

/**
 * Get current cart items
 * @returns {Array} cart items
 */
export function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Add item to cart. If item exists, increment quantity.
 * @param {Object} gun - product data
 * @returns {Array} updated cart
 */
export function addToCart(gun) {
  const cart = getCart()
  const existingIndex = cart.findIndex((item) => item.id === gun.id)
  if (existingIndex >= 0) {
    cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1
  } else {
    cart.push({
      id: gun.id,
      name: gun.name,
      type: gun.type || gun.category || 'Hardware',
      caliber: gun.caliber || '',
      price: gun.price ?? 0,
      image_url: gun.image_url || gun.image || '/guns/pistol.svg',
      quantity: 1,
    })
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  return cart
}

/**
 * Remove item from cart by id
 * @param {string|number} id
 * @returns {Array} updated cart
 */
export function removeFromCart(id) {
  const cart = getCart().filter((item) => item.id !== id)
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  return cart
}

/**
 * Update quantity of an item
 * @param {string|number} id
 * @param {number} quantity
 * @returns {Array} updated cart
 */
export function updateCartQuantity(id, quantity) {
  const cart = getCart().map((item) =>
    item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
  )
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  return cart
}

/**
 * Clear all items in cart
 * @returns {Array} empty cart
 */
export function clearCart() {
  localStorage.removeItem(CART_KEY)
  return []
}

/**
 * Generate WhatsApp checkout URL
 * @param {Array} items - cart items
 * @returns {string} WhatsApp URL
 */
export function generateWhatsAppUrl(items) {
  if (!items || items.length === 0) return null

  const lines = items.map((item) => {
    const price = item.price ? `Rp ${Number(item.price).toLocaleString('id-ID')}` : '-'
    return `- ${item.name} (${item.type}${item.caliber ? ' · ' + item.caliber : ''}) x${item.quantity} @ ${price}`
  })

  const total = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
  const totalStr = total > 0 ? `\n\nTotal: Rp ${total.toLocaleString('id-ID')}` : ''

  const message = encodeURIComponent(
    `Hi, aku mau pesan:\n\n${lines.join('\n')}${totalStr}\n\nMohon konfirmasi ketersediaan stok. Terima kasih! 🙏`
  )

  return `https://wa.me/${WA_NUMBER}?text=${message}`
}

/**
 * Get total item count in cart
 * @returns {number}
 */
export function getCartCount() {
  return getCart().reduce((sum, item) => sum + (item.quantity || 1), 0)
}

export default {
  getCart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  generateWhatsAppUrl,
  getCartCount,
}
