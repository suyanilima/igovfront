# Organização do JavaScript

O código está separado por domínio. Os arquivos continuam sendo scripts clássicos porque o HTML usa funções públicas em atributos como `onclick` e o build standalone incorpora cada script diretamente.

## Estrutura

- `app.js`: ponto de entrada e inicialização final da interface.
- `shared/estado.js`: estado transversal e paginação de documentos.
- `shared/validacao.js`: limites e mensagens de validação.
- `shared/datas-formatacao.js`: datas, prazos e formatação de valores.
- `shared/documentos-storage.js`: leitura e persistência dos documentos.
- `shared/interface.js`: modais, mensagens e contadores de caracteres.
- `shared/historico.js`: histórico e funções auxiliares de data.
- `dashboard/`: indicadores e resumo da aplicação.
- `documentos/`: cadastro, listagem e unidades; ações de renovação, exclusão, edição, resumo, notificações e histórico ficam em arquivos próprios.
- `reunioes/`: estado, unidades, cadastro e participantes; calendário, atas, filtros e paginação ficam separados por responsabilidade.
- `minutas/`: edição, formatação, histórico, IA, fluxo e exportação de atas.
- `relatorios/`: configuração e geração de relatórios.
- `vendor/`: dependências externas, sem código da aplicação.

## Ordem de carregamento

A ordem declarada no final de `index.html` é intencional:

1. dependências externas;
2. recursos compartilhados;
3. domínios da aplicação;
4. telas agregadoras, como dashboard;
5. `app.js` por último.

Ao adicionar um arquivo, mantenha suas dependências antes dele e inclua o caminho no teste quando as regras desse arquivo precisarem ser exercitadas isoladamente.

## Próxima etapa segura

A migração para módulos ES deve acontecer junto com a remoção dos manipuladores inline do HTML. Até lá, funções chamadas pelo HTML compõem a API pública da interface e não devem ser encapsuladas sem atualizar seus respectivos eventos.
