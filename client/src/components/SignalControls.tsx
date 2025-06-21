import React from 'react';

export type PresetOption =
  | 'Custom'
  | 'Pure Sine'
  | 'AM'
  | 'Pulse Train'
  | 'Noisy AM'
  | 'Sum of Sines'
  | 'BPSK'
  | 'QPSK'
  | 'FM';

interface SignalControlsProps {
  preset: PresetOption;
  onPresetChange: (p: PresetOption) => void;
  frequency: number;
  setFrequency: (v: number) => void;
  amplitude: number;
  setAmplitude: (v: number) => void;
  modFreq: number;
  setModFreq: (v: number) => void;
  modDepth: number;
  setModDepth: (v: number) => void;
  noiseLevel: number;
  setNoiseLevel: (v: number) => void;
  alpha: number;
  setAlpha: (v: number) => void;
  sampleRate: number;
  duration: number;
  setDuration: (v: number) => void;
}

const sliderStyle: React.CSSProperties = {
  width: 100,
  marginLeft: 8,
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: 14,
  margin: 2,
  flexWrap: 'wrap',
};

const SignalControls: React.FC<SignalControlsProps> = ({
  preset, onPresetChange,
  frequency, setFrequency,
  amplitude, setAmplitude,
  modFreq, setModFreq,
  modDepth, setModDepth,
  noiseLevel, setNoiseLevel,
  alpha, setAlpha,
  sampleRate,
  duration, setDuration,
}) => (
  <div
    style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'white',
      borderBottom: '1px solid #eee',
      padding: '0.5em 0.5em 0.5em 0.5em',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
    }}
  >
    <label style={labelStyle}>
      Example:
      <select value={preset} onChange={e => onPresetChange(e.target.value as PresetOption)} style={{ marginLeft: 8 }}>
        <option value="Custom">Custom</option>
        <option value="Pure Sine">Pure Sine</option>
        <option value="AM">AM</option>
        <option value="Pulse Train">Pulse Train</option>
        <option value="Noisy AM">Noisy AM</option>
        <option value="Sum of Sines">Sum of Sines</option>
        <option value="BPSK">BPSK</option>
        <option value="QPSK">QPSK</option>
        <option value="FM">FM</option>
      </select>
    </label>
    <label style={labelStyle}>
      Freq: {frequency} Hz
      <input type="range" min="1" max="50" value={frequency} onChange={e => setFrequency(Number(e.target.value))} style={sliderStyle} />
    </label>
    <label style={labelStyle}>
      Amp: {amplitude}
      <input type="range" min="0.1" max="2" step="0.1" value={amplitude} onChange={e => setAmplitude(Number(e.target.value))} style={sliderStyle} />
    </label>
    <label style={labelStyle}>
      Mod Freq: {modFreq} Hz
      <input type="range" min="0" max="20" value={modFreq} onChange={e => setModFreq(Number(e.target.value))} style={sliderStyle} />
    </label>
    <label style={labelStyle}>
      Mod Depth: {modDepth}
      <input type="range" min="0" max="1" step="0.01" value={modDepth} onChange={e => setModDepth(Number(e.target.value))} style={sliderStyle} />
    </label>
    <label style={labelStyle}>
      Noise: {noiseLevel}
      <input type="range" min="0" max="1" step="0.01" value={noiseLevel} onChange={e => setNoiseLevel(Number(e.target.value))} style={sliderStyle} />
    </label>
    <label style={labelStyle}>
      α: {alpha} Hz
      <input type="range" min="0" max={sampleRate / 2} step="0.1" value={alpha} onChange={e => setAlpha(Number(e.target.value))} style={sliderStyle} />
    </label>
    <label style={labelStyle}>
      Duration: {duration} seconds
      <input type="range" min="1" max="10" value={duration} onChange={e => setDuration(Number(e.target.value))} style={sliderStyle} />
    </label>
  </div>
);

export default SignalControls; 