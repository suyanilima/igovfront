/* ===== INTERAÇÕES COMPARTILHADAS DA INTERFACE ===== */

function toast(html, kind){
  const t = document.getElementById('toast');
  t.innerHTML = html;
  t.className = kind || '';
  t.style.display = 'block';
  clearTimeout(t._timer);
  t._timer = setTimeout(()=> t.style.display='none', 4200);
}

let focoAntesDoModal = null;

function abrirModalElemento(id){
  const overlay = document.getElementById(id);
  if(!overlay) return;
  inicializarContadoresCaracteres(overlay);
  focoAntesDoModal = document.activeElement;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-aberto');
  if(typeof sincronizarSeletoresPersonalizados === 'function') sincronizarSeletoresPersonalizados();
  requestAnimationFrame(() => overlay.querySelector('.modal')?.focus());
}

function fecharModalElemento(id){
  const overlay = document.getElementById(id);
  if(!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  if(!document.querySelector('[id$="modal-overlay"].open')) document.body.classList.remove('modal-aberto');
  focoAntesDoModal?.focus?.();
  focoAntesDoModal = null;
}

document.addEventListener('keydown', event => {
  if(event.key !== 'Escape') return;
  const aberto = document.querySelector('[id$="modal-overlay"].open');
  if(!aberto) return;
  const fechadores = {
    'modal-overlay': fecharModal,
    'delete-modal-overlay': fecharModalExcluir,
    'delete-reuniao-modal-overlay': fecharModalExcluirReuniao,
    'delete-minuta-modal-overlay': fecharModalExcluirMinuta,
    'exportar-ata-modal-overlay': fecharModalExportarAta,
    'edit-reuniao-modal-overlay': fecharModalEditarReuniao,
    'cancelar-reuniao-modal-overlay': fecharCancelamentoReuniao,
    'resumo-reuniao-modal-overlay': fecharResumoReuniao,
    'edit-modal-overlay': fecharModalEditar,
    'resumo-modal-overlay': fecharModalResumo,
    'notificar-modal-overlay': fecharModalNotificar,
    'historico-modal-overlay': fecharModalHistorico
  };
  fechadores[aberto.id]?.();
});

function inicializarLimpezaErrosCampos(){
  document.querySelectorAll('input, select, textarea').forEach(campo => {
    campo.addEventListener('input', () => limparErroCampo(campo));
    campo.addEventListener('change', () => limparErroCampo(campo));
  });
}

function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function atualizarContadorCampo(campo){
  if(!campo || campo.readOnly || campo.disabled || campo.type === 'hidden') return;
  const limite = Number(campo.maxLength);
  if(!Number.isFinite(limite) || limite <= 0) return;
  let contador = campo.nextElementSibling;
  if(!contador?.classList?.contains('contador-caracteres') && !contador?.classList?.contains('contador-caracteres-campo')){
    contador = document.createElement('div');
    contador.className = 'contador-caracteres-campo';
    contador.setAttribute('aria-live', 'polite');
    campo.insertAdjacentElement('afterend', contador);
  }
  const quantidade = String(campo.value || '').length;
  contador.textContent = `${quantidade}/${limite}`;
  contador.classList.toggle('proximo-limite', quantidade >= Math.ceil(limite * .9));
  campo.dataset.contadorCaracteres = 'ativo';
}

function inicializarContadoresCaracteres(raiz = document){
  raiz.querySelectorAll?.('textarea[maxlength]').forEach(atualizarContadorCampo);
}

document.addEventListener('input', evento => {
  if(evento.target?.matches?.('textarea[maxlength]')) atualizarContadorCampo(evento.target);
});

document.addEventListener('focusin', evento => {
  if(evento.target?.matches?.('textarea[maxlength]')) atualizarContadorCampo(evento.target);
});

function inicializarInterfaceCompartilhada(){
  inicializarLimpezaErrosCampos();
  inicializarContadoresCaracteres();
  if(typeof MutationObserver === 'function'){
    new MutationObserver(mudancas => mudancas.forEach(mudanca => mudanca.addedNodes.forEach(no => {
      if(no.nodeType !== 1) return;
      if(no.matches?.('textarea[maxlength]')) atualizarContadorCampo(no);
      inicializarContadoresCaracteres(no);
    }))).observe(document.body, {childList:true, subtree:true});
  }
}
