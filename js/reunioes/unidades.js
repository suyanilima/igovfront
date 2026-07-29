/* ===== CADASTRO E MANUTENÇÃO DE UNIDADES ===== */

const CARGOS_UNIDADE = [
  'Presidente','Vice-Presidente e Corregedor(a)','Diretor(a)-Geral','Secretário(a)','Coordenador(a)',
  'Chefe de Seção','Assistente','Assessor(a)','Estagiário(a)','Assistente Administrativo',
  'Juiz(a)','Desembargador(a)','Juiz(a) Auxiliar da Presidência','Procurador(a)','Promotor(a)',
  'Gestor(a)','Advogado(a)','Terceirizado(a)','Convidado(a)','Usuário Manual'
];
const CODIGOS_UNIDADES_FIXAS = ['CGTIC','CGOVTIC'];
let cargosLegadosUnidade = [];

function normalizarCodigoUnidade(nome){
  return limitarTexto(String(nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9 ]+/g, '').replace(/\s+/g, ' ').trim(), 40);
}

function carregarUnidades(){
  try{
    const dados = JSON.parse(localStorage.getItem(UNIDADES_STORAGE_KEY) || '[]');
    unidadesPersonalizadas = Array.isArray(dados) ? dados.map(item => ({
      codigo:normalizarCodigoUnidade(item.codigo || item.nome),
      nome:limitarTexto(String(item.nome || '').trim(), 50),
      periodicidade:limitarTexto(String(item.periodicidade || '').trim(), 30),
      membros:Array.isArray(item.membros) ? item.membros.slice(0, 30).map(m => ({ cargo:limitarTexto(String(m.cargo || '').trim(), 50), nome:limitarTexto(String(m.nome || '').trim(), 50) })).filter(m => m.cargo) : [],
      convidados:normalizarParticipantes(item.convidados)
    })).filter(item => item.codigo && item.nome) : [];
  }catch(e){ unidadesPersonalizadas = []; }
  unidadesPersonalizadas.forEach(unidade => {
    FREQUENCIAS_REUNIAO[unidade.codigo] = unidade.periodicidade || 'Personalizada';
    CARGOS_FIXOS_REUNIAO[unidade.codigo] = unidade.membros;
  });
  renderUnidadesReuniao();
}

function salvarUnidades(){
  try{ localStorage.setItem(UNIDADES_STORAGE_KEY, JSON.stringify(unidadesPersonalizadas)); return true; }
  catch(e){ toast('Não foi possível salvar a unidade neste navegador.', 'vencido'); return false; }
}

function renderUnidadesReuniao(){
  const lista = document.getElementById('reuniao-unidades-personalizadas');
  if(lista) lista.innerHTML = unidadesPersonalizadas.filter(unidade=>!CODIGOS_UNIDADES_FIXAS.includes(unidade.codigo)).map(unidade => `<div class="reuniao-unidade-card"><button type="button" class="reuniao-tipo-btn" data-tipo="${escapeHtml(unidade.codigo)}" onclick="selecionarTipoReuniao('${escapeHtml(unidade.codigo)}')"><strong>${escapeHtml(unidade.nome)}</strong><span>${escapeHtml(unidade.periodicidade || 'Periodicidade personalizada')}</span></button><div class="reuniao-unidade-acoes"><button type="button" onclick="editarUnidade('${escapeHtml(unidade.codigo)}')">Editar</button><button type="button" class="excluir" onclick="excluirUnidade('${escapeHtml(unidade.codigo)}')">Excluir</button></div></div>`).join('');
  CODIGOS_UNIDADES_FIXAS.forEach(codigo=>{
    const configuracao=unidadesPersonalizadas.find(item=>item.codigo===codigo);
    const nome=document.getElementById(`unidade-fixa-nome-${codigo}`);
    const periodicidade=document.getElementById(`unidade-fixa-periodicidade-${codigo}`);
    if(nome) nome.textContent=configuracao?.nome || codigo;
    if(periodicidade) periodicidade.textContent=`Reuniões ${(configuracao?.periodicidade || FREQUENCIAS_REUNIAO[codigo]).toLowerCase()}`;
  });
  const select = document.getElementById('edit-r-frequencia');
  if(select?.querySelectorAll && select?.appendChild){
    select.querySelectorAll('option[data-personalizada]').forEach(option => option.remove());
    unidadesPersonalizadas.filter(unidade=>!CODIGOS_UNIDADES_FIXAS.includes(unidade.codigo)).forEach(unidade => {
      const option = document.createElement('option'); option.value = unidade.codigo; option.dataset.personalizada = 'true'; option.textContent = `${unidade.nome} — ${unidade.periodicidade || 'Personalizada'}`; select.appendChild(option);
    });
  }
  atualizarFiltroTiposReuniao();
}

