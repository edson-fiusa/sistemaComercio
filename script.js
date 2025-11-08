const CHAVE_PRODUTOS = 'produtos';
const CHAVE_VENDAS = 'vendas';
const CHAVE_OPERADORES = 'operadores'; 
const CHAVE_CAIXAS_FECHADOS = 'caixasFechados'; 
const SENHA_ADMIN = 'admin123'; 

let carrinho = [];

// --- FUNÇÕES DE UTILIDADE E ARMAZENAMENTO ---

function obterDados(chave) {
    try {
        const dados = localStorage.getItem(chave);
        return dados ? JSON.parse(dados) : [];
    } catch (error) {
        console.error(`Erro ao obter dados da chave ${chave}:`, error);
        return [];
    }
}

function salvarDados(chave, dados) {
    try {
        localStorage.setItem(chave, JSON.stringify(dados));
        return true;
    } catch (error) {
        console.error(`Erro ao salvar dados na chave ${chave}:`, error);
        return false;
    }
}

function showCustomAlert(message, type = 'info', callback = null) {
    const modal = document.getElementById('customAlertModal');
    if (!modal) return alert(message);
    
    const modalMessage = document.getElementById('modalMessage');
    const modalHeader = document.getElementById('modalHeader');
    const modalConfirm = document.getElementById('modalConfirm');
    const modalCancel = document.getElementById('modalCancel');
    const modalOk = document.getElementById('modalOk');
    const modalHeaderTitle = modalHeader.querySelector('h3');

    modalMessage.innerHTML = '';
    modalMessage.textContent = message;

    modalHeader.className = 'modal-header';
    modalHeaderTitle.textContent = 'Notificação do Sistema';

    if (type === 'success') modalHeader.classList.add('success-header');
    else if (type === 'error') modalHeader.classList.add('error-header');
    else if (type === 'confirm') modalHeader.classList.add('confirm-header');
    else if (type === 'report') {
        modalHeader.classList.add('info-header');
        modalMessage.innerHTML = message;
        modalHeaderTitle.textContent = 'Detalhamento';
    }
    else modalHeader.classList.add('info-header');

    
    if (type === 'confirm') {
        modalOk.style.display = 'none';
        modalConfirm.style.display = 'inline-block';
        modalCancel.style.display = 'inline-block';
        
        modalConfirm.onclick = () => {
            modal.style.display = 'none';
            if (callback) callback(true);
        };
        modalCancel.onclick = () => {
            modal.style.display = 'none';
            if (callback) callback(false);
        };
    } else {
        modalOk.style.display = 'inline-block';
        modalConfirm.style.display = 'none';
        modalCancel.style.display = 'none';

        modalOk.onclick = () => {
            modal.style.display = 'none';
            if (callback) callback(true);
        };
    }

    modal.style.display = 'flex';
}

// --- FUNÇÕES DE LOGIN/ACESSO E SEGURANÇA ---

function handleLogin() {
    const senhaInput = document.getElementById('senhaAdmin');
    const alerta = document.getElementById('alertaLogin');
    
    if (!senhaInput || !alerta) return console.error("Erro: Elementos de login não encontrados.");

    const senha = senhaInput.value;
    alerta.style.display = 'none';

    if (senha === SENHA_ADMIN) {
        sessionStorage.setItem('adminLogado', 'true');
        window.location.href = 'admin.html';
    } else {
        alerta.textContent = 'Senha incorreta. Tente novamente.';
        alerta.style.display = 'block';
    }
}

function fazerLogout() {
    sessionStorage.removeItem('adminLogado');
    sessionStorage.removeItem('operadorLogado');
    sessionStorage.removeItem('sessaoInicio');
    window.location.href = 'index.html';
}

function verificarAdmin() {
    const isRestrictedPage = 
        window.location.pathname.includes('admin.html') || 
        window.location.pathname.includes('relatorio.html');

    if (isRestrictedPage) {
        document.body.classList.remove('acesso-restrito-oculto'); 
        
        if (sessionStorage.getItem('adminLogado') !== 'true') {
            showCustomAlert('Acesso negado. Faça login como administrador.', 'error', () => {
                window.location.href = 'index.html';
            });
        } else {
            document.body.style.display = 'block'; 
        }
    }
}

// --- FUNÇÕES DE ADMINISTRAÇÃO ---

function cadastrarProduto() {
    const nome = document.getElementById('nomeProduto').value.trim();
    const quantidade = Number(document.getElementById('qtdProduto').value); 
    const preco = Number(document.getElementById('precoProduto').value);
    const unidade = document.getElementById('unidadeProduto').value;

    if (!nome || isNaN(quantidade) || isNaN(preco) || preco < 0 || quantidade < 0) {
        showCustomAlert('Por favor, preencha todos os campos corretamente.', 'error');
        return;
    }

    let produtos = obterDados(CHAVE_PRODUTOS);
    const novoId = produtos.length > 0 ? Math.max(...produtos.map(p => p.id)) + 1 : 1;

    const novoProduto = { 
        id: novoId, 
        nome: nome, 
        quantidade: quantidade, 
        preco: preco, 
        unidade: unidade 
    };

    produtos.push(novoProduto);
    salvarDados(CHAVE_PRODUTOS, produtos);
    showCustomAlert(`Produto "${nome}" cadastrado com sucesso! ID: ${novoId}`, 'success');

    document.getElementById('formCadastro').reset();
    renderizarTabelaProdutos();
}

