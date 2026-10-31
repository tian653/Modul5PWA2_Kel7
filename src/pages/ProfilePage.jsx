import { useState, useCallback } from 'react'
import {
  Shield,
  Copy,
  Check,
  Heart,
  FileText,
  Camera,
  Play,
  Pencil,
  Archive,
  Info,
  Phone,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'

/**
 * Get count of active drafts in localStorage
 */
const getActiveDrafts = () => {
  try {
    const drafts = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('bore_barrel_draft_') || key.startsWith('recipe_draft_'))) {
        try {
          const raw = localStorage.getItem(key)
          const data = JSON.parse(raw)
          drafts.push({ key, ...data })
        } catch {
          drafts.push({ key })
        }
      }
    }
    return drafts
  } catch {
    return []
  }
}

/**
 * ProfilePage — User identity, stats, about, contact, and settings.
 * Edit profile is done in a separate page (EditProfilePage).
 */
export default function ProfilePage({ onReplaySplash, onNavigate }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [copied, setCopied] = useState(false)
  const [activeSection, setActiveSection] = useState('overview') // 'overview' | 'drafts' | 'about' | 'contact'

  const { favorites } = useFavorites()
  const drafts = getActiveDrafts()

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const refreshProfile = useCallback(() => {
    setProfile(userService.getUserProfile())
  }, [])

  // Expose refreshProfile for when we come back from EditProfilePage
  // (Using a simple key to force remount is another approach, but state refresh is sufficient)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Shield size={15} /> },
    { id: 'drafts', label: `Draft (${drafts.length})`, icon: <FileText size={15} /> },
    { id: 'about', label: 'About', icon: <Info size={15} /> },
    { id: 'contact', label: 'Contact', icon: <Phone size={15} /> },
  ]

  return (
    <div className="profile-page">
      {/* Masthead */}
      <section className="masthead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="display">Operator Profile</h1>
          <p className="lede">
            Operator credentials, procurement statistics, and armorer details.
          </p>
        </div>
        {onReplaySplash && (
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onReplaySplash}
            title="Replay introductory splash animation"
          >
            <Play size={14} /> Replay Intro
          </button>
        )}
      </section>

      {/* Operator Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
          </div>

          <div className="profile-identity" style={{ flex: 1 }}>
            <h2 className="display">{profile.username || 'Shooter'}</h2>
            {profile.bio && (
              <p style={{ color: 'var(--steel)', fontSize: '0.9rem', margin: '2px 0 6px' }}>
                {profile.bio}
              </p>
            )}
            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCopyId}
                title="Copy User ID to clipboard"
              >
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Edit Profile button */}
          {onNavigate && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => onNavigate('EditProfile')}
              title="Edit profil"
            >
              <Pencil size={14} /> Edit Profil
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="profile-stats">
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Procurement Favorites</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{drafts.length}</div>
            <div className="stat-label">Saved Offline Drafts</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="profile-quick-actions">
        <button
          type="button"
          className="profile-action-card"
          onClick={() => onNavigate && onNavigate('Archive')}
        >
          <Archive size={20} stroke="var(--brass)" />
          <span>Arsip Produk</span>
          <ChevronRight size={16} className="profile-action-chevron" />
        </button>
        <button
          type="button"
          className="profile-action-card"
          onClick={() => setActiveSection('drafts')}
        >
          <FileText size={20} stroke="var(--steel)" />
          <span>Draft Tersimpan ({drafts.length})</span>
          <ChevronRight size={16} className="profile-action-chevron" />
        </button>
      </div>

      {/* Section Tabs */}
      <div className="profile-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`profile-tab-btn ${activeSection === t.id ? 'profile-tab-btn--active' : ''}`}
            onClick={() => setActiveSection(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      {activeSection === 'overview' && (
        <OverviewSection profile={profile} favorites={favorites} refreshProfile={refreshProfile} />
      )}
      {activeSection === 'drafts' && <DraftsSection drafts={drafts} />}
      {activeSection === 'about' && <AboutSection />}
      {activeSection === 'contact' && <ContactSection />}
    </div>
  )
}

// ---- Sub-sections ----

