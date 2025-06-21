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
    let validSamples = 0;
    
    for (let n = 0; n < N; n++) {
      const nLag = n - lag;
      if (nLag >= 0 && nLag < N) {
        // Cyclic autocorrelation: E[x(n) * x(n-τ) * e^(-j2πα*n/fs)]
        // We compute only the real part here
        const phase = -2 * Math.PI * alpha * n / sampleRate;
        sum += signal[n] * signal[nLag] * Math.cos(phase);
        validSamples++;
      }
    }
    
    // Normalize by the number of valid samples to get proper autocorrelation estimate
    caf.push(validSamples > 0 ? sum / validSamples : 0);
  }
  
  return caf;
}

// DFT for real input with proper scaling (no normalization by N)
function computeDFTMagnitude(signal: number[]): number[] {
  const N = signal.length;
  const magnitude: number[] = [];
  
  for (let k = 0; k < N; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N;
      re += signal[n] * Math.cos(angle);
      im += signal[n] * Math.sin(angle);
    }
    magnitude.push(Math.sqrt(re * re + im * im));
  }
  return magnitude;
}

const SCFSlicePlot: React.FC<SCFSlicePlotProps> = ({ signal, sampleRate, alpha, maxLag }) => {
  const caf = useMemo(() => computeCAF(signal, alpha, sampleRate, maxLag), [signal, alpha, sampleRate, maxLag]);
  const scfMag = useMemo(() => computeDFTMagnitude(caf), [caf]);
  const N = scfMag.length; // This is 2*maxLag+1 = 201 samples
  
  // CAF frequency axis calculation:
  // CAF has N = 2*maxLag+1 samples, each representing a lag of 1/sampleRate seconds
  // Total time span of CAF = N * (1/sampleRate) seconds
  // DFT frequency resolution = 1 / (total_time_span) = sampleRate / N Hz
  // But this gives us the wrong scale - we need to think about this differently
  
  // The CAF represents lags from -maxLag to +maxLag samples
  // Each lag step is 1 sample = 1/sampleRate seconds
  // So the "sampling rate" of the CAF in the lag domain is 1/(1/sampleRate) = sampleRate
  // But the total span is 2*maxLag samples, so the frequency resolution is sampleRate/(2*maxLag+1)
  const freqResolution = sampleRate / N;
  const maxFreq = freqResolution * Math.floor(N/2);
  
  const freqs = useMemo(() => {
    const freqArray = Array.from({ length: N }, (_, k) => {
      // Standard DFT frequency mapping: k=0 to N-1 maps to 0 to fs-fs/N, then shift to center
      if (k <= Math.floor(N/2)) {
        return k * freqResolution;
      } else {
        return (k - N) * freqResolution;
      }
    });
    
    // Sort the frequencies to ensure proper ordering for line plot
    const sortedIndices = Array.from({ length: N }, (_, i) => i)
      .sort((a, b) => freqArray[a] - freqArray[b]);
    
    return sortedIndices.map(i => freqArray[i]);
  }, [N, freqResolution]);
  
  // Sort the magnitude data to match the sorted frequencies
  const scfMagSorted = useMemo(() => {
    const freqArray = Array.from({ length: N }, (_, k) => {
      if (k <= Math.floor(N/2)) {
        return k * freqResolution;
      } else {
        return (k - N) * freqResolution;
      }
    });
    
    const sortedIndices = Array.from({ length: N }, (_, i) => i)
      .sort((a, b) => freqArray[a] - freqArray[b]);
    
    // Apply fftshift first, then sort
    const scfMagShifted = [...scfMag.slice(Math.floor(N/2)), ...scfMag.slice(0, Math.floor(N/2))];
    return sortedIndices.map(i => scfMagShifted[i]);
  }, [scfMag, N, freqResolution]);

  return (
    <div>
      <div style={{marginBottom: 8, background: '#f6f6fa', border: '1px solid #e0e0e0', borderRadius: 6, padding: '0.5em 1em', fontSize: 14}}>
        <strong>Spectral Correlation Function (SCF) Slice</strong><br />
        Shows |Sₓ(f,α)| for α = {alpha} Hz. This is the DFT magnitude of the cyclic autocorrelation.<br />
        <b>For a pure sine wave at frequency f₀:</b><br />
        • When α = 0: Should show impulses at ±f₀ (regular power spectrum)<br />
        • When α ≠ 0: Should be nearly zero (pure sine waves are stationary, not cyclostationary)<br />
        <b>Tip:</b> Try α = 0 first to see the expected spectral peaks!<br />
        <b>Frequency resolution:</b> {freqResolution.toFixed(2)} Hz per bin ({N} CAF samples)<br />
        <b>Frequency range:</b> ±{maxFreq.toFixed(1)} Hz<br />
        <b>CAF covers:</b> ±{maxLag} samples = ±{(maxLag/sampleRate*1000).toFixed(1)} ms
      </div>
      <Plot
        data={[
          {
            x: freqs,
            y: scfMagSorted,
            type: 'scatter',
            mode: 'lines+markers',
            line: { 
              width: 2, 
              color: 'purple',
              shape: 'linear'
            },
            marker: { color: 'purple', size: 3 },
            fill: 'none',
            connectgaps: false,
          },
        ]}
        layout={{
          title: `Spectral Correlation Function (α = ${alpha} Hz)`,
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
              text: '|Sₓ(f,α)|',
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

export default SCFSlicePlot; 