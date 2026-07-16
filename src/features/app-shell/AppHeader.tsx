import { Button, Icon } from '../../components';
import { useNav } from '../../hooks/useNav';
import { SCREEN_TITLES } from './navConfig';
import './AppHeader.css';

export function AppHeader() {
  const { screen, navigate, toggleSidebar } = useNav();

  return (
    <header className="appHeader">
      <button
        type="button"
        className="appHeader__menu"
        aria-label="Toggle navigation"
        onClick={toggleSidebar}
      >
        <Icon name="menu" size={22} />
      </button>

      <h1 className="appHeader__title">{SCREEN_TITLES[screen]}</h1>

      <div className="appHeader__actions">
        <div className="appHeader__search">
          <Icon name="search" size={20} color="var(--ink-3)" />
          <label className="sr-only" htmlFor="global-search">
            Search jobs and skills
          </label>
          <input id="global-search" type="search" placeholder="Search jobs, skills…" />
        </div>

        <button
          type="button"
          className="appHeader__icon"
          aria-label="Notifications, 3 unread"
          onClick={() => navigate('notifications')}
        >
          <Icon name="notifications" size={21} />
          <span className="appHeader__dot" aria-hidden="true" />
        </button>

        <Button size="sm" leadingIcon="upload_file" onClick={() => navigate('upload')}>
          Upload resume
        </Button>
      </div>
    </header>
  );
}