function atualizarFiltroTiposReuniao(){
  const select=document.getElementById('reuniao-filtro-tipo');
  if(!select) return;
  const valorAtual=select.value;
  const codigos=[...new Set([
    ...CODIGOS_UNIDADES_FIXAS,
    ...unidadesPersonalizadas.map(unidade=>unidade.codigo),
    ...reunioes.map(reuniao=>reuniao.frequencia)
  ].filter(Boolean))];
  const rotuloCodigo=codigo=>unidadesPersonalizadas.find(unidade=>unidade.codigo===codigo)?.nome || codigo;
  select.innerHTML='<option value="">Todas</option>'+codigos.map(codigo=>`<option value="${escapeHtml(codigo)}">${escapeHtml(rotuloCodigo(codigo))}</option>`).join('');
  if(codigos.includes(valorAtual)) select.value=valorAtual;
}

function abrirCadastroUnidade(){
  unidadeEditandoCodigo = null;
  cargosLegadosUnidade = [];
  membrosNovaUnidade = [{cargo:'', nome:''}];
  ['unidade-nome','unidade-periodicidade','unidade-periodicidade-outra'].forEach(id => { const campo=document.getElementById(id); if(campo) campo.value=''; });
  alterarPeriodicidadeUnidade('');
  document.getElementById('unidade-modal-titulo').textContent = 'Cadastrar unidade';
  document.getElementById('unidade-salvar-btn').textContent = 'Salvar unidade';
  renderMembrosNovaUnidade(); abrirModalElemento('unidade-modal-overlay');
}
function fecharCadastroUnidade(){ fecharModalElemento('unidade-modal-overlay'); unidadeEditandoCodigo = null; }
function editarUnidade(codigo){
  const salva=unidadesPersonalizadas.find(item=>item.codigo===codigo);
  const unidade=salva || (CODIGOS_UNIDADES_FIXAS.includes(codigo) ? {codigo,nome:codigo,periodicidade:FREQUENCIAS_REUNIAO[codigo],membros:CARGOS_FIXOS_REUNIAO[codigo]} : null); if(!unidade) return;
  unidadeEditandoCodigo=codigo;
  document.getElementById('unidade-nome').value=unidade.nome;
  const opcoesPeriodicidade=['Semanal','Quinzenal','Mensal','Bimestral','Trimestral','Semestral','Anual','Sob demanda'];
  const periodicidadePadrao=opcoesPeriodicidade.includes(unidade.periodicidade);
  document.getElementById('unidade-periodicidade').value=periodicidadePadrao?unidade.periodicidade:'Outra';
  document.getElementById('unidade-periodicidade-outra').value=periodicidadePadrao?'':unidade.periodicidade;
  alterarPeriodicidadeUnidade(periodicidadePadrao?unidade.periodicidade:'Outra');
  membrosNovaUnidade=unidade.membros.map(item=>({...item}));
  cargosLegadosUnidade=[...new Set(membrosNovaUnidade.map(item=>item.cargo).filter(Boolean))];
  document.getElementById('unidade-modal-titulo').textContent='Editar unidade';
  document.getElementById('unidade-salvar-btn').textContent='Salvar alterações';
  renderMembrosNovaUnidade(); abrirModalElemento('unidade-modal-overlay');
}
function excluirUnidade(codigo){
  const unidade=unidadesPersonalizadas.find(item=>item.codigo===codigo); if(!unidade) return;
  unidadeExcluindoCodigo=codigo;
  document.getElementById('delete-unidade-nome').textContent=unidade.nome;
  abrirModalElemento('delete-unidade-modal-overlay');
}
function fecharExclusaoUnidade(){ fecharModalElemento('delete-unidade-modal-overlay'); unidadeExcluindoCodigo=null; }
function confirmarExclusaoUnidade(){
  const codigo=unidadeExcluindoCodigo;
  const indice=unidadesPersonalizadas.findIndex(item=>item.codigo===codigo); if(indice<0){ fecharExclusaoUnidade(); return; }
  const removida=unidadesPersonalizadas.splice(indice,1)[0]; delete FREQUENCIAS_REUNIAO[codigo]; delete CARGOS_FIXOS_REUNIAO[codigo];
  if(!salvarUnidades()){ unidadesPersonalizadas.splice(indice,0,removida); FREQUENCIAS_REUNIAO[codigo]=removida.periodicidade; CARGOS_FIXOS_REUNIAO[codigo]=removida.membros; return; }
  renderUnidadesReuniao(); fecharExclusaoUnidade(); toast('Unidade excluída.', 'valido');
}
function adicionarMembroNovaUnidade(){ if(membrosNovaUnidade.length < 30){ membrosNovaUnidade.push({cargo:'',nome:''}); renderMembrosNovaUnidade(); } }
function removerMembroNovaUnidade(indice){ membrosNovaUnidade.splice(indice,1); renderMembrosNovaUnidade(); }
function atualizarMembroNovaUnidade(indice, campo, valor){ if(membrosNovaUnidade[indice]) membrosNovaUnidade[indice][campo]=limitarTexto(valor,50); }
function renderMembrosNovaUnidade(){
  const lista=document.getElementById('unidade-membros-lista'); if(!lista) return;
  lista.innerHTML=membrosNovaUnidade.map((m,i)=>`<div class="unidade-membro-linha"><div class="cargo-busca-wrap"><input id="unidade-cargo-${i}" maxlength="50" placeholder="Cargo" value="${escapeHtml(m.cargo)}" autocomplete="off" aria-label="Digite ou escolha o cargo" oninput="atualizarMembroNovaUnidade(${i},'cargo',this.value)"><div id="unidade-cargo-sugestoes-${i}" class="cargo-sugestoes" role="listbox" hidden></div></div><input maxlength="50" placeholder="Nome do membro" value="${escapeHtml(m.nome)}" oninput="atualizarMembroNovaUnidade(${i},'nome',this.value)"><button type="button" onclick="removerMembroNovaUnidade(${i})" aria-label="Remover membro">×</button></div>`).join('');
  membrosNovaUnidade.forEach((_,i)=>configurarBuscaCargoUnidade(i));
}
function configurarBuscaCargoUnidade(indice){
  const campo=document.getElementById(`unidade-cargo-${indice}`);
  const sugestoes=document.getElementById(`unidade-cargo-sugestoes-${indice}`);
  if(!campo || !sugestoes || typeof campo.addEventListener!=='function') return;
  const esconder=()=>{ sugestoes.hidden=true; };
  const atualizar=()=>{
    const termo=campo.value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    const cargosDisponiveis=[...new Set([...CARGOS_UNIDADE,...cargosLegadosUnidade])];
    const resultados=cargosDisponiveis.filter(cargo=>!termo || cargo.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().includes(termo));
    sugestoes.innerHTML=resultados.map(cargo=>`<button type="button" role="option" data-cargo="${escapeHtml(cargo)}">${escapeHtml(cargo)}</button>`).join('');
    if(typeof campo.getBoundingClientRect==='function'){
      const modal=campo.closest?.('.modal');
      const campoRect=campo.getBoundingClientRect();
      const modalRect=modal?.getBoundingClientRect?.() || {top:8,bottom:window.innerHeight-8};
      const espacoAbaixo=Math.max(80,modalRect.bottom-campoRect.bottom-12);
      const espacoAcima=Math.max(80,campoRect.top-modalRect.top-12);
      const abrirAcima=espacoAbaixo<180 && espacoAcima>espacoAbaixo;
      sugestoes.classList.toggle('abre-acima',abrirAcima);
      sugestoes.style.maxHeight=`${Math.min(220,abrirAcima?espacoAcima:espacoAbaixo)}px`;
    }
    sugestoes.hidden=resultados.length===0;
  };
  campo.addEventListener('focus',atualizar);
  campo.addEventListener('input',atualizar);
  campo.addEventListener('blur',()=>setTimeout(esconder,120));
  sugestoes.addEventListener('mousedown',evento=>{
    const opcao=evento.target.closest('[data-cargo]'); if(!opcao) return;
    evento.preventDefault(); campo.value=opcao.dataset.cargo;
    atualizarMembroNovaUnidade(indice,'cargo',campo.value); esconder(); campo.focus();
  });
}
function alternarOpcoesPeriodicidadeUnidade(){
  const campo=document.getElementById('unidade-periodicidade');
  const opcoes=document.getElementById('unidade-periodicidade-opcoes');
  if(!campo || !opcoes) return;
  opcoes.hidden=!opcoes.hidden;
  campo.setAttribute('aria-expanded',String(!opcoes.hidden));
}
function selecionarPeriodicidadeUnidade(valor){
  const campo=document.getElementById('unidade-periodicidade');
  const opcoes=document.getElementById('unidade-periodicidade-opcoes');
  if(campo) campo.value=valor;
  if(opcoes) opcoes.hidden=true;
  campo?.setAttribute('aria-expanded','false');
  alterarPeriodicidadeUnidade(valor);
}
function tratarTecladoPeriodicidadeUnidade(evento){
  if(['Enter',' ','ArrowDown'].includes(evento.key)){ evento.preventDefault(); alternarOpcoesPeriodicidadeUnidade(); }
  if(evento.key==='Escape'){
    const opcoes=document.getElementById('unidade-periodicidade-opcoes');
    if(opcoes) opcoes.hidden=true;
    evento.currentTarget?.setAttribute('aria-expanded','false');
  }
}
function alterarPeriodicidadeUnidade(valor){
  const campo=document.getElementById('unidade-periodicidade-outra'); if(!campo) return;
  const personalizada=valor==='Outra'; campo.classList.toggle('oculto',!personalizada); campo.required=personalizada;
  if(!personalizada) campo.value='';
}
function cadastrarUnidade(){
  const nome=limitarTexto(document.getElementById('unidade-nome').value.trim(),50);
  const selecaoPeriodicidade=document.getElementById('unidade-periodicidade').value;
  const periodicidade=limitarTexto((selecaoPeriodicidade==='Outra'?document.getElementById('unidade-periodicidade-outra').value:selecaoPeriodicidade).trim(),30);
  const cargosPermitidos=[...new Set([...CARGOS_UNIDADE,...cargosLegadosUnidade])];
  const cargoInvalido=membrosNovaUnidade.find(m=>m.cargo.trim() && !cargosPermitidos.some(cargo=>cargo.toLowerCase()===m.cargo.trim().toLowerCase()));
  if(cargoInvalido){ toast('Digite e escolha um cargo válido da lista.', 'alerta'); return; }
  const membros=membrosNovaUnidade.map(m=>({cargo:cargosPermitidos.find(cargo=>cargo.toLowerCase()===m.cargo.trim().toLowerCase()) || '',nome:limitarTexto(formatarNomeProprio(m.nome.trim()),50)})).filter(m=>m.cargo && m.nome);
  if(!nome || !periodicidade || !membros.length){ toast('Informe o nome, a periodicidade e pelo menos um membro com cargo.', 'alerta'); return; }
  const codigo=unidadeEditandoCodigo || normalizarCodigoUnidade(nome);
  if(!unidadeEditandoCodigo && FREQUENCIAS_REUNIAO[codigo]){ toast('Já existe uma unidade com esse nome.', 'alerta'); return; }
  const unidade={codigo,nome,periodicidade,membros,convidados:[]};
  const indice=unidadesPersonalizadas.findIndex(item=>item.codigo===codigo); const anterior=indice>=0?unidadesPersonalizadas[indice]:null;
  if(indice>=0) unidadesPersonalizadas[indice]=unidade; else unidadesPersonalizadas.push(unidade);
  FREQUENCIAS_REUNIAO[codigo]=periodicidade; CARGOS_FIXOS_REUNIAO[codigo]=membros;
  if(!salvarUnidades()){ if(indice>=0) unidadesPersonalizadas[indice]=anterior; else unidadesPersonalizadas.pop(); return; }
  renderUnidadesReuniao(); fecharCadastroUnidade(); selecionarTipoReuniao(codigo); toast(indice>=0?'Unidade atualizada com sucesso.':'Unidade cadastrada com sucesso.', 'valido');
}