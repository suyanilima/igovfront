/* ===== ESTADO COMPARTILHADO DA APLICAÇÃO ===== */

let docs = [];
const STORAGE_KEY = 'igov:documentos';

const PAGINACAO_KEY = 'igov:itens-por-pagina';
const OPCOES_ITENS_POR_PAGINA = [10, 20, 50];
let ITENS_POR_PAGINA = (() => {
  try{
    const valor = Number(localStorage.getItem(PAGINACAO_KEY));
    return OPCOES_ITENS_POR_PAGINA.includes(valor) ? valor : 10;
  }catch(e){
    return 10;
  }
})();
let paginaAtual = 1;
let filtrosAnteriores = '';