function renderizarTabelaProdutos() {
    const produtos = obterDados(CHAVE_PRODUTOS);
    const tbody = document.getElementById('tabelaProdutosBody');
    if (!tbody) return;

    tbody.innerHTML = ''; 

    produtos.forEach(produto => {
        const unidade = produto.unidade || 'unidade';
        const displayUnidade = unidade === 'kg' ? 'Kg' : 'un';
        const qtd = Number(produto.quantidade);
        const preco = Number(produto.preco);

        const row = tbody.insertRow();
        row.insertCell().textContent = produto.id;
        row.insertCell().textContent = produto.nome;
        row.insertCell().textContent = `${qtd.toFixed(unidade === 'kg' ? 3 : 0)} ${displayUnidade}`; 
        row.insertCell().textContent = `R$ ${preco.toFixed(2)} / ${displayUnidade}`;

        const acoesCell = row.insertCell();
        
        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Alterar';
        btnEditar.className = 'btn-editar';
        btnEditar.onclick = () => prepararEdicao(produto.id);

        const btnExcluir = document.createElement('button');
        btnExcluir.textContent = 'Excluir';
        btnExcluir.className = 'btn-excluir';
        btnExcluir.onclick = () => excluirProduto(produto.id, produto.nome);

        acoesCell.appendChild(btnEditar);
        acoesCell.appendChild(btnExcluir);
    });
}

function prepararEdicao(idProduto) {
    const produtos = obterDados(CHAVE_PRODUTOS);
    const produto = produtos.find(p => p.id === idProduto);

    if (!produto) { showCustomAlert('Produto não encontrado para edição.', 'error'); return; }

    document.getElementById('editId').value = produto.id;
    document.getElementById('editNome').value = produto.nome;
    document.getElementById('editQtd').value = Number(produto.quantidade); 
    document.getElementById('editPreco').value = Number(produto.preco).toFixed(2);
    document.getElementById('editUnidade').value = produto.unidade || 'unidade';
    
    document.getElementById('sectionEdicao').style.display = 'block';
}

function salvarEdicao() {
    const id = parseInt(document.getElementById('editId').value);
    const novoNome = document.getElementById('editNome').value.trim();
    const novaQtd = Number(document.getElementById('editQtd').value); 
    const novoPreco = Number(document.getElementById('editPreco').value);
    const novaUnidade = document.getElementById('editUnidade').value;

    if (!novoNome || isNaN(novaQtd) || isNaN(novoPreco) || novoPreco < 0 || novaQtd < 0) {
        showCustomAlert('Por favor, preencha todos os campos de edição corretamente.', 'error');
        return;
    }

    let produtos = obterDados(CHAVE_PRODUTOS);
    const index = produtos.findIndex(p => p.id === id);

    if (index > -1) {
        produtos[index].nome = novoNome;
        produtos[index].quantidade = novaQtd;
        produtos[index].preco = novoPreco;
        produtos[index].unidade = novaUnidade; 
        
        salvarDados(CHAVE_PRODUTOS, produtos);
        showCustomAlert(`Produto ID ${id} alterado com sucesso!`, 'success');
        
        document.getElementById('sectionEdicao').style.display = 'none';
        renderizarTabelaProdutos();
    } else {
        showCustomAlert('Erro ao salvar edição: Produto não encontrado.', 'error');
    }
}

function excluirProduto(id, nome) {
    showCustomAlert(`Tem certeza que deseja excluir o produto: ${nome}?`, 'confirm', (confirma) => {
        if (confirma) {
            let produtos = obterDados(CHAVE_PRODUTOS);
            produtos = produtos.filter(p => p.id !== id);

            salvarDados(CHAVE_PRODUTOS, produtos);
            showCustomAlert(`Produto ${nome} excluído.`, 'success');
            renderizarTabelaProdutos();
        }
    });
}

function cadastrarOperador() {
    const nome = document.getElementById('nomeOperador').value.trim();
    const codigo = document.getElementById('codigoOperador').value.trim();

    if (!nome || !codigo) {
        showCustomAlert('Nome e Código são obrigatórios.', 'error');
        return;
    }

    let operadores = obterDados(CHAVE_OPERADORES);
    if (operadores.find(op => op.codigo === codigo)) {
        showCustomAlert('Erro: Código de operador já existe.', 'error');
        return;
    }

    operadores.push({ nome: nome, codigo: codigo });
    salvarDados(CHAVE_OPERADORES, operadores);
    showCustomAlert(`Operador "${nome}" cadastrado com sucesso! Código: ${codigo}`, 'success');

    document.getElementById('formOperador').reset();
    renderizarTabelaOperadores();
}

