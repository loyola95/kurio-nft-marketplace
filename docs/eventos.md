# Eventos em tempo real (Socket.IO)

## Conexão

- URL: `VITE_REALTIME_URL` (padrão `wss://realtime.kurio.mock`). O cliente é o `socket.io-client`, só com WebSocket (`transports: ['websocket']`, sem long polling).
- Sessão: o token vai na query da conexão (`?token=`). Sem token, a conexão é de visitante e recebe só eventos públicos.
- Uma conexão por sessão. Login, logout ou troca de usuário fecham o socket anterior, com os listeners, e abrem outro. Assim nenhum evento da sessão anterior chega aos dados da seguinte (`src/realtime/RealtimeProvider.tsx`).
- Reconexão automática: espera de 500 ms a 4 s entre tentativas. Quando volta, o cliente revalida pela API REST o que está na tela, pois eventos podem ter se perdido durante a queda (ver "Reconciliação" no [ARCHITECTURE](../ARCHITECTURE.md)).

## Envelope

Todo evento tem o mesmo envelope (`src/contracts/events.ts`):

| Campo        | Tipo                             | Uso                                                                 |
| ------------ | -------------------------------- | ------------------------------------------------------------------- |
| `id`         | string (UUID)                    | identidade do evento; o cliente descarta duplicatas por esse id     |
| `type`       | `nft.updated` ou `order.updated` | nome do evento no Socket.IO                                         |
| `resource`   | `{ type, id }`                   | recurso afetado                                                     |
| `version`    | inteiro                          | versão do recurso depois da mudança, a mesma que a API REST devolve |
| `occurredAt` | ISO 8601                         | quando aconteceu                                                    |
| `userId`     | string ou `null`                 | dono do recurso; `null` em eventos públicos                         |
| `data`       | objeto                           | conteúdo do evento (abaixo)                                         |

## `nft.updated` (público)

Emitido quando o preço ou a disponibilidade de um NFT mudam: compra confirmada, painel de cenários ou cenários de checkout. Vai para todas as conexões.

```json
{
  "id": "4f0c…",
  "type": "nft.updated",
  "resource": { "type": "nft", "id": "emerald-ape-042" },
  "version": 7,
  "occurredAt": "2026-10-29T21:14:03.120Z",
  "userId": null,
  "data": {
    "nftId": "emerald-ape-042",
    "priceEth": "2.5",
    "available": 12,
    "editions": [
      {
        "editionId": "emerald-ape-042-1-50",
        "priceEth": "2.5",
        "available": 12,
        "status": "available"
      }
    ]
  }
}
```

No cliente, o evento atualiza o detalhe, as páginas do catálogo em cache, os relacionados e os destaques, sem refetch. O carrinho é revalidado pela API, pois preço, limite e avisos de cada linha são calculados lá. Se o NFT está no carrinho da pessoa, aparece um aviso visível e anunciado para leitores de tela.

## `order.updated` (privado)

Emitido quando um pedido muda de estado (`pending` para `confirmed` ou `declined`). Vai só para as conexões do dono do pedido. O cliente também descarta qualquer `order.updated` com `userId` diferente do usuário atual.

```json
{
  "id": "9a71…",
  "type": "order.updated",
  "resource": { "type": "order", "id": "ord-3" },
  "version": 2,
  "occurredAt": "2026-10-29T21:15:40.002Z",
  "userId": "u-ana",
  "data": { "orderId": "ord-3", "status": "confirmed", "declineReason": null }
}
```

O status muda na hora no cache. O recibo completo, com o hash da transação simulada, vem de `GET /orders/:id`. Um pedido em estado final (`confirmed` ou `declined`) nunca volta para `pending`.

## Regras de aplicação

`applyEvent` (`src/realtime/handlers.ts`) aplica cada evento de forma idempotente:

1. Payload inválido (falha no schema Zod): ignorado.
2. Duplicata (`id` já visto): ignorada. O conjunto de ids vistos é limitado a 500.
3. Pedido de outra conta: ignorado.
4. Versão antiga (`version` menor ou igual à última aplicada ou à que está no cache): ignorada. Isso cobre eventos fora de ordem e eventos que chegam depois de uma resposta REST mais nova.
5. Caso contrário: aplicado, e a versão do recurso passa a ser a do evento.

Os testes unitários de `src/realtime/handlers.test.ts` e o grupo 10 dos testes e2e cobrem duplicata, versão antiga, isolamento entre sessões e reconexão.

## Transporte no mock

Não existe servidor. O MSW intercepta o WebSocket com `ws.link` e fala o protocolo do Socket.IO pelo `@mswjs/socket.io-binding` (`src/mocks/realtime/server.ts`). Três detalhes vieram de um spike feito antes da implementação:

- O link aponta só para o host (`wss://realtime.kurio.mock`), pois o MSW remove `/socket.io/` do caminho antes de comparar.
- O `socket.io-client` precisa ser importado depois de `worker.start()`. O engine.io guarda a referência do `WebSocket` no import, e antes disso a interceptação ainda não existe. Por isso `main.tsx` inicia o MSW e só então importa o app.
- O binding anuncia o intervalo de ping, mas não envia ping. Sem isso, o cliente derruba a conexão por "ping timeout" a cada 30 s. O servidor simulado envia o pacote `2` a cada 10 s.

## Disparo manual

Pelo painel de cenários (seção "Evento nft.updated" e "Tempo real") ou pelos endpoints `/__mock/events/*` e `/__mock/realtime/drop` ([contratos REST](contratos-rest.md#controle-da-simulação-__mock)).