function OverviewSection({ profile, favorites }) {
  return (
    <div className="profile-section-content">
      <div className="profile-form" style={{ gap: '12px' }}>
        <h3 className="section-title">Armorer Details</h3>
        <div className="profile-detail-row">
          <span className="form-label">Callsign</span>
          <span>{profile.username || 'Shooter'}</span>
        </div>
        <div className="profile-detail-row">
          <span className="form-label">Bio</span>
          <span style={{ color: profile.bio ? 'var(--ink)' : 'var(--steel)' }}>
            {profile.bio || '—'}
          </span>
        </div>
        <div className="profile-detail-row">
          <span className="form-label">User ID</span>
          <code style={{ fontSize: '0.8rem', color: 'var(--steel)' }}>{profile.userId}</code>
        </div>
        <div className="profile-detail-row">
          <span className="form-label">Last Updated</span>
          <span style={{ color: 'var(--steel)', fontSize: '0.88rem' }}>
            {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString('id-ID') : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

function DraftsSection({ drafts }) {
  const [visibleKeys, setVisibleKeys] = useState({})

  const toggleKey = (key) =>
    setVisibleKeys((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleDeleteDraft = (key) => {
    if (window.confirm('Hapus draft ini?')) {
      localStorage.removeItem(key)
      window.location.reload()
    }
  }

  if (drafts.length === 0) {
    return (
      <div className="state-box" style={{ marginTop: '16px' }}>
        <FileText size={32} stroke="var(--steel)" />
        <p className="lede">Tidak ada draft tersimpan.</p>
      </div>
    )
  }

  return (
    <div className="profile-section-content">
      <p className="lede" style={{ marginBottom: '16px' }}>
        Draft tersimpan secara offline di perangkat ini. Total: {drafts.length} draft.
      </p>
      <ul className="draft-list">
        {drafts.map((draft) => (
          <li key={draft.key} className="draft-item">
            <div className="draft-item-header">
              <div>
                <p className="draft-item-name">
                  {draft.name || draft.key.replace('bore_barrel_draft_', '').replace('recipe_draft_', '') || 'Draft tanpa nama'}
                </p>
                <p className="draft-item-key">{draft.key}</p>
              </div>
              <div className="draft-item-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => toggleKey(draft.key)}
                  title={visibleKeys[draft.key] ? 'Sembunyikan' : 'Lihat detail'}
                >
                  {visibleKeys[draft.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => handleDeleteDraft(draft.key)}
                  title="Hapus draft"
                  style={{ color: '#c0392b', borderColor: '#f5b7b1' }}
                >
                  ✕
                </button>
              </div>
            </div>
            {visibleKeys[draft.key] && (
              <pre className="draft-preview">
                {JSON.stringify(
                  Object.fromEntries(
                    Object.entries(draft).filter(([k]) => k !== 'key')
                  ),
                  null,
                  2
                )}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AboutSection() {
  return (
    <div className="profile-section-content">
      <div className="profile-form">
        <h3 className="section-title">A one-room armory.</h3>
        <p style={{ color: 'var(--steel)', lineHeight: 1.6 }}>
          Bore &amp; Barrel sells a short, honest list of firearms. Each piece is priced
          from the bench — no markup theatre, no filler.
        </p>
        <p style={{ color: 'var(--steel)', lineHeight: 1.6 }}>
          We stock pistols, rifles, and shotguns — nothing more. Every item in this catalog
          comes with full specifications, caliber details, and a real price. No MSRP fiction,
          no inflated dealer margins. Just honest hardware, honestly priced.
        </p>
        <p style={{ color: 'var(--steel)', lineHeight: 1.6 }}>
          This PWA is built for operators who want a fast, offline-capable catalog experience.
          Add hardware to favorites, write reviews, and share products via unique links.
        </p>
        <div className="about-badges">
          <span className="about-badge">⚡ PWA Ready</span>
          <span className="about-badge">📴 Offline Support</span>
          <span className="about-badge">🔒 Local-first</span>
        </div>
      </div>
    </div>
  )
}

function ContactSection() {
  return (
    <div className="profile-section-content">
      <div className="profile-form">
        <h3 className="section-title">Come by the shop.</h3>
        <div className="contact-rows">
          <div className="contact-row">
            <span className="form-label">📍 Address</span>
            <span>123 Range Road, Suite 1A</span>
          </div>
          <div className="contact-row">
            <span className="form-label">🕐 Hours</span>
            <span>Tuesday – Saturday, 10:00 – 18:00</span>
          </div>
          <div className="contact-row">
            <span className="form-label">📞 Phone</span>
            <a href="tel:+6255501010100" className="contact-link">(555) 010-0100</a>
          </div>
          <div className="contact-row">
            <span className="form-label">💬 WhatsApp</span>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-link"
            >
              Chat via WhatsApp
            </a>
          </div>
          <div className="contact-row">
            <span className="form-label">📧 Email</span>
            <a href="mailto:info@boreandbarrel.com" className="contact-link">
              info@boreandbarrel.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
