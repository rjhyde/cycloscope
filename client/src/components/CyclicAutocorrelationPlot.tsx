import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

interface CyclicAutocorrelationPlotProps {
  signal: number[];
  sampleRate: number;
  alpha: number; // cyclic frequency in Hz
  maxLag: number; // max lag in samples
}

// Compute cyclic autocorrelation for a given alpha and lag
function computeCAF(signal: number[], alpha: number, sampleRate: number, maxLag: number) {
  const N = signal.length;
  const caf: number[] = [];
  
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let sum = 0;
    let count = 0;
    
    for (let n = 0; n < N; n++) {
      const nLag = n - lag;
      if (nLag >= 0 && nLag < N) {
        // Cyclic autocorrelation: E[x(n) * x(n-τ) * e^(-j2πα*n/fs)]
        // We compute only the real part here
        const phase = -2 * Math.PI * alpha * n / sampleRate;
        sum += signal[n] * signal[nLag] * Math.cos(phase);
        count++;
      }
    }
    
    // Normalize by count to get sample autocorrelation estimate
    // This preserves the finite-length effects that Dr. Spooner expects to see
    caf.push(count > 0 ? sum / count : 0);
  }
  
  return caf;
}

const CyclicAutocorrelationPlot: React.FC<CyclicAutocorrelationPlotProps> = ({ signal, sampleRate, alpha, maxLag }) => {
  const lagsSamples = useMemo(() => Array.from({ length: 2 * maxLag + 1 }, (_, i) => i - maxLag), [maxLag]);
  const lagsTime = useMemo(() => lagsSamples.map(lag => lag / sampleRate), [lagsSamples, sampleRate]);
  const caf = useMemo(() => computeCAF(signal, alpha, sampleRate, maxLag), [signal, alpha, sampleRate, maxLag]);

  return (
    <div>
      <div style={{marginBottom: 8, background: '#f6f6fa', border: '1px solid #e0e0e0', borderRadius: 6, padding: '0.5em 1em', fontSize: 14}}>
        <strong>Cyclic Autocorrelation Function (CAF)</strong><br />
        Shows Rₓ(τ,α) for α = {alpha} Hz. This is a fundamental function in CSP theory.<br />
        <b>For a pure sine wave at frequency f₀:</b><br />
        • When α = 0: Should be a cosine at frequency f₀ with amplitude ≈ A²/2 (regular autocorrelation)<br />
        • When α = 2f₀: Should show some correlation (sine waves have cycle frequencies at ±2f₀)<br />
        • When α ≠ 0, 2f₀: Should be nearly zero (pure sine waves are weakly cyclostationary)<br />
        <b>For pulse trains:</b> Should show triangular patterns with finite-length edge effects.<br />
        <b>For BPSK:</b> Should show impulse-like correlation at α = 0, and structured patterns at symbol rate multiples.<br />
        <b>Lag range:</b> ±{maxLag} samples = ±{(maxLag/sampleRate).toFixed(3)} seconds at {sampleRate} Hz sampling rate.
      </div>
      <Plot
        data={[
          {
            x: lagsTime,
            y: caf,
            type: 'scatter',
            mode: 'lines+markers',
            line: { width: 2 },
            marker: { color: 'green', size: 3 },
            fill: 'none',
          },
        ]}
        layout={{
          title: `Cyclic Autocorrelation Function (α = ${alpha} Hz)`,
          xaxis: { 
            title: { 
              text: 'Lag τ (seconds)',
              font: { size: 14 }
            },
            showline: true,
            showgrid: true
          },
          yaxis: { 
            title: { 
              text: 'Rₓ(τ,α)',
              font: { size: 14 }
            },
            showline: true,
            showgrid: true
          },
          autosize: true,
          height: 350,
          margin: { l: 80, r: 20, t: 40, b: 60 },
        }}
        style={{ width: '100%' }}
        config={{ responsive: true }}
      />
    </div>
  );
};

export default CyclicAutocorrelationPlot; 