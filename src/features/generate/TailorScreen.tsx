import { Button, Icon } from '../../components';
import { useNav } from '../../hooks/useNav';
import './generate.css';

export function TailorScreen() {
  const { navigate } = useNav();

  return (
    <div className="page page--wide tailor u-fadeup">
      <div className="tailor__bar">
        <span className="tailor__barIcon">
          <Icon name="auto_fix_high" size={25} color="var(--accent)" />
        </span>
        <div className="tailor__barText">
          <div className="tailor__barTitle">Tailored for Product Designer · Stripe</div>
          <div className="tailor__barSub">
            12 changes · +6 keywords · 4 bullets rewritten · 1 section added
          </div>
        </div>
        <span className="tailor__delta">
          <Icon name="trending_up" size={18} color="var(--green)" />
          Match 84% → 93%
        </span>
        <Button variant="secondary" size="sm" leadingIcon="description">
          DOCX
        </Button>
        <Button size="sm" leadingIcon="download">
          Export PDF
        </Button>
      </div>

      <div className="tailor__cols">
        <div>
          <div className="tailor__colLabel">
            <Icon name="history" size={17} />
            Original
          </div>
          <div className="tailor__doc">
            <div className="tailor__name">Jordan Diaz</div>
            <div className="tailor__role">Product Designer · San Francisco, CA</div>
            <div className="tailor__docHead">Summary</div>
            <p>
              <span className="tailor__removed">
                Hard-working designer looking for new opportunities.
              </span>
            </p>
            <div className="tailor__docHead">Experience</div>
            <div className="tailor__job">Product Design Intern · Acme Corp</div>
            <ul>
              <li>
                <span className="tailor__removed">
                  Responsible for managing social media accounts.
                </span>
              </li>
              <li>
                <span className="tailor__removed">Helped with the website redesign.</span>
              </li>
            </ul>
          </div>
        </div>

        <div>
          <div className="tailor__colLabel tailor__colLabel--accent">
            <Icon name="auto_awesome" size={17} />
            Tailored
          </div>
          <div className="tailor__doc tailor__doc--accent">
            <div className="tailor__name">Jordan Diaz</div>
            <div className="tailor__role">Product Designer · San Francisco, CA</div>
            <div className="tailor__docHead">Summary</div>
            <p className="tailor__docText">
              Product designer with 4 years shipping{' '}
              <mark>accessible, design-system-driven</mark> B2B SaaS used by 40k+ people.
            </p>
            <div className="tailor__docHead">Experience</div>
            <div className="tailor__job">Product Design Intern · Acme Corp</div>
            <ul className="tailor__docText">
              <li>
                Led social strategy across 4 channels, growing engagement{' '}
                <mark>63% in 6 months</mark>.
              </li>
              <li>
                Redesigned the marketing site, lifting <mark>conversion 24%</mark> and cutting bounce
                18%.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="tailor__next">
        <Button variant="secondary" leadingIcon="drafts" onClick={() => navigate('cover')}>
          Now write a matching cover letter
        </Button>
      </div>
    </div>
  );
}
