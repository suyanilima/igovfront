/* ===== NOTIFICACOES ===== */

function montarMensagemGestor(doc){
  const status = calcularStatus(doc);
  const verbo = status === 'Vencido' ? 'venceu' : 'vence';
  const saudacao = doc.gestorNome ? `Olá, ${doc.gestorNome}!` : 'Olá!';
  return `${saudacao} O documento "${doc.nome}" (SEI ${formatarNumeroSei(doc.sei)}) ${verbo} em ${fmtData(doc.data)}. Poderia verificar a renovação/atualização, por favor? Obrigado(a).`;
}

function notificarGestor(id){
  const doc = docs.find(d=>d.id===id);
  if(!doc) return;
  if(doc.semNormativo || doc.tipo === 'Sem normativo'){
    toast('Documentos sem normativo não possuem aviso de vencimento.', 'alerta');
    return;
  }
  notificandoId = id;

  document.getElementById('notificar-doc-nome').textContent = doc.nome;
  document.getElementById('notificar-mensagem').textContent = montarMensagemGestor(doc);

  const semContato = !doc.gestorEmail && !doc.gestorWhatsapp;
  document.getElementById('notificar-sem-contato').style.display = semContato ? 'block' : 'none';

  document.getElementById('btn-notificar-email').style.display = doc.gestorEmail ? 'inline-block' : 'none';
  document.getElementById('btn-notificar-whatsapp').style.display = doc.gestorWhatsapp ? 'inline-block' : 'none';

  abrirModalElemento('notificar-modal-overlay');
}

function fecharModalNotificar(){
  fecharModalElemento('notificar-modal-overlay');
  notificandoId = null;
}

function abrirEmailGestor(){
  const doc = docs.find(d=>d.id===notificandoId);
  if(!doc || !doc.gestorEmail) return;
  const assunto = `Vencimento do documento: ${doc.nome}`;
  const corpo = montarMensagemGestor(doc);
  window.location.href = `mailto:${doc.gestorEmail}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}

function abrirWhatsappGestor(){
  const doc = docs.find(d=>d.id===notificandoId);
  if(!doc || !doc.gestorWhatsapp) return;
  let digitos = doc.gestorWhatsapp.replace(/\D/g,'');
  if(!digitos.startsWith('55')) digitos = `55${digitos}`;
  const mensagem = montarMensagemGestor(doc);
  window.open(`https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener,noreferrer');
}

const HIST_LABELS = {
  criacao: 'Cadastro',
  edicao: 'Edição',
  renovacao: 'Renovação de vigência'
};