function renderizarTabelaOperadores() {
    const operadores = obterDados(CHAVE_OPERADORES);
    const tbody = document.getElementById('tabelaOperadoresBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    operadores.forEach(op => {
        const row = tbody.insertRow();
        row.insertCell().textContent = op.nome;
        row.insertCell().textContent = op.codigo;
    });
}

// --- FUNÇÕES DE CAIXA (PDV) ---

function loginOperador() {
    const codigo = document.getElementById('codigoOperadorCaixa').value.trim();
    const operadores = obterDados(CHAVE_OPERADORES);
    const operador = operadores.find(op => op.codigo === codigo);

    const painelLogin = document.getElementById('painelLoginOperador');
    const painelCaixa = document.getElementById('painelCaixaCompleto');
    const displayOperador = document.getElementById('operadorDisplay');

    if (operador) {
        sessionStorage.setItem('operadorLogado', operador.nome);
        sessionStorage.setItem('sessaoInicio', new Date().toISOString()); 
        
        displayOperador.textContent = operador.nome;
        painelLogin.style.display = 'none';
        painelCaixa.style.display = 'flex'; 
        showCustomAlert(`Bem-vindo(a), ${operador.nome}! Caixa aberto.`, 'success');
        document.getElementById('codigoOperadorCaixa').value = '';
    } else {
        showCustomAlert('Código de operador inválido.', 'error');
    }
}

function buscarEExibirSugestoes() {
    const input = document.getElementById('searchProdutoCaixa');
    const query = input.value.trim();
    const listaSugestoes = document.getElementById('listaSugestoes');
    listaSugestoes.innerHTML = '';

    if (query.length < 2) return;

    const produtos = obterDados(CHAVE_PRODUTOS);
    const queryLower = query.toLowerCase();

    let sugestoes = [];

    if (query.startsWith('#')) {
        const nomeQuery = queryLower.substring(1);
        sugestoes = produtos.filter(p => p.nome.toLowerCase().startsWith(nomeQuery));
    } else {
        sugestoes = produtos.filter(p => p.nome.toLowerCase().includes(queryLower) || p.id.toString() === query);
    }
    
    sugestoes.forEach(p => {
        const unidade = p.unidade || 'unidade';
        const displayUnidade = unidade === 'kg' ? 'Kg' : 'un';
        
        const qtdDisponivel = Number(p.quantidade);
        const estoque = qtdDisponivel > 0 
            ? `Estoque: ${qtdDisponivel.toFixed(unidade === 'kg' ? 3 : 0)} ${displayUnidade}` 
            : `ESGOTADO`;
        
        const li = document.createElement('li');
        const precoDisplay = Number(p.preco).toFixed(2);
        
        li.textContent = `[ID: ${p.id}] ${p.nome} (R$ ${precoDisplay}/${displayUnidade}) - ${estoque}`;
        
        li.onclick = () => {
            document.getElementById('searchProdutoCaixa').value = p.nome;
            document.getElementById('qtdCaixa').focus();
            listaSugestoes.innerHTML = '';
        };
        if (qtdDisponivel <= 0) {
            li.style.color = 'red';
        }
        listaSugestoes.appendChild(li);
    });
}

function adicionarAoCarrinhoPeloInput() {
    const input = document.getElementById('searchProdutoCaixa').value.trim();
    const qtdVendida = Number(document.getElementById('qtdCaixa').value);
    
    if (!input || isNaN(qtdVendida) || qtdVendida <= 0) {
        showCustomAlert('Busca de produto e Quantidade/Peso devem ser válidas.', 'error');
        return;
    }

    const produtos = obterDados(CHAVE_PRODUTOS);
    let produto;

    const id = parseInt(input);
    if (!isNaN(id)) {
        produto = produtos.find(p => p.id === id);
    } 
    if (!produto) {
        produto = produtos.find(p => p.nome.toLowerCase().trim() === input.toLowerCase());
    }
    if (!produto && input.length >= 2) { 
        produto = produtos.find(p => p.nome.toLowerCase().includes(input.toLowerCase()));
    }

    if (!produto) {
        showCustomAlert('Produto não encontrado. Use o ID ou o nome completo.', 'error');
        return;
    }

    if (!produto.unidade) produto.unidade = 'unidade'; 

    const unitDisplay = produto.unidade === 'kg' ? 'Kg' : 'un';
    const estoqueAtual = Number(produto.quantidade);

    const itemExistente = carrinho.find(item => item.id === produto.id);
    const qtdTotalAposAdicao = (itemExistente ? itemExistente.qtd : 0) + qtdVendida;

    if (estoqueAtual < qtdTotalAposAdicao) {
        showCustomAlert(`Estoque insuficiente para ${produto.nome}. Disponível: ${estoqueAtual.toFixed(produto.unidade === 'kg' ? 3 : 0)} ${unitDisplay}.`, 'error');
        return;
    }

    if (itemExistente) {
        itemExistente.qtd = qtdTotalAposAdicao;
    } else {
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            precoUnitario: Number(produto.preco),
            qtd: qtdVendida,
            unidade: produto.unidade,
            carrinhoIndex: Date.now() + Math.random() 
        });
    }

    document.getElementById('searchProdutoCaixa').value = '';
    document.getElementById('qtdCaixa').value = 1;
    document.getElementById('listaSugestoes').innerHTML = '';

    renderizarCarrinho();
}

