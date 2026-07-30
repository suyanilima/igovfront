/* ===== NÚCLEO E ESTADO COMPARTILHADO DE REUNIÕES ===== */

/* ===== REUNIÕES: cadastro e histórico local ===== */

const REUNIOES_STORAGE_KEY = 'igov:reunioes';
const MINUTAS_STORAGE_KEY = 'igov:minutas';
const UNIDADES_STORAGE_KEY = 'igov:unidades-reuniao';
const FREQUENCIAS_REUNIAO = { CGOVTIC:'Bimestral', CGTIC:'Quinzenal' };
const SETORES_CONVIDADOS = Object.fromEntries([
  ['1ª ZE','1ª ZONA ELEITORAL'],['2ª ZE','2ª ZONA ELEITORAL'],['3ª ZE','3ª ZONA ELEITORAL'],
  ['4ª ZE','4ª ZONA ELEITORAL'],['5ª ZE','5ª ZONA ELEITORAL'],['6ª ZE','6ª ZONA ELEITORAL'],
  ['7ª ZE','7ª ZONA ELEITORAL'],['8ª ZE','8ª ZONA ELEITORAL'],['9ª ZE','9ª ZONA ELEITORAL'],
  ['AGECON','Agente de Contratação'],['AGEL','ASSESSORIA DE GESTÃO ELEITORAL'],
  ['ASCOM','ASSESSORIA DE COMUNICAÇÃO SOCIAL'],['ASCRE','ASSESSORIA DA CORREGEDORIA REGIONAL ELEITORAL'],
  ['ASGIM','ASSESSORIA DE GESTÃO DE IMÓVEIS'],
  ['ASGOVSAOF','Assessoria de Governança e Planejamento da Secretaria de Administração, Orçamento e Finanças - ASGOVSAOF'],
  ['ASJUIZ','ASSISTÊNCIA AOS JUÍZES-MEMBROS'],['ASJUR','ASSESSORIA JURÍDICA'],
  ['ASPGOVTI','ASSISTÊNCIA DE PLANEJAMENTO E GOVERNANÇA'],
  ['ASPLAN','ASSESSORIA DE PLANEJAMENTO, ESTRATÉGIA E GESTÃO'],['ASPRES','ASSESSORIA DA PRESIDÊNCIA'],
  ['ASSAI','ASSISTÊNCIA DE SUSTENTABILIDADE, ACESSIBILIDADE E INCLUSÃO - ASSAI'],
  ['CAE','SETOR DE PROTOCOLO DA CAE'],['CAVE','Comissão de Auditoria da Votação Eletrônica - CAVE'],
  ['CGE','COMITÊ GESTOR DA ESTRATÉGIA'],['CGLAIS','COMITÊ GESTOR LOCAL DE ATENÇÃO INTEGRAL À SAÚDE'],
  ['CGOVTIC','COMITÊ DE GOVERNANÇA DE TECNOLOGIA DA INFORMAÇÃO E COMUNICAÇÃO'],
  ['CGPDP','Comitê Gestor de Proteção de Dados Pessoais'],
  ['CGPLS','Comissão Gestora do Plano de Logística Sustentável'],['CGRP','COMITÊ GESTOR REGIONAL DO PJE'],
  ['CGRT','Comissão de Gestão do Regime de Teletrabalho'],
  ['CGTIC','COMITÊ GESTOR DE TECNOLOGIA DA INFORMAÇÃO E COMUNICAÇÃO'],
  ['CIE','COORDENADORIA DE INFRAESTRUTURA'],
  ['CIFBA','COMISSÃO DE INVENTÁRIO FÍSICO DOS BENS DE ALMOXARIFADO'],
  ['CIFBM','COMISSÃO DE INVENTÁRIO FÍSICO DOS BENS MÓVEIS'],
  ['CMJEAC','Comissão de Gestão da Memória da Justiça Eleitoral do Acre'],
  ['COAUDI','COORDENADORIA DE CONTROLE INTERNO E AUDITORIA'],['COCRE','COORDENADORIA DA CORREGEDORIA'],
  ['COELE','COORDENADORIA DE ELEIÇÕES'],['COFIN','COORDENADORIA DE ORÇAMENTO E FINANÇAS'],
  ['COGEP','COORDENADORIA DE GESTÃO DE PESSOAS'],['COMAP','COORDENADORIA DE MATERIAL E PATRIMÔNIO'],
  ['COSEG','COORDENADORIA DE SERVIÇOS GERAIS'],['COSES','COORDENADORIA DAS SESSÕES'],
  ['COSET','COMITÊ SETORIAL'],['CP','Comissão Processante'],
  ['CPEAD','Comissão de Prevenção e Enfrentamento do Assédio e da Discriminação'],
  ['CPEAMAS-1G','COMISSÃO DE PREVENÇÃO E ENFRENTAMENTO DO ASSÉDIO MORAL E DO ASSÉDIO SEXUAL'],
  ['CPES','COMISSÃO PERMANENTE DE ÉTICA E SINDICÂNCIA'],['CPFEM','Comissão de Participação Feminina'],
  ['CPL','COMISSÃO PERMANENTE DE LICITAÇÃO'],
  ['CPPG','COMITÊ GESTOR REGIONAL DE ATENÇÃO PRIORITÁRIA AO PRIMEIRO GRAU DE JURISDIÇÃO'],
  ['CPS','COMISSÃO PERMANENTE DE SEGURANÇA'],
  ['CRIP','COORDENADORIA DE REGISTROS E INFORMAÇÕES PROCESSUAIS'],
  ['CRPIR','COMITÊ REGIONAL DE PROMOÇÃO À IGUALDADE RACIAL'],
  ['CSCOR','Coordenadoria de Soluções Corporativas'],['CSI','Comissão de Segurança da Informação'],
  ['CTA','Comissão de Transporte e Alimentação'],['DBI','DESFAZIMENTO DE BENS INSERVÍVEIS'],
  ['EJE','ESCOLA JUDICIÁRIA ELEITORAL'],['EPSTI','ESCRITÓRIO DE PROJETOS DA STI'],
  ['GAAUX','GABINETE DA JUÍZA AUXILIAR'],['GACRE','GABINETE DA CORREGEDORIA REGIONAL ELEITORAL'],
  ['GADG','GABINETE DA DIRETORIA-GERAL'],['GAJAPRO','Gabinete dos Juízes Auxiliares da Propaganda'],
  ['GAJAUXCRE','Gabinete do Juiz Auxiliar da Corregedoria Regional Eleitoral'],
  ['GAJUD','GABINETE DA SECRETARIA JUDICIÁRIA'],['GAPRES','GABINETE DA PRESIDÊNCIA'],
  ['GASAOF','GABINETE DA SECRETARIA DE ADMINISTRAÇÃO, ORÇAMENTO E FINANÇAS'],
  ['GPINT','COMITÊ GESTOR DOS PORTAIS'],['GSTI','GABINETE DA SECRETARIA DE TECNOLOGIA DA INFORMAÇÃO'],
  ['GT - LGPD','Grupo de Trabalho - LGPD'],
  ['IN-NAUA','Laboratório de Inovação e Objetivos de Desenvolvimento Sustentável do Tribunal Regional Eleitoral do Acre (IN-NAUÁ)'],
  ['LGBTQIA+','Comissão Especial voltada à promoção dos direitos das pessoas LGBTQIA+'],
  ['MPE','MINISTÉRIO PÚBLICO ELEITORAL - MPE'],
  ['NISIPJ','NÚCLEO DE INTELIGÊNCIA DE SEGURANÇA INSTITUCIONAL E POLÍCIA JUDICIAL'],
  ['NREG','Núcleo Regional Eleitoral das Garantias'],['NULAB','Núcleo Laboratório de Inovação e Gestão da Qualidade'],
  ['OUVIDORIA','OUVIDORIA ELEITORAL'],['OUVIMULHER','Ouvidoria da Mulher'],
  ['PAD','PROCESSO ADMINISTRATIVO DISCIPLINAR'],['PROTO','SEÇÃO DE PROTOCOLO'],
  ['SAREMI','Seção de Apoio aos Inativos e Cadastro de Magistrados - SAREMI'],
  ['SASBEN','SEÇÃO DE ASSISTÊNCIA À SAÚDE E BENEFÍCIOS'],
  ['SCPE','SEÇÃO DE CADASTRO ELEITORAL E PROCESSOS ESPECÍFICOS'],['SCSEG','Seção de Cibersegurança'],
  ['SDBD','SEÇÃO DE DESENVOLVIMENTO E BANCO DE DADOS'],['SDP','SEÇÃO DE DIREITOS POLÍTICOS'],
  ['SEADE','SEÇÃO DE ADMINISTRAÇÃO DO EDIFÍCIO'],['SEANT','SEÇÃO DE ATAS E NOTAS TAQUIGRÁFICAS'],
  ['SEAPTIC','SEÇÃO DE AUDITORIA DE GESTÃO DE PESSOA E TECNOLOGIA DA INFORMAÇÃO E COMUNICAÇÃO'],
  ['SECAP','SEÇÃO DE CONTROLE E ACOMPANHAMENTO DE PROCESSOS'],
  ['SECARF','SEÇÃO DE CADASTRO E REGISTROS FUNCIONAIS'],
  ['SECEP','SEÇÃO DE EXAME DE CONTAS ELEITORAIS E PARTIDÁRIAS'],['SECON','SEÇÃO DE CONTABILIDADE'],
  ['SEDES','SEÇÃO DE CAPACITAÇÃO E DESENVOLVIMENTO'],
  ['SEGLOF','SEÇÃO DE AUDITORIA DE GESTÃO DE LOGÍSTICA, ORÇAMENTO E FINANÇAS'],
  ['SEMAP','SEÇÃO DE MATERIAL E PATRIMÔNIO'],['SEPAG','SEÇÃO DE PAGAMENTOS'],
  ['SEREDE','SEÇÃO DE REDES'],['SESEL','SEÇÃO DE SISTEMAS ELEITORAIS'],['SETRAN','SEÇÃO DE TRANSPORTES'],
  ['SEUE','SEÇÃO DE URNAS ELETRÔNICAS'],
  ['SGEC','Seção de Gestão de Contratos - SGEC, subordinada à Coordenadoria de Material e Patrimônio'],
  ['SJIP','SEÇÃO DE JURISPRUDÊNCIA, INDEXAÇÃO E GERENCIAMENTO DE DADOS PARTIDÁRIOS'],
  ['SLC','SEÇÃO DE COMPRAS, LICITAÇÕES E CONTRATOS'],
  ['SLDAG','SEÇÃO DE LEGISLAÇÃO, DOCUMENTAÇÃO E ARQUIVO GERAL'],['SOC','SEÇÃO DE ORIENTAÇÃO E CORREIÇÃO'],
  ['SPEF','SEÇÃO DE PROGRAMAÇÃO E EXECUÇÃO FINANCEIRA'],
  ['SPEO','SEÇÃO DE PROGRAMAÇÃO E EXECUÇÃO ORÇAMENTÁRIA'],
  ['SRDP','SEÇÃO DE REVISÃO DA AUTUAÇÃO E DA DISTRIBUIÇÃO DE PROCESSOS'],
  ['SRJAR','SEÇÃO DE REGISTROS DE JULGAMENTOS, ACÓRDÃOS E RESOLUÇÕES'],
  ['SSEC','Seção de Sistemas Eleitorais e Corporativos'],['SSU','SEÇÃO DE SUPORTE AO USUÁRIO'],
  ['VICRE','Vice-Presidência e Corregedoria Regional Eleitoral'],
  ['Z-ARQUIVO-9ZE','UNIDADE DE ARQUIVO DA 9ª ZONA ELEITORAL'],
  ['Z-ARQUIVO-AGEL','SEÇÃO DE ARQUIVOS DA AGEL'],['Z-ARQUIVO-ASPLAN','UNIDADE DE ARQUIVO DA ASPLAN'],
  ['Z-ARQUIVO-COAUDI','UNIDADE DE ARQUIVO DA COAUDI'],['Z-ARQUIVO-COCRE','UNIDADE DE ARQUIVO DA COCRE'],
  ['Z-ARQUIVO-COGEP','UNIDADE DE ARQUIVO DA COGEP'],['Z-ARQUIVO-CPES','ARQUIVO DA UNIDADE CPES'],
  ['Z-ARQUIVO-EJE','UNIDADE DE ARQUIVO DA EJE'],['Z-ARQUIVO-GADG','UNIDADE DE ARQUIVOS DA DIRETORIA-GERAL'],
  ['Z-ARQUIVO-GAJUD','UNIDADE DE ARQUIVO DA GAJUD'],['Z-ARQUIVO-GAPRES','UNIDADE DE ARQUIVO DA GAPRES'],
  ['Z-ARQUIVO-GASAO','ARQUIVOS GASAO'],['Z-ARQUIVO-GERAL','ARQUIVO-GERAL'],
  ['Z-ARQUIVO-SDBD','UNIDADE DE ARQUIVO DA SDBD'],['Z-ARQUIVO-SEADE','UNIDADE DE ARQUIVO DA SEADE'],
  ['Z-ARQUIVO-SEGLOF','UNIDADE DE ARQUIVOS DA SEGLOF'],['Z-ARQUIVO-SETRAN','SEÇÃO DE ARQUIVO DA SETRAN'],
  ['Z-ARQUIVO-SOC','UNIDADE DE ARQUIVO DA SOC'],['Z-ARQUIVO-STI','ARQUIVO-STI'],
  ['STI','Secretaria de Tecnologia da Informação'],
  ['GPTI','Assistência de Planejamento e Governança de Tecnologia da Informação']
]);

