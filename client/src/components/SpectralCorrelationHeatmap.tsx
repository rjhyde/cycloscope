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
function computeDFTMagnitude(signal: number[], nFreq: number): number[] {
  const N = signal.length;
  const magnitude: number[] = [];
  for (let k = 0; k < nFreq; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / nFreq;
      re += signal[n] * Math.cos(angle);
      im += signal[n] * Math.sin(angle);
    }
    magnitude.push(Math.sqrt(re * re + im * im));
  }
  return magnitude;
}

const CyclicDomainProfile: React.FC<SpectralCorrelationHeatmapProps> = ({ signal, sampleRate, maxLag, nAlpha, nFreq, alpha }) => {
  // Detect the dominant frequency in the signal for the profile
  const dominantFreq = useMemo(() => {
    // Detect dominant frequency from power spectrum
    const N = signal.length;
    const magnitude: number[] = [];
    
    // Compute DFT magnitude
    for (let k = 0; k < Math.floor(N / 2) + 1; k++) {
      let re = 0, im = 0;
      for (let n = 0; n < N; n++) {
        const angle = (-2 * Math.PI * k * n) / N;
        re += signal[n] * Math.cos(angle);
        im += signal[n] * Math.sin(angle);
      }
      magnitude.push(Math.sqrt(re * re + im * im));
    }
    
    // Find peak (excluding DC component at k=0)
    let maxIdx = 1;
    let maxVal = magnitude[1];
    for (let k = 2; k < magnitude.length; k++) {
      if (magnitude[k] > maxVal) {
        maxVal = magnitude[k];
        maxIdx = k;
      }
    }
    
    // Convert bin index to frequency
    const freq = (maxIdx * sampleRate) / N;
    return Math.round(freq * 10) / 10; // Round to 0.1 Hz
  }, [signal, sampleRate]);

  // Compute SCF profile: SCF magnitude vs α for the dominant frequency
  const { alphas, scfProfile } = useMemo(() => {
    const alphas = Array.from({ length: nAlpha }, (_, i) => (i * sampleRate / 4) / (nAlpha - 1)); // 0 to fs/4
    const scfProfile: number[] = [];
    
    for (let i = 0; i < nAlpha; i++) {
      const caf = computeCAF(signal, alphas[i], sampleRate, maxLag);
      const scfMag = computeDFTMagnitude(caf, nFreq);
      
      // Find the frequency bin closest to the dominant frequency
      const freqResolution = sampleRate / nFreq;
      const targetBin = Math.round(dominantFreq / freqResolution);
      const actualBin = targetBin < nFreq/2 ? targetBin : nFreq - targetBin;
      
      scfProfile.push(scfMag[actualBin]);
    }
    
    return { alphas, scfProfile };
  }, [signal, sampleRate, maxLag, nAlpha, nFreq, dominantFreq]);

  // Find the current alpha index for highlighting
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
        <strong>Cyclic Domain Profile</strong><br />
        Shows |Sₓ(f₀,α)| vs cyclic frequency α for the dominant signal frequency f₀ = {dominantFreq} Hz.<br />
        <b>CSP Insight:</b> This reveals the cyclostationary structure - peaks show α values where the signal exhibits cyclostationarity.<br />
        <b>For stationary signals:</b> Only α = 0 should show significant energy.<br />
        <b>For cyclostationary signals:</b> Additional peaks appear at characteristic α values.<br />
        <b>Note:</b> This follows CSP Blog visualization conventions, unlike heatmaps which obscure the sparse α structure.
      </div>
      <Plot
        data={[
          {
            x: alphas,
            y: scfProfile,
            type: 'scatter',
            mode: 'lines+markers',
            line: { width: 3, color: 'darkblue' },
            marker: { color: 'darkblue', size: 4 },
            fill: 'none',
            name: `|SCF(${dominantFreq} Hz, α)|`,
          },
          {
            x: [alpha],
            y: [scfProfile[alphaIdx]],
            type: 'scatter',
            mode: 'markers',
            marker: { 
              color: 'red', 
              size: 10, 
              symbol: 'circle-open',
              line: { width: 3, color: 'red' }
            },
            name: `Current α = ${alpha} Hz`,
          },
        ]}
        layout={{
          title: `Cyclic Domain Profile: |Sₓ(${dominantFreq} Hz, α)|`,
          xaxis: { 
            title: { 
              text: 'Cyclic Frequency α (Hz)',
              font: { size: 14 }
            },
            showline: true,
            showgrid: true
          },
          yaxis: { 
            title: { 
              text: '|Sₓ(f₀,α)|',
              font: { size: 14 }
            },
            showline: true,
            showgrid: true
          },
          autosize: true,
          height: 450,
          margin: { l: 80, r: 20, t: 40, b: 60 },
          showlegend: true,
        }}
        style={{ width: '100%' }}
        config={{ responsive: true }}
      />
    </div>
  );
};

export default CyclicDomainProfile; 