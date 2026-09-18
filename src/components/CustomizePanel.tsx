import type { AppearanceConfig } from '../types';
import { DEFAULT_APPEARANCE } from '../lib/storage';

type Props = {
  value: AppearanceConfig;
  onChange: (next: AppearanceConfig) => void;
};

const presets = [
  { name: 'Win97 Blue', desktopColor: '#008080', accentColor: '#000080' },
  { name: 'Night', desktopColor: '#202020', accentColor: '#303080' },
  { name: 'Olive', desktopColor: '#6b6b45', accentColor: '#3a4f24' },
];

export function CustomizePanel({ value, onChange }: Props) {
  function patch(next: Partial<AppearanceConfig>) {
    onChange({ ...value, ...next });
  }

  return (
    <div className="customize-panel">
      <fieldset>
        <legend>Page</legend>
        <label className="setting-row">
          <span>Window title</span>
          <input type="text" value={value.appLabel} maxLength={40} onChange={(e) => patch({ appLabel: e.target.value || 'Math That Matters' })} />
        </label>
        <label className="setting-row">
          <span>Desktop</span>
          <input type="color" value={value.desktopColor} onChange={(e) => patch({ desktopColor: e.target.value })} />
        </label>
        <label className="setting-row">
          <span>Title bar</span>
          <input type="color" value={value.accentColor} onChange={(e) => patch({ accentColor: e.target.value })} />
        </label>
        <label className="setting-row">
          <span>Window width</span>
          <input type="number" min="560" max="1200" step="20" value={value.windowWidth} onChange={(e) => patch({ windowWidth: Math.max(560, Math.min(1200, Number(e.target.value) || 900)) })} />
        </label>
        <label className="setting-row">
          <span>Font px</span>
          <input type="number" min="11" max="18" value={value.fontSize} onChange={(e) => patch({ fontSize: Math.max(11, Math.min(18, Number(e.target.value) || 13)) })} />
        </label>
      </fieldset>

      <fieldset>
        <legend>Layout</legend>
        <div className="inline-controls">
          <span>Density</span>
          <label><input type="radio" checked={value.density === 'compact'} onChange={() => patch({ density: 'compact' })} /> Compact</label>
          <label><input type="radio" checked={value.density === 'standard'} onChange={() => patch({ density: 'standard' })} /> Standard</label>
        </div>
        <div className="inline-controls">
          <span>Question</span>
          <label><input type="radio" checked={value.drillAlign === 'center'} onChange={() => patch({ drillAlign: 'center' })} /> Center</label>
          <label><input type="radio" checked={value.drillAlign === 'left'} onChange={() => patch({ drillAlign: 'left' })} /> Left</label>
        </div>
        <div className="mode-list">
          <label><input type="checkbox" checked={value.showQuestionMeta} onChange={(e) => patch({ showQuestionMeta: e.target.checked })} /> Show skill/context</label>
          <label><input type="checkbox" checked={value.showLiveAccuracy} onChange={(e) => patch({ showLiveAccuracy: e.target.checked })} /> Show live accuracy</label>
          <label><input type="checkbox" checked={value.showStatusBar} onChange={(e) => patch({ showStatusBar: e.target.checked })} /> Show status bar</label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Presets</legend>
        <div className="button-row">
          {presets.map((preset) => (
            <button key={preset.name} type="button" onClick={() => patch({ desktopColor: preset.desktopColor, accentColor: preset.accentColor })}>{preset.name}</button>
          ))}
          <button type="button" onClick={() => onChange(structuredClone(DEFAULT_APPEARANCE))}>Reset</button>
        </div>
      </fieldset>
    </div>
  );
}
