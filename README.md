# Igov Controle

Aplicação web estática para cadastrar e acompanhar documentos e reuniões de governança.

## Como executar

Abra `index.html` em um navegador moderno ou sirva a pasta com um servidor HTTP local. Exemplo:

```powershell
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Armazenamento

Em navegadores comuns, os registros são persistidos em `localStorage`, somente no navegador e perfil atuais. Se o ambiente oferecer a API `window.storage`, ela será utilizada por compatibilidade.

Não use esta versão para dados institucionais ou pessoais reais sem implementar backend, autenticação, autorização, banco de dados, backups e políticas adequadas à LGPD.

## Funcionalidades

- Cadastro, edição, renovação e exclusão de documentos;
- Cálculo automático de vencimento e situação;
- Filtros e paginação;
- Histórico local de alterações;
- Exportação CSV;
- Abertura manual de mensagens por e-mail e WhatsApp.
- Cadastro e histórico de reuniões CGOVTIC (bimestrais) e CGTIC (quinzenais), podendo fazer o cadastro de novos setores;
- Registro de data, horário, pauta, participantes e resumo das reuniões;
- Telas reutilizáveis para erros 403, 404, 500 e falta de conexão;
- Esqueleto de carregamento exibido apenas em operações lentas.

## Estados de erro e carregamento

Use `mostrarTelaErro(403)`, `mostrarTelaErro(404)` ou `mostrarTelaErro(500)` para apresentar uma tela de erro. A falta de conexão é detectada automaticamente pelos eventos `offline` e `online` do navegador.

Para operações assíncronas, envolva a chamada com `executarComCarregamento(() => operacao())`. O esqueleto aparece depois de 350 ms e é removido ao concluir. O atraso pode ser alterado com `executarComCarregamento(() => operacao(), { atraso: 500 })`.

## Limitações

- Não possui login ou controle de acesso real;
- Não envia notificações automaticamente;
- Não sincroniza dados entre dispositivos;
- O histórico local não substitui uma trilha de auditoria no servidor.

## Verificação

Execute:

```powershell
Get-ChildItem js/*.js | ForEach-Object { node --check $_.FullName }
node tests/regras.test.cjs
```

## Organização do código

- `js/core.js`: estado, persistência e utilitários compartilhados;
- `js/tabs.js`: navegação entre as telas;
- `js/documentos/`: cadastro, listagem e modais dos documentos;
- `js/reunioes/`: estado, unidades, cadastro e listagem das reuniões;
- `js/minutas/`: editor, formatação, fluxo, histórico, IA e exportação das minutas;
- `js/init.js`: inicialização da aplicação;
- `js/estados.js`: telas de erro, detecção de conexão e carregamento lento;
- `css/base.css`: variáveis, tipografia e estilos globais;
- `css/layout-formularios.css`: estrutura das telas e formulários;
- `css/filtros.css`: barra de busca e filtros;
- `css/documentos.css`: listagem e ações dos documentos;
- `css/modais-feedback.css`: modais, mensagens e ajustes finais.
- `css/reunioes.css`: formulário e histórico visual das reuniões;
- `css/estados.css`: telas de erro e esqueletos de carregamento.

## Banco de dados Oracle

- [`docs/modelo-de-dados.md`](docs/modelo-de-dados.md): modelo lógico, dicionário de dados, regras e mapeamento da aplicação;
- [`database/oracle/01_schema.sql`](database/oracle/01_schema.sql): DDL inicial para Oracle 12c ou superior.
