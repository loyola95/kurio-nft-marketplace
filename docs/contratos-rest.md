# Contratos REST

A API simulada responde em `VITE_API_BASE_URL` (padrão `/api`). Os tipos de entrada e saída são schemas Zod em `src/contracts/`, usados pelo cliente e pela camada de mocks. Mudar um contrato quebra os dois lados na verificação de tipos.

## Convenções

- Valores em ETH trafegam como string decimal (`"1.19"`). Toda conta usa `big.js`, sem `number`.
- Quantidades são inteiras.
- Datas seguem ISO 8601.
- Autenticação: header `Authorization: Bearer <token>`. Sem token, o carrinho do visitante é identificado pelo header `X-Cart-Id` (UUID gerado no navegador).
- Timeout do cliente: 8 s (`VITE_HTTP_TIMEOUT_MS`).
- Versão: recursos que mudam por evento (NFT, carrinho, pedido) carregam `version`. O cliente usa esse número para descartar eventos antigos (ver [eventos](eventos.md)).

### Formato de erro

Toda falha responde com `ApiErrorBody`:

```json
{
  "error": {
    "code": "AVAILABILITY_CONFLICT",
    "message": "Só restam 2 unidades desta edição.",
    "fieldErrors": { "quantity": "Máximo de 2" },
    "details": {}
  }
}
```

| Status   | Códigos                                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| 400      | `VALIDATION_ERROR` (com `fieldErrors`)                                                                                 |
| 401      | `UNAUTHENTICATED`, `SESSION_EXPIRED`, `INVALID_CREDENTIALS`                                                            |
| 403      | `FORBIDDEN`, `WALLET_REJECTED`                                                                                         |
| 404      | `NOT_FOUND`                                                                                                            |
| 409      | `EMAIL_TAKEN`, `USERNAME_TAKEN`, `AVAILABILITY_CONFLICT`, `QUOTE_STALE`, `IDEMPOTENCY_CONFLICT`, `WALLET_DISCONNECTED` |
| 422      | `VALIDATION_ERROR` (checkout e perfil), `COUPON_INVALID`, `COUPON_EXPIRED`, `INVALID_PASSWORD`, `NETWORK_MISMATCH`     |
| 500, 503 | `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`                                                                                |

Falha de rede, timeout, 500 e 503 são consideradas transitórias e podem ser repetidas em leituras. O resto não se repete.

## Catálogo

| Método | Rota                | Acesso  | Entrada              | Resposta                                         |
| ------ | ------------------- | ------- | -------------------- | ------------------------------------------------ |
| GET    | `/nfts`             | público | query `CatalogQuery` | `CatalogPage`                                    |
| GET    | `/nfts/featured`    | público |                      | `Featured` (destaques do topo e NFT em destaque) |
| GET    | `/nfts/:id`         | público |                      | `NftDetail` (edições, avaliações, galeria)       |
| GET    | `/nfts/:id/related` | público |                      | `RelatedNfts` (mesma coleção)                    |

`CatalogQuery`: `q`, `categories[]`, `networks[]`, `priceMin`, `priceMax`, `tab` (`todos`, `lancamentos`, `em-alta`), `sort` (`recentes`, `menor-preco`, `maior-preco`, `nome`), `page` e `pageSize` (padrão 9, máximo 48). `CatalogPage` traz os itens, a paginação e as contagens por categoria e rede para os filtros.

## Autenticação

| Método | Rota             | Acesso  | Entrada         | Resposta                                  |
| ------ | ---------------- | ------- | --------------- | ----------------------------------------- |
| POST   | `/auth/register` | público | `RegisterInput` | `AuthResponse` (201)                      |
| POST   | `/auth/login`    | público | `LoginInput`    | `AuthResponse`                            |
| GET    | `/auth/session`  | token   |                 | `SessionResponse` (401 se o token venceu) |
| POST   | `/auth/logout`   | token   |                 | 204                                       |

`AuthResponse` = `{ user, session: { token, expiresAt } }`. A sessão dura 2 horas (60 s no cenário `sessao-expirada`). A senha nunca é devolvida nem guardada no navegador.

## Carrinho

O carrinho mora na API. O da conta é encontrado pelo token, e o do visitante pelo `X-Cart-Id`.

| Método | Rota                    | Acesso             | Entrada                          | Resposta          |
| ------ | ----------------------- | ------------------ | -------------------------------- | ----------------- |
| GET    | `/cart`                 | visitante ou conta |                                  | `Cart`            |
| POST   | `/cart/items`           | visitante ou conta | `AddCartItemInput`               | `Cart`            |
| PATCH  | `/cart/items/:itemId`   | visitante ou conta | `UpdateCartItemInput`            | `Cart`            |
| DELETE | `/cart/items/:itemId`   | visitante ou conta |                                  | `Cart`            |
| PUT    | `/cart/coupon`          | visitante ou conta | `ApplyCouponInput`               | `Cart`            |
| DELETE | `/cart/coupon`          | visitante ou conta |                                  | `Cart`            |
| POST   | `/cart/notices/dismiss` | visitante ou conta |                                  | `Cart` sem avisos |
| POST   | `/cart/merge`           | token              | `MergeCartInput` (`guestCartId`) | `Cart` da conta   |

