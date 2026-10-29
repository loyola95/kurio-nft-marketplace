/* Service worker dos mocks: só as chamadas da API passam pelo MSW.
 *
 * O mockServiceWorker.js (gerado pelo `msw init`, mantido intacto) envia toda
 * requisição para a página, que percorre os handlers antes de liberar. Para
 * scripts, imagens e fontes isso é custo puro na thread principal. Este listener
 * roda antes do dele e, para o que não é API, interrompe o evento: o navegador
 * busca direto na rede. O WebSocket do tempo real não passa pelo evento fetch.
 */
const apiBase = new URL(self.location.href).searchParams.get('api') || '/api'

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  const isApi = url.origin === self.location.origin && url.pathname.startsWith(`${apiBase}/`)
  if (!isApi) event.stopImmediatePropagation()
})

importScripts('/mockServiceWorker.js')
