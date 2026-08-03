# Integração de IA para reuniões

O front-end nunca recebe tokens ou credenciais do Copilot. A autenticação e a chamada ao provedor de IA devem acontecer no backend institucional.

## Endpoint esperado

`POST /api/ia/reunioes/descricao`

Se a API estiver em outra origem, defina antes dos scripts da aplicação:

```html
<script>
  window.IGOV_CONFIG = { apiBaseUrl: 'https://api.institucional.example' };
</script>
```

## Requisição

```json
{
  "reuniao": {
    "id": "identificador",
    "colegiado": "CGTIC",
    "data": "2026-07-01",
    "horario": "08:00",
    "pauta": "Pauta da reunião",
    "membros": [{ "cargo": "Secretaria de Tecnologia da Informação", "nome": "Nome do membro" }],
    "convidados": ["Nome do convidado"]
  },
  "transcricao": "Texto integral da transcrição",
  "saidaEsperada": {
    "descricao": "Descrição dos problemas, solicitações e deliberações em texto formal.",
    "providencias": "Providências separadas, com responsáveis e prazos quando mencionados."
  }
}
```

## Resposta

```json
{
  "descricao": "Descrição organizada das discussões, solicitações e deliberações.",
  "providencias": "Providências, responsáveis e prazos identificados na transcrição."
}
```

O backend deve responder com conteúdo JSON e um status HTTP `2xx`. Erros de autenticação, limite, validação ou indisponibilidade devem usar o status HTTP correspondente.

## Adaptador opcional

Se a integração institucional usar outro cliente, o front também aceita a função assíncrona global abaixo:

```js
window.igovAI = {
  async gerarDescricaoReuniao(payload) {
    return { descricao: 'Texto gerado' };
  }
};
```

## Segurança

- Não inserir chave, token ou segredo no HTML ou JavaScript entregue ao navegador.
- Exigir autenticação e autorização no backend.
- Limitar tamanho, tipo e frequência das requisições.
- Validar e registrar o consentimento e a finalidade do tratamento da transcrição conforme as políticas institucionais e a LGPD.
- Não considerar a saída da IA definitiva: o usuário deve revisar a descrição antes de gerar a minuta.
