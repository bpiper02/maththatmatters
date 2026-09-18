import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { SetupPanel } from './components/SetupPanel';
import { DEFAULT_CONFIG, enabledCategories, generateQuestion, isCorrect, parseAnswer, validateConfig } from './lib/questions';
import type { DrillConfig, Question } from './types';

type Screen = 'setup' | 'drill' | 'result';

type LiveAttempt = {
  correct: boolean;
  ms: number;
};

function cloneDefaults(): DrillConfig {
  return structuredClone(DEFAULT_CONFIG);
}

function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [config, setConfig] = useState<DrillConfig>(cloneDefaults);
  const [duration, setDuration] = useState(120);
  const [submitMode, setSubmitMode] = useState<'auto' | 'enter'>('auto');
  const [question, setQuestion] = useState<Question>(() => generateQuestion('percentages', DEFAULT_CONFIG));
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState<LiveAttempt[]>([]);
  const [remaining, setRemaining] = useState(duration);
  const startedAt = useRef(0);
  const questionAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const finishing = useRef(false);

  const errors = useMemo(() => {
    const next = validateConfig(config);
    if (enabledCategories(config).length === 0) next.push('Enable at least one drill category.');
    return next;
  }, [config]);

  const correct = attempts.filter((attempt) => attempt.correct).length;
  const accuracy = attempts.length ? (correct / attempts.length) * 100 : 0;
  const avgMs = attempts.length ? attempts.reduce((sum, attempt) => sum + attempt.ms, 0) / attempts.length : 0;

  function pickNext(previous?: Question): Question {
    const categories = enabledCategories(config);
    if (!categories.length) throw new Error('No categories enabled.');
    let next = generateQuestion(categories[Math.floor(Math.random() * categories.length)], config);
    for (let tries = 0; tries < 12 && previous && next.signature === previous.signature; tries += 1) {
      next = generateQuestion(categories[Math.floor(Math.random() * categories.length)], config);
    }
    return next;
  }

  function start() {
    if (errors.length) return;
    finishing.current = false;
    setAttempts([]);
    setAnswer('');
    setRemaining(duration);
    const now = Date.now();
    startedAt.current = now;
    questionAt.current = now;
    setQuestion(pickNext());
    setScreen('drill');
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function finish() {
    if (finishing.current) return;
    finishing.current = true;
    setScreen('result');
  }

  useEffect(() => {
    if (screen !== 'drill') return;
    inputRef.current?.focus();
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      const left = Math.max(0, duration - elapsed);
      setRemaining(left);
      if (left <= 0) finish();
    }, 100);
    return () => window.clearInterval(timer);
  }, [screen, duration]);

  function record(value: number, force = false) {
    if (screen !== 'drill') return;
    const right = isCorrect(question, value);
    if (!force && submitMode === 'auto' && !right) return;
    const now = Date.now();
    setAttempts((current) => [...current, { correct: right, ms: now - questionAt.current }]);
    const next = pickNext(question);
    setQuestion(next);
    setAnswer('');
    questionAt.current = now;
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function onChange(value: string) {
    setAnswer(value);
    if (submitMode !== 'auto') return;
    const parsed = parseAnswer(value);
    if (parsed !== null && isCorrect(question, parsed)) record(parsed);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseAnswer(answer);
    if (parsed === null) return;
    record(parsed, true);
  }

  return (
    <main className="desktop">
      <section className="app-window">
        <header className="title-bar">
          <strong>Math That Matters</strong>
          <span>×</span>
        </header>
        <nav className="menu-bar" aria-label="Application">
          <button type="button" onClick={() => setScreen('setup')}>Drill</button>
          <button type="button" disabled>Review</button>
          <button type="button" disabled>Stats</button>
        </nav>

        {screen === 'setup' && (
          <div className="window-body">
            <SetupPanel
              config={config}
              setConfig={setConfig}
              duration={duration}
              setDuration={setDuration}
              submitMode={submitMode}
              setSubmitMode={setSubmitMode}
              errors={errors}
              onStart={start}
            />
          </div>
        )}

        {screen === 'drill' && (
          <div className="drill-view">
            <div className="drill-topline">
              <span>Time: {Math.ceil(remaining)}s</span>
              <span>Correct: {correct}</span>
              <span>Wrong: {attempts.length - correct}</span>
              <span>Accuracy: {accuracy.toFixed(0)}%</span>
            </div>
            <div className="question-area">
              <div className="question-meta">{question.context} · {question.skill}</div>
              <div className="question-text">{question.prompt}</div>
              <form onSubmit={onSubmit}>
                <input
                  ref={inputRef}
                  className="answer-input"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-label="Answer"
                  value={answer}
                  onChange={(event) => onChange(event.target.value)}
                />
              </form>
            </div>
            <div className="status-bar">{submitMode === 'auto' ? 'Type the correct answer to advance. Enter submits an attempt.' : 'Type answer and press Enter.'}</div>
          </div>
        )}

        {screen === 'result' && (
          <div className="window-body result-panel">
            <h1>Results</h1>
            <dl>
              <div><dt>Attempted</dt><dd>{attempts.length}</dd></div>
              <div><dt>Correct</dt><dd>{correct}</dd></div>
              <div><dt>Accuracy</dt><dd>{accuracy.toFixed(1)}%</dd></div>
              <div><dt>Average</dt><dd>{attempts.length ? (avgMs / 1000).toFixed(2) + 's' : '—'}</dd></div>
            </dl>
            <div className="button-row">
              <button type="button" onClick={start}>Run Again</button>
              <button type="button" onClick={() => setScreen('setup')}>Settings</button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
