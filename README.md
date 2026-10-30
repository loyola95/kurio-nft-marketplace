# Kurio: marketplace de NFTs

O Kurio é um marketplace de NFTs com descoberta, detalhe, carrinho, checkout com carteira e área da conta, em versões desktop e mobile. API, autenticação, carteiras, pagamentos e eventos em tempo real são simulados no navegador com MSW, então o projeto roda inteiro a partir de um checkout limpo, sem backend nem serviço privado.

- Deploy: https://kurio-nfts.vercel.app
- Repositório: https://github.com/loyola95/kurio-nft-marketplace
- Arquitetura e decisões: [ARCHITECTURE.md](ARCHITECTURE.md)
- Contratos: [REST](docs/contratos-rest.md) e [eventos Socket.IO](docs/eventos.md)

Stack: React 19, TypeScript, Vite, TanStack Router e Query, Tailwind CSS 4, shadcn/ui, React Hook Form com Zod, MSW 2 com `@mswjs/socket.io-binding`, Playwright, Vitest e Lighthouse CI.

## Requisitos

- Node 22 ou superior
- pnpm 10 (a versão exata está em `packageManager` no `package.json`; com Corepack, `corepack enable` basta)

## Setup

```bash
git clone https://github.com/loyola95/kurio-nft-marketplace.git
cd kurio-nft-marketplace
pnpm install --frozen-lockfile
pnpm exec playwright install chromium   # navegador dos testes e do Lighthouse
pnpm dev                                # http://localhost:5173
```

## Variáveis de ambiente

O `.env` versionado já tem os valores da demonstração, que são os mesmos do `.env.example`. Nenhum é segredo.

| Variável               | Padrão                      | Uso                                                                |
| ---------------------- | --------------------------- | ------------------------------------------------------------------ |
| `VITE_ENABLE_MOCKS`    | `true`                      | liga o MSW (API REST e Socket.IO simulados) e o painel de cenários |
| `VITE_API_BASE_URL`    | `/api`                      | base da API REST                                                   |
| `VITE_REALTIME_URL`    | `wss://realtime.kurio.mock` | endereço do Socket.IO                                              |
| `VITE_HTTP_TIMEOUT_MS` | `8000`                      | timeout das requisições do cliente                                 |
| `VITE_DEMO_HINT`       | texto com o acesso de teste | dica de acesso da demonstração mostrada no login (opcional)        |

## Credenciais fictícias

| E-mail            | Senha       | Observação                                                          |
| ----------------- | ----------- | ------------------------------------------------------------------- |
| `ana@kurio.dev`   | `Kurio@123` | perfil completo, carteiras Principal (Ethereum) e Reserva (Polygon) |
| `bruno@kurio.dev` | `Kurio@123` | segunda conta, para testar troca de usuário e isolamento            |

Cupons: `KURIO10` (10% de desconto), `GENESIS` (0.05 ETH fixo) e `VERAO2025` (expirado, para ver a mensagem de erro).

## Cenários e reset

O mock tem 17 cenários. Há três formas de escolher:

1. Pela URL: acrescente `?cenario=<nome>` a qualquer rota, por exemplo `/?cenario=lento`. O cenário fica salvo no banco simulado até ser trocado ou restaurado.
2. Pelo painel: o botão "Abrir painel de cenários" fica na borda direita da tela, no meio da altura. Escolha o cenário e clique em "Aplicar cenário".
3. Por API: `POST /api/__mock/scenario` com `{ "name": "<nome>" }`, de dentro da página. É o que os testes usam.

Para voltar ao estado inicial (catálogo, estoque, carrinhos, pedidos, sessões e cenário `padrao`), use **"Restaurar dados iniciais"** no painel ou `POST /api/__mock/reset`. O reset também encerra a sessão local. Os dados ficam no `localStorage` do navegador, então limpar os dados do site também reinicia tudo.

