import { useState } from 'react'
import { ArrowLeft, Save, Check, Camera, Shield } from 'lucide-react'
import userService from '../services/userService'

/**
 * EditProfilePage — Edit username, bio, and avatar in a dedicated page.
 * Opened from ProfilePage, returns via onBack().
 */
export default function EditProfilePage({ onBack }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [feedback, setFeedback] = useState('')
  const [isError, setIsError] = useState(false)

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setIsError(true)
      setFeedback('Avatar image must be under 2MB.')
      setTimeout(() => setFeedback(''), 3000)
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setAvatar(event.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = (e) => {
    e.preventDefault()
    const updated = {
      ...profile,
      username: username.trim() || 'Shooter',
      bio: bio.trim(),
      avatar,
    }
    const result = userService.saveUserProfile(updated)
    if (result.success) {
      setProfile(result.data)
      setIsError(false)
      setFeedback('Profil berhasil diperbarui!')
      setTimeout(() => {
        setFeedback('')
        onBack()
      }, 1500)
    } else {
      setIsError(true)
      setFeedback('Gagal menyimpan profil.')
    }
  }

  return (
    <div className="edit-profile-page form-page">
      <div className="form-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali ke Profil
        </button>
      </div>

      <div className="form-title-group">
        <h1 className="display">Edit Profil</h1>
        <p className="lede">Perbarui callsign, bio, dan foto profil kamu.</p>
      </div>

      {feedback && (
        <div className={`toast ${isError ? 'toast--error' : 'toast--success'}`}>
          {!isError && <Check size={18} />} {feedback}
        </div>
      )}

      <form onSubmit={handleSave} className="edit-profile-form card-box">
        {/* Avatar section */}
        <div className="edit-avatar-section">
          <div className="avatar-wrap avatar-wrap--lg">
            {avatar ? (
              <img src={avatar} alt={username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={48} stroke="var(--brass)" />
              </div>
            )}
            <label htmlFor="edit-avatar-input" className="avatar-upload-btn" title="Upload foto profil">
              <Camera size={14} />
              <input
                id="edit-avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden-file-input"
              />
            </label>
          </div>
          <div>
            <p className="form-label" style={{ marginBottom: '4px' }}>Foto Profil</p>
            <p className="form-hint">Klik ikon kamera untuk upload. Maks 2MB.</p>
            {avatar && (
              <button
                type="button"
                className="btn btn--outline btn--sm"
                style={{ marginTop: '8px' }}
                onClick={() => setAvatar(null)}
              >
                Hapus Foto
              </button>
            )}
          </div>
        </div>

        {/* Username */}
        <div className="form-group">
          <label htmlFor="ep-username" className="form-label">
            Callsign / Operator Alias <span className="req">*</span>
          </label>
          <input
            id="ep-username"
            type="text"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. Operator Delta, Master Gunsmith"
            maxLength={50}
            required
          />
        </div>

        {/* Bio */}
        <div className="form-group">
          <label htmlFor="ep-bio" className="form-label">
            Armory Notes / Station Bio
          </label>
          <textarea
            id="ep-bio"
            className="form-textarea"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Kualifikasi, kaliber favorit, unit penugasan…"
            maxLength={300}
          />
          <p className="form-hint">{bio.length}/300 karakter</p>
        </div>

        {/* Actions */}
        <div className="form-actions-bar">
          <button type="button" className="btn btn--outline" onClick={onBack}>
            Batal
          </button>
          <button type="submit" className="btn btn--primary">
            <Save size={16} /> Simpan Profil
          </button>
        </div>
      </form>
    </div>
  )
}
