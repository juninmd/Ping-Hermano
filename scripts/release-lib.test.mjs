import { describe, it, expect } from 'vitest';
import { bumpOf, buildNotes, compareVersions, nextVersion, parseCommit, validateMessage } from './release-lib.mjs';

describe('parseCommit', () => {
  it('lê tipo, escopo e descrição', () => {
    expect(parseCommit('feat(ui): nova paleta')).toEqual({ type: 'feat', scope: 'ui', breaking: false, description: 'nova paleta' });
  });
  it('detecta breaking por ! e por rodapé', () => {
    expect(parseCommit('feat!: remove api').breaking).toBe(true);
    expect(parseCommit('fix: x', 'BREAKING CHANGE: muda formato').breaking).toBe(true);
  });
  it('rejeita mensagens fora do padrão', () => {
    expect(parseCommit('atualiza coisas')).toBeNull();
    expect(parseCommit('wip: teste')).toBeNull();
  });
});

describe('validateMessage', () => {
  it('aceita commits semânticos, merges e reverts automáticos', () => {
    expect(validateMessage('fix(api): corrige timeout\n\ncorpo')).toBeNull();
    expect(validateMessage('Merge branch main')).toBeNull();
  });
  it('explica o erro', () => {
    expect(validateMessage('qualquer coisa')).toMatch(/Mensagem inválida/);
    expect(validateMessage(`feat: ${'a'.repeat(120)}`)).toMatch(/100 caracteres/);
  });
});

describe('versionamento', () => {
  const c = type => ({ type, breaking: false });
  it('escolhe o maior bump', () => {
    expect(bumpOf([c('fix'), c('feat')])).toBe('minor');
    expect(bumpOf([c('fix'), { type: 'chore', breaking: true }])).toBe('major');
    expect(bumpOf([c('perf')])).toBe('patch');
    expect(bumpOf([c('docs'), c('chore')])).toBeNull();
  });
  it('calcula a próxima versão', () => {
    expect(nextVersion('2.3.4', 'major')).toBe('3.0.0');
    expect(nextVersion('2.3.4', 'minor')).toBe('2.4.0');
    expect(nextVersion('2.3.4', 'patch')).toBe('2.3.5');
  });
  it('compara versões numericamente', () => {
    expect(compareVersions('1.10.0', '1.9.0')).toBeGreaterThan(0);
    expect(compareVersions('2.0.0', '2.0.0')).toBe(0);
  });
});

describe('buildNotes', () => {
  it('agrupa por tipo e inclui link de comparação', () => {
    const md = buildNotes(
      [{ type: 'feat', scope: 'ui', breaking: false, description: 'tema', sha: 'abcdef123' },
       { type: 'fix', scope: null, breaking: true, description: 'api', sha: '1234567890' }],
      { version: '2.1.0', prevTag: 'v2.0.0', repoUrl: 'https://github.com/o/r' });
    expect(md).toContain('## v2.1.0');
    expect(md).toContain('### Mudanças incompatíveis');
    expect(md).toContain('- **ui:** tema (abcdef1)');
    expect(md).toContain('https://github.com/o/r/compare/v2.0.0...v2.1.0');
  });
});
