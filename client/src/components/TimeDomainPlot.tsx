import React from 'react';
import Plot from 'react-plotly.js';

interface TimeDomainPlotProps {
  signal: number[];
  sampleRate: number;
}

const TimeDomainPlot: React.FC<TimeDomainPlotProps> = ({ signal, sampleRate }) => {
  const time = signal.map((_, i) => i / sampleRate);

  return (
    <Plot
      data={[
        {
          x: time,
          y: signal,
          type: 'scatter',
          mode: 'lines',
          line: { color: 'blue', width: 2 },
          fill: 'none',
        },
      ]}
      layout={{
        title: 'Time Domain Signal',
        xaxis: { 
          title: { 
            text: 'Time (s)',
            font: { size: 14 }
          },
          showline: true,
          showgrid: true
        },
        yaxis: { 
          title: { 
            text: 'Signal Amplitude',
            font: { size: 14 }
          },
          showline: true,
          showgrid: true
        },
        autosize: true,
        height: 350,
        margin: { l: 60, r: 20, t: 40, b: 60 },
      }}
      style={{ width: '100%' }}
      config={{ responsive: true }}
    />
  );
};

export default TimeDomainPlot; 