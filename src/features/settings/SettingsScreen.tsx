import { useEffect, useState } from 'react';
import { Button, Chip, TextField, Toggle } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { updateProfile } from '../../services/profileService';
import {
  defaultSettings,
  onboardingExpLevels,
  onboardingFields,
  onboardingGradYears,
  onboardingIndustries,
  onboardingRoles,
  settingItems,
} from '../../services/mockData';
import type { Profile } from '../../types';
import { getInitials } from '../../utils/initials';
import './SettingsScreen.css';

interface ProfileFormState {
  username: string;
  email: string;
  fieldOfStudy: string;
  graduationYear: string;
  targetRoles: string[];
  targetIndustries: string[];
  experienceLevel: string;
}

type ProfileUpdates = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

function toFormState(profile: Profile | null): ProfileFormState {
  return {
    username: profile?.username ?? '',
    email: profile?.email ?? '',
    fieldOfStudy: profile?.field_of_study ?? '',
    graduationYear: profile?.graduation_year ?? '',
    targetRoles: profile?.target_roles ?? [],
    targetIndustries: profile?.target_industries ?? [],
    experienceLevel: profile?.experience_level ?? '',
  };
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function buildUpdates(form: ProfileFormState, profile: Profile | null): ProfileUpdates {
  const baseline = toFormState(profile);
  const updates: ProfileUpdates = {};

  if (form.username !== baseline.username) updates.username = form.username.trim() || null;
  if (form.email !== baseline.email) updates.email = form.email.trim() || null;
  if (form.fieldOfStudy !== baseline.fieldOfStudy) {
    updates.field_of_study = form.fieldOfStudy || null;
  }
  if (form.graduationYear !== baseline.graduationYear) {
    updates.graduation_year = form.graduationYear || null;
  }
  if (!arraysEqual(form.targetRoles, baseline.targetRoles)) {
    updates.target_roles = form.targetRoles;
  }
  if (!arraysEqual(form.targetIndustries, baseline.targetIndustries)) {
    updates.target_industries = form.targetIndustries;
  }
  if (form.experienceLevel !== baseline.experienceLevel) {
    updates.experience_level = form.experienceLevel || null;
  }

  return updates;
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function SettingsScreen() {
  const { user } = useAuth();
  const {
    status,
    profile,
    error: profileError,
    reload,
    setProfile,
  } = useProfile(user?.id);

  const [toggles, setToggles] = useState<Record<string, boolean>>(defaultSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProfileFormState>(() => toFormState(null));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Keep the form in sync with the last-saved profile whenever it changes
  // (initial load, reload after an error, or a fresh save) — but never while
  // the user has in-progress, unsaved edits open.
  useEffect(() => {
    if (!isEditing) {
      setForm(toFormState(profile));
    }
  }, [profile, isEditing]);

  const setToggle = (key: string, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
  };

  const handleEditClick = () => {
    setForm(toFormState(profile));
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setForm(toFormState(profile));
    setSaveError(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;

    const updates = buildUpdates(form, profile);
    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateProfile(user.id, updates);
      setProfile(updated);
      setIsEditing(false);
    } catch {
      setSaveError('We could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = getInitials(form.username, form.email);

  return (
    <div className="page page--narrow u-fadeup">
      <section className="settings__card">
        {status === 'loading' && (
          <p className="settings__profileStatus">Loading your profile…</p>
        )}

        {status === 'error' && (
          <div className="settings__profileStatus settings__profileStatus--error" role="alert">
            <p>{profileError}</p>
            <Button variant="secondary" size="sm" onClick={reload}>
              Retry
            </Button>
          </div>
        )}

        {status === 'done' && profile === null && (
          <p className="settings__profileStatus">No profile found for this account.</p>
        )}

        {status === 'done' && profile !== null && (
          <>
            <div className="settings__profileHeader">
              <div className="settings__profile">
                <span className="settings__avatar">{initials}</span>
                <div>
                  <div className="settings__name">{form.username || 'Unnamed user'}</div>
                  <div className="settings__email">{form.email || 'No email on file'}</div>
                </div>
              </div>
              {!isEditing && (
                <Button variant="secondary" size="sm" leadingIcon="edit" onClick={handleEditClick}>
                  Edit
                </Button>
              )}
            </div>

            {!isEditing ? (
              <dl className="settings__grid settings__grid--display">
                <div className="settings__field">
                  <dt className="settings__fieldLabel">Username</dt>
                  <dd className="settings__fieldValue">{form.username || '—'}</dd>
                </div>
                <div className="settings__field">
                  <dt className="settings__fieldLabel">Email</dt>
                  <dd className="settings__fieldValue">{form.email || '—'}</dd>
                </div>
                <div className="settings__field">
                  <dt className="settings__fieldLabel">Field of study</dt>
                  <dd className="settings__fieldValue">{form.fieldOfStudy || '—'}</dd>
                </div>
                <div className="settings__field">
                  <dt className="settings__fieldLabel">Graduation year</dt>
                  <dd className="settings__fieldValue">{form.graduationYear || '—'}</dd>
                </div>
                <div className="settings__field settings__field--wide">
                  <dt className="settings__fieldLabel">Target roles</dt>
                  <dd className="settings__fieldValue">
                    {form.targetRoles.length ? form.targetRoles.join(', ') : '—'}
                  </dd>
                </div>
                <div className="settings__field settings__field--wide">
                  <dt className="settings__fieldLabel">Target industries</dt>
                  <dd className="settings__fieldValue">
                    {form.targetIndustries.length ? form.targetIndustries.join(', ') : '—'}
                  </dd>
                </div>
                <div className="settings__field">
                  <dt className="settings__fieldLabel">Experience level</dt>
                  <dd className="settings__fieldValue">{form.experienceLevel || '—'}</dd>
                </div>
              </dl>
            ) : (
              <div className="settings__editForm">
                <div className="settings__grid">
                  <TextField
                    label="Username"
                    value={form.username}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, username: event.target.value }))
                    }
                    disabled={saving}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    disabled={saving}
                  />
                </div>

                <h3 className="settings__group">Field of study</h3>
                <div className="settings__chips">
                  {onboardingFields.map((option) => (
                    <Chip
                      key={option}
                      selected={form.fieldOfStudy === option}
                      onClick={
                        saving
                          ? undefined
                          : () => setForm((prev) => ({ ...prev, fieldOfStudy: option }))
                      }
                    >
                      {option}
                    </Chip>
                  ))}
                </div>

                <h3 className="settings__group">Graduation year</h3>
                <label className="sr-only" htmlFor="settings-grad-year">
                  Graduation year
                </label>
                <select
                  id="settings-grad-year"
                  className="settings__select"
                  value={form.graduationYear}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, graduationYear: event.target.value }))
                  }
                  disabled={saving}
                >
                  <option value="">Select a year</option>
                  {onboardingGradYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <h3 className="settings__group">Target roles</h3>
                <div className="settings__chips">
                  {onboardingRoles.map((option) => (
                    <Chip
                      key={option}
                      selected={form.targetRoles.includes(option)}
                      onClick={
                        saving
                          ? undefined
                          : () =>
                              setForm((prev) => ({
                                ...prev,
                                targetRoles: toggleValue(prev.targetRoles, option),
                              }))
                      }
                    >
                      {option}
                    </Chip>
                  ))}
                </div>

                <h3 className="settings__group">Target industries</h3>
                <div className="settings__chips">
                  {onboardingIndustries.map((option) => (
                    <Chip
                      key={option}
                      selected={form.targetIndustries.includes(option)}
                      onClick={
                        saving
                          ? undefined
                          : () =>
                              setForm((prev) => ({
                                ...prev,
                                targetIndustries: toggleValue(prev.targetIndustries, option),
                              }))
                      }
                    >
                      {option}
                    </Chip>
                  ))}
                </div>

                <h3 className="settings__group">Experience level</h3>
                <div className="settings__chips">
                  {onboardingExpLevels.map((option) => (
                    <Chip
                      key={option}
                      selected={form.experienceLevel === option}
                      onClick={
                        saving
                          ? undefined
                          : () => setForm((prev) => ({ ...prev, experienceLevel: option }))
                      }
                    >
                      {option}
                    </Chip>
                  ))}
                </div>

                {saveError && (
                  <p className="settings__profileError" role="alert">
                    {saveError}
                  </p>
                )}

                <div className="settings__editActions">
                  <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={() => void handleSave()} disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
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
              Download all your resumes, jobs and history as a ZIP.
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