function popularSetoresConvidados(){
  configurarBuscaSetor('r-participante-setor','r-participante-setor-sugestoes');
  configurarBuscaSetor('edit-r-participante-setor','edit-r-participante-setor-sugestoes');
}

function configurarBuscaSetor(campoId, sugestoesId){
  const campo = document.getElementById(campoId);
  const sugestoes = document.getElementById(sugestoesId);
  if(!campo || !sugestoes || campo._buscaSetorConfigurada || typeof campo.addEventListener !== 'function') return;
  campo._buscaSetorConfigurada = true;

  const esconder = ()=>{ sugestoes.hidden = true; };
  const atualizar = ()=>{
    const termo = campo.value.trim().toUpperCase();
    const resultados = Object.entries(SETORES_CONVIDADOS)
      .filter(([sigla,nome])=>!termo || sigla.includes(termo) || nome.toUpperCase().includes(termo));
    sugestoes.innerHTML = resultados.map(([sigla,nome])=>
      `<button type="button" role="option" data-sigla="${escapeHtml(sigla)}" title="${escapeHtml(nome)}">${escapeHtml(sigla)}</button>`
    ).join('');
    sugestoes.hidden = resultados.length === 0;
  };

  campo.addEventListener('input',()=>{
    campo.value = campo.value.toUpperCase();
    atualizar();
  });
  campo.addEventListener('focus',atualizar);
  campo.addEventListener('blur',()=>setTimeout(esconder,120));
  sugestoes.addEventListener('mousedown',evento=>{
    const opcao = evento.target.closest('[data-sigla]');
    if(!opcao) return;
    evento.preventDefault();
    campo.value = opcao.dataset.sigla;
    esconder();
    campo.focus();
  });
}
const CARGOS_FIXOS_REUNIAO = {
  CGTIC: [
    { cargo:'Secretaria de Tecnologia da Informação', nome:'Edcley da Silva Firmino' },
    { cargo:'Coordenadoria de Soluções Corporativas', nome:'Ilis Sandro Antônio Areno Ambrózio' },
    { cargo:'Coordenadoria de Infraestrutura', nome:'Francisco Vital de Mascarenhas Filho' }
  ],
  CGOVTIC: [
    { cargo:'Diretoria-Geral', nome:'Maria Veronica da Costa' },
    { cargo:'Secretaria de Tecnologia da Informação', nome:'Edcley da Silva Firmino' },
    { cargo:'Secretaria de Administração, Orçamento e Finanças', nome:'Carlos Venícius Ferreira Ribeiro' },
    { cargo:'Secretaria Judiciária', nome:'Sandro Roberto de Oliveira Bezerra' },
    { cargo:'Coordenadoria da Corregedoria Regional Eleitoral', nome:'Jonathas Santos Almeida de Carvalho' }
  ]
};
let unidadesPersonalizadas = [];
let membrosNovaUnidade = [];
let unidadeEditandoCodigo = null;
let unidadeExcluindoCodigo = null;
let reunioes = [];
let participantesReuniaoCadastro = [];
let participantesReuniaoEdicao = [];
let membrosReuniaoCadastro = [];
let membrosReuniaoEdicao = [];
let reuniaoEditandoId = null;
let excluindoReuniaoId = null;
let minutaReuniaoId = null;
let minutaHistoricoReuniao = null;
let minutaHistoricoIdAtivo = null;
let excluindoMinutaId = null;
let minutasHistorico = [];
let passoMinutaLiberado = 1;
let paginaReunioes = 1;
let itensPorPaginaReunioes = 10;
let paginaAtas = 1;
let itensPorPaginaAtas = 10;

