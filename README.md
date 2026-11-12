# PingHermano

Cliente de API leve e rápido (estilo Postman), construído com **Tauri 2** (Rust) + **React** + **MobX**.

![Tela principal](docs/screenshots/main.png)
![Resposta](docs/screenshots/response.png)

## Recursos

- Abas de requisição persistentes, histórico, coleções e ambientes (`{{variavel}}`)
- Métodos HTTP, headers, query params, body (texto/JSON, form-data com arquivos, urlencoded)
- Autenticação (Bearer, Basic, API Key)
- Scripts de pre-request e testes com API `pm` (`pm.test`, `pm.expect`, `pm.environment`, `pm.response`)
- Visualização da resposta (body, preview, headers, testes), copiar/baixar
- Gerador de código (cURL e fetch), import/export de coleções e ambientes
- Cancelamento de requisições em andamento

## Por que Tauri

Instalador pequeno e baixo consumo de memória: o app usa a webview do sistema e um backend Rust
(`reqwest`, com pool de conexões, gzip/brotli e timeouts), sem Chromium/Node embutidos.

## Desenvolvimento

Requisitos: Node 20+, Rust estável e as [dependências do Tauri](https://tauri.app/start/prerequisites/).

```bash
npm install
npm run tauri:dev     # app desktop com hot reload
npm run dev           # somente a UI no navegador (sem backend nativo)
npm test              # testes (vitest)
npm run tauri:build   # gera o instalador
```

## Commits, versões e releases

Os commits seguem [Conventional Commits](https://www.conventionalcommits.org/pt-br/): `tipo(escopo): descrição`
(`feat`, `fix`, `perf`, `refactor`, `docs`, `style`, `test`, `build`, `ci`, `chore`, `revert`).
O hook `.githooks/commit-msg` valida localmente (ativado pelo `prepare` ao rodar `pnpm install`) e o
workflow **Commit Lint** valida o título e os commits de cada PR.

A cada push na `master`, o workflow **Release** calcula a próxima versão a partir dos commits desde a última tag:

| Commit | Versão |
| --- | --- |
| `feat!:` ou rodapé `BREAKING CHANGE:` | major |
| `feat` | minor |
| `fix`, `perf`, `revert` | patch |
| demais tipos | sem release |

Ele cria a tag `vX.Y.Z`, gera as notas, compila os instaladores (Linux, macOS Intel/ARM e Windows) e
publica a GitHub Release com o `latest.json` do auto-update. Para simular: `pnpm release:next`.

### Auto-update

O app mostra a versão instalada (`vX.Y.Z`) no canto inferior e consulta a última release ao abrir e a cada 6 horas
(ou pela paleta, em **Verificar atualizações**). Quando há uma versão nova, aparece **vX.Y.Z disponível · Atualizar**:
o app baixa, valida a assinatura, instala e reinicia.

Configuração única, para assinar as atualizações:

```bash
pnpm tauri signer generate -w ~/.tauri/pinghermano.key
```

1. Cadastre o conteúdo da chave privada como secret `TAURI_SIGNING_PRIVATE_KEY` (e a senha, se houver, em `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`).
2. Troque `plugins.updater.pubkey` em `src-tauri/tauri.conf.json` pela chave pública (`.pub`) gerada.

## Estrutura

```
src/renderer/        UI React (componentes, store MobX, utilitários)
src/renderer/api/    ponte com o backend (invoke) e sandbox de scripts `pm`
src-tauri/src/http.rs  execução HTTP e cancelamento (Rust)
```

## Licença

ISC
