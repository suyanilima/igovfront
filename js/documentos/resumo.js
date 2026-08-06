/* ===== RESUMO ===== */

function verResumo(id){
  const doc = docs.find(d=>d.id===id);
  if(!doc) return;
  resumoAtualId = id;
  const status = calcularStatus(doc);

  document.getElementById('resumo-nome').textContent = doc.nome;
  document.getElementById('resumo-tipo').textContent = doc.tipo;
  document.getElementById('resumo-sei').textContent = formatarNumeroSei(doc.sei) || '-';

  document.getElementById('resumo-baselegal').textContent = doc.semNormativo || doc.tipo === 'Sem normativo' ? '-' : doc.baseLegal
    ? `${doc.baseLegal}${doc.baseLegalNumero ? ' n° ' + doc.baseLegalNumero : ''}`
    : 'Não informado';

  document.getElementById('resumo-venc').textContent = doc.data ? fmtData(doc.data) : '-';

  const situEl = document.getElementById('resumo-situacao');
  situEl.innerHTML = status ? `<span class="tag ${status==='Vigente'?'valido':status==='Alerta'?'alerta':'vencido'}">${statusLabel(status)}</span>` : '-';

  document.getElementById('resumo-gestor').textContent = doc.gestorNome ? doc.gestorNome : 'Não informado';
  document.getElementById('resumo-setor').textContent = doc.gestorSetor ? doc.gestorSetor : 'Não informado';

  document.getElementById('resumo-desc').textContent = doc.descricao ? doc.descricao : 'Nenhuma descrição cadastrada.';

  abrirModalElemento('resumo-modal-overlay');
}

function fecharModalResumo(){
  fecharModalElemento('resumo-modal-overlay');
}

let notificandoId = null;