O painel também dispara eventos e falhas sob demanda: enviar `nft.updated` com novo preço ou estoque, reenviar o último evento (duplicata), enviar evento antigo de NFT ou de pedido, derrubar a conexão, expirar a sessão, desconectar a carteira e segurar pedidos em pendente. Para esconder o painel, use `?painel=0`; para mostrar de novo, `?painel=1`.

| Cenário                      | O que acontece                                             |
| ---------------------------- | ---------------------------------------------------------- |
| `padrao`                     | tudo funciona, latência de 150 ms                          |
| `catalogo-vazio`             | catálogo sem NFTs                                          |
| `lento`                      | todas as respostas em 2,5 s (skeletons visíveis)           |
| `latencia-variavel`          | latência entre 100 ms e 1,5 s, com seed fixa               |
| `fora-de-ordem`              | a resposta antiga do catálogo chega depois da nova         |
| `offline`                    | falha de rede em todas as rotas                            |
| `erro-servidor`              | erro 500 nas leituras do catálogo                          |
| `falha-transitoria`          | 503 nas duas primeiras leituras do catálogo, depois normal |
| `sessao-expirada`            | a sessão vence 60 s depois do login                        |
| `sem-permissao`              | 403 nas rotas privadas                                     |
| `favorito-falha`             | favoritar e desfavoritar falham (rollback)                 |
| `preco-alterado-no-checkout` | o preço sobe depois da cotação                             |
| `esgotado-no-checkout`       | o item esgota depois da cotação                            |
| `timeout-pedido`             | o pedido é criado, mas a resposta chega depois do timeout  |
| `pagamento-recusado`         | o pedido termina recusado                                  |
| `carteira-recusada`          | a carteira recusa a conexão                                |
| `tempo-real-instavel`        | o socket cai a cada 20 s                                   |

## Comandos

