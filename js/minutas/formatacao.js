/* ===== FORMATAÇÃO, LISTAS, TABELAS E COLAGEM ===== */

function formatarEditorMinuta(comando){
  if(!editorMinutaAtivo) return;
  editorMinutaAtivo.focus();
  if(comando === 'insertUnorderedList'){
    const selecao = window.getSelection();
    const noAtual = selecao?.anchorNode?.nodeType === 1 ? selecao.anchorNode : selecao?.anchorNode?.parentElement;
    const itemLista = noAtual?.closest?.('li');
    if(itemLista && editorMinutaAtivo.contains(itemLista)){
      converterItemListaEmParagrafo(itemLista);
      atualizarContadorEditorMinuta(editorMinutaAtivo);
      return;
    }
  }
  document.execCommand(comando, false, null);
  atualizarContadorEditorMinuta(editorMinutaAtivo);
}

function converterItemListaEmParagrafo(itemLista, posicionarNoInicio = false){
  const lista = itemLista?.parentElement;
  if(!lista || !['UL','OL'].includes(lista.tagName)) return;
  const paragrafo = document.createElement('div');
  while(itemLista.firstChild) paragrafo.appendChild(itemLista.firstChild);
  const itensPosteriores = [];
  let proximo = itemLista.nextElementSibling;
  while(proximo){ itensPosteriores.push(proximo); proximo = proximo.nextElementSibling; }
  itemLista.remove();
  lista.insertAdjacentElement('afterend', paragrafo);
  if(itensPosteriores.length){
    const listaPosterior = document.createElement(lista.tagName.toLowerCase());
    itensPosteriores.forEach(item => listaPosterior.appendChild(item));
    paragrafo.insertAdjacentElement('afterend', listaPosterior);
  }
  if(!lista.querySelector('li')) lista.remove();
  const selecao = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(paragrafo);
  range.collapse(posicionarNoInicio);
  selecao.removeAllRanges();
  selecao.addRange(range);
}

function removerListaEditorMinuta(){
  if(!editorMinutaAtivo) return;
  editorMinutaAtivo.focus();
  const selecao = window.getSelection();
  const noAtual = selecao?.anchorNode?.nodeType === 1 ? selecao.anchorNode : selecao?.anchorNode?.parentElement;
  if(!noAtual?.closest?.('li')) return;
  document.execCommand('outdent', false, null);
  atualizarContadorEditorMinuta(editorMinutaAtivo);
}

function aplicarClasseTextoMinuta(classe, tag = 'span'){
  if(!editorMinutaAtivo) return;
  editorMinutaAtivo.focus();
  const selecao = window.getSelection();
  if(!selecao?.rangeCount) return;
  const range = selecao.getRangeAt(0);
  if(range.collapsed || !editorMinutaAtivo.contains(range.commonAncestorContainer)) return;
  const elemento = document.createElement(tag);
  elemento.className = classe;
  elemento.appendChild(range.extractContents());
  range.insertNode(elemento);
  selecao.removeAllRanges();
  const novoRange = document.createRange();
  novoRange.selectNodeContents(elemento);
  selecao.addRange(novoRange);
  atualizarContadorEditorMinuta(editorMinutaAtivo);
}

function inserirTabelaEditorMinuta(){
  if(!editorMinutaAtivo) return;
  const selecao = window.getSelection();
  selecaoTabelaMinuta = selecao?.rangeCount ? selecao.getRangeAt(0).cloneRange() : null;
  document.getElementById('tabela-minuta-linhas').value = '2';
  document.getElementById('tabela-minuta-colunas').value = '2';
  document.getElementById('tabela-minuta-cabecalho').checked = true;
  abrirModalElemento('tabela-minuta-modal-overlay');
}

function fecharConfiguracaoTabelaMinuta(){
  fecharModalElemento('tabela-minuta-modal-overlay');
  selecaoTabelaMinuta = null;
}

function ajustarDimensaoTabela(id, variacao){
  const campo = document.getElementById(id);
  if(!campo) return;
  const minimo = Number(campo.min) || 1;
  const maximo = Number(campo.max) || 20;
  const atual = Number(campo.value) || minimo;
  campo.value = String(Math.min(maximo, Math.max(minimo, atual + variacao)));
}