function removerDoCarrinho(carrinhoIndex) {
    showCustomAlert('Tem certeza que deseja remover este item do carrinho?', 'confirm', (confirma) => {
        if (confirma) {
            carrinho = carrinho.filter(item => item.carrinhoIndex !== carrinhoIndex);
            renderizarCarrinho();
            showCustomAlert('Produto removido do carrinho.', 'info');
        }
    });
}

function renderizarCarrinho() {
    const tbody = document.getElementById('carrinhoBody');
    const totalDisplay = document.getElementById('totalCompra');
    let total = 0;

    tbody.innerHTML = '';

    carrinho.forEach((item) => {
        const subtotal = Number((item.precoUnitario * item.qtd).toFixed(2));
        total += subtotal;

        const row = tbody.insertRow();
        row.className = 'carrinho-row';

        const mainCell = row.insertCell();
        mainCell.colSpan = 2;
        mainCell.className = 'carrinho-main-cell';

        const unitDisplay = item.unidade === 'kg' ? 'Kg' : 'un';
        const displayQtd = item.unidade === 'kg' ? item.qtd.toFixed(3) : item.qtd.toFixed(0);
        const priceUnitDisplay = item.unidade === 'kg' ? 'Kg' : 'un';

        const nomeProduto = document.createElement('strong');
        nomeProduto.textContent = item.nome;
        mainCell.appendChild(nomeProduto);

        const detalhes = document.createElement('p');
        detalhes.className = 'carrinho-detalhes';
        detalhes.innerHTML = `
            <span>
                <span class="parte-inicio">
                    ${displayQtd} ${unitDisplay}
                </span>
                <span class="parte-meio">
                    x R$ ${item.precoUnitario.toFixed(2)}/${priceUnitDisplay}
                </span>
                <span class="parte-fim">
                    = R$ ${subtotal.toFixed(2)}
                </span>
            </span>`;

        mainCell.appendChild(detalhes);

        const acaoCell = row.insertCell();
        acaoCell.className = 'carrinho-acao-cell';
        const btnRemover = document.createElement('button');
        btnRemover.textContent = 'X';
        btnRemover.className = 'btn-remover-item';
        btnRemover.onclick = () => removerDoCarrinho(item.carrinhoIndex);
        acaoCell.appendChild(btnRemover);
    });

    total = Number(total.toFixed(2));
    totalDisplay.textContent = total.toFixed(2);
}

// Modal de pagamento
function abrirModalPagamento() {
    if (carrinho.length === 0) {
        showCustomAlert('Nenhum item no carrinho.', 'info');
        return;
    }
    document.getElementById('modalPagamento').style.display = 'flex';
}

function fecharModalPagamento() {
    document.getElementById('modalPagamento').style.display = 'none';
}

function confirmarPagamento(metodo) {
    fecharModalPagamento();
    prepararFinalizacao(metodo);
}

function prepararFinalizacao(metodoPagamento) {
    if (carrinho.length === 0) {
        showCustomAlert('O carrinho está vazio.', 'info');
        return;
    }

    const total = Number(document.getElementById('totalCompra').textContent);

    if (metodoPagamento === 'Dinheiro') {
        const valorRecebidoStr = prompt(`Total da Compra: R$ ${total.toFixed(2)}\n\nInsira o valor recebido:`);
        
        if (valorRecebidoStr === null || valorRecebidoStr.trim() === "") {
             showCustomAlert('Transação em Dinheiro cancelada.', 'info');
             return;
        }

        const valorRecebido = Number(valorRecebidoStr.replace(',', '.'));

        if (isNaN(valorRecebido) || valorRecebido <= 0) {
            showCustomAlert('Valor recebido inválido. Por favor, tente novamente.', 'error');
            return;
        }
        
        if (valorRecebido < total) {
            const faltando = total - valorRecebido;
            showCustomAlert(`Valor insuficiente! Faltam R$ ${faltando.toFixed(2)}.\nPor favor, insira o valor total.`, 'error');
            return;
        }

        const troco = Number((valorRecebido - total).toFixed(2));
        
        const mensagemTroco = troco > 0 
            ? `Troco a devolver: R$ ${troco.toFixed(2)}`
            : `Valor exato recebido. Não há troco.`;

        showCustomAlert(mensagemTroco, 'success', () => {
             finalizarCompra(metodoPagamento, total, valorRecebido, troco);
        });
        
    } else {
        // Para Cartão e Pix, passamos valores padrão
        finalizarCompra(metodoPagamento, total, total, 0);
    }
}

