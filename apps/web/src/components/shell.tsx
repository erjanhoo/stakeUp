import { useI18n } from '../lib/i18n';
import { NotificationBell } from './community';
import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  House,
  UsersRound,
  Activity,
  Settings2,
  ArrowUpRight,
  LogOut,
  Bell,
  ChevronDown,
  Mountain,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { message } from '../lib/api';
import { Avatar, Brand, ErrorMessage } from './common';
import { Button } from './ui/button';
const links = [
  { to: '/app', label: 'Overview', icon: House, end: true },
  { to: '/app/circles', label: 'My circles', icon: UsersRound },
  { to: '/app/activity', label: 'Activity', icon: Activity },
  { to: '/app/settings', label: 'Settings', icon: Settings2 },
];
export function Shell() {
  const { t } = useI18n();

  const { profile, signOut, mode } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        {t('Skip to content')}{' '}
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-label">{t('YOUR SPACE')}</div>
        <nav aria-label={t('Your space')}>
          {links.map((link) => (
            <NavLink
              end={link.end}
              to={link.to}
              key={link.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <link.icon size={19} />
              <span>{t(link.label)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-promise">
            <span className="small-star">✳</span>
            <h3>{t('Better, together.')}</h3>
            <p>
              {t('A little accountability.')} <br />
              {t('A lot of possibility.')}{' '}
            </p>
            <Link to="/app/roadmap">
              {t('The road ahead')} <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="virtual-caption">
            <span className="status-dot" /> {t('VIRTUAL STAKES ONLY')}{' '}
          </div>
          <button className="logout-button" disabled={busy} onClick={logout}>
            <LogOut size={17} />
            {busy ? t('Signing out…') : t('Log out')}
          </button>
        </div>
      </aside>
      <div className="app-body">
        <header className="app-header">
          <div className="breadcrumb">
            <Mountain size={17} />
            <span>{t('Your space')}</span>
            <span>/</span>
            <strong>StakeUp</strong>
          </div>
          <div className="header-actions">
            {mode === 'local' ? <span className="dev-indicator">{t('LOCAL DEV')}</span> : null}
            <NotificationBell />
            <span className="header-divider" />
            <Link
              className="profile-chip"
              to="/app/settings"
              aria-label={t('Your profile and settings')}
            >
              <Avatar name={profile?.displayName ?? 'You'} />
              <span>{profile?.displayName}</span>
              <ChevronDown size={14} />
            </Link>
          </div>
        </header>
        <main id="main-content" className="app-main">
          {error ? <ErrorMessage message={error} /> : null}
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>{t('PROGRESS IS A TEAM SPORT.')}</span>
          <span>{t('All stakes are virtual. Always.')}</span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label={t('Mobile navigation')}>
        {links.map((link) => (
          <NavLink end={link.end} to={link.to} key={link.to}>
            <link.icon size={20} />
            <span>{link.label === 'Overview' ? t('Home') : t(link.label)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
