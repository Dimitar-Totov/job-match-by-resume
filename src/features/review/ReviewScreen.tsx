import { useState } from 'react';
import { Button, Icon, TextAreaField, TextField } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useNav } from '../../hooks/useNav';
import { useResumeEditor } from '../../hooks/useResumeEditor';
import type { ResumeSaveStatus } from '../../hooks/useResumeEditor';
import type { EducationEntry, ExperienceEntry, ParsedResume } from '../../types';
import './ReviewScreen.css';

type ContactPatch = Partial<Pick<ParsedResume, 'name' | 'email' | 'phone' | 'location'>>;

// Footer save indicator: icon + tint + label per save state.
const SAVE_UI: Record<
  ResumeSaveStatus,
  { icon: string; color: string; label: string; spin?: boolean }
> = {
  idle: { icon: 'cloud_queue', color: 'var(--ink-3)', label: 'Changes save automatically' },
  pending: { icon: 'edit', color: 'var(--amber)', label: 'Unsaved changes…' },
  saving: { icon: 'progress_activity', color: 'var(--accent)', label: 'Saving…', spin: true },
  saved: { icon: 'cloud_done', color: 'var(--green)', label: 'All changes saved' },
  error: { icon: 'cloud_off', color: 'var(--red)', label: "Couldn't save — retry" },
};

