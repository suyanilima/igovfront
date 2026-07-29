/* ===== EXPORTAÇÃO DE MINUTAS E INICIALIZAÇÃO DO MÓDULO ===== */

function textoAtaParaHtml(valor){
  return escapeHtml(String(valor || '')).replace(/\r?\n/g, '<br>');
}

function gerarHtmlDocumentoAta(){
  const reuniao = obterReuniaoMinutaAtual();
  if(!reuniao) return '';
  const conteudoFinal = obterHtmlEditorMinuta('minuta-reuniao-texto');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Ata - PRESI/${escapeHtml(reuniao.frequencia)}</title><style>
    @page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0}body{color:#111;font-family:"Times New Roman",serif;font-size:12pt;line-height:1.4}.pagina{width:100%;margin:0 auto;padding:18mm 16mm}.conteudo{text-align:justify;overflow-wrap:anywhere}.ata-titulo{text-align:center;font-size:15pt;margin-bottom:18px}.ata-bloco{border:1px solid #777;padding:8px 10px;margin:0}.ata-bloco+.ata-bloco{border-top:0}.ata-secao-titulo{margin:0 0 5px}.ata-secao-conteudo{margin:0}.letras-compactas{letter-spacing:-.35pt}.texto-marcado,mark{background:#fff19a}.texto-menor{font-size:10pt}.texto-maior{font-size:15pt}table{width:100%;margin:7px 0;border-collapse:collapse}th,td{padding:6px;border:1px solid #777;vertical-align:top}ul{margin:6px 0;padding-left:24px}li{margin:3px 0}@media print{.pagina{padding:18mm 16mm}}
  </style></head><body><main class="pagina">
    <section class="conteudo">${conteudoFinal}</section>
  </main></body></html>`;
}

function baixarMinutaWord(){
  const reuniao = obterReuniaoMinutaAtual();
  const html = gerarHtmlDocumentoAta();
  if(!reuniao || !html) return;
  const url = URL.createObjectURL(new Blob(['\ufeff', html], {type:'application/msword;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = `minuta-ata-${reuniao.frequencia.toLowerCase()}-${reuniao.data}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast('Arquivo Word gerado.', 'valido');
}