function confirmarInsercaoTabelaMinuta(){
  if(!editorMinutaAtivo) return;
  const linhas = Math.min(20, Math.max(1, Number(document.getElementById('tabela-minuta-linhas').value) || 1));
  const colunas = Math.min(10, Math.max(1, Number(document.getElementById('tabela-minuta-colunas').value) || 1));
  const cabecalho = document.getElementById('tabela-minuta-cabecalho').checked;
  let html = '<table><tbody>';
  for(let linha = 0; linha < linhas; linha++){
    const tag = cabecalho && linha === 0 ? 'th' : 'td';
    html += '<tr>';
    for(let coluna = 0; coluna < colunas; coluna++) html += `<${tag}>${tag === 'th' ? `Cabeçalho ${coluna + 1}` : 'Conteúdo'}</${tag}>`;
    html += '</tr>';
  }
  html += '</tbody></table><br>';
  fecharModalElemento('tabela-minuta-modal-overlay');
  editorMinutaAtivo.focus();
  const selecao = window.getSelection();
  if(selecaoTabelaMinuta && editorMinutaAtivo.contains(selecaoTabelaMinuta.commonAncestorContainer)){
    selecao.removeAllRanges();
    selecao.addRange(selecaoTabelaMinuta);
  }
  if(selecaoTabelaMinuta?.createContextualFragment){
    const fragmento = selecaoTabelaMinuta.createContextualFragment(html);
    selecaoTabelaMinuta.deleteContents();
    selecaoTabelaMinuta.insertNode(fragmento);
  }else{
    document.execCommand('insertHTML', false, html);
  }
  atualizarContadorEditorMinuta(editorMinutaAtivo);
  selecaoTabelaMinuta = null;
}

function alternarEspacamentoEditorMinuta(){
  if(!editorMinutaAtivo) return;
  editorMinutaAtivo.focus();
  const selecao = window.getSelection();
  if(!selecao?.rangeCount) return;
  const range = selecao.getRangeAt(0);
  let ancestral = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
  const compacto = ancestral?.closest?.('.letras-compactas');
  if(compacto && editorMinutaAtivo.contains(compacto)){
    compacto.replaceWith(...compacto.childNodes);
    return;
  }
  if(range.collapsed) return;
  const span = document.createElement('span');
  span.className = 'letras-compactas';
  span.appendChild(range.extractContents());
  range.insertNode(span);
  selecao.removeAllRanges();
  const novoRange = document.createRange();
  novoRange.selectNodeContents(span);
  selecao.addRange(novoRange);
}

function colarTextoSimplesEditor(evento){
  evento.preventDefault();
  const areaTransferencia = evento.clipboardData || window.clipboardData;
  const textoOriginal = areaTransferencia?.getData('text/plain') || areaTransferencia?.getData('text') || '';
  const texto = normalizarQuebrasTextoColado(textoOriginal);
  const campo = evento.currentTarget || evento.target;
  if(campo && typeof campo.setRangeText === 'function'){
    const inicio = Number.isInteger(campo.selectionStart) ? campo.selectionStart : campo.value.length;
    const fim = Number.isInteger(campo.selectionEnd) ? campo.selectionEnd : inicio;
    campo.setRangeText(texto, inicio, fim, 'end');
    campo.dispatchEvent(new Event('input', {bubbles:true}));
    return;
  }
  if(document.execCommand('insertText', false, texto)){
    atualizarContadorEditorMinuta(campo);
    return;
  }
  const selecao = window.getSelection();
  if(!selecao?.rangeCount) return;
  const range = selecao.getRangeAt(0);
  range.deleteContents();
  const noTexto = document.createTextNode(texto);
  range.insertNode(noTexto);
  range.setStartAfter(noTexto);
  range.collapse(true);
  selecao.removeAllRanges();
  selecao.addRange(range);
  atualizarContadorEditorMinuta(campo);
}

