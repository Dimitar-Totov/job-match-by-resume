import { useRef, useState } from 'react';
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

const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function hasAcceptedExtension(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

function formatFileSize(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`;
}

export function UploadScreen() {
  const { navigate } = useNav();
  const { status, progress, stage, error, start, reset } = useResumeParsing(() => navigate('parse'));
  const isParsing = status === 'parsing' || status === 'done';
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileSelected(selected: File) {
    if (!hasAcceptedExtension(selected.name)) {
      setFileError('Please upload a PDF or DOCX file.');
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setFileError('File is too large — please upload something up to 10 MB.');
      return;
    }
    setFileError(null);
    setFile(selected);
    start();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      handleFileSelected(selected);
    }
    e.target.value = '';
  }

  function handleDragOver(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      handleFileSelected(dropped);
    }
  }

  return (
    <div className="page page--md">
      {!isParsing && status !== 'error' && (
        <div className="u-fadeup">
          <div className="upload__intro">
            <h2>Add your resume</h2>
            <p>
              Upload an existing file and we&apos;ll parse it — or start fresh with our guided
              builder.
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            hidden
            onChange={handleInputChange}
          />

          <button
            type="button"
            className={cn('upload__drop', isDragging && 'upload__drop--dragging')}
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <span className="upload__dropIcon">
              <Icon name="cloud_upload" size={38} color="var(--accent)" />
            </span>
            <span className="upload__dropTitle">Drag &amp; drop your resume here</span>
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

          {fileError && (
            <p className="upload__fileError" role="alert">
              {fileError}
            </p>
          )}

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
            <h2>Analyzing your resume…</h2>
            <p>Hang tight — this usually takes about ten seconds.</p>
          </div>
          <div className="upload__parseCard">
            <div className="upload__fileRow">
              <span className="upload__fileIcon">
                <Icon name="picture_as_pdf" size={24} color="var(--red)" />
              </span>
              <div className="upload__fileMeta">
                <div className="upload__fileName">{file?.name ?? ''}</div>
                <div className="upload__fileSub">{file ? `${formatFileSize(file.size)} · parsing` : ''}</div>
              </div>
              <span className="upload__pct">{Math.round(progress)}%</span>
            </div>
            <div
              className="upload__track"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Resume parsing progress"
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
