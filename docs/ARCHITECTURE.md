# Arquitetura administrativa

Planejamento antes da implementação, 23/10/2026

O projeto atual guarda nove produtos e seis categorias em TypeScript. IDs de produtos são usados pelo carrinho local; preços e adicionais são números em reais. Preservaremos esses IDs na importação. O banco usará centavos inteiros para preço base e adicionais; o adaptador converte para a interface existente. Cálculos serão somados em centavos.

## Fronteiras de confiança

- Supabase Auth valida identidade e e-mail; MFA TOTP é obrigatório para ler dados administrativos e escrever. A sessão administrativa fica em memória, sem persistir tokens ou senhas no armazenamento do navegador. Recarregar exige novo login.
- `admin_members` é administrado apenas por operador privilegiado fora da interface. Um RPC mínimo identifica a própria associação ativa em AAL1 para permitir configuração do MFA, sem retornar catálogo administrativo ou outras contas.
- RLS limita leituras públicas a produtos publicados em categorias ativas. Leituras administrativas exigem associação ativa e AAL2.
- Owner altera produtos/categorias por RLS. Staff não recebe UPDATE de linhas: RPC delega exclusivamente a alteração de disponibilidade, com verificação atual de papel, conta, e-mail, sessão e AAL2 no banco.
- Funções privilegiadas ficam em schema não exposto e com search_path vazio. A API expõe somente wrappers SECURITY INVOKER mínimos. Não há endpoint para atribuir papéis.
- Auditoria é escrita por trigger no banco; ninguém via API pode editar ou remover registros.
- Imagens: bucket público somente para fotos de cardápio, sem escrita direta. Edge Function valida identidade, AAL2, Owner ativo e bytes reais antes do upload usando credencial exclusivamente server-side. Se não implantada, upload falha fechado.
- Catálogo público vem apenas do banco em modo integrado; falhas não fazem fallback silencioso para dados estáticos. Sem configuração, o site existente permanece uma prévia local; nenhuma operação administrativa ou finalização verificada será liberada.
- Antes de copiar/enviar pedido: recarregar catálogo, validar publicação/disponibilidade/opções e comparar preços com o snapshot aceito pelo cliente. Alterações exigem revisão explícita; falha de conexão bloqueia conclusão. Nenhum pedido ou dado de cliente será armazenado no Supabase.

## Ativação e limites

Não foi identificado projeto Supabase configurado. As migrações não serão executadas remotamente, nem contas provisionadas sem ambiente autorizado. Testes de políticas em PostgreSQL/Supabase e testes de navegador são gates obrigatórios antes da produção, não substituíveis por inspeção de SQL. Cadastro público, provedores não usados e sign-in anônimo devem ser desativados no Supabase. MFA, SMTP, redirecionamentos exatos, HTTPS, limites de autenticação, backups e retenção dependem de configuração e validação operacional.

Referências oficiais: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [MFA TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp), [redirects](https://supabase.com/docs/guides/auth/redirect-urls), [Storage](https://supabase.com/docs/guides/storage/uploads/file-limits).
