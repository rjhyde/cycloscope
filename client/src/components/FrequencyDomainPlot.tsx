import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

interface FrequencyDomainPlotProps {
  signal: number[];
  sampleRate: number;
}

// Discrete Fourier Transform (DFT) implementation
// For real input signal of length N, computes N/2 frequency bins from 0 to Nyquist frequency
function computeDFT(signal: number[]): { magnitude: number[], phase: number[] } {
  const N = signal.length;
  const magnitude: number[] = [];
  const phase: number[] = [];
  
  // Compute DFT for frequencies 0 to N/2 (up to Nyquist frequency)
  for (let k = 0; k < Math.floor(N / 2) + 1; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N;
      re += signal[n] * Math.cos(angle);
      im += signal[n] * Math.sin(angle);
    }
    
    // Dr. Spooner's feedback: For a sine wave, the FFT peak should be approximately N
    // The DFT produces complex coefficients, we take the magnitude
    // For real signals: DC and Nyquist components appear once, others appear twice
    const mag = Math.sqrt(re * re + im * im);
    
    magnitude.push(mag);
    phase.push(Math.atan2(im, re));
  }
  
  return { magnitude, phase };
}

const FrequencyDomainPlot: React.FC<FrequencyDomainPlotProps> = ({ signal, sampleRate }) => {
  const N = signal.length;
  const { freqs, magnitude } = useMemo(() => {
    const numFreqs = Math.floor(N / 2) + 1;
    const freqs = Array.from({ length: numFreqs }, (_, k) => (k * sampleRate) / N);
    const { magnitude } = computeDFT(signal);
    return { freqs, magnitude };
  }, [signal, sampleRate, N]);

  return (
    <div>
      <div style={{marginBottom: 8, background: '#f6f6fa', border: '1px solid #e0e0e0', borderRadius: 6, padding: '0.5em 1em', fontSize: 14}}>
        <strong>Discrete Fourier Transform (DFT) Magnitude Spectrum</strong><br />
        This shows the DFT of {N} time samples at {sampleRate} Hz sampling rate.<br />
        <b>Frequency resolution:</b> Δf = {sampleRate/N} Hz per bin<br />
        <b>Frequency range:</b> 0 to {sampleRate/2} Hz (Nyquist frequency)<br />
        <b>Expected peak amplitude:</b> For a pure sine wave, the peak should be approximately {N} (full the number of samples).
      </div>
      <Plot
        data={[
          {
            x: freqs,
            y: magnitude,
            type: 'scatter',
            mode: 'lines+markers',
            line: { width: 2 },
            marker: { color: 'red', size: 4 },
            fill: 'none',
          },
        ]}
        layout={{
          title: `DFT Magnitude Spectrum (N=${N} samples, fs=${sampleRate} Hz)`,
          xaxis: { 
            title: { 
              text: 'Frequency f (Hz)',
              font: { size: 14 }
            },
            showline: true,
            showgrid: true
          },
          yaxis: { 
            title: { 
              text: 'Magnitude |X[k]|',
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

export default FrequencyDomainPlot; 