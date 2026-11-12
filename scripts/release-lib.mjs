// Lógica pura do release: Conventional Commits -> próxima versão semver + notas.

export const TYPES = {
  feat: 'Funcionalidades', fix: 'Correções', perf: 'Performance', revert: 'Reversões',
  refactor: 'Refatoração', docs: 'Documentação', style: 'Estilo', test: 'Testes',
  build: 'Build', ci: 'CI', chore: 'Manutenção',
};

const HEADER = /^(\w+)(?:\(([^)]+)\))?(!)?: (.+)$/;

/** Interpreta "tipo(escopo)!: descrição". Retorna null se não seguir o padrão. */
export function parseCommit(subject, body = '') {
  const m = HEADER.exec(subject.trim());
  if (!m || !(m[1] in TYPES)) return null;
  const breaking = Boolean(m[3]) || /^BREAKING[ -]CHANGE:/m.test(body);
  return { type: m[1], scope: m[2] ?? null, breaking, description: m[4] };
}

/** Mensagem válida: Conventional Commit, merge automático ou release. */
export function validateMessage(message) {
  const subject = message.split('\n')[0];
  if (/^(Merge |Revert ")/.test(subject)) return null;
  if (!parseCommit(subject, message)) {
    return `Mensagem inválida: "${subject}". Use tipo(escopo): descrição, com tipo em ${Object.keys(TYPES).join(', ')}.`;
  }
  return subject.length > 100 ? 'Assunto com mais de 100 caracteres.' : null;
}

/** major para breaking, minor para feat, patch para fix/perf/revert; null não gera release. */
export function bumpOf(commits) {
  if (commits.some(c => c.breaking)) return 'major';
  if (commits.some(c => c.type === 'feat')) return 'minor';
  if (commits.some(c => ['fix', 'perf', 'revert'].includes(c.type))) return 'patch';
  return null;
}

export function nextVersion(base, bump) {
  const [maj, min, pat] = base.split('.').map(Number);
  if (bump === 'major') return `${maj + 1}.0.0`;
  if (bump === 'minor') return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

export const compareVersions = (a, b) => {
  const [x, y] = [a, b].map(v => v.split('.').map(Number));
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

/** Notas em markdown agrupadas por tipo, com breaking changes em destaque. */
export function buildNotes(commits, { version, prevTag, repoUrl }) {
  const lines = [`## v${version}`, ''];
  const breaking = commits.filter(c => c.breaking);
  if (breaking.length) lines.push('### Mudanças incompatíveis', ...breaking.map(format), '');
  for (const [type, title] of Object.entries(TYPES)) {
    const group = commits.filter(c => c.type === type);
    if (group.length) lines.push(`### ${title}`, ...group.map(format), '');
  }
  if (prevTag && repoUrl) lines.push(`**Comparar:** ${repoUrl}/compare/${prevTag}...v${version}`);
  return lines.join('\n').trim() + '\n';
}

const format = c => `- ${c.scope ? `**${c.scope}:** ` : ''}${c.description}${c.sha ? ` (${c.sha.slice(0, 7)})` : ''}`;
