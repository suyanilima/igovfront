/* ===== OPERAÇÕES BÁSICAS DOS CAMPOS DE EDIÇÃO ===== */

/* ===== EDITOR, HISTÓRICO E GERAÇÃO DE MINUTAS ===== */

let editorMinutaAtivo = null;
let selecaoTabelaMinuta = null;
let ultimoEnterListaMinuta = {lista:null, momento:0};

function definirEditorMinutaAtivo(editor){ editorMinutaAtivo = editor; }

function obterTextoEditorMinuta(id){
  return (document.getElementById(id)?.innerText || '').replace(/\n{3,}/g, '\n\n').trim();
}

function definirTextoEditorMinuta(id, texto){
  const editor = document.getElementById(id);
  if(!editor) return;
  editor.textContent = texto || '';
  atualizarContadorEditorMinuta(editor);
}

function atualizarContadorEditorMinuta(editor){
  const limite = Number(editor?.dataset?.maxlength) || 0;
  if(!editor || !limite) return;
  let texto = editor.innerText || '';
  if(texto.length > limite){
    texto = texto.slice(0, limite);
    editor.textContent = texto;
  }
  const contador = document.getElementById(`contador-${editor.id}`);
  if(contador){
    contador.textContent = `${texto.length}/${limite}`;
    contador.classList.toggle('proximo-limite', texto.length >= Math.ceil(limite * .9));
  }
}