import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

interface SCFSlicePlotProps {
  signal: number[];
  sampleRate: number;
  alpha: number; // cyclic frequency in Hz
  maxLag: number; // max lag in samples
}

// Compute cyclic autocorrelation for a given alpha and lag (real part only)
function computeCAF(signal: number[], alpha: number, sampleRate: number, maxLag: number) {
  const N = signal.length;
  const caf: number[] = [];
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let sum = 0;
    let count = 0;
    for (let n = 0; n < N; n++) {
      const nLag = n - lag;
      if (nLag >= 0 && nLag < N) {
        const phase = -2 * Math.PI * alpha * n / sampleRate;
        sum += signal[n] * signal[nLag] * Math.cos(phase);
        count++;
      }
    }
    caf.push(sum / (count || 1));
  }
  return caf;
}

// Simple DFT for real input (returns magnitude spectrum)
function fftMag(signal: number[]): number[] {
  const N = signal.length;
  const mag: number[] = [];
  for (let k = 0; k < N; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += signal[n] * Math.cos(-angle);
      im += signal[n] * Math.sin(-angle);
    }
    mag.push(Math.sqrt(re * re + im * im) / N);
  }
  return mag;
}

const SCFSlicePlot: React.FC<SCFSlicePlotProps> = ({ signal, sampleRate, alpha, maxLag }) => {
  const caf = useMemo(() => computeCAF(signal, alpha, sampleRate, maxLag), [signal, alpha, sampleRate, maxLag]);
  const scfMag = useMemo(() => fftMag(caf), [caf]);
  const N = scfMag.length;
  const freqs = useMemo(() => Array.from({ length: N }, (_, k) => ((k - N / 2) * sampleRate) / N), [N, sampleRate]);
  // Shift zero frequency to center
  const scfMagShifted = [...scfMag.slice(N / 2), ...scfMag.slice(0, N / 2)];

  return (
    <div>
      <div style={{marginBottom: 8}}>
        <strong>Spectral Correlation Function (SCF) Slice</strong>: Shows the magnitude of the SCF for the selected cyclic frequency (α = {alpha} Hz) as a function of frequency.
      </div>
      <Plot
        data={[
          {
            x: freqs,
            y: scfMagShifted,
            type: 'scatter',
            mode: 'lines',
            marker: { color: 'purple' },
          },
        ]}
        layout={{
          title: 'Spectral Correlation Function |SCF|',
          xaxis: { title: 'Frequency (Hz)' },
          yaxis: { title: '|SCF|' },
          autosize: true,
          height: 300,
        }}
        style={{ width: '100%' }}
        config={{ responsive: true }}
      />
    </div>
  );
};

export default SCFSlicePlot; 