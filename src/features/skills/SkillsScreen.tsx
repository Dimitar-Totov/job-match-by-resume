import { Icon } from '../../components';
import { skillGaps } from '../../services/mockData';
import './SkillsScreen.css';

export function SkillsScreen() {
  return (
    <div className="page page--md skills u-fadeup">
      <div className="skills__intro">
        <Icon name="school" size={26} color="var(--accent)" />
        <div>
          <div className="skills__introTitle">Your personalized learning path</div>
          <div className="skills__introText">
            We aggregated the skills missing across your <b>12 saved jobs</b>, ranked by how often
            they appear. Close the top gaps first for the biggest impact.
          </div>
        </div>
      </div>

      <div className="skills__list">
        {skillGaps.map((gap) => {
          const pct = Math.round((gap.freq / gap.of) * 100);
          return (
            <div key={gap.skill} className="skills__card">
              <div className="skills__cardHead">
                <div className="skills__cardInfo">
                  <div className="skills__skill">{gap.skill}</div>
                  <div className="skills__meter">
                    <div className="skills__meterBar">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <span className="skills__freq">
                      {gap.freq} of {gap.of} saved jobs
                    </span>
                  </div>
                </div>
                <span className="skills__demand">High demand</span>
              </div>

              <div className="skills__courses">
                {gap.courses.map((course) => (
                  <div key={course.name} className="skills__course">
                    <span className="skills__courseIcon">
                      <Icon name="play_lesson" size={19} color="var(--ink-2)" />
                    </span>
                    <div className="skills__courseInfo">
                      <div className="skills__courseName">{course.name}</div>
                      <div className="skills__courseMeta">
                        {course.provider} · {course.length}
                      </div>
                    </div>
                    <button type="button" className="skills__start">
                      Start
                      <Icon name="arrow_outward" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