function normalizarQuebrasTextoColado(valor){
  const linhas = String(valor || '').replace(/\r\n?/g, '\n').split('\n');
  let resultado = '';
  for(let indice = 0; indice < linhas.length; indice++){
    const atual = linhas[indice].trim();
    const proxima = (linhas[indice + 1] || '').trim();
    if(!atual){
      resultado = resultado.trimEnd() + (resultado ? '\n\n' : '');
      continue;
    }
    resultado += atual;
    if(!proxima) continue;
    const itemAtual = /^(?:[-•*]|\d+[.)]|item\s+\d)/i.test(atual);
    const proximoItem = /^(?:[-•*]|\d+[.)]|item\s+\d)/i.test(proxima);
    const fimDeParagrafo = /[.!?;:]$/.test(atual);
    resultado += itemAtual || proximoItem || fimDeParagrafo ? '\n' : ' ';
  }
  return resultado.replace(/\n{3,}/g, '\n\n').trim();
}

function tratarEnterEditorMinuta(evento){
  const selecao = window.getSelection();
  const noAncora = selecao?.anchorNode;
  const noAtual = noAncora?.nodeType === 1 ? noAncora : noAncora?.parentElement;
  let itemLista = noAtual?.closest?.('li');
  if(!itemLista && ['UL','OL'].includes(noAtual?.tagName)){
    const indice = Math.max(0, (selecao?.anchorOffset || 1) - 1);
    const candidato = noAtual.children?.[indice];
    if(candidato?.tagName === 'LI') itemLista = candidato;
  }
  const listaAtual = itemLista?.parentElement;
  let cursorNoInicioDoItem = false;
  if(evento.key === 'Enter' && itemLista && selecao?.rangeCount && selecao.getRangeAt(0).collapsed){
    const rangeCursor = selecao.getRangeAt(0);
    const antesDoCursor = document.createRange();
    antesDoCursor.selectNodeContents(itemLista);
    try{
      antesDoCursor.setEnd(rangeCursor.startContainer, rangeCursor.startOffset);
      cursorNoInicioDoItem = !antesDoCursor.toString().replace(/[\s\u00a0\u200b\ufeff]/g, '');
    }catch(e){ cursorNoInicioDoItem = false; }
  }
  if(cursorNoInicioDoItem && itemLista.textContent.replace(/[\s\u00a0\u200b\ufeff]/g, '')){
    evento.preventDefault();
    converterItemListaEmParagrafo(itemLista, true);
    ultimoEnterListaMinuta = {lista:null, momento:0};
    atualizarContadorEditorMinuta(editorMinutaAtivo);
    return;
  }
  const textoItem = String(itemLista?.textContent || '').replace(/[\s\u00a0\u200b\ufeff]/g, '');
  const itemVazio = Boolean(itemLista && !textoItem && !itemLista.querySelector('img,table'));
  const agora = Date.now();
  const segundoEnter = evento.key === 'Enter' && itemLista && ultimoEnterListaMinuta.lista === listaAtual && agora - ultimoEnterListaMinuta.momento < 2000;
  if(itemLista && (itemVazio || segundoEnter) && ['Enter','Backspace'].includes(evento.key)){
    evento.preventDefault();
    const lista = listaAtual;
    const paragrafo = document.createElement('div');
    paragrafo.appendChild(document.createElement('br'));
    lista.insertAdjacentElement('afterend', paragrafo);
    if(itemVazio) itemLista.remove();
    [...lista.children].filter(item => item.tagName === 'LI' && !String(item.textContent || '').replace(/[\s\u00a0\u200b\ufeff]/g, '')).forEach(item => item.remove());
    if(!lista.querySelector('li')) lista.remove();
    const novoRange = document.createRange();
    novoRange.setStart(paragrafo, 0);
    novoRange.collapse(true);
    selecao.removeAllRanges();
    selecao.addRange(novoRange);
    ultimoEnterListaMinuta = {lista:null, momento:0};
    return;
  }
  if(evento.key !== 'Enter') return;
  if(itemLista){
    ultimoEnterListaMinuta = {lista:listaAtual, momento:agora};
    return;
  }
  ultimoEnterListaMinuta = {lista:null, momento:0};
  evento.preventDefault();
  if(!document.execCommand('insertLineBreak', false, null)) document.execCommand('insertHTML', false, '<br>');
}