Cada resposta traz o carrinho inteiro já recalculado: preço atual de cada linha, `maxQuantity`, `status` da linha (`ok`, `price_changed`, `quantity_reduced`, `sold_out`), avisos (`notices`) e o resumo (subtotal, desconto, taxa da rede e total). Pedir mais que o disponível devolve 409 `AVAILABILITY_CONFLICT`, com o máximo na mensagem.

Cupons de teste: `KURIO10` (10%), `GENESIS` (0.05 ETH fixo) e `VERAO2025` (expirado).

## Conta

| Método | Rota                   | Acesso | Entrada                            | Resposta                                  |
| ------ | ---------------------- | ------ | ---------------------------------- | ----------------------------------------- |
| GET    | `/me/profile`          | token  |                                    | `Profile`                                 |
| PATCH  | `/me/profile`          | token  | `UpdateProfileInput`               | `Profile`                                 |
| PUT    | `/me/avatar`           | token  | imagem PNG, JPEG ou WebP, até 1 MB | `AvatarResponse` (`avatarUrl`)            |
| DELETE | `/me/avatar`           | token  |                                    | 204                                       |
| POST   | `/me/password`         | token  | `ChangePasswordInput`              | 204                                       |
| GET    | `/me/favorites`        | token  |                                    | `Favorites`                               |
| PUT    | `/me/favorites/:nftId` | token  |                                    | 204                                       |
| DELETE | `/me/favorites/:nftId` | token  |                                    | 204                                       |
| GET    | `/me/wallets`          | token  |                                    | `Wallets` (carteiras Principal e Reserva) |
| POST   | `/me/wallets`          | token  | `WalletInput`                      | `Wallet` (201)                            |
| PUT    | `/me/wallets/:id`      | token  | `WalletInput`                      | `Wallet`                                  |

O endereço da carteira é validado conforme a rede: EVM (`0x` + 40 hexadecimais) para Ethereum e Polygon, base58 para Solana.

## Checkout e pedidos

| Método | Rota                      | Acesso                          | Entrada                                | Resposta                                 |
| ------ | ------------------------- | ------------------------------- | -------------------------------------- | ---------------------------------------- |
| POST   | `/wallet-connections`     | token                           | `ConnectWalletInput` (carteira e rede) | `WalletConnection` (201)                 |
| DELETE | `/wallet-connections/:id` | token                           |                                        | 204                                      |
| POST   | `/quotes`                 | token                           | `CreateQuoteInput`                     | `Quote` (201)                            |
| POST   | `/orders`                 | token, header `Idempotency-Key` | `CreateOrderInput`                     | `Order` (202, `pending`; 200 em reenvio) |
| GET    | `/orders`                 | token                           | query `status` opcional                | `Orders`                                 |
| GET    | `/orders/:id`             | token                           |                                        | `Order` (403 se for de outra conta)      |

- Cotação (`Quote`): congela linhas, taxa da rede e total por 5 minutos (`expiresAt`) e tem `version`. O pedido referencia a cotação. Antes de criar o pedido, a API revalida a cotação contra preço, estoque, cupom e taxa atuais. Se ela venceu ou algo mudou, `POST /orders` responde 409 `QUOTE_STALE` com a cotação nova em `details.quote`, e o cliente pede uma nova confirmação.
- Idempotência: o header é obrigatório. Reenviar o mesmo `Idempotency-Key` devolve o mesmo pedido (200), sem criar outro. Isso cobre clique repetido, timeout e refresh. A mesma chave com outro corpo responde 409 `IDEMPOTENCY_CONFLICT`.
- Estados do pedido: `pending`, depois `confirmed` ou `declined` (com `declineReason`). A mudança chega pelo evento `order.updated`. O recibo (`Receipt`, com hash da transação simulada) vem de `GET /orders/:id`.

## Controle da simulação (`/__mock/*`)

Existem só com os mocks ativos. São usados pelo painel de cenários e pelos testes. Não fazem parte do contrato do produto.

| Método | Rota                            | Efeito                                                  |
| ------ | ------------------------------- | ------------------------------------------------------- |
| GET    | `/__mock/state`                 | cenário atual, sessões, pedidos, conexões em tempo real |
| POST   | `/__mock/scenario`              | troca o cenário (`{ name }`)                            |
| POST   | `/__mock/reset`                 | restaura o banco simulado ao estado inicial             |
| POST   | `/__mock/session/expire`        | expira todas as sessões                                 |
| POST   | `/__mock/wallet/disconnect`     | desconecta a carteira conectada                         |
| POST   | `/__mock/orders/hold`           | segura (ou libera) pedidos em `pending`                 |
| POST   | `/__mock/events/nft-updated`    | altera preço ou disponibilidade e emite `nft.updated`   |
| POST   | `/__mock/events/duplicate-last` | reenvia o último evento com o mesmo `id`                |
| POST   | `/__mock/events/stale`          | envia um evento com versão antiga                       |
| POST   | `/__mock/realtime/drop`         | derruba as conexões Socket.IO                           |
