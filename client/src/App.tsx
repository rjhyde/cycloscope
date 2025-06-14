import React, { useMemo, useState } from 'react';
import './App.css';
import TimeDomainPlot from './components/TimeDomainPlot';
import FrequencyDomainPlot from './components/FrequencyDomainPlot';
import SpectralCorrelationPlaceholder from './components/SpectralCorrelationPlaceholder';
import CyclicAutocorrelationPlot from './components/CyclicAutocorrelationPlot';
import SCFSlicePlot from './components/SCFSlicePlot';
import SignalControls, { PresetOption } from './components/SignalControls';
import SpectralCorrelationHeatmap from './components/SpectralCorrelationHeatmap';

function App() {
  const sampleRate = 1000;
  const duration = 1;

  // Basic controls
  const [preset, setPreset] = useState<PresetOption>('Custom');
  const [frequency, setFrequency] = useState(5);
  const [amplitude, setAmplitude] = useState(1);
  const [modFreq, setModFreq] = useState(2);
  const [modDepth, setModDepth] = useState(0.5);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [alpha, setAlpha] = useState(2);
  const maxLag = 100;

  // Wrapped setters to switch to Custom on slider change
  const setFrequencyCustom = (v: number) => { setPreset('Custom'); setFrequency(v); };
  const setAmplitudeCustom = (v: number) => { setPreset('Custom'); setAmplitude(v); };
  const setModFreqCustom = (v: number) => { setPreset('Custom'); setModFreq(v); };
  const setModDepthCustom = (v: number) => { setPreset('Custom'); setModDepth(v); };
  const setNoiseLevelCustom = (v: number) => { setPreset('Custom'); setNoiseLevel(v); };
  const setAlphaCustom = (v: number) => { setPreset('Custom'); setAlpha(v); };

  // Handle preset selection
  const handlePresetChange = (p: PresetOption) => {
    setPreset(p);
    if (p === 'Custom') return;
    // Set slider values for each preset
    switch (p) {
      case 'Pure Sine':
        setFrequency(10); setAmplitude(1); setModFreq(0); setModDepth(0); setNoiseLevel(0); break;
      case 'AM':
        setFrequency(10); setAmplitude(1); setModFreq(2); setModDepth(0.7); setNoiseLevel(0); break;
      case 'Pulse Train':
        setFrequency(5); setAmplitude(1); setModFreq(0); setModDepth(0); setNoiseLevel(0); break;
      case 'Noisy AM':
        setFrequency(10); setAmplitude(1); setModFreq(2); setModDepth(0.7); setNoiseLevel(0.3); break;
      case 'Sum of Sines':
        setFrequency(10); setAmplitude(1); setModFreq(0); setModDepth(0); setNoiseLevel(0);
        break;
      case 'BPSK':
        setFrequency(10); setAmplitude(1); setModFreq(0); setModDepth(0); setNoiseLevel(0); break;
      case 'QPSK':
        setFrequency(10); setAmplitude(1); setModFreq(0); setModDepth(0); setNoiseLevel(0); break;
      case 'FM':
        setFrequency(10); setAmplitude(1); setModFreq(2); setModDepth(2); setNoiseLevel(0); break;
    }
  };

  // Generate signal based on preset
  const signal = useMemo(() => {
    const N = sampleRate * duration;
    switch (preset) {
      case 'Pure Sine':
        return Array.from({ length: N }, (_, i) => amplitude * Math.sin(2 * Math.PI * frequency * (i / sampleRate)));
      case 'AM':
        return Array.from({ length: N }, (_, i) => {
          const t = i / sampleRate;
          const mod = 1 + modDepth * Math.sin(2 * Math.PI * modFreq * t);
          return mod * amplitude * Math.sin(2 * Math.PI * frequency * t);
        });
      case 'Pulse Train':
        return Array.from({ length: N }, (_, i) => ((i % Math.round(sampleRate / frequency)) < Math.round(sampleRate / frequency / 4) ? amplitude : 0));
      case 'Noisy AM':
        return Array.from({ length: N }, (_, i) => {
          const t = i / sampleRate;
          const mod = 1 + modDepth * Math.sin(2 * Math.PI * modFreq * t);
          const carrier = amplitude * Math.sin(2 * Math.PI * frequency * t);
          const noise = noiseLevel * (2 * Math.random() - 1);
          return mod * carrier + noise;
        });
      case 'Sum of Sines':
        return Array.from({ length: N }, (_, i) => amplitude * (Math.sin(2 * Math.PI * frequency * (i / sampleRate)) + 0.7 * Math.sin(2 * Math.PI * (frequency / 2) * (i / sampleRate))));
      case 'BPSK': {
        // Simple BPSK: random bits, NRZ, modulate carrier
        const bitRate = 2; // bits/sec
        const samplesPerBit = Math.floor(sampleRate / bitRate);
        const bits = Array.from({ length: Math.ceil(N / samplesPerBit) }, () => (Math.random() > 0.5 ? 1 : -1));
        return Array.from({ length: N }, (_, i) => {
          const bit = bits[Math.floor(i / samplesPerBit)];
          return amplitude * bit * Math.sin(2 * Math.PI * frequency * (i / sampleRate));
        });
      }
      case 'QPSK': {
        // Simple QPSK: random symbols, modulate carrier
        const bitRate = 2;
        const samplesPerBit = Math.floor(sampleRate / bitRate);
        const symbols = Array.from({ length: Math.ceil(N / samplesPerBit) }, () => {
          const phase = Math.PI / 4 + (Math.floor(Math.random() * 4) * Math.PI / 2);
          return phase;
        });
        return Array.from({ length: N }, (_, i) => {
          const phase = symbols[Math.floor(i / samplesPerBit)];
          return amplitude * Math.sin(2 * Math.PI * frequency * (i / sampleRate) + phase);
        });
      }
      case 'FM':
        return Array.from({ length: N }, (_, i) => {
          const t = i / sampleRate;
          return amplitude * Math.sin(2 * Math.PI * frequency * t + modDepth * Math.sin(2 * Math.PI * modFreq * t));
        });
      case 'Custom':
      default:
        return Array.from({ length: N }, (_, i) => {
          const t = i / sampleRate;
          const mod = 1 + modDepth * Math.sin(2 * Math.PI * modFreq * t);
          const carrier = amplitude * Math.sin(2 * Math.PI * frequency * t);
          const noise = noiseLevel * (2 * Math.random() - 1);
          return mod * carrier + noise;
        });
    }
  }, [preset, sampleRate, duration, frequency, amplitude, modFreq, modDepth, noiseLevel]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>CycloScope</h1>
        <p>Interactive Cyclostationary Signal Processing Explorer</p>
      </header>
      <main>
        <SignalControls
          preset={preset}
          onPresetChange={handlePresetChange}
          frequency={frequency} setFrequency={setFrequencyCustom}
          amplitude={amplitude} setAmplitude={setAmplitudeCustom}
          modFreq={modFreq} setModFreq={setModFreqCustom}
          modDepth={modDepth} setModDepth={setModDepthCustom}
          noiseLevel={noiseLevel} setNoiseLevel={setNoiseLevelCustom}
          alpha={alpha} setAlpha={setAlphaCustom}
          sampleRate={sampleRate}
        />
        {/* Plots */}
        <section>
          <h2>Visualizations</h2>
          <div>
            <div style={{marginBottom: '1em'}}>
              <h3>Time-Domain Signal</h3>
              <TimeDomainPlot signal={signal} sampleRate={sampleRate} />
            </div>
            <div style={{marginBottom: '1em'}}>
              <h3>Frequency-Domain (FFT)</h3>
              <FrequencyDomainPlot signal={signal} sampleRate={sampleRate} />
            </div>
            <div style={{marginBottom: '1em'}}>
              <label>
                Cyclic Frequency α: {alpha} Hz
                <input type="range" min="0" max={sampleRate / 2} step="0.1" value={alpha} onChange={e => setAlphaCustom(Number(e.target.value))} style={{ width: 200, marginLeft: 8 }} />
              </label>
            </div>
            <div style={{marginBottom: '1em'}}>
              <CyclicAutocorrelationPlot signal={signal} sampleRate={sampleRate} alpha={alpha} maxLag={maxLag} />
            </div>
            <div style={{marginBottom: '1em'}}>
              <SCFSlicePlot signal={signal} sampleRate={sampleRate} alpha={alpha} maxLag={maxLag} />
            </div>
            <div style={{marginBottom: '1em'}}>
              <SpectralCorrelationHeatmap signal={signal} sampleRate={sampleRate} maxLag={50} nAlpha={32} nFreq={64} alpha={alpha} />
            </div>
          </div>
        </section>
      </main>
      <footer>
        <p>Inspired by the <a href="https://cyclostationary.blog/" target="_blank" rel="noopener noreferrer">Cyclostationary Signal Processing Blog</a></p>
      </footer>
    </div>
  );
}

export default App;
