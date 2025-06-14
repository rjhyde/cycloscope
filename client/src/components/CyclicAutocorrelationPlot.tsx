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
        // e^{-j2pi alpha n / fs}
        const phase = -2 * Math.PI * alpha * n / sampleRate;
        sum += signal[n] * signal[nLag] * Math.cos(phase); // real part only
        count++;
      }
    }
    caf.push(sum / (count || 1));
  }
  return caf;
}

const CyclicAutocorrelationPlot: React.FC<CyclicAutocorrelationPlotProps> = ({ signal, sampleRate, alpha, maxLag }) => {
  const lags = useMemo(() => Array.from({ length: 2 * maxLag + 1 }, (_, i) => i - maxLag), [maxLag]);
  const caf = useMemo(() => computeCAF(signal, alpha, sampleRate, maxLag), [signal, alpha, sampleRate, maxLag]);

  return (
    <div>
      <div style={{marginBottom: 8}}>
        <strong>Cyclic Autocorrelation Function (CAF)</strong>: Shows the real part of the cyclic autocorrelation for the selected cyclic frequency (α = {alpha} Hz) as a function of lag.
      </div>
      <Plot
        data={[
          {
            x: lags,
            y: caf,
            type: 'scatter',
            mode: 'lines',
            marker: { color: 'green' },
          },
        ]}
        layout={{
          title: 'Cyclic Autocorrelation (Real Part)',
          xaxis: { title: 'Lag (samples)' },
          yaxis: { title: 'Re{CAF}' },
          autosize: true,
          height: 300,
        }}
        style={{ width: '100%' }}
        config={{ responsive: true }}
      />
    </div>
  );
};

export default CyclicAutocorrelationPlot; 