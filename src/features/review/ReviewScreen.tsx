import { Button, Icon, TextField } from '../../components';
import { useNav } from '../../hooks/useNav';
import { parsedResume } from '../../services/mockData';
import './ReviewScreen.css';

export function ReviewScreen() {
  const { navigate } = useNav();
  const resume = parsedResume;

  return (
    <>
      <div className="page page--md review u-fadeup">
        <div className="review__banner">
          <Icon name="check_circle" size={22} filled color="var(--green)" />
          <div>
            <div className="review__bannerTitle">We extracted 6 sections from your résumé</div>
            <div className="review__bannerText">
              Review the fields below and edit anything the AI got wrong before saving.
            </div>
          </div>
        </div>

        <section className="review__section">
          <div className="review__sectionHead">
            <Icon name="person" size={22} color="var(--accent)" />
            <h2>Contact</h2>
            <span className="review__aiTag">
              <Icon name="auto_awesome" size={13} />
              AI extracted
            </span>
          </div>
          <div className="review__grid2">
            <TextField label="Full name" defaultValue={resume.name} />
            <TextField label="Email" type="email" defaultValue={resume.email} />
            <TextField label="Phone" defaultValue={resume.phone} />
            <TextField label="Location" defaultValue={resume.location} />
          </div>
        </section>

        <section className="review__section">
          <div className="review__sectionHead">
            <Icon name="school" size={22} color="var(--accent)" />
            <h2>Education</h2>
          </div>
          {resume.education.map((edu) => (
            <div key={edu.school} className="review__eduGrid">
              <TextField label="School" defaultValue={edu.school} className="review__span2" />
              <TextField label="Degree" defaultValue={edu.degree} />
              <TextField label="Years" defaultValue={edu.year} />
            </div>
          ))}
        </section>

        <section className="review__section">
          <div className="review__sectionHead">
            <Icon name="bolt" size={22} color="var(--accent)" />
            <h2>Skills</h2>
          </div>
          <div className="review__skills">
            {resume.skills.map((skill) => (
              <span key={skill} className="review__skill">
                {skill}
                <button type="button" aria-label={`Remove ${skill}`}>
                  <Icon name="close" size={16} color="var(--ink-3)" />
                </button>
              </span>
            ))}
            <button type="button" className="review__addSkill">
              <Icon name="add" size={16} />
              Add skill
            </button>
          </div>
        </section>

        <section className="review__section">
          <div className="review__sectionHead">
            <Icon name="work" size={22} color="var(--accent)" />
            <h2>Experience</h2>
          </div>
          <div className="review__expList">
            {resume.experience.map((exp) => (
              <div key={`${exp.role}-${exp.company}`} className="review__exp">
                <div className="review__expGrid">
                  <input className="review__expRole" defaultValue={exp.role} aria-label="Role" />
                  <input className="review__expCompany" defaultValue={exp.company} aria-label="Company" />
                  <input className="review__expDates" defaultValue={exp.dates} aria-label="Dates" />
                </div>
                <div className="review__bullets">
                  {exp.bullets.map((bullet, index) => (
                    <div key={index} className="review__bullet">
                      <span aria-hidden="true">•</span>
                      <textarea
                        rows={1}
                        defaultValue={bullet}
                        aria-label={`${exp.role} bullet ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="review__cert">
          <span className="review__certIcon">
            <Icon name="workspace_premium" size={23} color="var(--amber)" />
          </span>
          <div className="review__certBody">
            <div className="review__certTitle">No certifications found</div>
            <div className="review__certText">
              Adding relevant certs can boost your ATS score and credibility.
            </div>
          </div>
          <Button variant="secondary" size="sm" leadingIcon="add">
            Add certification
          </Button>
        </div>
      </div>

      <div className="review__footer">
        <div className="review__footerInner">
          <span className="review__saved">
            <Icon name="cloud_done" size={18} color="var(--green)" />
            Changes auto-saved
          </span>
          <Button variant="secondary" onClick={() => navigate('upload')}>
            Back
          </Button>
          <Button trailingIcon="arrow_forward" onClick={() => navigate('analysis')}>
            Confirm &amp; analyze
          </Button>
        </div>
      </div>
    </>
  );
}
