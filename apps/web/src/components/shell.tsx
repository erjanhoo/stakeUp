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
        Skip to content
      </a>
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-label">YOUR SPACE</div>
        <nav aria-label="Your space">
          {links.map((link) => (
            <NavLink
              end={link.end}
              to={link.to}
              key={link.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <link.icon size={19} />
              <span>{link.label}</span>
              {link.to === '/app/circles' ? <span className="nav-count">0</span> : null}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-promise">
            <span className="small-star">✳</span>
            <h3>Better, together.</h3>
            <p>
              A little accountability.
              <br />A lot of possibility.
            </p>
            <Link to="/app/roadmap">
              The road ahead <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="virtual-caption">
            <span className="status-dot" /> VIRTUAL STAKES ONLY
          </div>
          <button className="logout-button" disabled={busy} onClick={logout}>
            <LogOut size={17} />
            {busy ? 'Signing out…' : 'Log out'}
          </button>
        </div>
      </aside>
      <div className="app-body">
        <header className="app-header">
          <div className="breadcrumb">
            <Mountain size={17} />
            <span>Your space</span>
            <span>/</span>
            <strong>StakeUp</strong>
          </div>
          <div className="header-actions">
            {mode === 'local' ? <span className="dev-indicator">LOCAL DEV</span> : null}
            <Button variant="ghost" size="icon" asChild>
              <Link to="/app/notifications" aria-label="Notifications">
                <Bell size={20} />
              </Link>
            </Button>
            <span className="header-divider" />
            <Link
              className="profile-chip"
              to="/app/settings"
              aria-label="Your profile and settings"
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
          <span>PROGRESS IS A TEAM SPORT.</span>
          <span>All stakes are virtual. Always.</span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {links.map((link) => (
          <NavLink end={link.end} to={link.to} key={link.to}>
            <link.icon size={20} />
            <span>{link.label === 'Overview' ? 'Home' : link.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
