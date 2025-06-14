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
          marker: { color: 'blue' },
        },
      ]}
      layout={{
        title: 'Time Domain',
        xaxis: { title: 'Time (s)' },
        yaxis: { title: 'Amplitude' },
        autosize: true,
        height: 300,
      }}
      style={{ width: '100%' }}
      config={{ responsive: true }}
    />
  );
};

export default TimeDomainPlot; 