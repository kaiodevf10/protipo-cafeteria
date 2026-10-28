# Configuração e uso da administração

## Estado desta entrega

Código, migrações e testes preparados; **não ativado em produção**. Nenhum projeto remoto foi criado, nenhuma migração remota foi executada e nenhuma conta foi provisionada. O ambiente bloqueou o npm com EACCES; o SDK oficial ainda não está instalado. Docker/PostgreSQL e navegador de teste não estavam disponíveis. Não considere a passagem dos testes locais uma validação de RLS, MFA ou Storage.

## Ambiente e dependência oficial

1. Em máquina autorizada, use Node.js 22 ou superior. O SDK oficial consultado foi `@supabase/supabase-js@2.118.0`, que exige Node >=22.
2. Execute `node scripts/install-supabase.mjs`. Isso instala a versão oficial com versão exata e atualiza package.json/package-lock.json. Revise e versione ambos. Não copie arquivos de SDK de fontes desconhecidas. O carregador Vite detecta o pacote instalado; sem ele, falha fechado. Builds com configuração integrada mas sem SDK são rejeitados.
3. Rode `npm ci`, `npm audit` e revise avisos e advisories antes da publicação. A auditoria completa de dependências não pôde ser executada neste ambiente. Não use `npm audit fix --force` sem revisão.
4. Copie `.env.example` para `.env.local`. Preencha somente URL do projeto, **publishable key** e origem pública exata (ex.: a origem HTTPS efetivamente contratada, sem paths, query ou fragment). Nenhuma credencial real acompanha o projeto. Chaves secret/service_role ficam exclusivamente no ambiente server-side da Edge Function.
5. Com configuração ausente, `/admin` permanece bloqueado e o site mostra sua prévia original. Copiar/enviar pedidos exige consulta à fonte oficial e fica bloqueado sem ela. Não publique essa prévia como operação comercial confirmada. Não há fallback estático quando uma integração configurada falha.

## Supabase, Auth e autorização

1. Use um projeto autorizado e uma região aprovada pelo estabelecimento. Confirme contrato, DPA, subprocessadores e transferências com os responsáveis.
2. Em homologação, revise e aplique `supabase/migrations/202610230001_admin.sql`. Ela cria novas tabelas; não é idempotente e falha se houver objetos homônimos. Não a execute sobre estrutura existente sem revisão. `private` **não pode constar em Exposed schemas**. Não exponha `auth` ou `storage` por configuração adicional.
3. Desative cadastro público, sign-in anônimo e provedores não utilizados. `supabase/config.toml` configura o ambiente local; isso NÃO altera automaticamente as configurações do projeto hospedado.
4. Habilite TOTP, confirmação de e-mail e troca segura de senha. Configure senha mínima de 12 caracteres, proteção contra senhas vazadas quando disponível no plano, timeouts e limites de sessões apropriados. Teste expiração e revogação. Mantenha limites de tentativas do Auth e monitore abuso. Avalie CAPTCHA com integração oficial antes de habilitá-lo no provedor; a interface entregue não coleta captchaToken, portanto CAPTCHA obrigatório ainda exige essa integração e testes.
5. Configure SMTP transacional real e URLs exatas permitidas: origem HTTPS de produção como Site URL e `https://DOMÍNIO-REAL/admin/conta` como redirect de recuperação. Substitua pelo domínio real, sem curingas amplos. Só depois de testar entrega e recuperação, configure `VITE_ADMIN_PASSWORD_RECOVERY=true`. Destinos fornecidos por query string não são aceitos.

### Primeiro Owner e convites

Um operador autorizado cria/convida a conta por **Dashboard Auth / administração confiável**, nunca pelo site público. O usuário aceita o convite, confirma o e-mail e define a senha pelos fluxos oficiais. Verifique a identidade e obtenha o UUID real no Auth. Em sessão SQL privilegiada autorizada, execute uma inserção parametrizada equivalente a:

```sql
insert into public.admin_members(user_id, role, is_active)
values (:uuid_confirmado_do_auth, 'owner', true);
```

`:uuid_confirmado_do_auth` é um parâmetro do operador, não uma credencial ou conta existente. Não há valores de acesso demonstrativos. Staff é provisionado pelo mesmo procedimento com papel `staff`. Nunca use user_metadata para definir papéis, não conceda escrita em admin_members e não crie endpoints de cadastro de administradores.

### MFA e recuperação

No primeiro login válido, apenas a tela de segundo fator é exibida. Cadastre o QR no aplicativo e verifique os seis dígitos. Somente AAL2 libera catálogo administrativo. Owner pode adicionar outro autenticador em Minha conta. Tokens, QR e segredo ficam somente em memória; não são gravados pela aplicação em localStorage. Recarregar a página administrativa exige novo login.

