# Modelo de dados — Norma

## 1. Objetivo

Este documento descreve a proposta de persistência dos dados do Norma em Oracle. O modelo foi elaborado a partir dos campos e regras existentes na aplicação web.

O script inicial está em [`database/oracle/01_schema.sql`](../database/oracle/01_schema.sql).

## 2. Modelo lógico

```text
IGOV_SETOR 1 ─────── N IGOV_GESTOR 1 ─────── N IGOV_DOCUMENTO
                                                   │
                                                   │ 1
                                                   │
                                                   N
                                         IGOV_HIST_DOCUMENTO
```

- Um setor pode possuir vários gestores.
- Um gestor pertence a um setor e pode responder por vários documentos.
- Um documento possui várias ocorrências no histórico.

## 3. Dicionário de dados

### IGOV_SETOR

| Coluna | Tipo Oracle | Obrigatório | Regra/descrição |
|---|---|---:|---|
| ID_SETOR | NUMBER(19) | Sim | Chave primária gerada pelo banco. |
| NM_SETOR | VARCHAR2(200 CHAR) | Sim | Nome único do setor. |
| ST_ATIVO | CHAR(1) | Sim | `S` para ativo ou `N` para inativo. |
| DH_CRIACAO | TIMESTAMP(6) | Sim | Data e hora do cadastro. |
| DH_ATUALIZACAO | TIMESTAMP(6) | Sim | Data e hora da última alteração. |

### IGOV_GESTOR

| Coluna | Tipo Oracle | Obrigatório | Regra/descrição |
|---|---|---:|---|
| ID_GESTOR | NUMBER(19) | Sim | Chave primária gerada pelo banco. |
| ID_SETOR | NUMBER(19) | Sim | Chave estrangeira para `IGOV_SETOR`. |
| NM_GESTOR | VARCHAR2(200 CHAR) | Sim | Nome do gestor responsável. |
| DS_EMAIL | VARCHAR2(320 CHAR) | Sim | E-mail do gestor. |
| NR_TELEFONE | VARCHAR2(30 CHAR) | Sim | Telefone/WhatsApp, mantendo máscara e código do país. |
| ST_ATIVO | CHAR(1) | Sim | `S` para ativo ou `N` para inativo. |
| DH_CRIACAO | TIMESTAMP(6) | Sim | Data e hora do cadastro. |
| DH_ATUALIZACAO | TIMESTAMP(6) | Sim | Data e hora da última alteração. |

### IGOV_DOCUMENTO

| Coluna | Tipo Oracle | Obrigatório | Regra/descrição |
|---|---|---:|---|
| ID_DOCUMENTO | NUMBER(19) | Sim | Chave primária gerada pelo banco. |
| CD_PUBLICO | VARCHAR2(36 CHAR) | Sim | UUID usado para integração com a aplicação. |
| ID_GESTOR | NUMBER(19) | Sim | Gestor atualmente responsável. |
| NM_DOCUMENTO | VARCHAR2(300 CHAR) | Sim | Nome do documento. |
| TP_DOCUMENTO | VARCHAR2(20 CHAR) | Sim | `PROJETO`, `PLANO`, `PLANILHA`, `PROCESSO`, `NORMATIVO` ou `SEM_NORMATIVO`. |
| NR_SEI | VARCHAR2(30 CHAR) | Condicional | Ausente em documento `SEM_NORMATIVO`; nos demais, aceita somente algarismos e deve ser único. |
| TP_BASE_LEGAL | VARCHAR2(30 CHAR) | Sim | `PORTARIA`, `REGIMENTO_INTERNO`, `RESOLUCAO` ou `SEM_NORMATIVO`. |
| NR_BASE_LEGAL | VARCHAR2(50 CHAR) | Condicional | Obrigatório quando a base legal não for `SEM_NORMATIVO`. |
| DT_VIGENCIA | DATE | Condicional | Ausente em documento `SEM_NORMATIVO`; nos demais, início da vigência ou data da última renovação. |
| QT_MESES_VALIDADE | NUMBER(2) | Condicional | Ausente em documento `SEM_NORMATIVO`; nos demais, prazo permitido: 6, 12 ou 24 meses. |
| DT_VENCIMENTO | DATE virtual | Derivado | Calculado com `ADD_MONTHS(DT_VIGENCIA, QT_MESES_VALIDADE)`. |
| DS_DOCUMENTO | VARCHAR2(2000 CHAR) | Sim | Descrição breve. |
| DH_CRIACAO | TIMESTAMP(6) | Sim | Data e hora do cadastro. |
| DH_ATUALIZACAO | TIMESTAMP(6) | Sim | Data e hora da última alteração. |