function finalizarCompra(metodoPagamento, total, valorRecebido = null, troco = 0) {
    const operador = sessionStorage.getItem('operadorLogado') || 'N/A'; 
    const sessaoInicio = sessionStorage.getItem('sessaoInicio') || 'N/A'; 
    const carrinhoFinal = [...carrinho];

    // 1. ATUALIZA ESTOQUE
    let produtos = obterDados(CHAVE_PRODUTOS);
    carrinhoFinal.forEach(itemCarrinho => {
        const prodIndex = produtos.findIndex(p => p.id === itemCarrinho.id);
        if (prodIndex > -1) {
            produtos[prodIndex].quantidade = Number((Number(produtos[prodIndex].quantidade) - itemCarrinho.qtd).toFixed(3));
        }
    });
    salvarDados(CHAVE_PRODUTOS, produtos);

    // 2. REGISTRA VENDA
    const vendas = obterDados(CHAVE_VENDAS);
    const novoIdVenda = vendas.length > 0 ? Math.max(...vendas.map(v => v.idVenda)) + 1 : 1;

    const novaVenda = {
        idVenda: novoIdVenda,
        data: new Date().toISOString(),
        itens: carrinhoFinal,
        total: total,
        pagamento: metodoPagamento,
        valorRecebido: valorRecebido,
        troco: troco,
        operador: operador,
        sessaoInicio: sessaoInicio
    };

    vendas.push(novaVenda);
    salvarDados(CHAVE_VENDAS, vendas);

    // 3. EMITE O CUPOM
    gerarCupomFiscal(novaVenda);

    // 4. REINICIA O CAIXA
    carrinho = [];
    renderizarCarrinho(); 
}

// --- FUNÇÃO ENCERRAR CAIXA CORRIGIDA ---
function encerrarCaixa() {
    if (carrinho.length > 0) {
        showCustomAlert('Não é possível encerrar o caixa com itens no carrinho. Finalize a venda ou remova os produtos.', 'error');
        return;
    }
    
    const operador = sessionStorage.getItem('operadorLogado');
    const sessaoInicio = sessionStorage.getItem('sessaoInicio');

    if (!operador || !sessaoInicio) {
        showCustomAlert('Nenhum operador logado ou sessão iniciada para encerrar o caixa.', 'error');
        return;
    }

    showCustomAlert(`Deseja realmente encerrar o caixa para o operador ${operador} e gerar o relatório diário?`, 'confirm', (confirma) => {
        if (!confirma) return;
        
        const vendas = obterDados(CHAVE_VENDAS);
        console.log('Todas as vendas:', vendas);
        
        // CORREÇÃO: Filtrar vendas da sessão atual corretamente
        const vendasDaSessao = vendas.filter(venda => 
            venda.operador === operador && venda.sessaoInicio === sessaoInicio
        );
        
        console.log('Vendas da sessão:', vendasDaSessao);
        
        let resumo = { totalVendas: 0, totalPix: 0, totalCartao: 0, totalDinheiro: 0 };
        vendasDaSessao.forEach(venda => {
            resumo.totalVendas += venda.total;
            switch (venda.pagamento) {
                case 'Pix': resumo.totalPix += venda.total; break;
                case 'Cartão': resumo.totalCartao += venda.total; break; 
                case 'Dinheiro': resumo.totalDinheiro += venda.total; break;
            }
        });
        
        resumo.totalVendas = Number(resumo.totalVendas.toFixed(2));
        resumo.totalPix = Number(resumo.totalPix.toFixed(2));
        resumo.totalCartao = Number(resumo.totalCartao.toFixed(2));
        resumo.totalDinheiro = Number(resumo.totalDinheiro.toFixed(2));

        const caixasFechados = obterDados(CHAVE_CAIXAS_FECHADOS);
        console.log('Caixas fechados existentes:', caixasFechados);
        
        // CORREÇÃO: Calcular ID corretamente
        const novoIdCaixa = caixasFechados.length > 0 ? Math.max(...caixasFechados.map(c => c.idCaixa)) + 1 : 1;

        const novoFechamento = {
            idCaixa: novoIdCaixa,
            operador: operador,
            inicio: sessaoInicio,
            fim: new Date().toISOString(),
            resumo: resumo,
            vendasIds: vendasDaSessao.map(v => v.idVenda)
        };

        console.log('Novo fechamento a ser salvo:', novoFechamento);
        
        caixasFechados.push(novoFechamento);
        const salvou = salvarDados(CHAVE_CAIXAS_FECHADOS, caixasFechados);
        
        if (salvou) {
            console.log('Caixa fechado salvo com sucesso!');
        } else {
            console.error('Erro ao salvar caixa fechado!');
        }

        const relatorioHTML = `
            <h3>Relatório de Fechamento de Caixa #${novoIdCaixa}</h3>
            <p><strong>Operador:</strong> ${operador}</p>
            <p><strong>Início:</strong> ${new Date(sessaoInicio).toLocaleString()}</p>
            <p><strong>Fim:</strong> ${new Date().toLocaleString()}</p>
            <hr style="margin: 10px 0;">
            
            <h4>Resumo Financeiro:</h4>
            <p style="font-size: 1.2em; font-weight: bold;">Total Líquido: R$ ${resumo.totalVendas.toFixed(2)}</p>
            
            <hr style="margin: 5px 0;">

            <h4>Detalhamento por Meio:</h4>
            <p style="margin-left: 15px;">PIX: R$ ${resumo.totalPix.toFixed(2)}</p>
            <p style="margin-left: 15px;">CARTÃO: R$ ${resumo.totalCartao.toFixed(2)}</p>
            <p style="margin-left: 15px;">DINHEIRO: R$ ${resumo.totalDinheiro.toFixed(2)}</p>

            <hr style="margin: 10px 0;">
            <p><strong>Total de Vendas Registradas:</strong> ${vendasDaSessao.length}</p>
        `;
        
        showCustomAlert(relatorioHTML, 'report', () => {
            sessionStorage.removeItem('operadorLogado');
            sessionStorage.removeItem('sessaoInicio');
            carrinho = [];
            renderizarCarrinho();
            
            document.getElementById('painelLoginOperador').style.display = 'block';
            document.getElementById('painelCaixaCompleto').style.display = 'none';
            document.getElementById('operadorDisplay').textContent = 'N/A';
            
            showCustomAlert('Sessão encerrada com sucesso. Faça login para reabrir o caixa.', 'success');
        });
    });
}

