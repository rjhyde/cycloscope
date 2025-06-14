import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

interface SpectralCorrelationHeatmapProps {
  signal: number[];
  sampleRate: number;
  maxLag: number;
  nAlpha: number;
  nFreq: number;
  alpha: number; // current slider value
}

function percentile(arr: number[], p: number) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor(p * (sorted.length - 1));
  return sorted[idx];
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
function fftMag(signal: number[], nFreq: number): number[] {
  const N = signal.length;
  const mag: number[] = [];
  for (let k = 0; k < nFreq; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / nFreq;
      re += signal[n] * Math.cos(-angle);
      im += signal[n] * Math.sin(-angle);
    }
    mag.push(Math.sqrt(re * re + im * im) / N);
  }
  return mag;
}

const SpectralCorrelationHeatmap: React.FC<SpectralCorrelationHeatmapProps> = ({ signal, sampleRate, maxLag, nAlpha, nFreq, alpha }) => {
  // Compute SCF for a grid of alpha values
  const { alphas, freqs, scf2dLog, zmin, zmax } = useMemo(() => {
    const alphas = Array.from({ length: nAlpha }, (_, i) => (i * sampleRate / 2) / (nAlpha - 1));
    const freqs = Array.from({ length: nFreq }, (_, k) => ((k - nFreq / 2) * sampleRate) / nFreq);
    const scf2d: number[][] = [];
    for (let i = 0; i < nAlpha; i++) {
      const caf = computeCAF(signal, alphas[i], sampleRate, maxLag);
      let mag = fftMag(caf, nFreq);
      // Shift zero frequency to center
      mag = [...mag.slice(nFreq / 2), ...mag.slice(0, nFreq / 2)];
      scf2d.push(mag);
    }
    // Convert to log scale (dB)
    const scf2dLog = scf2d.map(row => row.map(v => 10 * Math.log10(v + 1e-12)));
    const flat = scf2dLog.flat();
    const zmin = percentile(flat, 0.05);
    const zmax = percentile(flat, 0.95);
    return { alphas, freqs, scf2dLog, zmin, zmax };
  }, [signal, sampleRate, maxLag, nAlpha, nFreq]);

  // Find the closest alpha index for the slider value
  const alphaIdx = useMemo(() => {
    let minIdx = 0;
    let minDiff = Math.abs(alphas[0] - alpha);
    for (let i = 1; i < alphas.length; i++) {
      const diff = Math.abs(alphas[i] - alpha);
      if (diff < minDiff) { minDiff = diff; minIdx = i; }
    }
    return minIdx;
  }, [alphas, alpha]);

  return (
    <div>
      <div style={{marginBottom: 8, background: '#f6f6fa', border: '1px solid #e0e0e0', borderRadius: 6, padding: '0.5em 1em', fontSize: 14}}>
        <strong>Spectral Correlation Function (SCF) Heatmap</strong><br />
        This 2D plot shows the magnitude of the SCF, <b>10·log₁₀|SCF(f, α)|</b> (in dB), as a function of both frequency and cyclic frequency.<br />
        <b>Colorbar:</b> dB scale, autoscaled to the 5th–95th percentile of the data for best feature visibility.<br />
        <b>Interpretation:</b> Bright regions (higher dB) indicate strong cyclostationary features or periodicities at those frequencies and cyclic frequencies.<br />
        <b>Note:</b> The heatmap shows all cyclic frequencies (α). The slider above controls the 1D plots and highlights the corresponding row here.
      </div>
      <Plot
        data={[
          {
            z: scf2dLog,
            x: freqs,
            y: alphas,
            type: 'heatmap',
            colorscale: 'Viridis',
            colorbar: { title: '10·log₁₀|SCF|' },
            zmin,
            zmax,
          },
        ]}
        layout={{
          title: 'Spectral Correlation Function 10·log₁₀|SCF(f, α)|',
          xaxis: { title: 'Frequency (Hz)' },
          yaxis: { title: 'Cyclic Frequency α (Hz)' },
          autosize: true,
          height: 400,
          shapes: [
            {
              type: 'line',
              xref: 'paper',
              yref: 'y',
              x0: 0,
              x1: 1,
              y0: alphas[alphaIdx],
              y1: alphas[alphaIdx],
              line: {
                color: 'red',
                width: 2,
                dash: 'dot',
              },
            },
          ],
        }}
        style={{ width: '100%' }}
        config={{ responsive: true }}
      />
    </div>
  );
};

export default SpectralCorrelationHeatmap; 