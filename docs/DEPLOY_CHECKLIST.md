# Gates de publicação

**Estado atual: NÃO LIBERADO para produção administrativa.** Não há SDK instalado, Supabase configurado, contas provisionadas, execução de SQL/RLS ou revisão visual real nesta sessão. Não confundir build da estrutura desativada com validação da integração.

- [ ] Autorização do estabelecimento para projeto/região/plano e operadores
- [ ] Node >=22; instalar SDK oficial pelo script, revisar/versionar lockfile e fazer instalação limpa
- [ ] Rodar npm audit e revisar dependências reais; sem segredo no bundle/source maps
- [ ] URL + publishable key corretas; .env fora do Git; nenhum service_role/sb_secret no frontend
- [ ] Backup antes de migração; validar migration em projeto isolado sem conflitos de schema
- [ ] RLS/grants revisados; private fora de Exposed schemas; sem policies amplas ou escrita em admin_members
- [ ] Executar `psql "$CONEXAO_DE_HOMOLOGACAO" -v ON_ERROR_STOP=1 -f supabase/tests/authorization.sql` em ambiente isolado; não passar segredos em históricos/logs compartilhados
- [ ] Testar anon, usuário sem associação, Staff/Owner AAL1/AAL2, conta desativada, e-mail não confirmado, sessão revogada/expirada, metadata forjada e requisições diretas
- [ ] Conferir que Staff não altera preço/publicação/categoria/imagem nem lê audit_logs; Owner não adultera logs ou se atribui papéis
- [ ] Cadastro público/anônimo desativado; SMTP, confirmação de e-mail, redirects exatos, senhas, limites e timeouts configurados no projeto hospedado
- [ ] Provisionar Owner real; testar convite, senha, enrollment TOTP, challenge, logout e recuperação sem bypass
- [ ] Testar Auth error/offline e revogação durante operações; dados não reaparecem após logout
- [ ] Revisar seed manual; importar sem sobrescrever catálogo real; verificar IDs, categorias, imagens, centavos, opções e disponibilidade
- [ ] Implantar Edge Function e definir origem exata; verificar segredo somente server-side
- [ ] Upload anônimo/Staff/AAL1 negado; JPEG/PNG/WebP reais aceitos, MIME forjado/SVG/PDF/polyglot/corrompido/arquivo grande rejeitados; validar codecs/limites na versão implantada
- [ ] Confirmar ausência de escrita direta no bucket; sem sobrescrita; foto inexistente rejeitada ao salvar; nenhuma foto/documento privado publicado
- [ ] Testar criar/editar/ocultar, categorias inativas, concorrência updated_at e falhas sem confirmação falsa
- [ ] Confirmar auditoria para cada edição com ator do JWT, sem senhas/tokens; revisar trilhas do Auth separadamente
- [ ] Testar atualização entre duas abas/dispositivos, busca, filtros, carrinho, quantidades, personalizações, preços e WhatsApp
- [ ] Alterar preço/disponibilidade/opções/publicação entre adicionar e finalizar; comprovar revisão/bloqueio; cortar rede durante a consulta e impedir cópia/envio normal
- [ ] Testar 320, 375, 390, 428, 768, 1024, 1440 e 1920 px, orientações e teclado em navegador real, incluindo modal, MFA, upload e sidebar
- [ ] TypeScript, build com SDK instalado e testes locais passando; teste RLS/Edge/Auth remoto passando
- [ ] Domínio e HTTPS; CSP/headers efetivos no host; /admin e deep links sem cache e sem indexação; sem liberar unsafe-inline/unsafe-eval
- [ ] Backup/PITR ou alternativa confirmada no plano; cópia de Storage/config e restauração isolada testada; definir RPO/RTO
- [ ] Aprovar retenção de logs/fotos/backups, aviso de privacidade, bases legais, contratos, região e transferências com responsáveis reais
- [ ] Designar responsáveis e contatos de incidentes; revisar orientações e obrigações ANPD; não há comunicação automática

## Evidência disponível nesta sessão

Os testes locais cobrem a interface pública preservada, cálculos em centavos, parsing/validações, detecção de alterações no carrinho, bloqueio sem integração, algumas rejeições de arquivos e gate administrativo sem confiar em localStorage. Os testes SQL são entregues para execução, **não executados aqui**. Os cenários de autenticação real, RLS, upload em Storage, persistência remota, alteração simultânea entre dispositivos e responsividade visual ainda não têm evidência de execução.
