# Cafeteria

Personalização em `src/data/config.ts`: nome, descrição/SEO, texto institucional, endereço, complemento, referência, horário, telefone, WhatsApp, Instagram e URLs do Google Maps. Contatos vazios ficam pendentes. `logoUrl` está reservado para personalização futura; o nome textual permanece na interface. As fotos demonstrativas ficam em `images` no mesmo arquivo.

Por compatibilidade, foram mantidos o identificador do projeto Supabase e a chave de armazenamento do carrinho. São referências técnicas, sem exibição na interface. Segurança, autenticação e revalidação para copiar/enviar pedidos permanecem como antes.

React + TypeScript + Tailwind CSS 4 + Vite, com integração administrativa preparada para Supabase e sem pagamentos. A integração ainda depende de instalação do SDK, configuração e homologação; `/admin` permanece bloqueado sem esses requisitos.

## Executar

`npm install`, depois `npm run dev`. `npm run build` verifica os tipos e gera `dist/`. `npm run preview` serve a versão de produção.

`npm test` executa verificações públicas e administrativas locais com React e jsdom. Testes de Auth/MFA/RLS/Storage reais ainda exigem homologação. Em ambientes Windows restritos que impedem o bundling da configuração do Vite, use `npm run build:local`. Nesta sessão foi necessário definir `NODE_OPTIONS=--preserve-symlinks --preserve-symlinks-main` para execução do Node.

Para iniciar o servidor nessas mesmas condições, execute `node scripts/dev-local.mjs` após definir `NODE_OPTIONS`.

## Preparar a publicação

- `src/data/config.ts`: preencher WhatsApp oficial (DDI + DDD + número, somente dígitos) e URLs oficiais. Sem WhatsApp configurado, os botões explicam a pendência. Copiar/enviar pedidos exige catálogo integrado e revalidação bem-sucedida, inclusive na prévia local.
- `src/data/products.ts`: dados originais somente para prévia sem integração e importação manual. Com Supabase configurado, o banco é a fonte de verdade e não há fallback silencioso para esses dados. Preços e adicionais são persistidos em centavos e adaptados à interface existente.
- Fotografias externas do Unsplash são ilustrativas; substituir as URLs em `config.ts` e `products.ts` por fotos oficiais otimizadas. A coxinha e o pão de queijo usam referências visuais genéricas de alimentos, não fotos oficiais dos produtos.
- Revisar o texto institucional demonstrativo em `config.ts`, os metadados em `index.html`, atendimento e FAQ antes da publicação.
- Configure `mapsEmbedUrl` com a URL de incorporação do Google Maps e `mapsUrl` com a rota. Sem configuração, a seção exibe um estado neutro e não consulta endereços.
- O carrinho salva apenas itens e personalizações no navegador (`vitorino-cart-v1`). Nome e observações gerais não são persistidos. Não há analytics ou cookies de rastreamento próprios. Avaliar os serviços externos e a necessidade de aviso de privacidade na publicação.

## Organização

Dados e configurações em `src/data`, integração e validações em `src/lib`, painel em `src/admin`, migrações e Edge Function em `supabase`. Tipos em `src/types`, carrinho em `src/hooks/useCart.ts`, cálculos e mensagem de WhatsApp em `src/utils/order.ts`, componentes públicos em `src/components`.

## Administração e ativação

Consulte [configuração e manual](docs/ADMIN_SETUP.md), [arquitetura](docs/ARCHITECTURE.md), [segurança e recuperação](docs/SECURITY.md), [privacidade](docs/PRIVACY_NOTES.md) e [gates de implantação](docs/DEPLOY_CHECKLIST.md). Não há credenciais demonstrativas. O Owner é provisionado por operador autorizado e o MFA é obrigatório no backend. Os testes SQL entregues não foram executados nesta sessão.

Modais usam o elemento nativo `dialog`, com foco contido, Escape e restauração de foco. Quantidades vão de 1 a 99; diminuir de 1 remove o item. Personalizações diferentes geram linhas distintas. O envio ao WhatsApp apenas abre a conversa: é necessário enviar a mensagem e aguardar a confirmação.
