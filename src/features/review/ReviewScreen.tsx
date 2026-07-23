import { Button, Icon } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useNav } from '../../hooks/useNav';
import { useResume } from '../../hooks/useResume';
import './ReviewScreen.css';

export function ReviewScreen() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const { status, resume: record } = useResume(user?.id);
  const resume = record?.parsed ?? null;

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

  if (!resume) {
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

  return (
    <div className="review__page">
      <div className="page page--md review u-fadeup">
        <div className="review__banner review__banner--info">
          <Icon name="fact_check" size={22} color="var(--accent)" />
          <div>
            <div className="review__bannerTitle">Review your resume</div>
            <div className="review__bannerText">
              AI-based extraction can occasionally misread details — please confirm the information
              below matches your resume before continuing.
            </div>
          </div>
        </div>

        <section className="review__section">
          <div className="review__sectionHead">
            <Icon name="person" size={22} color="var(--accent)" />
            <h2>Contact</h2>
          </div>
          <div className="review__grid2">
            <div className="review__field">
              <span className="review__fieldLabel">Full name</span>
              <span className="review__fieldValue">{resume.name || '—'}</span>
            </div>
            <div className="review__field">
              <span className="review__fieldLabel">Email</span>
              <span className="review__fieldValue">{resume.email || '—'}</span>
            </div>
            <div className="review__field">
              <span className="review__fieldLabel">Phone</span>
              <span className="review__fieldValue">{resume.phone || '—'}</span>
            </div>
            <div className="review__field">
              <span className="review__fieldLabel">Location</span>
              <span className="review__fieldValue">{resume.location || '—'}</span>
            </div>
          </div>
        </section>

        <section className="review__section">
          <div className="review__sectionHead">
            <Icon name="subject" size={22} color="var(--accent)" />
            <h2>Professional summary</h2>
          </div>
          {resume.summary ? (
            <p className="review__summaryText">{resume.summary}</p>
          ) : (
            <p className="review__empty">No summary extracted.</p>
          )}
        </section>

        <section className="review__section">
          <div className="review__sectionHead">
            <Icon name="school" size={22} color="var(--accent)" />
            <h2>Education</h2>
          </div>
          {resume.education.length === 0 && (
            <p className="review__empty">No education found.</p>
          )}
          {resume.education.map((edu, i) => (
            <div key={i} className="review__eduGrid">
              <div className="review__field review__span2">
                <span className="review__fieldLabel">School</span>
                <span className="review__fieldValue">{edu.school || '—'}</span>
              </div>
              <div className="review__field">
                <span className="review__fieldLabel">Degree</span>
                <span className="review__fieldValue">{edu.degree || '—'}</span>
              </div>
              <div className="review__field">
                <span className="review__fieldLabel">Years</span>
                <span className="review__fieldValue">{edu.year || '—'}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="review__section">
          <div className="review__sectionHead">
            <Icon name="bolt" size={22} color="var(--accent)" />
            <h2>Skills</h2>
          </div>
          {resume.skills.length === 0 ? (
            <p className="review__empty">No skills found.</p>
          ) : (
            <div className="review__skills">
              {resume.skills.map((skill, i) => (
                <span key={`${skill}-${i}`} className="review__skill">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="review__section">
          <div className="review__sectionHead">
            <Icon name="work" size={22} color="var(--accent)" />
            <h2>Experience</h2>
          </div>
          {resume.experience.length === 0 && (
            <p className="review__empty">No experience found.</p>
          )}
          <div className="review__expList">
            {resume.experience.map((exp, i) => (
              <div key={i} className="review__exp">
                <div className="review__expHead">
                  <div className="review__expRole">{exp.role || '—'}</div>
                  <div className="review__expCompany">{exp.company || '—'}</div>
                  <div className="review__expDates">{exp.dates || '—'}</div>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="review__bullets">
                    {exp.bullets.map((bullet, j) => (
                      <li key={j} className="review__bullet">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="review__footer">
        <div className="review__footerInner">
          <Button variant="secondary" onClick={() => navigate('upload')}>
            Back
          </Button>
          <Button trailingIcon="arrow_forward" onClick={() => navigate('analysis')}>
            Confirm &amp; analyze
          </Button>
        </div>
      </div>
    </div>
  );
}
