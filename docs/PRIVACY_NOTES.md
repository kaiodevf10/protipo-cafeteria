# Privacidade: notas para revisão técnica, jurídica e operacional

Este documento não é uma política publicada nem uma declaração de conformidade. A cafeteria deve identificar o controlador e responsáveis reais e validar a LGPD e normas aplicáveis antes da publicação. Não foram inventados CNPJ, endereço de contato de privacidade, encarregado ou compromissos comerciais.

## Dados e finalidade

| Dados | Finalidade e local | Acesso |
|---|---|---|
| E-mail, UUID e material de autenticação gerenciado pelo provedor | Login/recuperação/MFA no Supabase Auth | Titular e operadores autorizados; aplicação nunca recebe hashes de senha |
| UUID, papel, estado ativo | Autorização em admin_members/PostgreSQL | Funções confiáveis; mudanças só por operador privilegiado |
| UUID do ator, ação, registro, antes/depois, timestamp | Rastreabilidade em audit_logs | Owner AAL2 e manutenção autorizada |
| Produtos/categorias, preço e fotos | Publicação do cardápio | Público apenas conforme RLS; fotos do bucket são públicas |
| Sessão e TOTP em memória | Acesso durante a aba atual | Titular; não persistidos pela aplicação no armazenamento local |
| Carrinho, notas e snapshot de produtos | Continuidade/revisão local já existente | Navegador do visitante; não enviado ao Supabase |
| Nome/observações de pedido na tela | Compor mensagem voluntariamente enviada ao WhatsApp | Memória da página e WhatsApp quando o cliente escolhe enviar |

Não foi criada tabela de clientes, pedidos, CPF, documentos, pagamentos ou dados de marketing. A aplicação não envia nomes/notas dos pedidos ao banco administrativo. A prévia da mensagem é local; o envio final continua sendo ação do cliente no WhatsApp. Auth/Supabase podem manter registros operacionais próprios (como IP e horários) conforme configuração/contrato; verificar isso no ambiente real.

Avaliar bases legais pertinentes por finalidade, como execução de contrato e procedimentos relacionados, legítimo interesse sujeito à avaliação e obrigações aplicáveis. Consentimento não é assumido como base universal. O estabelecimento deve definir necessidade, finalidade, transparência, atendimento de direitos e papéis controlador/operador com assessoria apropriada.

## Retenção

Proposta operacional para aprovação: logs comuns de edição do cardápio por 180 dias, com expurgo privilegiado documentado e sem acesso de exclusão pelo painel. **Esse prazo é proposta, não uma obrigação legal nem rotina já ativa.** Antes de liberar produção, responsáveis devem aprovar prazo, fundamento e rotina, considerando investigação/obrigações, direitos e backups. Não deixar retenção indefinida sem decisão registrada. Registros de incidentes possuem finalidade e regras próprias; consultar SECURITY e ANPD.

Contas devem ser desativadas quando cessa a autorização. Exclusão/anonymização pelo provedor requer avaliação das referências e preservação necessária de auditoria; admin_members referencia Auth e impede apagar inadvertidamente uma conta vinculada. Auditoria não armazena e-mail em cada edição, somente UUID. Definir rotina de limpeza de fotos órfãs e backups, acesso e expiração de cópias. Exclusão no bucket não garante remoção instantânea de caches públicos.

## Fornecedores e transferências

Supabase: região **a escolher/confirmar**, plano, controles de acesso de operadores, DPA/contrato vigente, subprocessadores, local de processamento e possíveis transferências internacionais devem ser documentados. Conferir instrumentos e responsabilidades aplicáveis; hospedagem sozinha não estabelece conformidade. O SDK não adiciona analytics ou marketing.

Serviços já presentes no site: Google Maps incorporado, fontes Google, fotos Unsplash e WhatsApp recebem conexões conforme suas funções e políticas. O aviso deve refletir as configurações efetivas e essa relação com terceiros. Esta etapa não acrescenta pixels, analytics invasivos ou banner fictício. Se forem introduzidas tecnologias não essenciais futuramente, realizar avaliação e manter desativadas até mecanismo adequado.

## Estrutura de aviso de privacidade a completar (não publicar sem validação)

1. Identificação real e contato do controlador/responsáveis
2. Finalidades, categorias de dados e bases legais avaliadas para administração e experiência pública
3. Uso estritamente necessário de memória, carrinho local e autenticação; tecnologias de terceiros realmente utilizadas
4. Supabase/WhatsApp/Google/Unsplash, compartilhamentos e transferências efetivamente confirmados
5. Critérios e prazos de retenção aprovados, incluindo logs e cópias
6. Canal real para direitos, procedimento de identidade proporcional e limitações aplicáveis
7. Medidas existentes descritas sem garantias absolutas e procedimento de incidentes aprovado
8. Data, responsável pela aprovação e processo de atualização

Fontes para revisão: [LGPD no Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm), [ANPD](https://www.gov.br/anpd/pt-br), [Supabase DPA](https://supabase.com/legal/dpa). Confirmar versões e condições efetivamente contratadas.