function imprimirMinutaPdf(){
  const reuniao = obterReuniaoMinutaAtual();
  const JsPdf = window.jspdf?.jsPDF;
  if(!reuniao || !JsPdf){
    toast('Não foi possível carregar o gerador de PDF.', 'vencido');
    return;
  }
  const doc = new JsPdf({orientation:'portrait', unit:'mm', format:'a4', compress:true});
  const margemX = 16;
  const largura = 178;
  const limiteY = 276;
  let y = 20;

  function novaPagina(){ doc.addPage(); y = 20; }
  function garantirEspaco(altura){ if(y + altura > limiteY) novaPagina(); }
  function escrever(texto, opcoes = {}){
    const tamanho = opcoes.tamanho || 11;
    const estilo = opcoes.negrito ? 'bold' : 'normal';
    doc.setFont('times', estilo);
    doc.setFontSize(tamanho);
    const linhas = doc.splitTextToSize(String(texto || ''), largura - (opcoes.recuo || 0));
    const alturaLinha = tamanho * .42;
    linhas.forEach(linha => {
      garantirEspaco(alturaLinha + 1);
      doc.text(linha, margemX + (opcoes.recuo || 0), y);
      y += alturaLinha;
    });
    y += opcoes.depois ?? 2;
  }
  function separador(){ garantirEspaco(4); doc.setDrawColor(150); doc.line(margemX, y, margemX + largura, y); y += 5; }
  function tituloSecao(titulo){ separador(); escrever(titulo.toUpperCase(), {negrito:true, tamanho:11, depois:3}); }
  function escreverEditor(id){
    const tokens = obterTokensEditorMinuta(id);
    const tamanho = 11;
    const alturaLinha = 4.8;
    let dentroBloco = false;
    let dentroItem = false;
    let inicioBloco = null;
    let x = margemX;
    function baseX(){ return margemX + (dentroBloco ? 3 : 0) + (dentroItem ? 5 : 0); }
    function maxX(){ return dentroBloco ? margemX + largura - 3 : margemX + largura; }
    function novaLinha(){ y += alturaLinha; x = baseX(); garantirEspaco(alturaLinha); }
    garantirEspaco(alturaLinha);
    tokens.forEach(token => {
      if(token.inicioTituloSecao){
        if(x > baseX()) novaLinha();
        return;
      }
      if(token.fimTituloSecao){
        y += 1.8;
        x = baseX();
        garantirEspaco(alturaLinha);
        return;
      }
      if(token.tabela){
        if(x > baseX()) novaLinha();
        const colunas = Math.max(...token.tabela.map(linha => linha.length));
        const larguraTabela = maxX() - baseX();
        const larguraCelula = larguraTabela / colunas;
        token.tabela.forEach(linha => {
          doc.setFontSize(9);
          const conteudos = Array.from({length:colunas}, (_, indice) => {
            const celula = linha[indice] || {texto:'',cabecalho:false};
            doc.setFont('times', celula.cabecalho ? 'bold' : 'normal');
            return {...celula, linhas:doc.splitTextToSize(celula.texto, larguraCelula - 4)};
          });
          const altura = Math.max(8, ...conteudos.map(celula => Math.max(1, celula.linhas.length) * 4 + 4));
          garantirEspaco(altura + 2);
          conteudos.forEach((celula, indice) => {
            const celulaX = baseX() + indice * larguraCelula;
            doc.setDrawColor(130);
            doc.rect(celulaX, y, larguraCelula, altura);
            doc.setFont('times', celula.cabecalho ? 'bold' : 'normal');
            doc.setFontSize(9);
            doc.text(celula.linhas, celulaX + 2, y + 4);
          });
          y += altura;
        });
        y += 4;
        x = baseX();
        return;
      }
      if(token.inicioBloco){
        garantirEspaco(12);
        dentroBloco = true;
        y += 5;
        x = baseX();
        inicioBloco = {pagina:doc.internal.getCurrentPageInfo().pageNumber, y:y - 5};
        return;
      }
      if(token.inicioItem){
        if(x > baseX()) novaLinha();
        dentroItem = true;
        x = baseX();
        doc.setFont('times', 'normal');
        doc.setFontSize(tamanho);
        doc.text('•', x - 4, y);
        return;
      }
      if(token.fimItem){
        dentroItem = false;
        y += alturaLinha;
        x = baseX();
        garantirEspaco(alturaLinha);
        return;
      }
      if(token.fimBloco){
        y += 4;
        const paginaAtual = doc.internal.getCurrentPageInfo().pageNumber;
        const paginaRetorno = paginaAtual;
        doc.setDrawColor(130);
        for(let pagina = inicioBloco.pagina; pagina <= paginaAtual; pagina++){
          doc.setPage(pagina);
          const topo = pagina === inicioBloco.pagina ? inicioBloco.y : 16;
          const fim = pagina === paginaAtual ? y : limiteY + 2;
          doc.rect(margemX, topo, largura, Math.max(4, fim - topo));
        }
        doc.setPage(paginaRetorno);
        dentroBloco = false;
        inicioBloco = null;
        x = margemX;
        return;
      }
      if(token.titulo && String(token.texto || '').trim()){
        garantirEspaco(8);
        doc.setFont('times', 'bold');
        doc.setFontSize(15);
        doc.text(String(token.texto).trim(), 105, y, {align:'center'});
        y += 10;
        x = margemX;
        return;
      }
      const partes = String(token.texto || '').split(/(\n|\s+)/).filter(parte => parte !== '');
      partes.forEach(parte => {
        if(parte.includes('\n')){ novaLinha(); return; }
        const estilo = token.negrito && token.italico ? 'bolditalic' : token.negrito ? 'bold' : token.italico ? 'italic' : 'normal';
        doc.setFont('times', estilo);
        doc.setFontSize(tamanho);
        doc.setCharSpace(token.compacto ? -.12 : 0);
        const larguraParte = doc.getTextWidth(parte);
        if(x > baseX() && x + larguraParte > maxX()) novaLinha();
        if(/^\s+$/.test(parte) && x === baseX()) return;
        const larguraDisponivel = maxX() - baseX();
        if(larguraParte > larguraDisponivel){
          doc.splitTextToSize(parte, larguraDisponivel).forEach((linha, indice) => {
            if(indice) novaLinha();
            doc.text(linha, x, y);
            if(token.sublinhado) doc.line(x, y + .7, x + doc.getTextWidth(linha), y + .7);
            x += doc.getTextWidth(linha);
          });
          return;
        }
        doc.text(parte, x, y);
        if(token.sublinhado && !/^\s+$/.test(parte)) doc.line(x, y + .7, x + larguraParte, y + .7);
        x += larguraParte;
      });
    });
    doc.setCharSpace(0);
    y += alturaLinha + 3;
  }

  escreverEditor('minuta-reuniao-texto');

  const totalPaginas = doc.getNumberOfPages();
  for(let pagina = 1; pagina <= totalPaginas; pagina++){
    doc.setPage(pagina);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90);
    doc.text(`${pagina}/${totalPaginas}`, 194, 291, {align:'right'});
  }
  doc.save(`minuta-ata-${reuniao.frequencia.toLowerCase()}-${reuniao.data}.pdf`);
  toast('PDF baixado com sucesso.', 'valido');
}

document.addEventListener('DOMContentLoaded', () => {
  carregarUnidades();
  montarPaginaMinuta();
  carregarHistoricoMinutas();
  carregarReunioes();
  renderParticipantesCadastro();
  atualizarContadorPauta();
  atualizarEstadoEdicaoReuniao();
  document.getElementById('r-participante-input')?.addEventListener('keydown', evento => {
    if(evento.key !== 'Enter') return;
    evento.preventDefault();
    adicionarParticipanteReuniao();
  });
  document.getElementById('edit-r-participante-input')?.addEventListener('keydown', evento => {
    if(evento.key !== 'Enter') return;
    evento.preventDefault();
    adicionarParticipanteEdicaoReuniao();
  });
});