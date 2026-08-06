/* ===== PERSISTÊNCIA DOS DOCUMENTOS ===== */

async function salvar(){
  try{
    const conteudo = JSON.stringify(docs);
    if(window.storage?.set){
      await window.storage.set(STORAGE_KEY, conteudo, false);
    } else {
      localStorage.setItem(STORAGE_KEY, conteudo);
    }
    return true;
  }catch(e){ console.error('Erro ao salvar', e); }
  toast('Não foi possível salvar os dados neste navegador.', 'vencido');
  return false;
}

async function carregar(){
  try{
    const conteudo = window.storage?.get
      ? (await window.storage.get(STORAGE_KEY, false))?.value
      : localStorage.getItem(STORAGE_KEY);
    const dados = conteudo ? JSON.parse(conteudo) : [];
    docs = Array.isArray(dados) ? dados : [];
    docs.forEach(doc => {
      doc.nome = limitarTexto(doc.nome, LIMITES_CAMPOS.nome);
      doc.sei = normalizarNumeroSei(doc.sei);
      doc.baseLegalNumero = limitarTexto(doc.baseLegalNumero, LIMITES_CAMPOS.baseLegalNumero);
      doc.gestorNome = limitarTexto(doc.gestorNome, LIMITES_CAMPOS.gestorNome);
      doc.gestorSetor = limitarTexto(doc.gestorSetor, LIMITES_CAMPOS.gestorSetor);
      doc.unidade = typeof localizarUnidadeDocumento === 'function' ? (localizarUnidadeDocumento(doc.unidade)?.codigo || '') : limitarTexto(doc.unidade, 30);
      doc.gestorEmail = limitarTexto(doc.gestorEmail, LIMITES_CAMPOS.gestorEmail);
      doc.gestorWhatsapp = limitarTexto(doc.gestorWhatsapp, LIMITES_CAMPOS.gestorWhatsapp);
      doc.descricao = limitarTexto(doc.descricao, LIMITES_CAMPOS.descricao);
      if(doc.semNormativo || doc.tipo === 'Sem normativo'){
        doc.semNormativo = true;
        doc.tipo = 'Sem normativo';
        doc.sei = '';
        doc.dataVigencia = '';
        doc.validade = '';
        doc.data = '';
        doc.baseLegal = 'Sem normativo';
        doc.baseLegalNumero = '';
      }
    });
  }catch(e){
    console.error('Erro ao carregar', e);
    docs = [];
  }
  render();
}