// --- FUNÇÕES DE RELATÓRIO ---

function renderizarEstoque() {
    const produtos = obterDados(CHAVE_PRODUTOS);
    const tbody = document.getElementById('tabelaEstoqueBody');
    if (!tbody) {
        console.error('Elemento tabelaEstoqueBody não encontrado');
        return;
    }

    tbody.innerHTML = '';

    if (produtos.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 4;
        cell.textContent = 'Nenhum produto cadastrado';
        cell.style.textAlign = 'center';
        return;
    }

    produtos.forEach(produto => {
        const unidade = produto.unidade || 'unidade';
        const displayUnidade = unidade === 'kg' ? 'Kg' : 'un';
        const qtd = Number(produto.quantidade);
        
        const row = tbody.insertRow();
        row.insertCell().textContent = produto.id;
        row.insertCell().textContent = produto.nome;
        row.insertCell().innerHTML = qtd < 5 
            ? `<span style="color: red; font-weight: bold;">${qtd.toFixed(unidade === 'kg' ? 3 : 0)} ${displayUnidade}</span>` 
            : `${qtd.toFixed(unidade === 'kg' ? 3 : 0)} ${displayUnidade}`;
        row.insertCell().textContent = `R$ ${Number(produto.preco).toFixed(2)} / ${displayUnidade}`;
    });
}

function renderizarRelatorioCaixasFechados() {
    const caixasFechados = obterDados(CHAVE_CAIXAS_FECHADOS);
    console.log('Dados de caixas fechados para renderizar:', caixasFechados);
    
    const tbody = document.getElementById('tabelaCaixasFechadosBody');
    
    if (!tbody) {
        console.error('Elemento tabelaCaixasFechadosBody não encontrado');
        return;
    }

    tbody.innerHTML = '';

    if (caixasFechados.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 7;
        cell.textContent = 'Nenhum caixa fechado encontrado';
        cell.style.textAlign = 'center';
        return;
    }

    // Ordenar por ID decrescente (mais recentes primeiro)
    caixasFechados.sort((a, b) => b.idCaixa - a.idCaixa);
    
    caixasFechados.forEach(caixa => {
        const resumo = caixa.resumo;
        
        const row = tbody.insertRow();
        row.insertCell().textContent = caixa.idCaixa;
        row.insertCell().textContent = caixa.operador; 
        row.insertCell().textContent = new Date(caixa.inicio).toLocaleString();
        row.insertCell().textContent = new Date(caixa.fim).toLocaleTimeString();
        row.insertCell().textContent = `R$ ${resumo.totalVendas.toFixed(2)}`;
        row.insertCell().textContent = `${caixa.vendasIds.length} Vendas`;

        const acoesCell = row.insertCell();
        const btnDetalhes = document.createElement('button');
        btnDetalhes.textContent = 'Detalhes';
        btnDetalhes.className = 'btn-editar';
        btnDetalhes.onclick = () => mostrarDetalhesCaixa(caixa.idCaixa);

        acoesCell.appendChild(btnDetalhes);
    });
}

