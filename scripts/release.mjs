#!/usr/bin/env node
// CLI do release:  next | apply <versão> | check-message <arquivo> | check-title <texto> | check-range <intervalo>
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { bumpOf, buildNotes, compareVersions, nextVersion, parseCommit, validateMessage } from './release-lib.mjs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const read = f => readFileSync(f, 'utf8');
const SEP = '\u001e';

function lastTag() {
  try { return git('describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*'); } catch { return null; }
}

/** Maior versão declarada nos manifestos, usada como base quando ainda não há tag. */
function baseVersion(tag) {
  if (tag) return tag.slice(1);
  const found = [
    JSON.parse(read('package.json')).version,
    JSON.parse(read('src-tauri/tauri.conf.json')).version,
    /^version = "(.+)"/m.exec(read('src-tauri/Cargo.toml'))[1],
  ];
  return found.sort(compareVersions).pop();
}

function commitsSince(tag) {
  const range = tag ? [`${tag}..HEAD`] : ['HEAD'];
  const raw = git('log', ...range, `--format=%H%n%s%n%b${SEP}`);
  return raw.split(SEP).map(s => s.trim()).filter(Boolean).flatMap(entry => {
    const [sha, subject, ...body] = entry.split('\n');
    const parsed = parseCommit(subject, body.join('\n'));
    return parsed ? [{ ...parsed, sha }] : [];
  });
}

function next() {
  const tag = lastTag();
  const commits = commitsSince(tag);
  const bump = bumpOf(commits);
  const out = { released: 'false', version: '', notes: '' };
  if (bump) {
    const version = nextVersion(baseVersion(tag), bump);
    const repoUrl = (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY)
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}` : '';
    Object.assign(out, { released: 'true', version, bump, notes: buildNotes(commits, { version, prevTag: tag, repoUrl }) });
  }
  if (process.env.GITHUB_OUTPUT) {
    const lines = Object.entries(out).map(([k, v]) => `${k}<<__EOF__\n${v}\n__EOF__`);
    appendFileSync(process.env.GITHUB_OUTPUT, lines.join('\n') + '\n');
  }
  console.log(JSON.stringify(out, null, 2));
}

/** Grava a versão em package.json, tauri.conf.json, Cargo.toml e Cargo.lock. */
function apply(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) throw new Error(`Versão inválida: ${version}`);
  for (const f of ['package.json', 'src-tauri/tauri.conf.json']) {
    const json = JSON.parse(read(f));
    json.version = version;
    writeFileSync(f, JSON.stringify(json, null, 2) + '\n');
  }
  writeFileSync('src-tauri/Cargo.toml', read('src-tauri/Cargo.toml').replace(/^version = ".+"/m, `version = "${version}"`));
  writeFileSync('src-tauri/Cargo.lock',
    read('src-tauri/Cargo.lock').replace(/(name = "ping-hermano"\nversion = )".+"/, `$1"${version}"`));
  console.log(`Versão ${version} aplicada`);
}

const fail = error => { if (error) { console.error(error); process.exit(1); } };

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'next') next();
else if (cmd === 'apply') apply(arg);
else if (cmd === 'check-message') fail(validateMessage(read(arg)));
else if (cmd === 'check-title') fail(validateMessage(arg ?? ''));
else if (cmd === 'check-range') {
  // Valida o assunto de todos os commits do intervalo (ex.: origin/master..HEAD).
  fail(git('log', arg, '--format=%s').split('\n').filter(Boolean).map(validateMessage).find(Boolean) ?? null);
} else { console.error('Uso: release.mjs next | apply <versão> | check-message <arquivo> | check-title <texto> | check-range <intervalo>'); process.exit(2); }
