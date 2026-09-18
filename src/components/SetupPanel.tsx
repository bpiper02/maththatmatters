import type { Dispatch, SetStateAction } from 'react';
import type { DrillConfig, DrillMode } from '../types';
import { RangeFields } from './RangeFields';

type Props = {
  config: DrillConfig;
  setConfig: Dispatch<SetStateAction<DrillConfig>>;
  duration: number;
  setDuration: (value: number) => void;
  submitMode: 'auto' | 'enter';
  setSubmitMode: (value: 'auto' | 'enter') => void;
  drillMode: DrillMode;
  setDrillMode: (value: DrillMode) => void;
  errors: string[];
  onStart: () => void;
};

const durations = [60, 120, 300, 600];

export function SetupPanel({
  config,
  setConfig,
  duration,
  setDuration,
  submitMode,
  setSubmitMode,
  drillMode,
  setDrillMode,
  errors,
  onStart,
}: Props) {
  function edit(mutator: (draft: DrillConfig) => void) {
    setConfig((current) => {
      const draft = structuredClone(current);
      mutator(draft);
      return draft;
    });
  }

  return (
    <div className="setup-grid">
      <fieldset>
        <legend>Session</legend>
        <div className="inline-controls">
          <span>Mode</span>
          <label><input type="radio" name="drillMode" checked={drillMode === 'adaptive'} onChange={() => setDrillMode('adaptive')} /> Adaptive</label>
          <label><input type="radio" name="drillMode" checked={drillMode === 'custom'} onChange={() => setDrillMode('custom')} /> Random mix</label>
        </div>
        <div className="inline-controls">
          <span>Time</span>
          {durations.map((seconds) => (
            <label key={seconds}>
              <input type="radio" name="duration" checked={duration === seconds} onChange={() => setDuration(seconds)} />
              {seconds < 60 ? seconds + 's' : seconds / 60 + 'm'}
            </label>
          ))}
        </div>
        <div className="inline-controls">
          <span>Submit</span>
          <label><input type="radio" name="submitMode" checked={submitMode === 'auto'} onChange={() => setSubmitMode('auto')} /> Auto when correct</label>
          <label><input type="radio" name="submitMode" checked={submitMode === 'enter'} onChange={() => setSubmitMode('enter')} /> Enter</label>
        </div>
      </fieldset>

      <fieldset>
        <legend><label><input type="checkbox" checked={config.addition.enabled} onChange={(e) => edit((d) => { d.addition.enabled = e.target.checked; })} /> Addition</label></legend>
        <RangeFields label="First" value={config.addition.left} onChange={(value) => edit((d) => { d.addition.left = value; })} />
        <RangeFields label="Second" value={config.addition.right} onChange={(value) => edit((d) => { d.addition.right = value; })} />
      </fieldset>

      <fieldset>
        <legend><label><input type="checkbox" checked={config.subtraction.enabled} onChange={(e) => edit((d) => { d.subtraction.enabled = e.target.checked; })} /> Subtraction</label></legend>
        <RangeFields label="First" value={config.subtraction.left} onChange={(value) => edit((d) => { d.subtraction.left = value; })} />
        <RangeFields label="Second" value={config.subtraction.right} onChange={(value) => edit((d) => { d.subtraction.right = value; })} />
        <label><input type="checkbox" checked={Boolean(config.subtraction.allowNegative)} onChange={(e) => edit((d) => { d.subtraction.allowNegative = e.target.checked; })} /> Allow negative answers</label>
      </fieldset>

      <fieldset>
        <legend><label><input type="checkbox" checked={config.multiplication.enabled} onChange={(e) => edit((d) => { d.multiplication.enabled = e.target.checked; })} /> Multiplication</label></legend>
        <RangeFields label="First" value={config.multiplication.left} onChange={(value) => edit((d) => { d.multiplication.left = value; })} />
        <RangeFields label="Second" value={config.multiplication.right} onChange={(value) => edit((d) => { d.multiplication.right = value; })} />
      </fieldset>

      <fieldset>
        <legend><label><input type="checkbox" checked={config.division.enabled} onChange={(e) => edit((d) => { d.division.enabled = e.target.checked; })} /> Division</label></legend>
        <RangeFields label="Divisor" value={config.division.divisor} min={1} onChange={(value) => edit((d) => { d.division.divisor = value; })} />
        <RangeFields label="Quotient" value={config.division.quotient} onChange={(value) => edit((d) => { d.division.quotient = value; })} />
        <small>Dividend = divisor × quotient.</small>
      </fieldset>

      <fieldset>
        <legend><label><input type="checkbox" checked={config.percentages.enabled} onChange={(e) => edit((d) => { d.percentages.enabled = e.target.checked; })} /> Percentages</label></legend>
        <RangeFields label="Percent" value={config.percentages.percent} step={0.5} onChange={(value) => edit((d) => { d.percentages.percent = value; })} />
        <RangeFields label="Base" value={config.percentages.base} onChange={(value) => edit((d) => { d.percentages.base = value; })} />
        <label><input type="checkbox" checked={config.percentages.cleanAnswers} onChange={(e) => edit((d) => { d.percentages.cleanAnswers = e.target.checked; })} /> Prefer clean mental answers</label>
        <div className="mode-list">
          {([['of', 'X% of Y'], ['findPercent', 'Find %'], ['change', '% increase'], ['reverse', 'Reverse %']] as const).map(([key, label]) => (
            <label key={key}><input type="checkbox" checked={config.percentages.modes[key]} onChange={(e) => edit((d) => { d.percentages.modes[key] = e.target.checked; })} /> {label}</label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend><label><input type="checkbox" checked={config.fractions.enabled} onChange={(e) => edit((d) => { d.fractions.enabled = e.target.checked; })} /> Fractions</label></legend>
        <RangeFields label="Numerator" value={config.fractions.numerator} onChange={(value) => edit((d) => { d.fractions.numerator = value; })} />
        <RangeFields label="Denominator" value={config.fractions.denominator} min={1} onChange={(value) => edit((d) => { d.fractions.denominator = value; })} />
        <div className="mode-list">
          <label><input type="checkbox" checked={config.fractions.commonOnly} onChange={(e) => edit((d) => { d.fractions.commonOnly = e.target.checked; })} /> Common mental fractions</label>
          <label><input type="checkbox" checked={config.fractions.properOnly} onChange={(e) => edit((d) => { d.fractions.properOnly = e.target.checked; })} /> Proper only</label>
          <label><input type="checkbox" checked={config.fractions.reducedOnly} onChange={(e) => edit((d) => { d.fractions.reducedOnly = e.target.checked; })} /> Reduced only</label>
        </div>
        <div className="mode-list">
          {([['toPercent', 'Fraction → %'], ['toDecimal', 'Fraction → decimal'], ['percentToFraction', '% → fraction']] as const).map(([key, label]) => (
            <label key={key}><input type="checkbox" checked={config.fractions.modes[key]} onChange={(e) => edit((d) => { d.fractions.modes[key] = e.target.checked; })} /> {label}</label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend><label><input type="checkbox" checked={config.ratios.enabled} onChange={(e) => edit((d) => { d.ratios.enabled = e.target.checked; })} /> Ratios</label></legend>
        <RangeFields label="Left part" value={config.ratios.left} onChange={(value) => edit((d) => { d.ratios.left = value; })} />
        <RangeFields label="Right part" value={config.ratios.right} onChange={(value) => edit((d) => { d.ratios.right = value; })} />
        <RangeFields label="Scale" value={config.ratios.scale} min={1} onChange={(value) => edit((d) => { d.ratios.scale = value; })} />
      </fieldset>

      <fieldset>
        <legend><label><input type="checkbox" checked={config.applied.enabled} onChange={(e) => edit((d) => { d.applied.enabled = e.target.checked; })} /> Applied Mix</label></legend>
        <p className="compact-copy">Startup funnels, runway, margins, probability and EV.</p>
      </fieldset>

      {errors.length > 0 && <div className="error-box" role="alert">{errors.map((error) => <div key={error}>{error}</div>)}</div>}
      <button className="primary-button" type="button" disabled={errors.length > 0} onClick={onStart}>Start Drill</button>
    </div>
  );
}
