import { useMemo, useState } from 'react';
import { Icon } from '../../components';
import { cn } from '../../utils/cn';
import type { NotificationTone } from '../../types';
import { notifications as seedNotifications } from '../../services/mockData';
import './NotificationsScreen.css';

const TONE_CLASS: Record<NotificationTone, string> = {
  amber: 'tone-amber',
  green: 'tone-green',
  accent: 'tone-accent',
};

export function NotificationsScreen() {
  const [items, setItems] = useState(seedNotifications);
  const unread = useMemo(() => items.filter((item) => item.unread).length, [items]);

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  return (
    <div className="page page--narrow notifs u-fadeup">
      <div className="notifs__head">
        <div className="notifs__count">
          <b>{unread} unread</b> notifications
        </div>
        <button type="button" className="notifs__markAll" onClick={markAllRead} disabled={unread === 0}>
          <Icon name="done_all" size={18} />
          Mark all read
        </button>
      </div>

      <div className="notifs__list">
        {items.map((item) => (
          <article key={item.id} className={cn('notifs__item', item.unread && 'is-unread')}>
            <span className={cn('notifs__icon', TONE_CLASS[item.tone])}>
              <Icon name={item.icon} size={23} />
            </span>
            <div className="notifs__body">
              <div className="notifs__titleRow">
                <span className="notifs__title">{item.title}</span>
                {item.unread && <span className="notifs__dot" aria-label="Unread" />}
                <span className="notifs__time">{item.time}</span>
              </div>
              <div className="notifs__text">{item.body}</div>
              {item.cta && (
                <button type="button" className="notifs__cta">
                  {item.cta}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
