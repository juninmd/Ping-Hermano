import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CommandPalette } from './CommandPalette';
import { Select } from './Select';

describe('CommandPalette', () => {
  it('filters commands and closes on Escape', () => {
    const onClose = vi.fn();
    render(<CommandPalette open onClose={onClose} toggleTheme={() => {}} />);
    fireEvent.change(screen.getByLabelText('Buscar comandos'), { target: { value: 'tema' } });
    expect(screen.getByText('Alternar tema')).toBeInTheDocument();
    expect(screen.queryByText('Nova requisição')).not.toBeInTheDocument();
    fireEvent.keyDown(screen.getByLabelText('Buscar comandos'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('runs the selected command on Enter', () => {
    const toggle = vi.fn();
    render(<CommandPalette open onClose={() => {}} toggleTheme={toggle} />);
    fireEvent.change(screen.getByLabelText('Buscar comandos'), { target: { value: 'tema' } });
    fireEvent.keyDown(screen.getByLabelText('Buscar comandos'), { key: 'Enter' });
    expect(toggle).toHaveBeenCalled();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<CommandPalette open={false} onClose={() => {}} toggleTheme={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('Select', () => {
  const setup = (onChange = vi.fn()) => {
    render(<Select value="a" onChange={onChange} label="Letra"><option value="a">A</option><option value="b">B</option></Select>);
    return onChange;
  };

  it('opens the menu and picks an option with the mouse', () => {
    const onChange = setup();
    fireEvent.click(screen.getByRole('button', { name: /Letra/ }));
    fireEvent.click(within(screen.getByRole('listbox')).getByText('B'));
    expect(onChange).toHaveBeenCalledWith({ target: { value: 'b' } });
  });

  it('supports keyboard navigation', () => {
    const onChange = setup();
    const btn = screen.getByRole('button', { name: /Letra/ });
    fireEvent.keyDown(btn, { key: 'ArrowDown' });
    fireEvent.keyDown(btn, { key: 'ArrowDown' });
    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith({ target: { value: 'b' } });
    fireEvent.keyDown(btn, { key: 'ArrowDown' });
    fireEvent.keyDown(btn, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
