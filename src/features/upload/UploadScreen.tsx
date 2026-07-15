import { Button, Icon } from '../../components';
import { useNav } from '../../hooks/useNav';
import { useResumeParsing } from '../../hooks/useResumeParsing';
import { cn } from '../../utils/cn';
import './UploadScreen.css';

const PARSE_STEPS = [
  { index: 0, label: 'Reading document' },
  { index: 1, label: 'Extracting sections' },
  { index: 2, label: 'Structuring content' },
] as const;

export function UploadScreen() {
  const { navigate } = useNav();
  const { status, progress, stage, error, start, reset } = useResumeParsing(() => navigate('parse'));
  const isParsing = status === 'parsing' || status === 'done';

  return (
    <div className="page page--md">
      {!isParsing && status !== 'error' && (
        <div className="u-fadeup">
          <div className="upload__intro">
            <h2>Add your résumé</h2>
            <p>
              Upload an existing file and we&apos;ll parse it — or start fresh with our guided
              builder.
            </p>
          </div>

          <button type="button" className="upload__drop" onClick={start}>
            <span className="upload__dropIcon">
              <Icon name="cloud_upload" size={38} color="var(--accent)" />
            </span>
            <span className="upload__dropTitle">Drag &amp; drop your résumé here</span>
            <span className="upload__dropHint">or click to browse — PDF or DOCX, up to 10&nbsp;MB</span>
            <span className="upload__browse">
              <Icon name="upload_file" size={20} color="#fff" />
              Browse files
            </span>
            <span className="upload__badges">
              <span>
                <Icon name="lock" size={16} color="var(--green)" />
                Private &amp; encrypted
              </span>
              <span>
                <Icon name="bolt" size={16} color="var(--green)" />
                Parsed in ~10s
              </span>
            </span>
          </button>

          <div className="upload__or">
            <span>or</span>
          </div>

          <div className="upload__alts">
            <button type="button" className="upload__alt" onClick={start}>
              <span className="upload__altIcon">
                <Icon name="design_services" size={24} />
              </span>
              <span>
                <span className="upload__altTitle">Build from scratch</span>
                <span className="upload__altDesc">
                  Answer a few prompts and let AI draft each section for you.
                </span>
              </span>
            </button>
            <button type="button" className="upload__alt" onClick={start}>
              <span className="upload__altIcon">
                <Icon name="link" size={24} />
              </span>
              <span>
                <span className="upload__altTitle">Import from LinkedIn</span>
                <span className="upload__altDesc">
                  Paste your profile URL and we&apos;ll pull in your history.
                </span>
              </span>
            </button>
          </div>
        </div>
      )}

      {isParsing && (
        <div className="u-fadein upload__parsing">
          <div className="upload__intro">
            <h2>Analyzing your résumé…</h2>
            <p>Hang tight — this usually takes about ten seconds.</p>
          </div>
          <div className="upload__parseCard">
            <div className="upload__fileRow">
              <span className="upload__fileIcon">
                <Icon name="picture_as_pdf" size={24} color="var(--red)" />
              </span>
              <div className="upload__fileMeta">
                <div className="upload__fileName">Jordan_Diaz_Resume.pdf</div>
                <div className="upload__fileSub">248 KB · parsing</div>
              </div>
              <span className="upload__pct">{Math.round(progress)}%</span>
            </div>
            <div
              className="upload__track"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Résumé parsing progress"
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <ul className="upload__steps">
              {PARSE_STEPS.map((step) => {
                const state = stage > step.index ? 'done' : stage === step.index ? 'active' : 'pending';
                return (
                  <li key={step.label} className="upload__step">
                    <Icon
                      name={
                        state === 'done'
                          ? 'check_circle'
                          : state === 'active'
                            ? 'progress_activity'
                            : 'radio_button_unchecked'
                      }
                      size={22}
                      spin={state === 'active'}
                      color={
                        state === 'done'
                          ? 'var(--green)'
                          : state === 'active'
                            ? 'var(--accent)'
                            : 'var(--ink-3)'
                      }
                    />
                    <span>{step.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className={cn('upload__error', 'u-fadein')} role="alert">
          <Icon name="error" size={40} color="var(--red)" />
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <Button leadingIcon="refresh" onClick={reset}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