function obterHtmlEditorMinuta(id){
  const editor = document.getElementById(id);
  if(!editor) return '';
  if(!editor.childNodes) return textoAtaParaHtml(editor.innerText || '');
  const tags = {B:'strong',STRONG:'strong',I:'em',EM:'em',U:'u',BR:'br',DIV:'div',P:'p',SPAN:'span',MARK:'mark',UL:'ul',LI:'li',TABLE:'table',TBODY:'tbody',THEAD:'thead',TR:'tr',TD:'td',TH:'th'};
  function serializar(no){
    if(no.nodeType === 3) return escapeHtml(no.nodeValue);
    if(no.nodeType !== 1) return '';
    const filhos = [...no.childNodes].map(serializar).join('');
    const tag = tags[no.tagName];
    if(!tag) return filhos;
    if(tag === 'br') return '<br>';
    const classePermitida = ['ata-bloco','ata-titulo','ata-secao-titulo','ata-secao-conteudo','letras-compactas','texto-marcado','texto-menor','texto-maior'].find(nome => no.classList?.contains(nome));
    const classe = classePermitida ? ` class="${classePermitida}"` : '';
    return `<${tag}${classe}>${filhos}</${tag}>`;
  }
  return normalizarHtmlConteudoMinuta([...editor.childNodes].map(serializar).join(''));
}

function normalizarHtmlConteudoMinuta(html){
  let resultado = String(html || '').trim();
  const vazioInicio = /^(?:<br\s*\/?>|<(?:div|p)>\s*(?:<br\s*\/?>)?\s*<\/(?:div|p)>|\s)+/i;
  const vazioFim = /(?:<br\s*\/?>|<(?:div|p)>\s*(?:<br\s*\/?>)?\s*<\/(?:div|p)>|\s)+$/i;
  while(vazioInicio.test(resultado)) resultado = resultado.replace(vazioInicio, '');
  while(vazioFim.test(resultado)) resultado = resultado.replace(vazioFim, '');
  return resultado.replace(/(?:<br\s*\/?>(?:\s*)){3,}/gi, '<br><br>');
}

function obterTokensEditorMinuta(id){
  const editor = document.getElementById(id);
  const tokens = [];
  if(!editor) return tokens;
  if(!editor.childNodes) return [{texto:editor.innerText || ''}];
  function percorrer(no, estilo = {}){
    if(no.nodeType === 3){ tokens.push({texto:no.nodeValue, ...estilo}); return; }
    if(no.nodeType !== 1) return;
    if(no.tagName === 'TABLE'){
      const linhas = [...no.querySelectorAll('tr')].map(linha => [...linha.querySelectorAll('th,td')].map(celula => ({texto:(celula.innerText || celula.textContent || '').trim(), cabecalho:celula.tagName === 'TH'})));
      if(linhas.length) tokens.push({tabela:linhas});
      return;
    }
    if(no.tagName === 'BR'){ tokens.push({texto:'\n', ...estilo}); return; }
    if(no.classList?.contains('ata-bloco')) tokens.push({inicioBloco:true});
    if(no.classList?.contains('ata-secao-titulo')) tokens.push({inicioTituloSecao:true});
    if(no.tagName === 'LI') tokens.push({inicioItem:true});
    const proximo = {
      negrito: estilo.negrito || ['B','STRONG'].includes(no.tagName),
      italico: estilo.italico || ['I','EM'].includes(no.tagName),
      sublinhado: estilo.sublinhado || no.tagName === 'U',
      titulo: estilo.titulo || no.classList?.contains('ata-titulo'),
      compacto: estilo.compacto || no.classList?.contains('letras-compactas')
    };
    [...no.childNodes].forEach(filho => percorrer(filho, proximo));
    if(['DIV','P'].includes(no.tagName)) tokens.push({texto:'\n', ...proximo});
    if(no.classList?.contains('ata-secao-titulo')) tokens.push({fimTituloSecao:true});
    if(no.tagName === 'LI') tokens.push({fimItem:true});
    if(no.classList?.contains('ata-bloco')) tokens.push({fimBloco:true});
  }
  [...editor.childNodes].forEach(no => percorrer(no));
  const limpos = [];
  tokens.forEach(token => {
    if(token.fimBloco){
      while(limpos.length && limpos.at(-1).texto !== undefined && !String(limpos.at(-1).texto).trim()) limpos.pop();
      if(limpos.length && limpos.at(-1).texto !== undefined) limpos.at(-1).texto = String(limpos.at(-1).texto).trimEnd();
    }
    limpos.push(token);
  });
  return limpos;
}