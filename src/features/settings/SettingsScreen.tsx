import { useState } from 'react';
import { Button, TextField, Toggle } from '../../components';
import { defaultSettings, settingItems } from '../../services/mockData';
import './SettingsScreen.css';

export function SettingsScreen() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(defaultSettings);

  const setToggle = (key: string, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="page page--narrow u-fadeup">
      <section className="settings__card">
        <div className="settings__profile">
          <span className="settings__avatar">JD</span>
          <div>
            <div className="settings__name">Jordan Diaz</div>
            <div className="settings__email">jordan.diaz@email.com</div>
          </div>
          <Button variant="secondary" size="sm" className="settings__editPhoto">
            Edit photo
          </Button>
        </div>
        <div className="settings__grid">
          <TextField label="Full name" defaultValue="Jordan Diaz" />
          <TextField label="Email" type="email" defaultValue="jordan.diaz@email.com" />
          <TextField label="Target role" defaultValue="Product Designer" />
          <TextField label="Location" defaultValue="San Francisco, CA" />
        </div>
      </section>

      <section className="settings__card settings__card--flush">
        <h2 className="settings__sectionTitle">Notifications</h2>
        {settingItems.map((item) => (
          <div key={item.key} className="settings__row">
            <div className="settings__rowText">
              <div className="settings__rowLabel">{item.label}</div>
              <div className="settings__rowDesc">{item.desc}</div>
            </div>
            <Toggle
              label={item.label}
              checked={toggles[item.key] ?? false}
              onChange={(value) => setToggle(item.key, value)}
            />
          </div>
        ))}
      </section>

      <section className="settings__card">
        <h2 className="settings__sectionTitle settings__sectionTitle--tight">Plan &amp; billing</h2>
        <div className="settings__plan">
          <div className="settings__planText">
            <div className="settings__planEyebrow">Currently on Free</div>
            <div className="settings__planTitle">Upgrade to Pro</div>
            <div className="settings__planDesc">
              Unlimited tailoring, cover letters &amp; deep ATS scans.
            </div>
          </div>
          <button type="button" className="settings__planBtn">
            Go Pro · $9/mo
          </button>
        </div>
      </section>

      <section className="settings__card settings__card--flush">
        <h2 className="settings__sectionTitle">Data &amp; privacy</h2>
        <div className="settings__row settings__row--bordered">
          <div className="settings__rowText">
            <div className="settings__rowLabel">Export my data</div>
            <div className="settings__rowDesc">
              Download all your résumés, jobs and history as a ZIP.
            </div>
          </div>
          <Button variant="secondary" size="sm">
            Export
          </Button>
        </div>
        <div className="settings__row settings__row--bordered">
          <div className="settings__rowText">
            <div className="settings__rowLabel settings__rowLabel--danger">Delete account</div>
            <div className="settings__rowDesc">Permanently remove your account and all data.</div>
          </div>
          <button type="button" className="settings__delete">
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}
