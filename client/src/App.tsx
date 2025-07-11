import React, { useMemo, useState } from 'react';
import './App.css';
import TimeDomainPlot from './components/TimeDomainPlot';
import FrequencyDomainPlot from './components/FrequencyDomainPlot';
import SpectralCorrelationPlaceholder from './components/SpectralCorrelationPlaceholder';
import CyclicAutocorrelationPlot from './components/CyclicAutocorrelationPlot';
import SCFSlicePlot from './components/SCFSlicePlot';
import SignalControls, { PresetOption } from './components/SignalControls';
import CyclicDomainProfile from './components/SpectralCorrelationHeatmap';

function App() {
  const sampleRate = 1000;
  const [duration, setDuration] = useState(1);

  // Basic controls
  const [preset, setPreset] = useState<PresetOption>('Custom');
  const [waveformType, setWaveformType] = useState<PresetOption>('Pure Sine');
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
  const setDurationCustom = (v: number) => { setPreset('Custom'); setDuration(v); };

  // Handle preset selection
  const handlePresetChange = (p: PresetOption) => {
    setPreset(p);
    setWaveformType(p);
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

  // Generate signal based on waveformType (not preset)
  const signal = useMemo(() => {
    const N = sampleRate * duration;
    switch (waveformType) {
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
        // Generate many bits for proper CSP analysis (Dr. Spooner's feedback)
        const bitRate = 10; // bits/sec - higher rate for more bits in the signal
        const samplesPerBit = Math.floor(sampleRate / bitRate);
        const numBits = Math.ceil(N / samplesPerBit);
        const bits = Array.from({ length: numBits }, () => (Math.random() > 0.5 ? 1 : -1));
        return Array.from({ length: N }, (_, i) => {
          const bit = bits[Math.floor(i / samplesPerBit)];
          return amplitude * bit * Math.sin(2 * Math.PI * frequency * (i / sampleRate));
        });
      }
      case 'QPSK': {
        // Generate many symbols for proper CSP analysis  
        const symbolRate = 5; // symbols/sec
        const samplesPerSymbol = Math.floor(sampleRate / symbolRate);
        const numSymbols = Math.ceil(N / samplesPerSymbol);
        const symbols = Array.from({ length: numSymbols }, () => {
          const phase = Math.PI / 4 + (Math.floor(Math.random() * 4) * Math.PI / 2);
          return phase;
        });
        return Array.from({ length: N }, (_, i) => {
          const phase = symbols[Math.floor(i / samplesPerSymbol)];
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
        // Default to last waveformType (should not hit 'Custom' here)
        return Array.from({ length: N }, (_, i) => amplitude * Math.sin(2 * Math.PI * frequency * (i / sampleRate)));
    }
  }, [waveformType, sampleRate, duration, frequency, amplitude, modFreq, modDepth, noiseLevel]);

  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          width: '100%',
          background: '#23272f',
          minHeight: '40vh',
          maxHeight: '60vh',
          height: '50vh',
          margin: 0,
          padding: 0,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: 0,
            width: '100%',
            textAlign: 'center',
            color: 'white',
          }}
        >
          <h1 style={{ marginBottom: 0, fontWeight: 700, fontSize: '2.5rem' }}>CycloScope</h1>
          <p style={{ marginTop: 4, marginBottom: 0, fontSize: '1.2rem' }}>Interactive Cyclostationary Signal Processing Explorer</p>
        </div>
      </div>
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
          duration={duration} setDuration={setDurationCustom}
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
              <h3>Frequency-Domain Spectrum</h3>
              <FrequencyDomainPlot signal={signal} sampleRate={sampleRate} />
            </div>
            <div style={{marginBottom: '1em'}}>
              <label>
                Cyclic Frequency α: {alpha} Hz
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  step="0.5" 
                  value={alpha} 
                  onChange={e => setAlphaCustom(Number(e.target.value))} 
                  style={{ width: 300, marginLeft: 8 }} 
                />
                <input 
                  type="number" 
                  min="0" 
                  max="50" 
                  step="0.1" 
                  value={alpha} 
                  onChange={e => setAlphaCustom(Number(e.target.value))} 
                  style={{ width: 80, marginLeft: 8, padding: 4 }}
                />
              </label>
            </div>
            <div style={{marginBottom: '1em'}}>
              <CyclicAutocorrelationPlot signal={signal} sampleRate={sampleRate} alpha={alpha} maxLag={maxLag} />
            </div>
            <div style={{marginBottom: '1em'}}>
              <SCFSlicePlot signal={signal} sampleRate={sampleRate} alpha={alpha} maxLag={maxLag} />
            </div>
            <div style={{marginBottom: '1em'}}>
              <h3>Cyclic Domain Profile</h3>
              <CyclicDomainProfile signal={signal} sampleRate={sampleRate} maxLag={maxLag} nAlpha={32} nFreq={64} alpha={alpha} />
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
