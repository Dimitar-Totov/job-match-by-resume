import { useState } from 'react';
import { Button, Icon } from '../../components';
import { coverTones } from '../../services/mockData';
import { cn } from '../../utils/cn';
import './generate.css';

type Length = 'short' | 'medium' | 'long';

export function CoverLetterScreen() {
  const [tone, setTone] = useState('formal');
  const [length, setLength] = useState<Length>('medium');

  return (
    <div className="page cover u-fadeup">
      <div className="cover__side">
        <div className="cover__panel">
          <div className="cover__panelTitle">Tone</div>
          <div className="cover__tones">
            {coverTones.map((option) => {
              const selected = tone === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  className={cn('cover__tone', selected && 'is-selected')}
                  aria-pressed={selected}
                  onClick={() => setTone(option.key)}
                >
                  <span className="cover__toneText">
                    <span className="cover__toneLabel">{option.label}</span>
                    <span className="cover__toneDesc">{option.desc}</span>
                  </span>
                  {selected && <Icon name="check_circle" size={18} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="cover__panel">
          <div className="cover__panelTitle">Length</div>
          <div className="cover__length" role="group" aria-label="Cover letter length">
            {(['short', 'medium', 'long'] as Length[]).map((value) => (
              <button
                key={value}
                type="button"
                className={cn('cover__lengthBtn', length === value && 'is-active')}
                aria-pressed={length === value}
                onClick={() => setLength(value)}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
          <Button variant="soft" fullWidth leadingIcon="refresh" className="cover__regen">
            Regenerate
          </Button>
        </div>
      </div>

      <div className="cover__doc">
        <div className="cover__docHead">
          <Icon name="drafts" size={20} color="var(--accent)" />
          <span className="cover__docTitle">Cover letter · Stripe</span>
          <span className="cover__editHint">
            <Icon name="edit" size={16} />
            Click to edit
          </span>
          <Button size="sm" leadingIcon="download">
            Export
          </Button>
        </div>
        <div
          className="cover__body"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Cover letter content"
          tabIndex={0}
        >
          <p>Dear Hiring Manager,</p>
          <p>
            I&apos;m excited to apply for the Product Designer role at Stripe. Over the past four
            years I&apos;ve shipped accessible, design-system-driven B2B products used by more than
            40,000 people — and Stripe&apos;s focus on craft and clarity is exactly where I do my best
            work.
          </p>
          <p>
            At Acme Corp I led social strategy across four channels and grew engagement 63% in six
            months, then redesigned our marketing site to lift conversion 24%. I pair strong Figma and
            prototyping skills with a habit of validating decisions through research and A/B testing.
          </p>
          <p>
            I&apos;d love to bring that same rigor to Stripe&apos;s payments platform. Thank you for
            your consideration — I&apos;d welcome the chance to talk.
          </p>
          <p>
            Warm regards,
            <br />
            Jordan Diaz
          </p>
        </div>
      </div>
    </div>
  );
}
