# Direção visual

Planejamento com a skill frontend-design: uma pausa local apresentada com composição editorial, sem linguagem de aplicativo de delivery. A fotografia e o título do hero concentram a expressão visual. Cardápio e carrinho ficam discretos e utilitários.

Tokens: espresso #171512; creme #F5F0E8; caramelo #D3A06B; branco quente #FFFCF7; cinza café #716A63. Verde #254E3D reservado ao WhatsApp. Cormorant Garamond em títulos e assinatura textual; DM Sans em leitura e controles. Títulos entre 38 e 98 px conforme contexto; corpo entre 12 e 16 px. Contêiner máximo de 1240 px. Espaços de seção entre 58 e 100 px.

Composição, com conteúdo alinhado à esquerda:

```text
Desktop
[ marca             navegação       pedido / bolsa ]
[ título e descrição       fotografia com arco     ]
[ ações                    legenda creme           ]
[ endereço              localização        horário ]
[ título favoritos                  link cardápio  ]
[ foto / produto ][ produto ][ produto ][ produto  ]
[ cardápio / busca / categorias                     ]
[ produto             ][ produto      ][ produto   ]
[ ambiente                    apresentação         ]
[ endereço e rota             localização pendente        ]
[ dúvidas                     acordeões            ]
[ rodapé                                            ]

Mobile
[ marca                       bolsa / menu ]
[ título, texto, ações                    ]
[ fotografia horizontal                   ]
[ informações compactas                   ]
[ favoritos em duas colunas               ]
[ busca / categorias com rolagem          ]
[ foto | nome, descrição, preço, adicionar]
[ ambiente / sobre / endereço / dúvidas   ]
[ resumo fixo do pedido, quando houver    ]
```

Revisão contra o briefing: a paleta creme com serifada foi explicitamente solicitada. Para evitar repetição de um template, a expressão fica no recorte arqueado da fotografia, no título de três linhas e na legenda deslocada. Foram evitados selos promocionais, avaliações, numerações decorativas e grids de cartões nas seções institucionais. A localização é um painel tipográfico identificado como consulta por endereço, sem mapa fictício.

Movimento restrito a feedback de interação, hover e navegação suave, respeitando movimento reduzido. Dialog nativo contém o foco, fecha com Escape e devolve o foco ao acionador. Formulários usam labels, opções obrigatórias nativas e mensagens de feedback. Dados pendentes ficam próximos à ação afetada.
