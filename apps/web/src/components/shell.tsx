import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  ReceiptText,
  SlidersHorizontal,
  ArrowUpRight,
  LogOut,
  Plus,
  KeyRound,
  Route,
  Globe,
} from 'lucide-react';
import type { CircleSummary } from '@stakeup/contracts';
import { useI18n } from '../lib/i18n';
import { NotificationBell } from './community';
import { useAuth } from '../lib/auth';
import { useResource } from '../lib/social';
import { message } from '../lib/api';
import { Avatar, Brand, ErrorMessage } from './common';
const links = [
  { to: '/app', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/app/circles', label: 'My circles', icon: Users },
  { to: '/app/activity', label: 'Personal activity', icon: ReceiptText },
  { to: '/app/settings', label: 'Settings & appearance', icon: SlidersHorizontal },
];
export function Shell() {
  const { t } = useI18n(),
    { profile, signOut } = useAuth(),
    { data: circles, reload: reloadCircles } = useResource<CircleSummary[]>('/circles'),
    navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    void reloadCircles();
  }, [pathname, reloadCircles]);
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await signOut();
      navigate('/login');
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="st-shell">
      <a className="skip-link" href="#main-content">
        {t('Skip to content')}
      </a>
      <aside className="st-sidebar">
        <div>
          <div className="st-sidebar-brand">
            <Brand />
            <span className="st-version">VC</span>
          </div>
          <div className="st-sidebar-caption">
            <i />
            {t('PRIVATE CIRCLES')}
          </div>
          <div className="st-nav-group">
            <span className="st-mono st-nav-heading">{t('Your workspace')}</span>
            <nav aria-label={t('Your space')}>
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) => `st-nav-link ${isActive ? 'is-active' : ''}`}
                >
                  <l.icon size={19} />
                  {t(l.label)}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="st-nav-group">
            <div className="st-nav-heading st-squad-label">
              <span>{t('Your circles')}</span>
              <span>{circles?.filter((c) => !c.archived).length ?? '—'}</span>
            </div>
            <div className="st-squad-list">
              {circles
                ?.filter((c) => !c.archived)
                .slice(0, 6)
                .map((c) => (
                  <Link to={`/app/circles/${c.id}`} key={c.id}>
                    <i />
                    <span>{c.name}</span>
                    <small>{t(c.role === 'owner' ? 'Owner' : 'Member')}</small>
                  </Link>
                ))}
            </div>
            <Link className="st-nav-link" to="/app/roadmap">
              <Route size={18} />
              {t('The road ahead')}
            </Link>
          </div>
        </div>
        <div className="st-profile-dock">
          <Link to="/app/settings" aria-label={t('Your profile and settings')}>
            <Avatar name={profile?.displayName ?? ''} />
            <div>
              <strong>{profile?.displayName}</strong>
              <span>@{profile?.username}</span>
            </div>
            <ArrowUpRight size={16} />
          </Link>
          <div className="st-profile-dock-footer">
            <span>{t('VIRTUAL STAKES ONLY')}</span>
            <button disabled={busy} onClick={() => void logout()} aria-label={t('Log out')}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="st-app-content">
        <header className="st-topbar">
          <div className="st-phone-brand">
            <Brand />
          </div>
          <div className="st-topbar-location">
            <Globe size={15} />
            <span>{profile?.timezone}</span>
            <span className="st-topbar-divider" />
            <span>{t('All stakes are virtual. Always.')}</span>
          </div>
          <div className="st-topbar-actions">
            <Link className="st-topbar-join" to="/join">
              <KeyRound size={14} />
              {t('Join circle')}
            </Link>
            <Link className="st-btn st-btn-small" to="/app/circles/new">
              <Plus size={15} />
              {t('Create circle')}
            </Link>
            <NotificationBell />
            <Link
              className="st-topbar-avatar"
              to="/app/settings"
              aria-label={t('Your profile and settings')}
            >
              <Avatar name={profile?.displayName ?? ''} />
            </Link>
          </div>
        </header>
        <main id="main-content" className="st-main">
          {error ? <ErrorMessage message={error} /> : null}
          <Outlet />
        </main>
        <footer className="st-app-footer">
          <span>{t('StakeUp · All stakes are virtual.')}</span>
          <span>{t('Private circles. Friendly stakes. Always virtual.')}</span>
        </footer>
      </div>
      <nav className="st-bottom-nav" aria-label={t('Mobile navigation')}>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            <l.icon size={21} />
            <span>
              {t(
                l.to === '/app'
                  ? 'Home'
                  : l.to === '/app/activity'
                    ? 'Activity'
                    : l.to === '/app/settings'
                      ? 'Settings'
                      : l.label,
              )}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
