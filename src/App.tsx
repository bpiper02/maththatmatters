import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { SetupPanel } from './components/SetupPanel';
import { DEFAULT_CONFIG, enabledCategories, isCorrect, parseAnswer, validateConfig } from './lib/questions';
import { pickQuestion, skillStats, slowThreshold } from './lib/progress';
import { allAttempts, loadDrillConfig, loadSessions, saveDrillConfig, saveSession } from './lib/storage';
import type { Attempt, DrillConfig, DrillMode, Question, SessionRecord } from './types';

type Screen = 'setup' | 'drill' | 'result' | 'review' | 'stats';

function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [config, setConfig] = useState<DrillConfig>(() => loadDrillConfig(DEFAULT_CONFIG));
  const [duration, setDuration] = useState(120);
  const [submitMode, setSubmitMode] = useState<'auto' | 'enter'>('auto');
  const [drillMode, setDrillMode] = useState<DrillMode>('adaptive');
  const [sessions, setSessions] = useState<SessionRecord[]>(loadSessions);
  const [question, setQuestion] = useState<Question>(() => pickQuestion(DEFAULT_CONFIG, []));
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [remaining, setRemaining] = useState(duration);
  const [weakFocus, setWeakFocus] = useState(false);
  const attemptsRef = useRef<Attempt[]>([]);
  const startedAt = useRef(0);
  const questionAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const finishing = useRef(false);

  const history = useMemo(() => allAttempts(sessions), [sessions]);
  const combinedHistory = useMemo(() => [...history, ...attempts], [history, attempts]);
  const stats = useMemo(() => skillStats(history).sort((a, b) => {
    const scoreA = (1 - a.accuracy) * 2 + a.slowRate;
    const scoreB = (1 - b.accuracy) * 2 + b.slowRate;
    return scoreB - scoreA;
  }), [history]);

  const errors = useMemo(() => {
    const next = validateConfig(config);
    if (enabledCategories(config).length === 0) next.push('Enable at least one drill category.');
    return next;
  }, [config]);

  const correct = attempts.filter((attempt) => attempt.correct).length;
  const accuracy = attempts.length ? (correct / attempts.length) * 100 : 0;
  const avgMs = attempts.length ? attempts.reduce((sum, attempt) => sum + attempt.ms, 0) / attempts.length : 0;
  const fastest = attempts.length ? Math.min(...attempts.map((attempt) => attempt.ms)) : 0;
  const slowest = attempts.length ? Math.max(...attempts.map((attempt) => attempt.ms)) : 0;

  useEffect(() => {
    saveDrillConfig(config);
  }, [config]);

  function nextQuestion(previous?: Question): Question {
    return pickQuestion(config, combinedHistory, previous, drillMode, weakFocus);
  }

  function start(focusWeak = false) {
    if (errors.length) return;
    finishing.current = false;
    setWeakFocus(focusWeak);
    attemptsRef.current = [];
    setAttempts([]);
    setAnswer('');
    setRemaining(duration);
    const now = Date.now();
    startedAt.current = now;
    questionAt.current = now;
    const first = pickQuestion(config, history, undefined, drillMode, focusWeak);
    setQuestion(first);
    setScreen('drill');
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function finish() {
    if (finishing.current) return;
    finishing.current = true;
    const completed = attemptsRef.current;
    if (completed.length) {
      const session: SessionRecord = {
        id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
        startedAt: startedAt.current,
        duration,
        attempts: completed,
      };
      setSessions(saveSession(session));
    }
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
    const ms = now - questionAt.current;
    const prior = [...history, ...attemptsRef.current];
    const attempt: Attempt = {
      question,
      userAnswer: value,
      correct: right,
      slow: ms > slowThreshold(question.skill, prior),
      ms,
      timestamp: now,
    };
    const nextAttempts = [...attemptsRef.current, attempt];
    attemptsRef.current = nextAttempts;
    setAttempts(nextAttempts);
    const next = pickQuestion(config, [...history, ...nextAttempts], question, drillMode, weakFocus);
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

  const reviewItems = history.filter((attempt) => !attempt.correct || attempt.slow).slice(-60).reverse();

  return (
    <main className="desktop">
      <section className="app-window">
        <header className="title-bar"><strong>Math That Matters</strong><span>×</span></header>
        <nav className="menu-bar" aria-label="Application">
          <button type="button" onClick={() => setScreen('setup')}>Drill</button>
          <button type="button" onClick={() => setScreen('review')}>Review</button>
          <button type="button" onClick={() => setScreen('stats')}>Stats</button>
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
              drillMode={drillMode}
              setDrillMode={setDrillMode}
              errors={errors}
              onStart={() => start(false)}
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
                <input ref={inputRef} className="answer-input" inputMode="decimal" autoComplete="off" aria-label="Answer" value={answer} onChange={(event) => onChange(event.target.value)} />
              </form>
            </div>
            <div className="status-bar">{submitMode === 'auto' ? 'Correct answer advances. Enter records the current answer.' : 'Enter submits.'}</div>
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
              <div><dt>Fastest</dt><dd>{attempts.length ? (fastest / 1000).toFixed(2) + 's' : '—'}</dd></div>
              <div><dt>Slowest</dt><dd>{attempts.length ? (slowest / 1000).toFixed(2) + 's' : '—'}</dd></div>
            </dl>
            {skillStats(attempts).length > 0 && (
              <div className="compact-table-wrap">
                <table className="data-table">
                  <thead><tr><th>Skill</th><th>Accuracy</th><th>Avg</th></tr></thead>
                  <tbody>{skillStats(attempts).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5).map((item) => (
                    <tr key={item.skill}><td>{item.skill}</td><td>{(item.accuracy * 100).toFixed(0)}%</td><td>{(item.avgMs / 1000).toFixed(2)}s</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            <div className="button-row">
              <button type="button" onClick={() => start(true)}>Drill Weak Areas</button>
              <button type="button" onClick={() => setScreen('review')}>Review</button>
              <button type="button" onClick={() => start(false)}>Run Again</button>
            </div>
          </div>
        )}

        {screen === 'review' && (
          <div className="window-body">
            <h1 className="section-title">Wrong / Slow</h1>
            {reviewItems.length === 0 ? <p>No flagged attempts yet.</p> : (
              <div className="compact-table-wrap">
                <table className="data-table">
                  <thead><tr><th>Question</th><th>Your answer</th><th>Answer</th><th>Time</th><th>Flag</th></tr></thead>
                  <tbody>{reviewItems.map((attempt, index) => (
                    <tr key={attempt.timestamp + '-' + index}>
                      <td>{attempt.question.prompt}<small>{attempt.question.skill}</small></td>
                      <td>{attempt.userAnswer}</td>
                      <td>{Number(attempt.question.answer.toFixed(4))}</td>
                      <td>{(attempt.ms / 1000).toFixed(2)}s</td>
                      <td>{!attempt.correct ? 'wrong' : 'slow'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            <div className="button-row"><button type="button" onClick={() => start(true)}>Drill Weak Areas</button></div>
          </div>
        )}

        {screen === 'stats' && (
          <div className="window-body">
            <h1 className="section-title">Progress</h1>
            <div className="summary-strip">
              <span>Sessions: {sessions.length}</span>
              <span>Questions: {history.length}</span>
              <span>Accuracy: {history.length ? (history.filter((a) => a.correct).length / history.length * 100).toFixed(1) : '0.0'}%</span>
              <span>Avg: {history.length ? (history.reduce((sum, a) => sum + a.ms, 0) / history.length / 1000).toFixed(2) : '0.00'}s</span>
            </div>
            <div className="compact-table-wrap">
              <table className="data-table">
                <thead><tr><th>Skill</th><th>Attempts</th><th>Accuracy</th><th>Avg</th><th>Slow</th></tr></thead>
                <tbody>{stats.map((item) => (
                  <tr key={item.skill}><td>{item.skill}</td><td>{item.attempts}</td><td>{(item.accuracy * 100).toFixed(0)}%</td><td>{(item.avgMs / 1000).toFixed(2)}s</td><td>{(item.slowRate * 100).toFixed(0)}%</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