function normalizarParticipantes(valor){
  const lista = Array.isArray(valor) ? valor : String(valor || '').split(/[\n,;]+/);
  return lista
    .map(nome => limitarTexto(String(nome).trim(), 180))
    .filter(Boolean)
    .slice(0, 30);
}

function normalizarFormatoReuniao(valor){
  return valor === 'Presencial' ? 'Presencial' : 'Online';
}

function rotuloFormatoReuniao(valor){
  return normalizarFormatoReuniao(valor) === 'Presencial' ? 'Presencial' : 'On-line';
}

function formatarConvidadoComSetor(valor, siglaSelecionada=''){
  const texto = limitarTexto(String(valor || '').trim(), 80);
  const sigla = String(siglaSelecionada || '').trim().toUpperCase();
  if(sigla && SETORES_CONVIDADOS[sigla]){
    return limitarTexto(`${formatarNomeProprio(texto)} (${sigla})`, 180);
  }
  const correspondencia = texto.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  if(!correspondencia) return formatarNomeProprio(texto);
  const nome = formatarNomeProprio(correspondencia[1].trim());
  const setor = correspondencia[2].trim().toUpperCase();
  return limitarTexto(`${nome} (${setor})`, 180);
}

function resumirConvidadoParaExibicao(valor){
  return String(valor || '').replace(/\s*\(([^()—]+?)\s+—\s+[^()]+\)\s*$/, ' ($1)');
}

function normalizarMembros(valor, tipo){
  const recebidos = Array.isArray(valor) ? valor : [];
  const padroes = CARGOS_FIXOS_REUNIAO[tipo];
  if(!padroes) return recebidos.slice(0, 30).map(item => ({ cargo:limitarTexto(String(item?.cargo || '').trim(), 50), nome:limitarTexto(String(item?.nome || '').trim(), 50) })).filter(item => item.cargo);
  return padroes.map((padrao, indice) => {
    const recebido = recebidos.find(item => item?.cargo === padrao.cargo) || recebidos[indice];
    return {
      cargo: padrao.cargo,
      nome: limitarTexto(String(recebido ? recebido.nome : padrao.nome).trim(), 50)
    };
  });
}
