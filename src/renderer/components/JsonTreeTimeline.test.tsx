import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { JsonTree } from './JsonTree';
import { Timeline } from './Timeline';

describe('JsonTree', () => {
  it('renders nested objects and primitives', () => {
    render(<JsonTree data={{ id: 1, tags: ['a'], ok: true, none: null }} />);
    expect(screen.getByText('{4}')).toBeInTheDocument();
    expect(screen.getByText('[1]')).toBeInTheDocument();
    expect(screen.getByText('"a"')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('parses JSON strings and falls back to plain text', () => {
    const { unmount } = render(<JsonTree data='{"x": 2}' />);
    expect(screen.getByText('2')).toBeInTheDocument();
    unmount();
    render(<JsonTree data="not json" />);
    expect(screen.getByText('not json')).toBeInTheDocument();
  });
});

describe('Timeline', () => {
  it('shows both phases with their durations', () => {
    render(<Timeline timing={{ ttfbMs: 120, downloadMs: 30 }} />);
    expect(screen.getByText('Espera (TTFB)')).toBeInTheDocument();
    expect(screen.getByText('120 ms')).toBeInTheDocument();
    expect(screen.getByText('30 ms')).toBeInTheDocument();
  });

  it('shows a fallback when timing is missing', () => {
    render(<Timeline />);
    expect(screen.getByText(/Sem dados de tempo/)).toBeInTheDocument();
  });
});
