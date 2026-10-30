# Resultados do Lighthouse

Gerado por `pnpm lighthouse` (configs em `lighthouse/`). Valores são a mediana de 3 medições por página e perfil; ⚠ marca nota abaixo da meta do enunciado.

## Resultados

### Mobile

| Página | Medições | Performance (≥ 90) | Accessibility (≥ 95) | Best Practices (≥ 95) | SEO (≥ 90) | LCP | CLS | TBT | FCP |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 3 | 52 ⚠ | 100 | 100 | 100 | 5,03 s | 0,000 | 904 ms | 3,61 s |
| `/nft/emerald-ape-042` | 3 | 52 ⚠ | 100 | 100 | 100 | 4,86 s | 0,000 | 786 ms | 3,62 s |

Relatórios (HTML, com o JSON ao lado):
- `/`: [localhost--2026_10_29_23_05_58.report.html](mobile/localhost--2026_10_29_23_05_58.report.html), [localhost--2026_10_29_23_06_30.report.html](mobile/localhost--2026_10_29_23_06_30.report.html), [localhost--2026_10_29_23_07_00.report.html](mobile/localhost--2026_10_29_23_07_00.report.html)
- `/nft/emerald-ape-042`: [localhost-nft_emerald_ape_042-2026_10_29_23_07_29.report.html](mobile/localhost-nft_emerald_ape_042-2026_10_29_23_07_29.report.html), [localhost-nft_emerald_ape_042-2026_10_29_23_07_57.report.html](mobile/localhost-nft_emerald_ape_042-2026_10_29_23_07_57.report.html), [localhost-nft_emerald_ape_042-2026_10_29_23_08_26.report.html](mobile/localhost-nft_emerald_ape_042-2026_10_29_23_08_26.report.html)

### Desktop

| Página | Medições | Performance (≥ 90) | Accessibility (≥ 95) | Best Practices (≥ 95) | SEO (≥ 90) | LCP | CLS | TBT | FCP |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 3 | 97 | 100 | 100 | 100 | 1,11 s | 0,004 | 40 ms | 0,85 s |
| `/nft/emerald-ape-042` | 3 | 97 | 100 | 100 | 100 | 1,08 s | 0,000 | 64 ms | 0,82 s |

Relatórios (HTML, com o JSON ao lado):
- `/`: [localhost--2026_10_29_23_09_10.report.html](desktop/localhost--2026_10_29_23_09_10.report.html), [localhost--2026_10_29_23_09_43.report.html](desktop/localhost--2026_10_29_23_09_43.report.html), [localhost--2026_10_29_23_10_14.report.html](desktop/localhost--2026_10_29_23_10_14.report.html)
- `/nft/emerald-ape-042`: [localhost-nft_emerald_ape_042-2026_10_29_23_10_44.report.html](desktop/localhost-nft_emerald_ape_042-2026_10_29_23_10_44.report.html), [localhost-nft_emerald_ape_042-2026_10_29_23_11_12.report.html](desktop/localhost-nft_emerald_ape_042-2026_10_29_23_11_12.report.html), [localhost-nft_emerald_ape_042-2026_10_29_23_11_41.report.html](desktop/localhost-nft_emerald_ape_042-2026_10_29_23_11_41.report.html)

### Mobile com CPU 2x (referência complementar, ver análise)

| Página | Medições | Performance (≥ 90) | Accessibility (≥ 95) | Best Practices (≥ 95) | SEO (≥ 90) | LCP | CLS | TBT | FCP |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 3 | 69 ⚠ | 100 | 100 | 100 | 5,03 s | 0,000 | 228 ms | 3,44 s |
| `/nft/emerald-ape-042` | 3 | 65 ⚠ | 100 | 100 | 100 | 4,80 s | 0,000 | 350 ms | 3,44 s |

Relatórios (HTML, com o JSON ao lado):
- `/`: [localhost--2026_10_29_23_12_25.report.html](mobile-cpu2x/localhost--2026_10_29_23_12_25.report.html), [localhost--2026_10_29_23_12_55.report.html](mobile-cpu2x/localhost--2026_10_29_23_12_55.report.html), [localhost--2026_10_29_23_13_23.report.html](mobile-cpu2x/localhost--2026_10_29_23_13_23.report.html)
- `/nft/emerald-ape-042`: [localhost-nft_emerald_ape_042-2026_10_29_23_13_52.report.html](mobile-cpu2x/localhost-nft_emerald_ape_042-2026_10_29_23_13_52.report.html), [localhost-nft_emerald_ape_042-2026_10_29_23_14_21.report.html](mobile-cpu2x/localhost-nft_emerald_ape_042-2026_10_29_23_14_21.report.html), [localhost-nft_emerald_ape_042-2026_10_29_23_14_51.report.html](mobile-cpu2x/localhost-nft_emerald_ape_042-2026_10_29_23_14_51.report.html)

