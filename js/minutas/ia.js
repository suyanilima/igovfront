/* ===== REVISÃO E INTEGRAÇÃO COM IA ===== */

function obterReuniaoMinutaAtual(){
  return reunioes.find(item => item.id === minutaReuniaoId) || minutaHistoricoReuniao;
}

async function solicitarDescricaoReuniaoIA(payload){
  if(typeof window.igovAI?.gerarDescricaoReuniao === 'function'){
    return window.igovAI.gerarDescricaoReuniao(payload);
  }
  const base = String(window.IGOV_CONFIG?.apiBaseUrl || '').replace(/\/$/, '');
  const resposta = await fetch(`${base}/api/ia/reunioes/descricao`, {
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
  if(!resposta.ok) throw new Error(`Serviço de IA indisponível (${resposta.status}).`);
  return resposta.json();
}

function gerarConteudoTesteDaTranscricao(transcricao){
  const trechos = transcricao.split(/(?<=[.!?])\s+|\n+/).map(item => item.trim()).filter(Boolean);
  const termosProvidencia = /\b(irá|deverá|ficou definido|ficou acordado|encaminh|providência|responsável|prazo|solicitar|atualizar|apresentar)\b/i;
  const providencias = trechos.filter(item => termosProvidencia.test(item));
  return {
    descricao: transcricao,
    providencias: providencias.length ? providencias.join('\n') : 'Não foram identificadas providências no modo de teste.'
  };
}

function iniciarRevisaoManualMinuta(){
  const campoOrigem = document.getElementById('minuta-reuniao-transcricao');
  const conteudo = limitarTexto(campoOrigem?.value.trim(), 20000);
  if(!conteudo){
    mostrarErroCampo(campoOrigem, 'Insira a transcrição, as anotações ou um resumo da reunião.');
    campoOrigem?.focus();
    return;
  }
  limparErroCampo(campoOrigem);
  definirTextoEditorMinuta('minuta-reuniao-descricao', limitarTexto(conteudo, 5000));
  const aviso = document.getElementById('minuta-revisao-aviso');
  if(aviso){
    aviso.textContent = 'Conteúdo inserido sem IA. Revise a descrição e informe as providências antes de montar a minuta.';
    aviso.classList.remove('modo-teste');
  }
  const status = document.getElementById('minuta-ia-status');
  if(status) status.textContent = 'Você prosseguiu sem IA. Nenhum conteúdo foi enviado para processamento.';
  passoMinutaLiberado = Math.max(passoMinutaLiberado, 2);
  atualizarNavegacaoMinuta();
  mostrarPassoMinuta(2);
  toast('Conteúdo pronto para revisão.', 'valido');
}

async function gerarDescricaoReuniaoComIA(){
  const reuniao = obterReuniaoMinutaAtual();
  const campoTranscricao = document.getElementById('minuta-reuniao-transcricao');
  const transcricao = limitarTexto(campoTranscricao?.value.trim(), 20000);
  if(!reuniao || !transcricao){
    mostrarErroCampo(campoTranscricao, 'Insira a transcrição, as anotações ou um resumo da reunião.');
    campoTranscricao?.focus();
    return;
  }
  limparErroCampo(campoTranscricao);
  const botao = document.getElementById('btn-gerar-descricao-ia');
  const status = document.getElementById('minuta-ia-status');
  botao.disabled = true;
  botao.textContent = 'Editando...';
  if(status) status.textContent = 'A IA está editando e organizando a transcrição...';
  try{
    const resultado = await solicitarDescricaoReuniaoIA({
      reuniao:{
        id:reuniao.id,
        colegiado:reuniao.frequencia,
        data:reuniao.data,
        horario:reuniao.horario,
        pauta:reuniao.pauta,
        membros:normalizarMembros(reuniao.membros, reuniao.frequencia),
        convidados:normalizarParticipantes(reuniao.convidados ?? reuniao.participantes)
      },
      transcricao,
      saidaEsperada:{
        descricao:'Descrição dos problemas, solicitações e deliberações em texto formal.',
        providencias:'Providências separadas, com responsáveis e prazos quando mencionados.'
      }
    });
    const descricao = limitarTexto(String(resultado?.descricao || '').trim(), 5000);
    if(!descricao) throw new Error('A IA não retornou uma descrição válida.');
    definirTextoEditorMinuta('minuta-reuniao-descricao', descricao);
    const providencias = limitarTexto(String(resultado?.providencias || 'Não foram registradas providências.').trim(), 3000);
    definirTextoEditorMinuta('minuta-reuniao-providencias', providencias);
    const avisoRevisao = document.getElementById('minuta-revisao-aviso');
    avisoRevisao.textContent = 'Conteúdo gerado pela IA. Revise antes de criar a minuta.';
    avisoRevisao.classList.remove('modo-teste');
    if(status) status.textContent = 'Descrição e providências geradas. Revise os textos antes de criar a minuta.';
    passoMinutaLiberado = Math.max(passoMinutaLiberado, 2);
    atualizarNavegacaoMinuta();
    mostrarPassoMinuta(2);
    toast('Conteúdo organizado para revisão.', 'valido');
  }catch(e){
    const resultadoTeste = gerarConteudoTesteDaTranscricao(transcricao);
    definirTextoEditorMinuta('minuta-reuniao-descricao', resultadoTeste.descricao);
    definirTextoEditorMinuta('minuta-reuniao-providencias', resultadoTeste.providencias);
    const avisoRevisao = document.getElementById('minuta-revisao-aviso');
    avisoRevisao.textContent = 'Modo de teste: conteúdo provisório gerado sem IA. Revise antes de continuar.';
    avisoRevisao.classList.add('modo-teste');
    if(status) status.textContent = 'Modo de teste: conteúdo provisório gerado sem IA.';
    passoMinutaLiberado = Math.max(passoMinutaLiberado, 2);
    atualizarNavegacaoMinuta();
    mostrarPassoMinuta(2);
    toast('Modo de teste ativo: revise a minuta provisória.', 'alerta');
  }finally{
    botao.disabled = false;
    botao.textContent = 'Editar com IA';
  }
}