Na perda do autenticador, um operador verifica a identidade fora do site, desativa temporariamente `admin_members.is_active`, encerra sessões pelo provedor, remove fatores perdidos pelo Auth Admin e conduz nova autenticação/enrollment. Reative a associação somente após identidade e conta terem sido verificadas. Não forneça códigos mestres. Recuperação de senha não dispensa MFA ou associação ativa. Teste o fluxo de convite/recovery na versão efetiva do Auth antes de ativar.

## Importação do cardápio

`node scripts/export-menu.mjs` gera `supabase/seed-menu.sql`, preservando nove IDs, seis categorias, preços, adicionais, imagens, disponibilidade e ordem originais. É um arquivo **manual e revisável**, separado das migrations. Não é executado no startup. Os INSERTs não substituem registros existentes. Faça backup e confira conflitos de slug, IDs, referências e totais em homologação. Não aplique dados de prévia automaticamente sobre um catálogo real.

Personalizações são armazenadas em JSON validado com `price_cents`; o editor preserva as existentes e produtos novos começam sem opções. Não há editor de regras de personalização nesta etapa. Alterações estruturais futuras exigem migração revisada e teste do carrinho.

## Storage

A migration cria apenas o bucket público `menu-images` para fotos de cardápio. Não armazene documentos ou fotos pessoais nele. Não crie policies de escrita direta para authenticated/anon. A leitura pública de fotos é intencional, inclusive de uma foto antes usada por produto ocultado; ocultar produto não torna a foto secreta.

Implante `supabase/functions/menu-image` no projeto autorizado. Configure **no servidor** `ADMIN_ALLOWED_ORIGIN` com a origem exata do painel. Só após testes de autorização e arquivos em homologação, defina `MENU_IMAGE_UPLOADS_ENABLED=true`; por padrão o upload fica desabilitado. As variáveis SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY são usadas somente no runtime da função. O handler valida Auth, papel atual e AAL2 mesmo com `verify_jwt=false`. Não remova essa validação. A função fica indisponível se a origem ou a liberação operacional não estiver configurada.

Upload aceita raster JPEG/PNG/WebP até 5 MB, decodifica/regrava no navegador para remover metadados e valida assinaturas/estrutura e limites no servidor. SVG, animação WebP e metadados identificados são rejeitados. Isso não é uma garantia de ausência de todo conteúdo malicioso ou sensível; faça testes com arquivos corrompidos/adversariais antes da liberação. Nomes são UUIDs, sem sobrescrita. Uma foto enviada só altera o cardápio após salvar o produto. Objetos órfãos/retenção de fotos antigas devem ser limpos por manutenção privilegiada, conferindo referências; não há exclusão em massa pelo painel.

## Uso diário

- Acesse diretamente `/admin/login`; não há link na navegação pública.
- Owner usa Produtos → Novo produto/Editar, seleciona categoria, informa preço, envia foto e salva. Desmarque Publicado para ocultar sem excluir. Indisponível mantém o produto público com botão desabilitado.
- Owner e Staff usam o switch de disponibilidade; o estado só é confirmado depois da persistência e releitura. Conflitos de edição pedem atualização.
- Categorias permite criar, renomear, ordenar e desativar. A desativação oculta os produtos relacionados do site público. Não há exclusão destrutiva.
- Atividades é exclusivo de Owner, com os 200 registros mais recentes. Exportações completas são procedimentos privilegiados, não downloads públicos.
- Staff não possui editor de preços/categorias e a API também bloqueia essas operações. Alterações de papel e ativação só ocorrem no procedimento administrativo privilegiado.
- O público revalida a cada 30 segundos, ao focar a página e novamente ao copiar/enviar pedido. Não há reserva de estoque ou tabela de clientes/pedidos. O WhatsApp permanece sujeito à confirmação da cafeteria; o contato oficial deve ser configurado no ponto já existente do projeto.

## Execução e implantação

`npm run dev`, `npm run build`, `node scripts/verify-admin.mjs`. No sandbox Windows desta entrega, os comandos diretos exigiram `node --preserve-symlinks --preserve-symlinks-main ...`; o build alternativo é `scripts/build-local.mjs`. Isso não substitui um build limpo após instalar o SDK.

`public/_headers` e `_redirects` são exemplos aplicáveis a hosts compatíveis (Netlify/Cloudflare Pages). Outro host precisa configurar regras equivalentes. Verifique o deep link `/admin/produtos`, HTTPS, CSP, headers no documento real e ausência de cache nas rotas admin. Adapte CSP para domínio próprio do Supabase se utilizado; não libere unsafe-inline/unsafe-eval para contornar erros. Consulte DEPLOY_CHECKLIST e SECURITY.

Referências: [SDK](https://github.com/supabase/supabase-js), [TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp), [senhas/recovery](https://supabase.com/docs/guides/auth/passwords), [redirects](https://supabase.com/docs/guides/auth/redirect-urls), [limites](https://supabase.com/docs/guides/auth/rate-limits), [Storage](https://supabase.com/docs/guides/storage/uploads/file-limits).
