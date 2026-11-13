import { JoinCircleButton } from './invitation';
import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  ReceiptText,
  SlidersHorizontal,
  ArrowUpRight,
  LogOut,
  Globe,
  Award,
  ClipboardCheck,
} from 'lucide-react';
import type { CircleSummary } from '@stakeup/contracts';
import { useI18n } from '../lib/i18n';
import { NotificationBell } from './community';
import { useAuth } from '../lib/auth';
import { useResource } from '../lib/social';
import { message } from '../lib/api';
import { Avatar, Brand, ErrorMessage } from './common';
import { NetworkNotice } from './install-card';
const links = [
  { to: '/app', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/app/circles', label: 'My circles', icon: Users },
  { to: '/app/reviews', label: 'Review inbox', icon: ClipboardCheck },
  { to: '/app/activity', label: 'Activity', icon: ReceiptText },
  { to: '/app/settings', label: 'Settings', icon: SlidersHorizontal },
];
export function Shell() {
  const { t } = useI18n(),
    { profile, signOut } = useAuth(),
    { data: circles, reload: reloadCircles } = useResource<CircleSummary[]>('/circles'),
    navigate = useNavigate();
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0 });
    else {
      const target = () => document.getElementById(hash.slice(1))?.scrollIntoView();
      const observer = new MutationObserver(target);
      observer.observe(document.getElementById('root')!, { childList: true, subtree: true });
      target();
      const timer = setTimeout(() => observer.disconnect(), 1500);
      return () => {
        clearTimeout(timer);
        observer.disconnect();
      };
    }
  }, [pathname, hash]);
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
            <span className="st-version">{profile?.currency ?? 'USD'}</span>
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
              <NavLink
                to={`/app/members/${profile?.id}`}
                className={({ isActive }) => `st-nav-link ${isActive ? 'is-active' : ''}`}
              >
                <Award size={19} />
                {t('Achievements')}
              </NavLink>
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
          </div>
        </div>
        <div className="st-profile-dock">
          <Link to={`/app/members/${profile?.id}`} aria-label={t('Your profile')}>
            <Avatar userId={profile?.id} linked={false} name={profile?.displayName ?? ''} />
            <div>
              <strong>{profile?.displayName}</strong>
              <span>@{profile?.username}</span>
            </div>
            <ArrowUpRight size={16} />
          </Link>
          <div className="st-profile-dock-footer">
            <span>{t('Your private workspace')}</span>
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
            <span>{t('Your workspace')}</span>
          </div>
          <div className="st-topbar-actions">
            {!['/app', '/app/circles'].includes(pathname) && <JoinCircleButton />}
            <NotificationBell />
            <Link
              className="st-topbar-review"
              to="/app/reviews"
              aria-label={t('Review inbox')}
              title={t('Review inbox')}
            >
              <ClipboardCheck size={20} />
            </Link>
            <Link
              className="st-topbar-avatar"
              to={`/app/members/${profile?.id}`}
              aria-label={t('Your profile')}
            >
              <Avatar userId={profile?.id} linked={false} name={profile?.displayName ?? ''} />
            </Link>
          </div>
        </header>
        <main id="main-content" className="st-main">
          <NetworkNotice />
          {error ? <ErrorMessage message={error} /> : null}
          <Outlet />
        </main>
        <footer className="st-app-footer">
          <span>StakeUp</span>
          <span>{t('Your people. Your promise.')}</span>
        </footer>
      </div>
      <nav className="st-bottom-nav" aria-label={t('Mobile navigation')}>
        {links
          .filter((l) => l.to !== '/app/activity')
          .map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              <l.icon size={21} />
              <span>
                {t(
                  l.to === '/app'
                    ? 'Home'
                    : l.to === '/app/activity'
                      ? 'Activity'
                      : l.to === '/app/reviews'
                        ? 'Reviews'
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
