# Verificação desta versão

- TypeScript: passou com `tsc -b`.
- Produção: build gerado com `npm run build:local` (carregamento direto dos plugins por restrição de caminhos do sandbox Windows).
- `npm test`: passou. Verifica preços com adicionais, agrupamento por configuração, separação de configurações diferentes, aumento e redução de quantidade, remoção de item personalizado, total, recuperação após remontar o hook, limpeza, bloqueio de indisponível, recuperação de dados locais inválidos e mensagem/URL do WhatsApp com caracteres especiais.
- A suíte também renderiza a aplicação no jsdom e testa busca sem acentos, categorias, estado sem resultados, reset dos filtros, botão indisponível, abertura do carrinho, revisão, opções obrigatórias da personalização, adição personalizada, abertura/fechamento do menu mobile e destinos de todas as âncoras. O jsdom usa substitutos dos métodos de dialog; comportamento real de foco e apresentação exige navegador.
- Dependências utilizadas na verificação estavam disponíveis localmente. O registro npm retornou EACCES nesta sessão; a instalação limpa via rede não pôde ser verificada.
- Responsividade implementada com breakpoints para desktop, tablet e mobile. Revisão visual e testes de interação em navegador continuam pendentes: a ferramenta de computer-use retornou inventário vazio de navegadores e aplicativos.
- A tentativa de iniciar o servidor local também recebeu `listen EACCES` em `127.0.0.1:5173`. O build está disponível em `dist/`, mas não foi possível manter uma prévia HTTP neste ambiente.
- Abertura real de WhatsApp permanece intencionalmente indisponível até preencher o número oficial em `src/data/config.ts`. A geração e a codificação da mensagem estão testadas, e a cópia utiliza Clipboard API, com alternativa de seleção manual em caso de falha.
- Fotografias e fontes dependem de serviços externos. Verificar as imagens finais, rede, contraste e os layouts em 375, 768 e 1440 px antes da publicação.