## Ambiente e condições

- Data: 29/10/2026, 20:05:58 (horário de Brasília)
- Lighthouse 12.6.1 via @lhci/cli; HeadlessChrome/156.0.0.0
- Node v22.23.4; Windows_NT 10.0.19045 (x64)
- CPU: Intel(R) Core(TM) i5-5200U CPU @ 2.20GHz (4 threads); RAM 8 GB; benchmarkIndex entre 659 e 1270 nas medições
- Mobile: mobile, 412×823, método simulate, RTT 150 ms, 1638 Kbps, CPU 4x
- Desktop: desktop, 1350×940, método simulate, RTT 40 ms, 10240 Kbps, CPU 1x
- Mobile com CPU 2x: mobile, 412×823, método simulate, RTT 150 ms, 1638 Kbps, CPU 2x
- Servidor: `vite preview` do build de produção (`pnpm build`), mocks ativos, cenário `padrao`, armazenamento limpo a cada medição

<!-- análise: texto abaixo é escrito à mão e preservado -->

## Análise

Desktop atinge todas as metas nas duas páginas. No mobile, Accessibility, Best Practices e SEO ficam em 100 e o CLS em zero, mas Performance fica em 52, abaixo da meta de 90. As causas abaixo foram medidas com perfil de CPU e com variações descartáveis do build, cada uma com 3 medições, antes de qualquer mudança.

### Resumo: por que a Performance mobile parece baixa

O 52 diz mais sobre a máquina em que a auditoria rodou do que sobre o site. O perfil mobile do Lighthouse não usa um celular de verdade: ele pega a CPU do computador e a deixa 4 vezes mais lenta. Esse multiplicador supõe um computador rápido, e esta máquina é um notebook de 2015 (Intel i5-5200U, 8 GB). O `benchmarkIndex`, a nota que o Lighthouse dá para a CPU antes de medir, ficou entre 659 e 1270, e o próprio Lighthouse registrou o aviso "The tested device appears to have a slower CPU than Lighthouse expects". Dividida por 4, essa CPU vira um celular bem mais lento do que o celular de referência do perfil, e é isso que derruba o TBT (786 a 904 ms) e, com ele, a nota.

Três medições do mesmo build mostram o peso da máquina:

| Onde e como | Performance mobile | TBT |
| --- | ---: | ---: |
| Esta máquina, perfil padrão (CPU 4x), medição oficial | 52 e 52 | 904 e 786 ms |
| Esta máquina, CPU 2x (calibração indicada pela documentação do Lighthouse para essa faixa de `benchmarkIndex`) | 69 e 65 | 228 e 350 ms |
| PageSpeed Insights, nas máquinas do Google, contra o deploy (29/10/2026) | 93 | n/d |

O WebPageTest, também contra o deploy, mediu 25 ms de TBT e 1,15 s de LCP.

Sobra uma parte que é da arquitetura da demonstração, e não do ambiente: a imagem que define o LCP vem da resposta de `/api/nfts`, e essa resposta só existe depois que o navegador baixa e registra o backend simulado (MSW, cerca de 64 KB comprimidos, mais o service worker). Num site com API real esse trecho sai do caminho crítico. Os detalhes estão nas seções seguintes.

### O que foi otimizado

Ponto de partida: build do commit f6497b6. Para a Início mobile, mediana de 3 medições. Para a Início desktop, 2 medições. Para o detalhe, a medição da Tarefa 18, com o mesmo build e nas mesmas condições.

