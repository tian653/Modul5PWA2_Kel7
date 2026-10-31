import { useState } from 'react'
import { ArrowLeft, RotateCcw, Trash2, Archive, PackageOpen, Loader, RefreshCw } from 'lucide-react'
import { useGuns } from '../hooks/useGuns'
import { formatPrice } from '../utils/helpers'
import gunService from '../services/gunService'
import ConfirmModal from '../components/modals/ConfirmModal'

/**
 * ArchivePage — Shows all soft-deleted (archived) products.
 * Users can restore or permanently delete archived items.
 */
export default function ArchivePage({ onBack, onSelectGun }) {
  const { guns: archivedGuns, loading, error, refetch } = useGuns({ include_archived: true })
  const [restoring, setRestoring] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleRestore = async (gun) => {
    setRestoring(gun.id)
    gunService.restoreGun(gun.id)
    await new Promise((r) => setTimeout(r, 300))
    setRestoring(null)
    showToast(`"${gun.name}" berhasil dipulihkan.`)
    refetch()
  }

  const handleDeletePermanent = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await gunService.deleteGun(deleteTarget.id)
      setDeleteTarget(null)
      showToast(`"${deleteTarget.name}" dihapus permanen.`)
      refetch()
    } catch (err) {
      alert(err.message || 'Gagal menghapus.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="archive-page form-page">
      {/* Header */}
      <div className="form-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali ke Profil
        </button>
      </div>

      <div className="form-title-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="display">
            <Archive size={28} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
            Arsip Produk
          </h1>
          <p className="lede">Produk yang diarsipkan tidak muncul di katalog. Kamu bisa memulihkan atau menghapus permanen.</p>
        </div>
        <button type="button" className="btn btn--outline btn--sm" onClick={refetch}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {toast && (
        <div className="toast toast--success" style={{ marginBottom: '16px' }}>
          {toast}
        </div>
      )}

      {loading && (
        <div className="state-box">
          <Loader size={28} className="spin" />
          <p>Memuat arsip…</p>
        </div>
      )}

      {!loading && error && (
        <div className="state-box state-box--error">
          <p>{error}</p>
          <button type="button" className="btn btn--outline" onClick={refetch}>
            Coba Lagi
          </button>
        </div>
      )}

      {!loading && archivedGuns.length === 0 && !error && (
        <div className="state-box">
          <PackageOpen size={40} stroke="var(--steel)" />
          <h3>Tidak Ada Arsip</h3>
          <p className="lede">Belum ada produk yang diarsipkan.</p>
        </div>
      )}

      {!loading && archivedGuns.length > 0 && (
        <ul className="archive-list">
          {archivedGuns.map((gun) => (
            <li key={gun.id} className="archive-item">
              <img
                src={gun.image_url || '/guns/pistol.svg'}
                alt={gun.name}
                className="archive-item-img"
                loading="lazy"
              />
              <div className="archive-item-info">
                <p className="archive-item-name display">{gun.name}</p>
                <p className="archive-item-meta">
                  {gun.type}{gun.caliber ? ` · ${gun.caliber}` : ''}
                </p>
                <p className="archive-item-price">{formatPrice(gun.price)}</p>
              </div>
              <div className="archive-item-actions">
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => handleRestore(gun)}
                  disabled={restoring === gun.id}
                  title="Pulihkan ke katalog"
                >
                  {restoring === gun.id ? (
                    <Loader size={14} className="spin" />
                  ) : (
                    <RotateCcw size={14} />
                  )}
                  Pulihkan
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => setDeleteTarget(gun)}
                  title="Hapus permanen"
                >
                  <Trash2 size={14} /> Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Confirm permanent delete */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Permanen"
        message={`Apakah kamu yakin ingin menghapus "${deleteTarget?.name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Permanen"
        danger
        loading={deleting}
        onConfirm={handleDeletePermanent}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
