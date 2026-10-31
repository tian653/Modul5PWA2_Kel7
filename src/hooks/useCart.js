import { useState, useEffect, useCallback } from 'react'
import cartService from '../services/cartService'

// ---------------------------------------------------------------------------
// useCart — Manages shopping cart state, synced with localStorage
// ---------------------------------------------------------------------------

export function useCart() {
  const [cartItems, setCartItems] = useState(() => cartService.getCart())

  // Sync across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'bore_barrel_cart') {
        setCartItems(cartService.getCart())
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const addToCart = useCallback((gun) => {
    const updated = cartService.addToCart(gun)
    setCartItems([...updated])
  }, [])

  const removeFromCart = useCallback((id) => {
    const updated = cartService.removeFromCart(id)
    setCartItems([...updated])
  }, [])

  const updateQuantity = useCallback((id, quantity) => {
    const updated = cartService.updateCartQuantity(id, quantity)
    setCartItems([...updated])
  }, [])

  const clearCart = useCallback(() => {
    const updated = cartService.clearCart()
    setCartItems(updated)
  }, [])

  const isInCart = useCallback(
    (id) => cartItems.some((item) => item.id === id),
    [cartItems]
  )

  const totalCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)

  const checkout = useCallback(() => {
    const url = cartService.generateWhatsAppUrl(cartItems)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }, [cartItems])

  return {
    cartItems,
    totalCount,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    checkout,
  }
}
