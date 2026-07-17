import { useState } from 'react';
import { cn } from '../../utils/cn';
import { ConfirmDialog, Icon } from '../../components';
import { Logo } from '../../components/Logo';
import { useNav } from '../../hooks/useNav';
import type { Screen } from '../../types';
import { signOut } from '../../services/authService';
import { BOTTOM_NAV, NAV_SECTIONS } from './navConfig';
import type { NavItem } from './navConfig';
import './Sidebar.css';

export function Sidebar() {
  const { screen, navigate, sidebarCollapsed } = useNav();
  const showLabels = !sidebarCollapsed;
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    if (isSigningOut) return;

    setIsSigningOut(true);

    signOut()
      .then(() => {
        navigate('welcome' satisfies Screen, { replace: true });
      })
      .catch((err: unknown) => {
        console.error('Failed to sign out:', err);
      })
      .finally(() => {
        setIsSigningOut(false);
        setShowLogoutConfirm(false);
      });
  };

  const renderItem = (item: NavItem) => {
    const active = item.screen === screen;
    return (
      <button
        key={item.screen}
        type="button"
        className={cn('navItem', active && 'navItem--active', sidebarCollapsed && 'navItem--compact')}
        title={item.label}
        aria-current={active ? 'page' : undefined}
        onClick={() => navigate(item.screen)}
      >
        <Icon name={item.icon} size={22} filled={active} />
        {showLabels && <span className="navItem__label">{item.label}</span>}
        {showLabels && item.badge && <span className="navItem__badge">{item.badge}</span>}
      </button>
    );
  };

  return (
    <aside className={cn('sidebar', sidebarCollapsed && 'sidebar--collapsed')}>
      <div className="sidebar__brand">
        <Logo size="sm" markOnly={sidebarCollapsed} />
      </div>

      <nav className="sidebar__nav" aria-label="Primary">
        {NAV_SECTIONS.map((section, index) => (
          <div key={section.label || `section-${index}`}>
            {section.label && showLabels && (
              <div className="sidebar__sectionLabel">{section.label}</div>
            )}
            {section.items.map(renderItem)}
          </div>
        ))}
      </nav>

      <div className="sidebar__bottom">
        {BOTTOM_NAV.map(renderItem)}
        <button
          type="button"
          className={cn('sidebar__profile', sidebarCollapsed && 'sidebar__profile--compact')}
          onClick={() => navigate('settings' satisfies Screen)}
        >
          <span className="sidebar__avatar">JD</span>
          {showLabels && (
            <span className="sidebar__profileText">
              <span className="sidebar__profileName">Jordan Diaz</span>
              <span className="sidebar__profilePlan">Free plan</span>
            </span>
          )}
        </button>
        <button
          type="button"
          className={cn('sidebar__logout', sidebarCollapsed && 'sidebar__logout--compact')}
          title="Log out"
          disabled={isSigningOut}
          onClick={() => setShowLogoutConfirm(true)}
        >
          <Icon name="logout" size={20} />
          {showLabels && <span className="sidebar__logoutLabel">Log out</span>}
        </button>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Log out?"
        description="You'll need to sign in again to access your dashboard."
        confirmLabel="Log out"
        cancelLabel="Cancel"
        tone="destructive"
        confirmLoading={isSigningOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </aside>
  );
}
