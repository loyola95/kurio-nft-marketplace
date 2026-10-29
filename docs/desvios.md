# Desvios e ajustes em relação ao Figma

Registro acumulado durante a implementação. Consolidado no ARCHITECTURE.md.

| Tela                                                        | Figma                                | Implementação                                                                   | Motivo                                                                          |
| ----------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Formulários (login, cadastro, perfil, carteiras, pagamento) | Campos só com placeholder, sem label | Label associado ao campo, visualmente oculto; placeholder igual ao Figma        | README §8: labels e mensagens de erro associadas aos campos                     |
| Ícones                                                      | Set Iconly do arquivo                | SVGs exportados do próprio arquivo via API do Figma                             | Fidelidade; nenhum ícone substituído                                            |
| Imagens dos NFTs                                            | 4 artes reutilizadas                 | As mesmas 4 artes, exportadas em WebP 320/640/960                               | Performance; o arquivo só tem 4 imagens, então o catálogo simulado as reutiliza |
| Contraste                                                   | Paleta do arquivo                    | Paleta mantida; todas as combinações texto/fundo passam AA (menor razão 5,22:1) | Verificado, nenhum ajuste necessário                                            |