function calcularDuracaoSessao(inicio, fim) {
    const inicioDate = new Date(inicio);
    const fimDate = new Date(fim);
    const diffMs = fimDate - inicioDate;
    
    const horas = Math.floor(diffMs / (1000 * 60 * 60));
    const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas === 0) {
        return `${minutos} minutos`;
    } else {
        return `${horas}h ${minutos}m`;
    }
}

function mostrarDetalhesCaixa(idCaixa) {
    const caixasFechados = obterDados(CHAVE_CAIXAS_FECHADOS);
    const caixa = caixasFechados.find(c => c.idCaixa === idCaixa);

    if (!caixa) {
        showCustomAlert('Caixa fechado não encontrado.', 'error');
        return;
    }

    const vendasRegistradas = obterDados(CHAVE_VENDAS);
    const vendasDaSessao = vendasRegistradas.filter(v => caixa.vendasIds.includes(v.idVenda));

    let resumoProdutos = {};
    let resumoPagamentos = {};

    // Processar todas as vendas da sessão
    vendasDaSessao.forEach(venda => {
        // Processar itens de cada venda
        venda.itens.forEach(item => {
            if (!resumoProdutos[item.nome]) {
                resumoProdutos[item.nome] = { 
                    qtdTotal: 0, 
                    unidade: item.unidade,
                    totalVendido: 0 
                };
            }
            resumoProdutos[item.nome].qtdTotal += item.qtd;
            resumoProdutos[item.nome].totalVendido += (item.precoUnitario * item.qtd);
        });

        // Processar métodos de pagamento
        const pagamento = venda.pagamento;
        if (!resumoPagamentos[pagamento]) {
            resumoPagamentos[pagamento] = 0;
        }
        resumoPagamentos[pagamento] += venda.total;
    });

    // Construir HTML dos produtos
    let produtosHTML = '<h4>📦 Produtos Vendidos na Sessão:</h4>';
    if (Object.keys(resumoProdutos).length === 0) {
        produtosHTML += '<p>Nenhum produto vendido</p>';
    } else {
        produtosHTML += '<ul style="max-height: 200px; overflow-y: auto;">';
        for (const nome in resumoProdutos) {
            const item = resumoProdutos[nome];
            const unitDisplay = item.unidade === 'kg' ? 'Kg' : 'un';
            const displayQtd = item.unidade === 'kg' ? item.qtdTotal.toFixed(3) : item.qtdTotal.toFixed(0);
            const totalItem = Number(item.totalVendido).toFixed(2);
            
            produtosHTML += `
                <li style="margin-bottom: 8px;">
                    <strong>${nome}</strong><br>
                    <span style="margin-left: 15px; font-size: 0.9em;">
                        ${displayQtd} ${unitDisplay} - Total: R$ ${totalItem}
                    </span>
                </li>`;
        }
        produtosHTML += '</ul>';
    }

    // Construir HTML dos pagamentos
    let pagamentosHTML = '<h4>💳 Formas de Pagamento:</h4>';
    if (Object.keys(resumoPagamentos).length === 0) {
        pagamentosHTML += '<p>Nenhum pagamento registrado</p>';
    } else {
        pagamentosHTML += '<ul>';
        for (const tipo in resumoPagamentos) {
            const total = Number(resumoPagamentos[tipo]).toFixed(2);
            pagamentosHTML += `<li><strong>${tipo}:</strong> R$ ${total}</li>`;
        }
        pagamentosHTML += '</ul>';
    }

    // Lista individual de vendas
    let vendasHTML = '<h4>🧾 Vendas Individuais:</h4>';
    if (vendasDaSessao.length === 0) {
        vendasHTML += '<p>Nenhuma venda registrada</p>';
    } else {
        vendasHTML += '<div style="max-height: 300px; overflow-y: auto;">';
        vendasDaSessao.forEach((venda, index) => {
            const dataVenda = new Date(venda.data).toLocaleString('pt-BR');
            let infoPagamento = '';
            
            if (venda.pagamento === 'Dinheiro') {
                infoPagamento = ` (Recebido: R$ ${venda.valorRecebido?.toFixed(2) || '0.00'}, Troco: R$ ${venda.troco?.toFixed(2) || '0.00'})`;
            }
            
            vendasHTML += `
                <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                    <strong>Venda #${venda.idVenda}</strong> - ${dataVenda}<br>
                    <strong>Total:</strong> R$ ${venda.total.toFixed(2)}<br>
                    <strong>Pagamento:</strong> ${venda.pagamento}${infoPagamento}
                </div>`;
        });
        vendasHTML += '</div>';
    }
    
    const detalhesHTML = `
        <div style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                🧾 Detalhes do Caixa #${caixa.idCaixa}
            </h3>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                <p><strong>👤 Operador:</strong> ${caixa.operador}</p>
                <p><strong>🕐 Sessão:</strong> ${new Date(caixa.inicio).toLocaleString('pt-BR')} até ${new Date(caixa.fim).toLocaleString('pt-BR')}</p>
                <p><strong>⏱️ Duração:</strong> ${calcularDuracaoSessao(caixa.inicio, caixa.fim)}</p>
                <p><strong>💰 Total Bruto:</strong> <span style="font-size: 1.2em; font-weight: bold; color: #27ae60;">R$ ${caixa.resumo.totalVendas.toFixed(2)}</span></p>
            </div>

            <div style="margin-bottom: 15px;">
                ${pagamentosHTML}
            </div>

            <div style="margin-bottom: 15px;">
                ${produtosHTML}
            </div>

            ${vendasHTML}

            <div style="margin-top: 15px; padding: 10px; background: #e8f4fd; border-radius: 5px;">
                <strong>📊 Resumo Final:</strong><br>
                • Total de Vendas: ${vendasDaSessao.length}<br>
                • Valor Total: R$ ${caixa.resumo.totalVendas.toFixed(2)}<br>
                • Duração da Sessão: ${calcularDuracaoSessao(caixa.inicio, caixa.fim)}
            </div>
        </div>
    `;

    showCustomAlert(detalhesHTML, 'report');
}

