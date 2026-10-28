# Segurança, operação e recuperação

## Controles implementados no código

Supabase é a autoridade de identidade; não há cadastro público, contas demonstrativas ou senhas fixas na aplicação. O SDK oficial é obrigatório para ativação. Sessão administrativa não persiste no navegador. LocalStorage continua sendo usado somente pelo carrinho existente e seu snapshot de revisão, nunca como fonte de autorização ou disponibilidade.

Políticas de products/categories exigem Owner ativo, e-mail confirmado, sessão presente/não expirada no Auth, fator verificado e JWT AAL2 para escrita. Staff só escreve disponibilidade pelo RPC, que não recebe actor/role/price e valida novamente essas condições. Owner e Staff leem dados administrativos sob as mesmas condições. Produtos publicados e categorias ativas são públicos por finalidade. RLS não é substituído por esconder botões. Nenhum browser user pode editar admin_members, audit_logs ou apagar produtos/categorias.

SECURITY DEFINER fica em `private`, não exposto no PostgREST; wrappers públicos são SECURITY INVOKER. Search_path é vazio e relações são qualificadas. EXECUTE padrão público é revogado. Não conceda novos grants para contornar falhas. Edições usam updated_at para detectar concorrência. Triggers registram usuário via auth.uid(), alteração antes/depois e instante do banco, sem aceitar identidade fornecida pelo cliente.

O Storage não concede escrita ao navegador. A Edge Function exige Auth real + contexto Owner/AAL2, limita corpo/arquivo e valida os bytes. Credenciais privilegiadas permanecem no servidor. Frontend renderiza textos pelo React, sem HTML arbitrário. URLs de fotos são limitadas às fotos importadas Unsplash e paths seguros do bucket. CSP/HTTPS/headers precisam ser efetivamente aplicados pelo host.

Auth usa bearer token em memória e requisições autenticadas pelo SDK, não cookies de sessão enviados automaticamente; por isso a API do painel não depende de um token CSRF caseiro. CORS/origem da função não substituem autenticação. XSS continua uma ameaça importante: revise código, CSP e dependências. Não registrar JWTs, senhas, códigos TOTP ou respostas brutas de Auth em logs.

## Revogação de acesso

Em procedimento privilegiado, identifique o UUID correto e altere `admin_members.is_active=false`. Isso bloqueia operações administrativas no banco em novas requisições, mesmo com JWT ainda válido. Use Auth Admin/Dashboard para bloquear conta e revogar sessões conforme suporte do projeto. Verifique que a linha auth.sessions é encerrada e teste com o JWT anterior. A UI revalida ao foco/a cada 30s; não é ela que impede a escrita. Fechar/recarregar o painel limpa a sessão em memória, mas não substitui revogação server-side de uma conta comprometida.

Logout solicita signOut global. Se a conexão falhar, a página é recarregada para eliminar a memória local; a revogação remota não é garantida e deve ser realizada pelo operador. Não prometa invalidação automática de toda cópia de JWT: valide comportamento da versão real do Auth e as verificações de sessão da migration.

## Backup e restauração

Antes da produção, confirmar plano contratado, disponibilidade de backups/PITR, região, retenção e quem pode restaurar. Nenhum backup automático é presumido nesta entrega. Definir RPO/RTO com o estabelecimento, testar restauração em ambiente isolado e registrar duração/resultado.

Se o plano não atender, um operador autorizado agenda exportações PostgreSQL cifradas e protegidas fora do diretório público, usando conexão/segredos de um cofre. Exportar também bucket de fotos e configuração de Auth/redirects/CSP; dump do banco sozinho não contém os bytes dos objetos. Restringir acesso, separar chaves das cópias e testar recuperação conjunta banco + Storage. Não versionar dumps nem executar exportações pelo browser. Pastas backups e .env são ignoradas pelo Git.

Durante indisponibilidade do Supabase, a integração configurada limpa o catálogo e exibe falha/repetição; finalizar pedido fica bloqueado. Snapshots do carrinho servem para revisão, não confirmação de preço. Não habilitar fallback silencioso para o cardápio de prévia. Ao restaurar, conferir relações, RLS, papéis e objetos de fotos antes de reabrir o serviço.

## Incidentes

1. Acionar os responsáveis designados pelo estabelecimento e registrar a linha do tempo, com acesso restrito.
2. Desativar associações comprometidas, bloquear contas e encerrar sessões pelo Auth. Conter uploads e alterações se necessário.
3. Revogar/rotacionar segredos server-side, chaves comprometidas e credenciais de operadores no provedor. Atualizar secrets das funções e conferir que nenhuma chave privada foi publicada. Chave publishable não é credencial de autorização; revisar RLS e logs, não apenas rotacioná-la.
4. Preservar evidências necessárias e consultar audit_logs, Auth logs e logs da infraestrutura, sem copiar tokens ou dados pessoais indiscriminadamente. Auditoria de conteúdo não substitui logs de autenticação.
5. Investigar alterações, restaurar de cópias verificadas em homologação e validar os acessos permitidos/proibidos antes de liberar.
6. O controlador avalia risco/dano relevante e comunicações à ANPD/titulares, com assessoria adequada. Não existe comunicação automática na aplicação.

Consultar o [canal oficial de incidentes da ANPD](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis) e a Resolução CD/ANPD 15/2024. O regulamento prevê prazos e obrigações específicos, incluindo a comunicação aplicável e registros de incidentes; sua aplicação, exceções e eventual regime de pequeno porte exigem avaliação do caso. Separar retenção legal de registro de incidente da retenção de logs comuns do cardápio.

## Atualizações

Atualizar dependências em branch isolada, revisar advisories e lockfile, executar build/testes públicos e administrativos, testar RLS/MFA/Storage em homologação e preparar rollback. Migrations são versionadas: não editar uma já aplicada, criar nova migration revisada. Não apagar catálogo real para reaplicar seed.