### IGOV_HIST_DOCUMENTO

| Coluna | Tipo Oracle | Obrigatório | Regra/descrição |
|---|---|---:|---|
| ID_HISTORICO | NUMBER(19) | Sim | Chave primária gerada pelo banco. |
| ID_DOCUMENTO | NUMBER(19) | Sim | Documento relacionado. |
| TP_EVENTO | VARCHAR2(20 CHAR) | Sim | `CRIACAO`, `EDICAO` ou `RENOVACAO`. |
| DS_EVENTO | VARCHAR2(2000 CHAR) | Sim | Descrição legível da alteração. |
| NM_RESPONSAVEL | VARCHAR2(200 CHAR) | Não | Nome informado como responsável pela ação. |
| DH_EVENTO | TIMESTAMP(6) WITH TIME ZONE | Sim | Momento da ocorrência. |

## 4. Regras de negócio

1. O vencimento é calculado somando o prazo em meses à data de vigência.
2. O status não deve ser armazenado na tabela, pois varia com a data atual:
   - `VENCIDO`: vencimento anterior ao dia atual;
   - `A_VENCER`: dentro do período de alerta;
   - `VIGENTE`: fora do período de alerta.
3. O alerta começa três meses antes do vencimento para validade de seis meses e seis meses antes para validade de 12 ou 24 meses.
4. Uma renovação atualiza a vigência, o prazo e, consequentemente, o vencimento, além de gerar histórico.
5. Documento sem normativo usa `TP_DOCUMENTO = 'SEM_NORMATIVO'` e `TP_BASE_LEGAL = 'SEM_NORMATIVO'`; não possui SEI, vigência, validade, vencimento, situação nem número de base legal.
6. Recomenda-se inativar gestores e setores em vez de excluí-los quando já estiverem referenciados.
7. A exclusão de documento deve ser definida com o responsável funcional. O script bloqueia exclusão quando existe histórico; para auditoria institucional, recomenda-se futuramente adicionar exclusão lógica ao documento.

## 5. Mapeamento da aplicação atual

| Campo JavaScript/localStorage | Destino Oracle |
|---|---|
| `id` | `IGOV_DOCUMENTO.CD_PUBLICO` |
| `nome` | `NM_DOCUMENTO` |
| `tipo` | `TP_DOCUMENTO` (convertido para maiúsculas) |
| `sei` | `NR_SEI` |
| `baseLegal` | `TP_BASE_LEGAL` |
| `baseLegalNumero` | `NR_BASE_LEGAL` |
| `dataVigencia` | `DT_VIGENCIA` |
| `validade` (`6m`, `1a`, `2a`) | `QT_MESES_VALIDADE` (6, 12, 24) |
| `data` | `DT_VENCIMENTO` (recalculado pelo Oracle) |
| `descricao` | `DS_DOCUMENTO` |
| `gestorNome`, `gestorSetor`, `gestorEmail`, `gestorWhatsapp` | `IGOV_GESTOR` e `IGOV_SETOR` |
| `ultimaAtualizacao` | `DH_ATUALIZACAO` |
| `historico[]` | `IGOV_HIST_DOCUMENTO` |

## 6. Pontos para validação com o supervisor

- Schema/tablespace que receberá os objetos.
- Versão do Oracle; o script usa colunas `IDENTITY`, disponíveis a partir do Oracle 12c.
- Se um documento pode ter mais de um gestor simultaneamente. Se sim, substituir `ID_GESTOR` por uma tabela associativa.
- Se o número SEI é globalmente único ou pode se repetir entre tipos/unidades.
- Política de exclusão lógica, retenção do histórico e auditoria de usuário autenticado.
- Integração futura com SEI, login institucional e LGPD.
