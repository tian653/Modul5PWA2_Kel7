import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Catalog from './pages/Catalog.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import EditProfilePage from './pages/EditProfilePage.jsx'
import CreateGunPage from './pages/CreateGunPage.jsx'
import EditGunPage from './pages/EditGunPage.jsx'
import CartPage from './pages/CartPage.jsx'
import ArchivePage from './pages/ArchivePage.jsx'
import GunDetail from './components/gun/GunDetail.jsx'
import PWABadge from './components/PWABadge.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import gunService from './services/gunService.js'
import './App.css'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Catalog')
  const [mode, setMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail' | 'cart' | 'archive' | 'editProfile'
  const [selectedGun, setSelectedGun] = useState(null)
  const [editingGun, setEditingGun] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [archiveToast, setArchiveToast] = useState('')

  // Deep-link: if URL hash is #gun/{id}, open that gun's detail on first load
  useEffect(() => {
    const hash = window.location.hash // e.g. "#gun/42"
    const match = hash.match(/^#gun\/(.+)$/)
    if (!match) return
    const gunId = match[1]
    gunService.getGunById(gunId)
      .then((res) => {
        const gun = res?.data ?? res
        if (gun && gun.id) {
          setSelectedGun(gun)
          setMode('detail')
          setShowSplash(false) // skip splash when navigating via shared link
        }
      })
      .catch(() => {
        // If not found, just show normal catalog
      })
  }, [])

  const showToast = (msg) => {
    setArchiveToast(msg)
    setTimeout(() => setArchiveToast(''), 3000)
  }

  // Unified navigation handler
  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      setMode('create')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Cart') {
      setMode('cart')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Archive') {
      setMode('archive')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'EditProfile') {
      setMode('editProfile')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Tab change
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBackToList = () => {
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
  }

  const handleArchiveGun = (gun) => {
    setArchiveTarget(gun)
  }

  const confirmArchive = () => {
    if (!archiveTarget) return
    gunService.archiveGun(archiveTarget.id)
    showToast(`"${archiveTarget.name}" diarsipkan.`)
    setArchiveTarget(null)
    if (mode === 'detail') handleBackToList()
  }

  return (
    <div className="shell">
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={() => handleNavigate('Create')}
        onNavigateCart={() => handleNavigate('Cart')}
      />

      {/* Archive toast */}
      {archiveToast && (
        <div className="toast toast--success" style={{ margin: '0 auto', maxWidth: '900px', padding: '10px 24px' }}>
          {archiveToast}
        </div>
      )}

      <main className="main">
        {/* Cart page */}
        {mode === 'cart' && (
          <CartPage
            onBack={handleBackToList}
            onNavigateCatalog={() => handleNavigate('Catalog')}
          />
        )}

        {/* Archive page */}
        {mode === 'archive' && (
          <ArchivePage
            onBack={() => {
              setMode('list')
              setTab('Profile')
            }}
          />
        )}

        {/* Edit Profile page */}
        {mode === 'editProfile' && (
          <EditProfilePage
            onBack={() => {
              setMode('list')
              setTab('Profile')
            }}
          />
        )}

        {/* Sub-page views */}
        {mode === 'create' && (
          <CreateGunPage
            onBack={handleBackToList}
            onSuccess={() => {
              handleBackToList()
              setTab('Catalog')
            }}
          />
        )}

        {mode === 'edit' && (
          <EditGunPage
            gun={editingGun}
            gunId={editingGun?.id}
            onBack={handleBackToList}
            onSuccess={() => {
              handleBackToList()
              setTab('Catalog')
            }}
          />
        )}

        {mode === 'detail' && selectedGun && (
          <GunDetail
            gun={selectedGun}
            onBack={handleBackToList}
            onEdit={(g) => handleNavigate('Edit', g)}
            onDelete={(g) => setDeleteTarget(g)}
            onArchive={handleArchiveGun}
          />
        )}

        {/* Top-level Tabs */}
        {mode === 'list' && (
          <>
            {tab === 'Catalog' && (
              <Catalog
                onNavigate={(destination, payload) => handleNavigate(destination, payload)}
                onArchive={handleArchiveGun}
              />
            )}
            {tab === 'Favorites' && (
              <FavoritesPage
                onSelectGun={(g) => handleNavigate('Detail', g)}
                onNavigateCatalog={() => setTab('Catalog')}
              />
            )}
            {tab === 'Profile' && (
              <ProfilePage
                onReplaySplash={() => setShowSplash(true)}
                onNavigate={handleNavigate}
              />
            )}
          </>
        )}
      </main>

      {/* Global Delete Confirmation */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Hardware Record"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            setDeleting(true)
            await gunService.deleteGun(deleteTarget.id)
            setDeleteTarget(null)
            handleBackToList()
            setTab('Catalog')
          } catch (err) {
            alert(err.message || 'Failed to delete record.')
          } finally {
            setDeleting(false)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Archive Confirmation */}
      <ConfirmModal
        open={Boolean(archiveTarget)}
        title="Arsipkan Produk"
        message={`Arsipkan "${archiveTarget?.name}"? Produk akan disembunyikan dari katalog. Kamu bisa memulihkannya dari halaman Arsip di Profil.`}
        confirmLabel="Arsipkan"
        loading={false}
        onConfirm={confirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
