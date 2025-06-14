import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

interface FrequencyDomainPlotProps {
  signal: number[];
  sampleRate: number;
}

// Simple FFT implementation (real input, returns magnitude spectrum)
function fftMag(signal: number[]): number[] {
  const N = signal.length;
  // Zero pad to next power of 2 for speed (optional, not done here for simplicity)
  // Use a simple DFT for small N
  const mag: number[] = [];
  for (let k = 0; k < N / 2; k++) {
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

const FrequencyDomainPlot: React.FC<FrequencyDomainPlotProps> = ({ signal, sampleRate }) => {
  const N = signal.length;
  const freqs = useMemo(() => Array.from({ length: N / 2 }, (_, k) => (k * sampleRate) / N), [N, sampleRate]);
  const mag = useMemo(() => fftMag(signal), [signal]);

  return (
    <Plot
      data={[
        {
          x: freqs,
          y: mag,
          type: 'scatter',
          mode: 'lines',
          marker: { color: 'red' },
        },
      ]}
      layout={{
        title: 'Frequency Domain (Magnitude Spectrum)',
        xaxis: { title: 'Frequency (Hz)' },
        yaxis: { title: 'Magnitude' },
        autosize: true,
        height: 300,
      }}
      style={{ width: '100%' }}
      config={{ responsive: true }}
    />
  );
};

export default FrequencyDomainPlot; 