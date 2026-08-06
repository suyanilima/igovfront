/* ===== LIMITES E VALIDAÇÃO DE CAMPOS ===== */

const LIMITES_CAMPOS = Object.freeze({
  nome: 70,
  sei: 30,
  baseLegalNumero: 50,
  gestorNome: 50,
  gestorSetor: 50,
  gestorEmail: 50,
  gestorWhatsapp: 16,
  descricao: 300,
  motivo: 300
});

function limitarTexto(valor, limite){
  return String(valor ?? '').slice(0, limite);
}

function mostrarErroCampo(elemento, mensagem){
  if(!elemento) return;
  const idErro = `erro-${elemento.id || uid()}`;
  let erro = document.getElementById(idErro);
  if(!erro){
    erro = document.createElement('div');
    erro.id = idErro;
    erro.className = 'field-error';
    elemento.insertAdjacentElement('afterend', erro);
  }
  erro.textContent = mensagem;
  elemento.classList?.add('campo-invalido');
}

function limparErroCampo(elemento){
  if(!elemento) return;
  document.getElementById(`erro-${elemento.id}`)?.remove();
  elemento.classList?.remove('campo-invalido');
}