| Comando                | O que faz                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm dev`             | servidor de desenvolvimento com mocks                                                      |
| `pnpm build`           | gera as rotas, verifica tipos e faz o build de produção em `dist/`                         |
| `pnpm preview`         | serve o build em http://localhost:4173                                                     |
| `pnpm typecheck`       | verificação de tipos                                                                       |
| `pnpm lint`            | oxlint, com avisos tratados como erro                                                      |
| `pnpm format`          | Prettier                                                                                   |
| `pnpm test:unit`       | testes unitários (Vitest)                                                                  |
| `pnpm test:e2e`        | testes Playwright (e2e e regressão visual) contra o build de produção, em desktop e mobile |
| `pnpm test:e2e:update` | igual ao anterior, regravando as baselines visuais                                         |
| `pnpm lighthouse`      | build e auditoria Lighthouse (3 medições por página e perfil)                              |

O `pnpm test:e2e` sobe o build sozinho (`pnpm build && pnpm preview`). Numa máquina com pouca memória, `pnpm test:e2e --workers=1` evita que o sistema derrube o navegador.

### Regressão visual em outros sistemas

As baselines visuais estão versionadas para Windows (`*-win32.png`) e Linux (`*-linux.png`), em `tests/visual/telas.spec.ts-snapshots/`. Em macOS não há baseline: rode `pnpm test:e2e:update tests/visual` uma vez para gerar as locais. O workflow do GitHub Actions tem um disparo manual com a opção `update_snapshots`, que gera as baselines Linux e as publica como artefato.

## Como reproduzir os fluxos de falha

Cada passo parte da Início com o cenário na URL. Para trocar de cenário no meio, use o painel. Os testes de cada fluxo estão em `tests/e2e/`.

**Catálogo vazio** (`/?cenario=catalogo-vazio`): a grade mostra "Nenhum NFT encontrado" no lugar dos cards.

**Carregamento lento** (`/?cenario=lento`): skeletons do tamanho do conteúdo final na grade, no detalhe e no resumo do carrinho enquanto as respostas não chegam.

**Respostas fora de ordem** (`/?cenario=fora-de-ordem`): troque de filtro duas vezes seguidas ou use voltar e avançar com uma busca em andamento. A grade sempre corresponde ao filtro da URL atual, mesmo quando a resposta antiga chega por último.

**Sem conexão** (`/?cenario=offline`): a grade mostra o erro com o botão "Tentar novamente". Volte para `padrao` no painel e tente de novo.

**Erro do servidor** (`/?cenario=erro-servidor`): igual ao anterior, com a mensagem de erro do servidor.

**Falha transitória** (`/?cenario=falha-transitoria`): as duas primeiras leituras falham com 503, o cliente tenta de novo sozinho e a grade aparece sem intervenção.

**Sessão expirada** (`/entrar?cenario=sessao-expirada`): entre com `ana@kurio.dev`, abra o perfil, mude um campo e espere 60 s. Ao salvar, o app leva ao login com o aviso de sessão expirada. Depois de entrar de novo, a pessoa volta ao perfil com o rascunho preservado. Para não esperar, use "Expirar sessão" no painel em qualquer cenário.

**Sem permissão**: entre com `ana@kurio.dev`, abra `/pedidos/ord-1`, aplique `sem-permissao` no painel e recarregue. A página mostra "Você não tem acesso a este pedido", sem nenhum dado do pedido.

**Favorito com falha** (`/?cenario=favorito-falha`): entre e clique no coração de um card. Ele marca na hora e volta ao estado anterior quando a API falha, com aviso.

**Preço alterado no checkout**: aplique `preco-alterado-no-checkout`, entre, coloque um item no carrinho, vá para o pagamento, conecte a carteira e abra a revisão. O preço sobe depois da cotação. Ao confirmar, a API recusa a cotação antiga, e a revisão passa a mostrar o preço novo e pede uma nova confirmação.

**Esgotado no checkout**: os mesmos passos com `esgotado-no-checkout`. O envio fica bloqueado, com o motivo, e nenhum pedido é criado.

**Timeout do pedido**: os mesmos passos com `timeout-pedido`. A resposta passa do timeout de 8 s e o app avisa. Ao tentar de novo, o reenvio usa a mesma chave de idempotência e encontra o pedido já criado, sem duplicar.

**Pagamento recusado**: os mesmos passos com `pagamento-recusado`. O pedido fica pendente por 3 s e termina recusado, com o motivo. O carrinho é mantido e há a opção de tentar de novo.

**Carteira recusada**: no pagamento, com `carteira-recusada`, escolha uma carteira. A conexão é recusada com mensagem, e dá para tentar outra.

**Carteira desconectada**: no pagamento, com a carteira conectada, use "Desconectar carteira" no painel e confirme a compra. O app volta ao passo de conexão.

**Tempo real instável** (`/?cenario=tempo-real-instavel`): o socket cai a cada 20 s e reconecta sozinho. Na reconexão, o app revalida o que está na tela. Um pedido pendente continua sendo acompanhado por polling enquanto o socket está fora.

**Eventos duplicados e antigos**: com um item no carrinho, envie `nft.updated` pelo painel, depois "Reenviar último evento" e "Evento antigo de NFT". Só o primeiro muda a tela e gera aviso.

**Refresh com pedido pendente**: ative "Segurar pedidos pendentes" no painel, confirme uma compra e recarregue a página do pedido. Ele continua pendente e é retomado. Ao liberar no painel, o recibo aparece sem recarregar.

## Relatórios

| O quê                                                | Onde                                                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Relatório HTML do Playwright                         | `playwright-report/` depois de `pnpm test:e2e` (`pnpm exec playwright show-report`) |
| Traces e screenshots de falhas                       | `test-results/` (`trace: retain-on-failure`)                                        |
| Lighthouse (HTML e JSON, 3 perfis)                   | `reports/lighthouse/`                                                               |
| Resumo do Lighthouse com mediana, ambiente e análise | [`reports/lighthouse/RESULTS.md`](reports/lighthouse/RESULTS.md)                    |
| CI (checks, e2e, relatório e traces como artefato)   | aba Actions do GitHub, workflow `CI`                                                |
