import React from 'react';
import styled from 'styled-components';

export interface Timing { ttfbMs: number; downloadMs: number }

const Grid = styled.div`display: grid; gap: 12px; padding: 6px 2px; font: 12px 'JetBrains Mono', monospace;`;
const Row = styled.div`display: grid; grid-template-columns: 130px 1fr 70px; align-items: center; gap: 10px;`;
const Track = styled.div`height: 12px; border-radius: 6px; background: var(--surface2); position: relative;`;
const Bar = styled.i<{ $left: number; $width: number }>`
  position: absolute; top: 0; bottom: 0; left: ${p => p.$left}%; width: ${p => p.$width}%;
  border-radius: 6px; background: linear-gradient(90deg, var(--accent), var(--accent2));
  transform-origin: left; animation: grow .8s cubic-bezier(.2,.8,.2,1) both;
  @keyframes grow { from { transform: scaleX(0); } }
`;

/** Linha do tempo da resposta: espera pelo servidor (TTFB) e download do corpo. */
export const Timeline: React.FC<{ timing?: Timing }> = ({ timing }) => {
  if (!timing) return <div style={{ color: 'var(--mute)' }}>Sem dados de tempo para esta resposta.</div>;
  const total = Math.max(timing.ttfbMs + timing.downloadMs, 1);
  const phases = [
    { name: 'Espera (TTFB)', start: 0, ms: timing.ttfbMs },
    { name: 'Download', start: timing.ttfbMs, ms: timing.downloadMs },
  ];
  return (
    <Grid aria-label="Timeline">
      {phases.map(p => (
        <Row key={p.name}>
          <span>{p.name}</span>
          <Track><Bar $left={(p.start / total) * 100} $width={Math.max((p.ms / total) * 100, 1.5)} /></Track>
          <span>{p.ms} ms</span>
        </Row>
      ))}
    </Grid>
  );
};