| Página e perfil | Performance antes | Performance depois | LCP antes | LCP depois | TBT antes | TBT depois |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` mobile | 33 | 52 | 7,33 s | 5,03 s | 3.481 ms | 904 ms |
| `/` desktop | 68 a 71 | 97 | 3,08 a 3,32 s | 1,11 s | 132 a 144 ms | 40 ms |
| `/nft/emerald-ape-042` mobile | 34 | 52 | 6,7 s | 4,86 s | ~4.900 ms | 786 ms |
| `/nft/emerald-ape-042` desktop | 62 | 97 | 3,1 s | 1,08 s | 270 ms | 64 ms |

1. **Assets estáticos fora do MSW** (`public/mockWorker.js`). Depois de ativado, o `mockServiceWorker.js` manda para a página toda requisição, inclusive scripts, imagens e fontes. Na página, o MSW 2.15 testa os 43 handlers em sequência, e cada um lê e interpreta os cookies antes de comparar a URL. Na carga da Início eram 58 requisições, só 3 da API. Isso dava perto de 2 mil leituras de cookie só para liberar arquivos que nunca foram mockados. O perfil de CPU apontou `executeHandlers` e `getAllRequestCookies` como a maior parte do tempo do chunk do MSW. O seed dos 239 NFTs e a persistência no localStorage custavam menos de 50 ms. O worker novo registra um listener de `fetch` antes de importar o do MSW e encerra o evento para tudo que não é API, então o navegador busca direto na rede. O arquivo gerado pelo `msw init` fica intacto, e REST e tempo real continuam passando pelos mocks.
2. **Pré-carregamento dos chunks do App** (plugin `preloadAppChunks` em `vite.config.ts`). O App só pode ser importado depois de `worker.start()`, porque o socket.io-client captura o WebSocket no import. Isso deixava a cadeia em série: entrada, MSW, registro do worker, App e chunks da rota. Com `modulepreload`, os chunks do App são baixados e compilados enquanto o MSW sobe, mas nada é executado. A ordem de boot não muda.
3. **Lista pública de sufixos fora do bundle** (`src/mocks/lib/tldts-lite.ts`, via alias). Metade do chunk do MSW era o pacote `tldts`, que o tough-cookie do cookie store do MSW usa para casar domínios de cookies. O Kurio não usa cookies: a sessão vai por token no header. Por isso o pacote foi trocado por uma função de poucas linhas com a mesma assinatura. O chunk caiu de 177 KB para 64 KB comprimidos, e o LCP mobile caiu cerca de 0,5 s.

A suíte Playwright completa passou depois das três mudanças: 188 testes passaram e 12 foram pulados, o mesmo resultado de antes.

### Por que o mobile fica abaixo de 90

- **A CPU desta máquina está abaixo do que o perfil supõe.** O multiplicador padrão de 4x foi pensado para que um desktop rápido simule um celular intermediário. Aqui o `benchmarkIndex` ficou entre 659 e 1270, e a documentação do Lighthouse põe essa faixa entre "desktop de entrada" e "celular topo de linha". Em 3 das 6 medições mobile, o próprio Lighthouse registrou o aviso: "The tested device appears to have a slower CPU than Lighthouse expects. This can negatively affect your performance score". A tabela de calibração dessa documentação indica 2x para essa classe de máquina. A medição complementar com 2x está nos resultados acima: 69 e 65, com TBT de 228 e 350 ms. A medição oficial continua sendo a padrão, de 4x.
- **O `vite preview` serve por HTTP/1.1.** FCP (~3,5 s) e LCP (~5 s) quase não mudam entre 4x e 2x, então não vêm da CPU. A página baixa cerca de 330 KB de JavaScript em uns 30 arquivos antes do primeiro render, e o preview entrega as 60 requisições por HTTP/1.1. O modo `simulate` reproduz o limite de 6 conexões desse protocolo, e os scripts entram em fila. Para isolar essa causa, o mesmo Lighthouse, na mesma máquina e com o mesmo perfil mobile, rodou contra o deploy na Vercel (`https://kurio-nfts.vercel.app/`, 3 medições da Início). Lá, 58 de 61 requisições usam HTTP/2. O FCP caiu para 2,65 s, o LCP para 3,6 s e a Performance subiu para 57 a 62. O TBT continuou alto (1,1 a 1,5 s) por causa da CPU desta máquina.
- **O LCP depende da API mockada.** A imagem de maior área vem da resposta de `/api/nfts`, e essa resposta só existe depois do MSW ativo, do worker registrado (em toda medição, porque o armazenamento começa limpo) e do app montado.

Então a nota mobile local vem principalmente de duas causas do ambiente de medição, o HTTP/1.1 do preview e a CPU lenta, somadas ao backend simulado no caminho crítico do LCP, que é próprio da demonstração. Como referência externa, o PageSpeed Insights deu 93 de Performance no mobile para o deploy, em 29/10/2026, com 100 em Accessibility, Best Practices e SEO. A auditoria versionada continua sendo a local, porque é reproduzível com `pnpm lighthouse`.

### Testado e descartado

Cada ideia foi medida em build descartável, com 3 medições da Início mobile:

| Ideia | Resultado |
| --- | --- |
| Render inicial dentro de `startTransition`, para o React dividir o trabalho | TBT dentro da variação entre medições |
| Registrar o service worker já no HTML, em paralelo aos scripts | sem efeito mensurável |
| Renderizar o app antes de o MSW ativar, segurando REST e socket até ele ficar pronto (protótipo funcional, inclusive o tempo real) | FCP e LCP sem mudança, porque os mesmos bytes continuam antes do primeiro paint |
| Shell estático no HTML (logo dentro do `#root`) | FCP 0,3 s menor, dentro da variação |
| Pré-carregar também o chunk do MSW | LCP igual e FCP pior (3,97 para 4,30 s), porque o download disputa banda com a entrada |
| Esconder o painel de cenários (`?painel=0`) | sem efeito. Por isso a auditoria usa as URLs sem o parâmetro, com o painel carregado como na entrega |

Nenhuma funcionalidade foi removida para a auditoria: mocks, tempo real, painel de cenários, imagens e fontes são os da entrega.