export function ReviewScreen() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const { status, resume, saveStatus, update, saveNow } = useResumeEditor(user?.id);
  const [skillDraft, setSkillDraft] = useState('');

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="page page--md review u-fadein">
        <div className="review__banner review__banner--info">
          <Icon name="progress_activity" size={22} spin color="var(--accent)" />
          <div>
            <div className="review__bannerTitle">Loading your resume…</div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="page page--md review u-fadein">
        <div className="review__banner review__banner--error">
          <Icon name="error" size={22} color="var(--red)" />
          <div>
            <div className="review__bannerTitle">We couldn&apos;t load your resume</div>
            <div className="review__bannerText">Please refresh the page and try again.</div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'empty' || !resume) {
    return (
      <div className="page page--md review u-fadein">
        <div className="review__banner review__banner--info">
          <Icon name="info" size={22} color="var(--amber)" />
          <div>
            <div className="review__bannerTitle">No parsed resume yet</div>
            <div className="review__bannerText">Upload a resume to see its extracted details here.</div>
          </div>
        </div>
        <Button leadingIcon="upload_file" onClick={() => navigate('upload')}>
          Upload a resume
        </Button>
      </div>
    );
  }

  // --- Immutable edit helpers (the hook owns state + persistence) --------------
  const setContact = (patch: ContactPatch) => update((r) => ({ ...r, ...patch }));
  const setSummary = (value: string) => update((r) => ({ ...r, summary: value }));

  const setEdu = (i: number, patch: Partial<EducationEntry>) =>
    update((r) => ({
      ...r,
      education: r.education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    }));
  const addEdu = () =>
    update((r) => ({
      ...r,
      education: [...r.education, { school: '', degree: '', year: '', extra: '' }],
    }));
  const removeEdu = (i: number) =>
    update((r) => ({ ...r, education: r.education.filter((_, idx) => idx !== i) }));

  const addSkill = (value: string) => {
    const v = value.trim();
    if (!v) return;
    update((r) => (r.skills.includes(v) ? r : { ...r, skills: [...r.skills, v] }));
    setSkillDraft('');
  };
  const removeSkill = (i: number) =>
    update((r) => ({ ...r, skills: r.skills.filter((_, idx) => idx !== i) }));

  const setExp = (i: number, patch: Partial<ExperienceEntry>) =>
    update((r) => ({
      ...r,
      experience: r.experience.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    }));
  const setBullet = (i: number, j: number, value: string) =>
    update((r) => ({
      ...r,
      experience: r.experience.map((e, idx) =>
        idx === i ? { ...e, bullets: e.bullets.map((b, bj) => (bj === j ? value : b)) } : e,
      ),
    }));
  const addBullet = (i: number) =>
    update((r) => ({
      ...r,
      experience: r.experience.map((e, idx) =>
        idx === i ? { ...e, bullets: [...e.bullets, ''] } : e,
      ),
    }));
  const removeBullet = (i: number, j: number) =>
    update((r) => ({
      ...r,
      experience: r.experience.map((e, idx) =>
        idx === i ? { ...e, bullets: e.bullets.filter((_, bj) => bj !== j) } : e,
      ),
    }));
  const addExp = () =>
    update((r) => ({
      ...r,
      experience: [...r.experience, { role: '', company: '', dates: '', bullets: [''] }],
    }));
  const removeExp = (i: number) =>
    update((r) => ({ ...r, experience: r.experience.filter((_, idx) => idx !== i) }));

  const handleConfirm = async () => {
    await saveNow();
    // Force a fresh score for the edited resume (regenerate intent, honored by
    // useResumeAnalysis) instead of showing the now-stale cached analysis.
    navigate('analysis', { state: { regenerate: true } });
  };

  const save = SAVE_UI[saveStatus];

  return (
    <>
      <div className="page page--md review u-fadeup">
        <div className="review__banner review__banner--info">
          <Icon name="edit_note" size={22} color="var(--accent)" />
          <div>
            <div className="review__bannerTitle">Review &amp; edit your resume</div>
            <div className="review__bannerText">
              Fix anything the AI got wrong — changes save automatically as you type.
            </div>
          </div>
        </div>

        <section className="review__section">
          <div className="review__sectionHead">
            <Icon name="person" size={22} color="var(--accent)" />
            <h2>Contact</h2>
          </div>
          <div className="review__grid2">
            <TextField
              label="Full name"
              value={resume.name}
              onChange={(e) => setContact({ name: e.target.value })}
            />
            <TextField
              label="Email"
              type="email"
              value={resume.email}
              onChange={(e) => setContact({ email: e.target.value })}
            />
            <TextField
              label="Phone"
              value={resume.phone}
              onChange={(e) => setContact({ phone: e.target.value })}
            />
            <TextField
              label="Location"
              value={resume.location}
              onChange={(e) => setContact({ location: e.target.value })}
            />
          </div>
        </section>

        <section className="review__section">
          <div className="review__sectionHead">
            <Icon name="subject" size={22} color="var(--accent)" />
            <h2>Professional summary</h2>
          </div>
          <TextAreaField
            value={resume.summary ?? ''}
            rows={4}
            placeholder="A 2–3 sentence summary of your strengths. Accept the AI summary draft in AI Improve to fill this automatically."
            aria-label="Professional summary"
            onChange={(e) => setSummary(e.target.value)}
          />
        </section>

        <section className="review__section">
          <div className="review__sectionHead">
            <Icon name="school" size={22} color="var(--accent)" />
            <h2>Education</h2>
          </div>
          {resume.education.length === 0 && (
            <p className="review__empty">No education added yet.</p>
          )}
          {resume.education.map((edu, i) => (
            <div key={i} className="review__eduRow">
              <div className="review__eduGrid">
                <TextField
                  label="School"
                  value={edu.school}
                  className="review__span2"
                  onChange={(e) => setEdu(i, { school: e.target.value })}
                />
                <TextField
                  label="Degree"
                  value={edu.degree}
                  onChange={(e) => setEdu(i, { degree: e.target.value })}
                />
                <TextField
                  label="Years"
                  value={edu.year}
                  onChange={(e) => setEdu(i, { year: e.target.value })}
                />
              </div>
              <button
                type="button"
                className="review__removeEntry"
                aria-label="Remove this education entry"
                onClick={() => removeEdu(i)}
              >
                <Icon name="delete" size={18} />
              </button>
            </div>
          ))}
          <button type="button" className="review__addBtn" onClick={addEdu}>
            <Icon name="add" size={17} />
            Add education
          </button>
        </section>

        <section className="review__section">
          <div className="review__sectionHead">
            <Icon name="bolt" size={22} color="var(--accent)" />
            <h2>Skills</h2>
          </div>
          <div className="review__skills">
            {resume.skills.map((skill, i) => (
              <span key={`${skill}-${i}`} className="review__skill">
                {skill}
                <button type="button" aria-label={`Remove ${skill}`} onClick={() => removeSkill(i)}>
                  <Icon name="close" size={16} color="var(--ink-3)" />
                </button>
              </span>
            ))}
          </div>
          <div className="review__skillAdd">
            <input
              className="review__skillInput"
              placeholder="Add a skill…"
              value={skillDraft}
              onChange={(e) => setSkillDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill(skillDraft);
                }
              }}
              aria-label="Add a skill"
            />
            <Button
              variant="secondary"
              size="sm"
              leadingIcon="add"
              onClick={() => addSkill(skillDraft)}
              disabled={!skillDraft.trim()}
            >
              Add
            </Button>
          </div>
        </section>

        <section className="review__section">
          <div className="review__sectionHead">
            <Icon name="work" size={22} color="var(--accent)" />
            <h2>Experience</h2>
          </div>
          {resume.experience.length === 0 && (
            <p className="review__empty">No experience added yet.</p>
          )}
          <div className="review__expList">
            {resume.experience.map((exp, i) => (
              <div key={i} className="review__exp">
                <div className="review__expTop">
                  <div className="review__expGrid">
                    <input
                      className="review__expRole"
                      value={exp.role}
                      onChange={(e) => setExp(i, { role: e.target.value })}
                      placeholder="Role"
                      aria-label="Role"
                    />
                    <input
                      className="review__expCompany"
                      value={exp.company}
                      onChange={(e) => setExp(i, { company: e.target.value })}
                      placeholder="Company"
                      aria-label="Company"
                    />
                    <input
                      className="review__expDates"
                      value={exp.dates}
                      onChange={(e) => setExp(i, { dates: e.target.value })}
                      placeholder="Dates"
                      aria-label="Dates"
                    />
                  </div>
                  <button
                    type="button"
                    className="review__removeEntry"
                    aria-label="Remove this experience entry"
                    onClick={() => removeExp(i)}
                  >
                    <Icon name="delete" size={18} />
                  </button>
                </div>
                <div className="review__bullets">
                  {exp.bullets.map((bullet, j) => (
                    <div key={j} className="review__bullet">
                      <span aria-hidden="true">•</span>
                      <textarea
                        rows={2}
                        value={bullet}
                        onChange={(e) => setBullet(i, j, e.target.value)}
                        aria-label={`${exp.role || 'Experience'} bullet ${j + 1}`}
                      />
                      <button
                        type="button"
                        className="review__bulletRemove"
                        aria-label={`Remove bullet ${j + 1}`}
                        onClick={() => removeBullet(i, j)}
                      >
                        <Icon name="close" size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="review__addBullet" onClick={() => addBullet(i)}>
                    <Icon name="add" size={15} />
                    Add bullet
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="review__addBtn" onClick={addExp}>
            <Icon name="add" size={17} />
            Add experience
          </button>
        </section>
      </div>

      <div className="review__footer">
        <div className="review__footerInner">
          <button
            type="button"
            className="review__saved"
            onClick={saveStatus === 'error' ? () => void saveNow() : undefined}
            disabled={saveStatus !== 'error'}
          >
            <Icon name={save.icon} size={18} spin={save.spin} color={save.color} />
            {save.label}
          </button>
          <Button variant="secondary" onClick={() => navigate('upload')}>
            Back
          </Button>
          <Button trailingIcon="arrow_forward" onClick={handleConfirm}>
            Confirm &amp; analyze
          </Button>
        </div>
      </div>
    </>
  );
}