// --- FUNÇÃO PARA GERAR CUPOM FISCAL ---
function gerarCupomFiscal(venda) {
    const operador = sessionStorage.getItem('operadorLogado') || 'N/A';
    const dataHora = new Date(venda.data).toLocaleString('pt-BR', { hour12: false });
    
    const qtdTotal = venda.itens.reduce((acc, item) => acc + Number(item.qtd), 0);

    let cupomHTML = `
        <div style="max-width: 300px; margin: 0 auto; font-family: monospace;">
            <h3 style="text-align:center; margin-bottom: 10px;">CUPOM FISCAL</h3>
            <hr style="border-top: 1px dashed #000; margin: 10px 0;">
            <p><strong>Operador:</strong> ${operador}</p>
            <p><strong>Data/Hora:</strong> ${dataHora}</p>
            <p><strong>Venda #:</strong> ${venda.idVenda}</p>
            <hr style="border-top: 1px dashed #000; margin: 10px 0;">
    `;

    // Itens da venda
    venda.itens.forEach(item => {
        const unitDisplay = item.unidade === 'kg' ? 'Kg' : 'un';
        const displayQtd = item.unidade === 'kg' ? item.qtd.toFixed(3) : item.qtd.toFixed(0);
        const subtotal = (item.precoUnitario * item.qtd).toFixed(2);
        
        cupomHTML += `
            <div style="margin-bottom: 8px;">
                <div><strong>${item.nome}</strong></div>
                <div style="margin-left: 10px;">
                    ${displayQtd} ${unitDisplay} x R$ ${item.precoUnitario.toFixed(2)} = R$ ${subtotal}
                </div>
            </div>`;
    });

    cupomHTML += `
            <hr style="border-top: 1px dashed #000; margin: 10px 0;">
            <p><strong>Total de itens:</strong> ${qtdTotal.toFixed(0)}</p>
            <p><strong>Forma de pagamento:</strong> ${venda.pagamento}</p>
    `;

    // Adiciona informações específicas para cada tipo de pagamento
    if (venda.pagamento === 'Dinheiro') {
        cupomHTML += `
            <p><strong>Valor recebido:</strong> R$ ${venda.valorRecebido?.toFixed(2) || '0.00'}</p>
            <p><strong>Troco:</strong> R$ ${venda.troco?.toFixed(2) || '0.00'}</p>
        `;
    } else {
        // Para Cartão e Pix, mostra apenas o total
        cupomHTML += `<p><strong>Valor pago:</strong> R$ ${venda.total.toFixed(2)}</p>`;
    }

    cupomHTML += `
            <p style="font-size: 1.1em; font-weight: bold; text-align: center; margin-top: 10px;">
                TOTAL: R$ ${venda.total.toFixed(2)}
            </p>
            <hr style="border-top: 1px dashed #000; margin: 10px 0;">
            <p style="text-align:center; font-style: italic;">Obrigado pela preferência!</p>
            <p style="text-align:center;">Volte sempre!</p>
        </div>
    `;

    showCustomAlert(cupomHTML, 'report', () => {
        showCustomAlert(`Venda #${venda.idVenda} finalizada com sucesso!`, 'success');
    });
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, verificando admin...');
    verificarAdmin();
    
    // Verificar se estamos na página de relatórios
    if (window.location.pathname.includes('relatorio.html')) {
        console.log('Página de relatórios detectada, renderizando dados...');
        renderizarEstoque();
        renderizarRelatorioCaixasFechados();
    }
    
    // Verificar se estamos na página admin
    if (window.location.pathname.includes('admin.html')) {
        console.log('Página admin detectada, renderizando tabelas...');
        renderizarTabelaProdutos();
        renderizarTabelaOperadores();
    }
});