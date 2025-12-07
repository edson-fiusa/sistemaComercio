// ==================== CLASSES PRINCIPAIS ====================

class Produto {
    constructor(id, codigo, nome, precoEntrada, precoVenda, unidade, quantidade, estoqueMinimo, categoria) {
        this.id = id;
        this.codigo = codigo;
        this.nome = nome;
        this.precoEntrada = precoEntrada;
        this.precoVenda = precoVenda;
        this.unidade = unidade;
        this.quantidade = quantidade;
        this.estoqueMinimo = estoqueMinimo;
        this.categoria = categoria;
        this.dataCadastro = new Date().toISOString();
        this.ativo = true;
    }
}

class Operador {
    constructor(id, nome, usuario, senha) {
        this.id = id;
        this.nome = nome;
        this.usuario = usuario;
        this.senha = senha;
        this.dataCadastro = new Date().toISOString();
    }
}

class ItemCarrinho {
    constructor(produto, quantidade) {
        this.produtoId = produto.id;
        this.codigo = produto.codigo;
        this.nome = produto.nome;
        this.preco = produto.precoVenda;
        this.quantidade = quantidade;
        this.unidade = produto.unidade;
        this.valorUnitario = produto.precoVenda;
    }
    
    getSubtotal() {
        return this.preco * this.quantidade;
    }
}

class Venda {
    constructor(itens, formaPagamento, operadorId, operadorNome, caixaId, troco = 0) {
        this.id = Date.now();
        this.data = new Date().toISOString();
        this.itens = itens;
        this.total = this.calcularTotal();
        this.formaPagamento = formaPagamento;
        this.troco = troco;
        this.operadorId = operadorId;
        this.operadorNome = operadorNome;
        this.caixaId = caixaId;
    }
    
    calcularTotal() {
        return this.itens.reduce((total, item) => total + item.getSubtotal(), 0);
    }
}

class Caixa {
    constructor(operadorId, operadorNome) {
        this.id = Date.now();
        this.operadorId = operadorId;
        this.operadorNome = operadorNome;
        this.dataAbertura = new Date().toISOString();
        this.vendas = [];
        this.total = 0;
        this.fechado = false;
    }
    
    adicionarVenda(venda) {
        this.vendas.push(venda);
        this.total += venda.total;
    }
    
    fechar() {
        this.dataFechamento = new Date().toISOString();
        this.fechado = true;
    }
}

class Avaria {
    constructor(produtoId, produtoNome, quantidade, motivo, observacao, precoCusto) {
        this.id = Date.now();
        this.produtoId = produtoId;
        this.produtoNome = produtoNome;
        this.quantidade = quantidade;
        this.motivo = motivo;
        this.observacao = observacao;
        this.data = new Date().toISOString();
        this.precoCusto = precoCusto;
    }
}

class Entrada {
    constructor(produtoId, produtoNome, quantidade, precoCusto, motivo) {
        this.produtoId = produtoId;
        this.produtoNome = produtoNome;
        this.quantidade = quantidade;
        this.precoCusto = precoCusto;
        this.motivo = motivo;
        this.data = new Date().toISOString();
    }
}

class SistemaPDV {
    constructor() {
        this.SENHA_ADMIN = "admin123";
        
        // Inicializar todas as propriedades
        this.estoque = JSON.parse(localStorage.getItem('estoque')) || [];
        this.operadores = JSON.parse(localStorage.getItem('operadores')) || [];
        this.vendas = JSON.parse(localStorage.getItem('vendas')) || [];
        this.avarias = JSON.parse(localStorage.getItem('avarias')) || [];
        this.caixas = JSON.parse(localStorage.getItem('caixas')) || [];
        this.entradas = JSON.parse(localStorage.getItem('entradas')) || [];
        this.carrinho = [];
        this.formaPagamento = null;
        this.operadorAtual = null;
        this.caixaAtual = null;
        
        // Inicializar operador padrão se não existir
        if (this.operadores.length === 0) {
            this.operadores.push(new Operador(
                1,
                "Administrador",
                "admin",
                "admin123"
            ));
            this.salvarOperadores();
        }
        
        // Carregar estoque exemplo se vazio
        if (Array.isArray(this.estoque) && this.estoque.length === 0) {
            this.carregarEstoqueExemplo();
        }
        
        console.log("Sistema PDV inicializado com:", {
            estoque: this.estoque.length,
            operadores: this.operadores.length,
            vendas: this.vendas.length
        });
    }
    
    // ==================== MÉTODOS DE PERSISTÊNCIA ====================
    
    salvarDados(chave, dados) {
        localStorage.setItem(chave, JSON.stringify(dados));
    }
    
    salvarEstoque() {
        this.salvarDados('estoque', this.estoque);
    }
    
    salvarOperadores() {
        this.salvarDados('operadores', this.operadores);
    }
    
    salvarVendas() {
        this.salvarDados('vendas', this.vendas);
    }
    
    salvarAvarias() {
        this.salvarDados('avarias', this.avarias);
    }
    
    salvarCaixas() {
        this.salvarDados('caixas', this.caixas);
    }
    
    salvarEntradas() {
        this.salvarDados('entradas', this.entradas);
    }
    
    carregarEstoqueExemplo() {
        console.log("Carregando estoque de exemplo...");
        this.estoque = [
            new Produto(1, "AR001", "Arroz Tipo 1 5kg", 18.50, 25.90, "unidade", 50, 10, "Alimentos"),
            new Produto(2, "FE001", "Feijão Carioca 1kg", 7.80, 12.50, "unidade", 30, 5, "Alimentos"),
            new Produto(3, "AC001", "Açúcar Cristal 1kg", 3.20, 5.90, "unidade", 40, 8, "Alimentos"),
            new Produto(4, "CA001", "Café em Pó 500g", 11.90, 18.50, "unidade", 25, 5, "Alimentos"),
            new Produto(5, "LE001", "Leite Integral 1L", 4.20, 6.90, "unidade", 60, 15, "Laticínios")
        ];
        this.salvarEstoque();
    }
    
    // ==================== MÉTODOS DE PRODUTOS ====================
    
    buscarProdutoPorId(id) {
        return this.estoque.find(p => p.id === id);
    }
    
    buscarProdutoPorCodigo(codigo) {
        return this.estoque.find(p => p.codigo === codigo);
    }
    
    cadastrarProduto(dados) {
        const produto = new Produto(
            Date.now(),
            dados.codigo,
            dados.nome,
            dados.precoEntrada,
            dados.precoVenda,
            dados.unidade,
            dados.quantidade,
            dados.estoqueMinimo,
            dados.categoria
        );
        
        this.estoque.push(produto);
        this.salvarEstoque();
        return produto;
    }
    
    atualizarProduto(id, dados) {
        const produto = this.buscarProdutoPorId(id);
        if (produto) {
            Object.assign(produto, dados);
            this.salvarEstoque();
            return produto;
        }
        return null;
    }
    
    excluirProduto(id) {
        this.estoque = this.estoque.filter(p => p.id !== id);
        this.salvarEstoque();
    }
    
    // ==================== MÉTODOS DE CARRINHO ====================
    
    adicionarAoCarrinho(produtoId, quantidade) {
        const produto = this.buscarProdutoPorId(produtoId);
        if (!produto) return false;
        
        if (produto.quantidade < quantidade) {
            alert(`Estoque insuficiente! Disponível: ${produto.quantidade.toFixed(3)} ${produto.unidade}`);
            return false;
        }
        
        const itemExistente = this.carrinho.find(item => item.produtoId === produtoId);
        
        if (itemExistente) {
            const novaQuantidade = itemExistente.quantidade + quantidade;
            if (produto.quantidade < novaQuantidade) {
                alert(`Estoque insuficiente para adicionar mais! Disponível: ${produto.quantidade.toFixed(3)} ${produto.unidade}`);
                return false;
            }
            itemExistente.quantidade = novaQuantidade;
        } else {
            this.carrinho.push(new ItemCarrinho(produto, quantidade));
        }
        
        return true;
    }
    
    alterarQuantidadeCarrinho(index, delta) {
        const item = this.carrinho[index];
        const produto = this.buscarProdutoPorId(item.produtoId);
        
        const novaQuantidade = item.quantidade + delta;
        
        if (novaQuantidade <= 0) {
            this.removerDoCarrinho(index);
            return;
        }
        
        if (produto.quantidade < novaQuantidade) {
            alert(`Estoque insuficiente! Disponível: ${produto.quantidade.toFixed(3)} ${produto.unidade}`);
            return;
        }
        
        item.quantidade = parseFloat(novaQuantidade.toFixed(3));
    }
    
    removerDoCarrinho(index) {
        this.carrinho.splice(index, 1);
    }
    
    limparCarrinho() {
        this.carrinho = [];
    }
    
    getTotalCarrinho() {
        return this.carrinho.reduce((total, item) => total + item.getSubtotal(), 0);
    }
    
    // ==================== MÉTODOS DE VENDA ====================
    
    concluirVenda(formaPagamento, valorPago = 0) {
        // Verificar estoque
        for (const item of this.carrinho) {
            const produto = this.buscarProdutoPorId(item.produtoId);
            if (produto.quantidade < item.quantidade) {
                alert(`Estoque insuficiente para ${produto.nome}! Disponível: ${produto.quantidade.toFixed(3)} ${produto.unidade}`);
                return null;
            }
        }
        
        // Calcular troco se for dinheiro
        let troco = 0;
        if (formaPagamento === 'dinheiro') {
            const total = this.getTotalCarrinho();
            if (valorPago < total) {
                alert('Valor pago insuficiente!');
                return null;
            }
            troco = valorPago - total;
        }
        
        // Criar venda
        const venda = new Venda(
            [...this.carrinho],
            formaPagamento,
            this.operadorAtual.id,
            this.operadorAtual.nome,
            this.caixaAtual.id,
            troco
        );
        
        // Atualizar estoque
        this.carrinho.forEach(item => {
            const produto = this.buscarProdutoPorId(item.produtoId);
            if (produto) {
                produto.quantidade -= item.quantidade;
                produto.quantidade = parseFloat(produto.quantidade.toFixed(3));
            }
        });
        
        // Adicionar venda ao caixa
        this.caixaAtual.adicionarVenda(venda);
        
        // Salvar dados
        this.vendas.push(venda);
        this.salvarEstoque();
        this.salvarVendas();
        this.salvarCaixas();
        
        return venda;
    }
    
    // ==================== MÉTODOS DE CAIXA ====================
    
    abrirCaixa(operador) {
        this.operadorAtual = operador;
        this.caixaAtual = new Caixa(operador.id, operador.nome);
        this.limparCarrinho();
    }
    
    encerrarCaixa() {
        if (this.caixaAtual) {
            this.caixaAtual.fechar();
            this.caixas.push(this.caixaAtual);
            this.salvarCaixas();
            
            const totalVendas = this.caixaAtual.total;
            alert(`Caixa encerrado!\nTotal de vendas: R$ ${totalVendas.toFixed(2)}\nNúmero de vendas: ${this.caixaAtual.vendas.length}`);
            
            this.caixaAtual = null;
            this.operadorAtual = null;
            this.limparCarrinho();
        }
    }
    
    // ==================== MÉTODOS DE OPERADORES ====================
    
    buscarOperadorPorId(id) {
        return this.operadores.find(o => o.id == id);
    }
    
    buscarOperadorPorUsuario(usuario) {
        return this.operadores.find(o => o.usuario === usuario);
    }
    
    cadastrarOperador(dados) {
        const operador = new Operador(
            Date.now(),
            dados.nome,
            dados.usuario,
            dados.senha
        );
        
        this.operadores.push(operador);
        this.salvarOperadores();
        return operador;
    }
    
    excluirOperador(id) {
        this.operadores = this.operadores.filter(o => o.id !== id);
        this.salvarOperadores();
    }
    
    // ==================== MÉTODOS DE AVARIA ====================
    
    registrarAvaria(dados) {
        const produto = this.buscarProdutoPorId(dados.produtoId);
        if (!produto) return null;
        
        if (produto.quantidade < dados.quantidade) {
            alert(`Quantidade insuficiente em estoque! Disponível: ${produto.quantidade.toFixed(3)} ${produto.unidade}`);
            return null;
        }
        
        produto.quantidade -= dados.quantidade;
        produto.quantidade = parseFloat(produto.quantidade.toFixed(3));
        
        const avaria = new Avaria(
            produto.id,
            produto.nome,
            dados.quantidade,
            dados.motivo,
            dados.observacao,
            produto.precoEntrada * dados.quantidade
        );
        
        this.avarias.push(avaria);
        this.salvarEstoque();
        this.salvarAvarias();
        
        return avaria;
    }
    
    excluirAvaria(id) {
        const avariaIndex = this.avarias.findIndex(a => a.id === id);
        if (avariaIndex !== -1) {
            const avaria = this.avarias[avariaIndex];
            const produto = this.buscarProdutoPorId(avaria.produtoId);
            if (produto) {
                produto.quantidade += avaria.quantidade;
                produto.quantidade = parseFloat(produto.quantidade.toFixed(3));
            }
            
            this.avarias.splice(avariaIndex, 1);
            this.salvarEstoque();
            this.salvarAvarias();
            return true;
        }
        return false;
    }
    
    // ==================== MÉTODOS DE ENTRADA ====================
    
    registrarEntrada(dados) {
        const produto = this.buscarProdutoPorId(dados.produtoId);
        if (!produto) return null;
        
        produto.quantidade += dados.quantidade;
        produto.quantidade = parseFloat(produto.quantidade.toFixed(3));
        
        if (dados.precoCusto && dados.precoCusto > 0) {
            produto.precoEntrada = dados.precoCusto;
        }
        
        const entrada = new Entrada(
            produto.id,
            produto.nome,
            dados.quantidade,
            dados.precoCusto || produto.precoEntrada,
            dados.motivo
        );
        
        this.entradas.push(entrada);
        this.salvarEstoque();
        this.salvarEntradas();
        
        return entrada;
    }
    
    // ==================== MÉTODOS DE FILTRO ====================
    
    filtrarProdutosPorTermo(termo) {
        return this.estoque.filter(produto => 
            produto.ativo !== false && 
            produto.quantidade > 0 &&
            (produto.nome.toLowerCase().includes(termo.toLowerCase()) || 
             produto.codigo.toLowerCase().includes(termo.toLowerCase()))
        );
    }
    
    getCategorias() {
        return [...new Set(this.estoque.map(p => p.categoria))];
    }
    
    filtrarAvariasPorData(dataInicio, dataFim) {
        let avariasFiltradas = [...this.avarias];
        
        if (dataInicio) {
            const inicio = new Date(dataInicio);
            inicio.setHours(0, 0, 0, 0);
            avariasFiltradas = avariasFiltradas.filter(a => new Date(a.data) >= inicio);
        }
        
        if (dataFim) {
            const fim = new Date(dataFim);
            fim.setHours(23, 59, 59, 999);
            avariasFiltradas = avariasFiltradas.filter(a => new Date(a.data) <= fim);
        }
        
        return avariasFiltradas.sort((a, b) => new Date(b.data) - new Date(a.data));
    }
    
    filtrarCaixas(dataInicio, dataFim, operadorId, status) {
        let filteredCaixas = this.caixas;
        
        if (dataInicio) {
            const inicio = new Date(dataInicio);
            inicio.setHours(0, 0, 0, 0);
            filteredCaixas = filteredCaixas.filter(c => new Date(c.dataAbertura) >= inicio);
        }
        
        if (dataFim) {
            const fim = new Date(dataFim);
            fim.setHours(23, 59, 59, 999);
            filteredCaixas = filteredCaixas.filter(c => new Date(c.dataAbertura) <= fim);
        }
        
        if (operadorId !== 'todos') {
            filteredCaixas = filteredCaixas.filter(c => c.operadorId == operadorId);
        }
        
        if (status !== 'todos') {
            filteredCaixas = filteredCaixas.filter(c => 
                status === 'aberto' ? !c.fechado : c.fechado
            );
        }
        
        return filteredCaixas;
    }
}

// ==================== CLASSE DE INTERFACE ====================

class InterfacePDV {
    constructor(sistema) {
        this.sistema = sistema;
        this.produtoSelecionadoParaAdicionar = null;
        
        // Configurar listeners após um pequeno delay para garantir que o DOM está pronto
        setTimeout(() => {
            this.configurarEventListeners();
            console.log("Interface PDV inicializada");
        }, 100);
    }
    
    // ==================== MÉTODOS DE NAVEGAÇÃO ====================
    
    backToMain() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('adminLoginScreen').classList.add('hidden');
        document.getElementById('caixaLoginScreen').classList.add('hidden');
        document.getElementById('adminMode').classList.add('hidden');
        document.getElementById('caixaMode').classList.add('hidden');
        
        this.esconderMensagemErro('adminError');
        this.esconderMensagemErro('caixaError');
    }
    
    showSection(sectionId) {
        const sections = [
            'cadastroProduto', 
            'gerenciarProdutos', 
            'entradaProduto', 
            'avariaProduto', 
            'relatorioEstoque', 
            'relatorioCaixa',
            'gerenciarOperadores',
            'relatorioAvarias'
        ];
        
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.add('hidden');
        });
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            
            switch(sectionId) {
                case 'gerenciarProdutos':
                    this.carregarProdutosAdmin();
                    break;
                case 'entradaProduto':
                case 'avariaProduto':
                    this.carregarProdutosSelect();
                    break;
                case 'relatorioEstoque':
                    this.carregarRelatorioEstoque();
                    break;
                case 'relatorioCaixa':
                    this.carregarOperadoresRelatorio();
                    break;
                case 'gerenciarOperadores':
                    this.carregarOperadoresAdmin();
                    break;
                case 'relatorioAvarias':
                    this.carregarRelatorioAvarias();
                    break;
            }
        }
    }
    
    // ==================== MÉTODOS DE LOGIN ====================
    
    loginAdmin() {
        const senhaInput = document.getElementById('adminPassword');
        const senha = senhaInput.value;
        
        this.esconderMensagemErro('adminError');
        
        if (!senha) {
            this.mostrarMensagemErro('adminError', 'Por favor, digite a senha do administrador.');
            senhaInput.focus();
            return;
        }
        
        if (senha === this.sistema.SENHA_ADMIN) {
            senhaInput.value = '';
            document.getElementById('adminLoginScreen').classList.add('hidden');
            document.getElementById('adminMode').classList.remove('hidden');
            this.showSection('cadastroProduto');
            this.carregarProdutosSelect();
            this.carregarOperadoresRelatorio();
        } else {
            this.mostrarMensagemErro('adminError', 'Senha incorreta! A senha padrão é: admin123');
            senhaInput.focus();
            senhaInput.select();
        }
    }
    
    loginCaixa() {
        const operadorId = document.getElementById('operador').value;
        const senha = document.getElementById('caixaPassword').value;
        
        this.esconderMensagemErro('caixaError');
        
        if (!operadorId) {
            this.mostrarMensagemErro('caixaError', 'Selecione um operador!');
            document.getElementById('operador').focus();
            return;
        }
        
        if (!senha) {
            this.mostrarMensagemErro('caixaError', 'Digite a senha do operador!');
            document.getElementById('caixaPassword').focus();
            return;
        }
        
        const operador = this.sistema.buscarOperadorPorId(parseInt(operadorId));
        
        if (!operador) {
            this.mostrarMensagemErro('caixaError', 'Operador não encontrado!');
            return;
        }
        
        if (operador.senha === senha) {
            this.sistema.abrirCaixa(operador);
            
            document.getElementById('operador').value = '';
            document.getElementById('caixaPassword').value = '';
            
            document.getElementById('caixaLoginScreen').classList.add('hidden');
            document.getElementById('caixaMode').classList.remove('hidden');
            
            const infoOperador = document.getElementById('infoOperador');
            if (infoOperador) {
                infoOperador.innerHTML = `<strong>Operador:</strong> ${operador.nome}`;
            }
            
            const infoCaixa = document.getElementById('infoCaixa');
            if (infoCaixa) {
                infoCaixa.textContent = `Caixa Aberto`;
            }
            
            // Limpar campo de busca e mostrar mensagem inicial
            const buscaProduto = document.getElementById('buscaProduto');
            if (buscaProduto) {
                buscaProduto.value = '';
            }
            this.mostrarMensagemBusca();
            this.atualizarCarrinho();
        } else {
            this.mostrarMensagemErro('caixaError', 'Senha incorreta! Tente novamente.');
            document.getElementById('caixaPassword').focus();
            document.getElementById('caixaPassword').select();
        }
    }
    
    // ==================== MÉTODOS DE BUSCA PDV ====================
    
    mostrarMensagemBusca() {
        const container = document.getElementById('listaProdutos');
        if (container) {
            container.innerHTML = `
                <div class="empty-state" id="mensagemBusca">
                    <i class="fas fa-search"></i>
                    <p>Digite o nome ou código do produto para buscar</p>
                </div>
            `;
        }
    }
    
    buscarProdutoPDV() {
        const termo = document.getElementById('buscaProduto').value.trim();
        const container = document.getElementById('listaProdutos');
        
        if (!container) return;
        
        if (!termo) {
            this.mostrarMensagemBusca();
            return;
        }
        
        const produtosFiltrados = this.sistema.filtrarProdutosPorTermo(termo);
        
        if (produtosFiltrados.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>Nenhum produto encontrado para "${termo}"</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        produtosFiltrados.forEach(produto => {
            const estoqueBaixo = produto.quantidade <= produto.estoqueMinimo;
            
            const item = document.createElement('div');
            item.className = 'produto-card';
            item.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <strong>${produto.nome}</strong>
                        <p>Código: ${produto.codigo}</p>
                        <p>Estoque: ${produto.quantidade.toFixed(3)} ${produto.unidade} 
                        ${estoqueBaixo ? '<span class="badge badge-warning">BAIXO</span>' : ''}</p>
                    </div>
                    <div class="text-right">
                        <div class="preco">R$ ${produto.precoVenda.toFixed(2)}</div>
                        <small class="text-muted">por ${produto.unidade === 'unidade' ? 'un' : produto.unidade}</small>
                    </div>
                </div>
                <div class="produto-quantidade-controles">
                    <button class="quantidade-btn diminuir-produto" data-id="${produto.id}">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" class="quantidade-input" id="quantidade-${produto.id}" value="1" min="0.001" step="0.001" style="width: 80px; text-align: center;">
                    <button class="quantidade-btn aumentar-produto" data-id="${produto.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-small btn-adicionar-quantidade" data-id="${produto.id}">
                        <i class="fas fa-plus"></i> Adicionar
                    </button>
                </div>
                <div class="mt-10">
                    <small><strong>Valor unitário:</strong> R$ ${produto.precoVenda.toFixed(2)} por ${produto.unidade === 'unidade' ? 'unidade' : produto.unidade}</small>
                </div>
            `;
            container.appendChild(item);
        });
        
        // Adicionar event listeners
        setTimeout(() => {
            document.querySelectorAll('.diminuir-produto').forEach(button => {
                button.addEventListener('click', (e) => {
                    const produtoId = parseInt(e.target.closest('button').getAttribute('data-id'));
                    this.alterarQuantidadeProduto(produtoId, -1);
                });
            });
            
            document.querySelectorAll('.aumentar-produto').forEach(button => {
                button.addEventListener('click', (e) => {
                    const produtoId = parseInt(e.target.closest('button').getAttribute('data-id'));
                    this.alterarQuantidadeProduto(produtoId, 1);
                });
            });
            
            document.querySelectorAll('.btn-adicionar-quantidade').forEach(button => {
                button.addEventListener('click', (e) => {
                    const produtoId = parseInt(e.target.closest('button').getAttribute('data-id'));
                    this.adicionarAoCarrinhoPDV(produtoId);
                });
            });
            
            document.querySelectorAll('.quantidade-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const produtoId = parseInt(e.target.id.replace('quantidade-', ''));
                    const valor = parseFloat(e.target.value);
                    
                    if (isNaN(valor) || valor <= 0) {
                        e.target.value = '1';
                        return;
                    }
                    
                    const produto = this.sistema.buscarProdutoPorId(produtoId);
                    if (produto && valor > produto.quantidade) {
                        alert(`Estoque insuficiente! Disponível: ${produto.quantidade.toFixed(3)} ${produto.unidade}`);
                        e.target.value = produto.quantidade;
                    }
                });
            });
        }, 100);
    }
    
    alterarQuantidadeProduto(produtoId, delta) {
        const quantidadeInput = document.getElementById(`quantidade-${produtoId}`);
        if (!quantidadeInput) return;
        
        let quantidade = parseFloat(quantidadeInput.value);
        if (isNaN(quantidade)) quantidade = 1;
        
        quantidade += delta;
        
        if (quantidade < 0.001) quantidade = 0.001;
        
        const produto = this.sistema.buscarProdutoPorId(produtoId);
        if (produto && produto.quantidade < quantidade) {
            alert(`Estoque insuficiente! Disponível: ${produto.quantidade.toFixed(3)} ${produto.unidade}`);
            quantidade = produto.quantidade;
        }
        
        quantidadeInput.value = quantidade.toFixed(3);
    }
    
    adicionarAoCarrinhoPDV(produtoId) {
        const quantidadeInput = document.getElementById(`quantidade-${produtoId}`);
        if (!quantidadeInput) return;
        
        const quantidade = parseFloat(quantidadeInput.value);
        if (isNaN(quantidade) || quantidade <= 0) {
            alert('Digite uma quantidade válida!');
            quantidadeInput.value = '1';
            return;
        }
        
        const sucesso = this.sistema.adicionarAoCarrinho(produtoId, quantidade);
        if (sucesso) {
            quantidadeInput.value = '1';
            this.atualizarCarrinho();
        }
    }
    
    // ==================== MÉTODOS DE CARRINHO ====================
    
    atualizarCarrinho() {
        const container = document.getElementById('carrinhoItems');
        const totalElement = document.getElementById('totalCarrinho');
        const totalElementSmall = document.getElementById('totalCarrinhoSmall');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.sistema.carrinho.length === 0) {
            container.innerHTML = `
                <div class="empty-state" id="carrinhoVazio">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Carrinho vazio</p>
                </div>
            `;
            const btnFinalizar = document.getElementById('btnFinalizarVenda');
            const btnCancelar = document.getElementById('btnCancelarCarrinho');
            if (btnFinalizar) btnFinalizar.disabled = true;
            if (btnCancelar) btnCancelar.disabled = true;
        } else {
            const btnFinalizar = document.getElementById('btnFinalizarVenda');
            const btnCancelar = document.getElementById('btnCancelarCarrinho');
            if (btnFinalizar) btnFinalizar.disabled = false;
            if (btnCancelar) btnCancelar.disabled = false;
            
            this.sistema.carrinho.forEach((item, index) => {
                const subtotal = item.getSubtotal();
                
                const itemElement = document.createElement('div');
                itemElement.className = 'carrinho-item';
                itemElement.innerHTML = `
                    <div class="carrinho-item-header">
                        <div class="carrinho-item-nome">${item.nome}</div>
                        <div class="carrinho-item-preco">R$ ${subtotal.toFixed(2)}</div>
                    </div>
                    <div class="carrinho-item-detalhes">
                        <div>
                            <span>Código: ${item.codigo}</span><br>
                            <span>${item.quantidade} ${item.unidade} x R$ ${item.preco.toFixed(2)}</span><br>
                            <small class="text-muted">Valor unitário: R$ ${item.preco.toFixed(2)}/${item.unidade === 'unidade' ? 'und ' : item.unidade}</small>
                        </div>
                        <div class="carrinho-item-acoes">
                        
                            <button class="btn btn-small btn-vermelho remover" data-index="${index}" title="Remover">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(itemElement);
            });
            
            // Adicionar event listeners
            setTimeout(() => {
                document.querySelectorAll('.diminuir').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const index = parseInt(e.target.closest('button').getAttribute('data-index'));
                        this.sistema.alterarQuantidadeCarrinho(index, -0.001);
                        this.atualizarCarrinho();
                    });
                });
                
                document.querySelectorAll('.aumentar').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const index = parseInt(e.target.closest('button').getAttribute('data-index'));
                        this.sistema.alterarQuantidadeCarrinho(index, 0.001);
                        this.atualizarCarrinho();
                    });
                });
                
                document.querySelectorAll('.remover').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const index = parseInt(e.target.closest('button').getAttribute('data-index'));
                        this.sistema.removerDoCarrinho(index);
                        this.atualizarCarrinho();
                    });
                });
            }, 100);
        }
        
        const total = this.sistema.getTotalCarrinho();
        if (totalElement) totalElement.textContent = total.toFixed(2);
        if (totalElementSmall) totalElementSmall.textContent = total.toFixed(2);
    }
    
    // ==================== MÉTODOS DE PAGAMENTO ====================
    
    selecionarPagamento(tipo) {
        this.sistema.formaPagamento = tipo;
        
        document.querySelectorAll('.forma-pagamento-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const trocoSection = document.getElementById('trocoSection');
        if (trocoSection) trocoSection.classList.add('hidden');
        
        const valorPago = document.getElementById('valorPago');
        const valorTroco = document.getElementById('valorTroco');
        
        if (valorPago) valorPago.value = '';
        if (valorTroco) valorTroco.textContent = '0.00';
        
        if (tipo === 'dinheiro') {
            const btnDinheiro = document.querySelector('[data-pagamento="dinheiro"]');
            if (btnDinheiro) btnDinheiro.classList.add('active');
            if (trocoSection) trocoSection.classList.remove('hidden');
            if (valorPago) valorPago.focus();
        } else if (tipo === 'cartao') {
            const btnCartao = document.querySelector('[data-pagamento="cartao"]');
            if (btnCartao) btnCartao.classList.add('active');
        } else if (tipo === 'pix') {
            const btnPix = document.querySelector('[data-pagamento="pix"]');
            if (btnPix) btnPix.classList.add('active');
        }
    }
    
    calcularTroco() {
        const totalElement = document.getElementById('totalCarrinho');
        const valorPagoElement = document.getElementById('valorPago');
        const valorTrocoElement = document.getElementById('valorTroco');
        
        if (!totalElement || !valorPagoElement || !valorTrocoElement) return;
        
        const total = parseFloat(totalElement.textContent);
        const valorPago = parseFloat(valorPagoElement.value) || 0;
        
        if (valorPago >= total) {
            const troco = valorPago - total;
            valorTrocoElement.textContent = troco.toFixed(2);
        } else {
            valorTrocoElement.textContent = '0.00';
        }
    }
    
    concluirPagamento() {
        if (!this.sistema.formaPagamento) {
            alert('Selecione uma forma de pagamento!');
            return;
        }
        
        let valorPago = 0;
        if (this.sistema.formaPagamento === 'dinheiro') {
            const valorPagoElement = document.getElementById('valorPago');
            if (valorPagoElement) {
                valorPago = parseFloat(valorPagoElement.value);
            }
            if (!valorPago || valorPago < this.sistema.getTotalCarrinho()) {
                alert('Valor pago insuficiente!');
                return;
            }
        }
        
        const venda = this.sistema.concluirVenda(this.sistema.formaPagamento, valorPago);
        if (venda) {
            this.mostrarCupom(venda);
            this.sistema.limparCarrinho();
            
            setTimeout(() => {
                this.atualizarCarrinho();
                const formasPagamento = document.getElementById('formasPagamento');
                if (formasPagamento) formasPagamento.classList.add('hidden');
                
                document.querySelectorAll('.carrinho-footer').forEach(el => {
                    el.classList.remove('hidden');
                });
                
                document.querySelectorAll('.carrinho-items').forEach(el => {
                    el.classList.remove('hidden');
                });
                
                this.selecionarPagamento(null);
                const buscaProduto = document.getElementById('buscaProduto');
                if (buscaProduto) buscaProduto.value = '';
                this.mostrarMensagemBusca();
            }, 100);
        }
    }
    
    // ==================== MÉTODOS DE CUPOM ====================
    
    mostrarCupom(venda) {
        const cupomModal = document.getElementById('cupomModal');
        if (!cupomModal) return;
        
        const cupomItens = document.getElementById('cupomItens');
        const cupomTotal = document.getElementById('cupomTotal');
        const cupomPagamento = document.getElementById('cupomPagamento');
        const cupomTroco = document.getElementById('cupomTroco');
        const cupomData = document.getElementById('cupomData');
        const cupomOperador = document.getElementById('cupomOperador');
        
        if (cupomData) cupomData.textContent = new Date(venda.data).toLocaleString();
        if (cupomOperador) cupomOperador.textContent = `Operador: ${venda.operadorNome}`;
        if (cupomItens) cupomItens.innerHTML = '';
        
        if (cupomItens) {
            venda.itens.forEach(item => {
                const subtotal = item.getSubtotal();
                const itemElement = document.createElement('div');
                itemElement.className = 'cupom-item';
                itemElement.innerHTML = `
                    <span>${item.nome.substring(0, 20)} ${item.quantidade.toFixed(3)}${item.unidade === 'unidade' ? 'un' : item.unidade.substring(0, 1)} x ${item.preco.toFixed(2)}</span>
                    <span>${subtotal.toFixed(2)}</span>
                `;
                cupomItens.appendChild(itemElement);
            });
        }
        
        if (cupomTotal) cupomTotal.textContent = venda.total.toFixed(2);
        if (cupomPagamento) {
            cupomPagamento.innerHTML = `<div class="cupom-item"><span>Pgto: ${venda.formaPagamento.toUpperCase()}</span><span></span></div>`;
        }
        
        if (cupomTroco) {
            if (venda.formaPagamento === 'dinheiro' && venda.troco > 0) {
                cupomTroco.innerHTML = `<div class="cupom-item"><span>Troco:</span><span>${venda.troco.toFixed(2)}</span></div>`;
            } else {
                cupomTroco.innerHTML = '';
            }
        }
        
        cupomModal.style.display = 'flex';
    }
    
    // ==================== MÉTODOS ADMINISTRADOR ====================
    
    carregarProdutosAdmin() {
        const tbody = document.getElementById('produtosTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.sistema.estoque.forEach(produto => {
            const row = `
                <tr>
                    <td>${produto.codigo}</td>
                    <td>${produto.nome}</td>
                    <td>${produto.quantidade.toFixed(3)} ${produto.unidade}</td>
                    <td>R$ ${produto.precoVenda.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-azul editar-produto" data-id="${produto.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-vermelho excluir-produto" data-id="${produto.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        
        // Adicionar event listeners
        setTimeout(() => {
            document.querySelectorAll('.editar-produto').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = parseInt(e.target.closest('button').getAttribute('data-id'));
                    this.editarProduto(id);
                });
            });
            
            document.querySelectorAll('.excluir-produto').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = parseInt(e.target.closest('button').getAttribute('data-id'));
                    this.excluirProduto(id);
                });
            });
        }, 100);
    }
    
    editarProduto(id) {
        const produto = this.sistema.buscarProdutoPorId(id);
        if (!produto) return;
        
        const novoNome = prompt('Digite o novo nome do produto:', produto.nome);
        if (novoNome === null) return;
        
        const novoPreco = prompt('Digite o novo preço de venda:', produto.precoVenda);
        if (novoPreco === null) return;
        
        this.sistema.atualizarProduto(id, {
            nome: novoNome,
            precoVenda: parseFloat(novoPreco)
        });
        
        this.carregarProdutosAdmin();
        this.carregarProdutosSelect();
        alert('Produto atualizado com sucesso!');
    }
    
    excluirProduto(id) {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;
        
        this.sistema.excluirProduto(id);
        this.carregarProdutosAdmin();
        this.carregarProdutosSelect();
        alert('Produto excluído com sucesso!');
    }
    
    cadastrarProduto() {
        const produto = this.sistema.cadastrarProduto({
            codigo: document.getElementById('produtoCodigo').value.trim(),
            nome: document.getElementById('produtoNome').value.trim(),
            precoEntrada: parseFloat(document.getElementById('precoEntrada').value) || 0,
            precoVenda: parseFloat(document.getElementById('precoVenda').value) || 0,
            unidade: document.getElementById('unidadeMedida').value,
            quantidade: parseFloat(document.getElementById('quantidadeInicial').value) || 0,
            estoqueMinimo: parseFloat(document.getElementById('estoqueMinimo').value) || 0,
            categoria: document.getElementById('categoriaProduto').value.trim() || 'Geral'
        });
        
        if (produto) {
            alert('Produto cadastrado com sucesso!');
            
            // Limpar formulário
            document.getElementById('produtoCodigo').value = '';
            document.getElementById('produtoNome').value = '';
            document.getElementById('precoEntrada').value = '';
            document.getElementById('precoVenda').value = '';
            document.getElementById('quantidadeInicial').value = '0';
            document.getElementById('estoqueMinimo').value = '0';
            document.getElementById('categoriaProduto').value = '';
        }
    }
    
    carregarProdutosSelect() {
        const selects = ['produtoSelect', 'produtoAvaria'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Selecione um produto</option>';
                
                this.sistema.estoque.forEach(produto => {
                    const option = document.createElement('option');
                    option.value = produto.id;
                    option.textContent = `${produto.codigo} - ${produto.nome} (${produto.quantidade.toFixed(3)} ${produto.unidade})`;
                    select.appendChild(option);
                });
            }
        });
    }
    
    carregarInfoProduto() {
        const produtoId = document.getElementById('produtoSelect').value;
        const produto = this.sistema.buscarProdutoPorId(produtoId);
        
        if (produto) {
            document.getElementById('infoProduto').style.display = 'block';
            document.getElementById('estoqueAtual').textContent = produto.quantidade.toFixed(3);
            document.getElementById('unidadeAtual').textContent = produto.unidade;
            document.getElementById('precoCustoAtual').textContent = produto.precoEntrada.toFixed(2);
            document.getElementById('precoVendaAtual').textContent = produto.precoVenda.toFixed(2);
            document.getElementById('precoCustoEntrada').placeholder = produto.precoEntrada.toFixed(2);
        } else {
            document.getElementById('infoProduto').style.display = 'none';
        }
    }
    
    registrarEntrada() {
        const entrada = this.sistema.registrarEntrada({
            produtoId: document.getElementById('produtoSelect').value,
            quantidade: parseFloat(document.getElementById('quantidadeEntrada').value),
            precoCusto: parseFloat(document.getElementById('precoCustoEntrada').value),
            motivo: document.getElementById('motivoEntrada').value
        });
        
        if (entrada) {
            const produto = this.sistema.buscarProdutoPorId(entrada.produtoId);
            alert(`Entrada de ${entrada.quantidade} ${produto.unidade} registrada para ${produto.nome}`);
            document.getElementById('quantidadeEntrada').value = '';
            document.getElementById('precoCustoEntrada').value = '';
            this.carregarInfoProduto();
        }
    }
    
    registrarAvaria() {
        const avaria = this.sistema.registrarAvaria({
            produtoId: document.getElementById('produtoAvaria').value,
            quantidade: parseFloat(document.getElementById('quantidadeAvaria').value),
            motivo: document.getElementById('motivoAvaria').value,
            observacao: document.getElementById('observacaoAvaria').value
        });
        
        if (avaria) {
            const produto = this.sistema.buscarProdutoPorId(avaria.produtoId);
            alert(`Avaria de ${avaria.quantidade} ${produto.unidade} registrada para ${produto.nome}`);
            document.getElementById('quantidadeAvaria').value = '';
            document.getElementById('observacaoAvaria').value = '';
        }
    }
    
    // ==================== MÉTODOS DE RELATÓRIOS ====================
    
    carregarRelatorioEstoque() {
        const tbody = document.getElementById('estoqueTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        let totalValor = 0;
        
        this.sistema.estoque.forEach(produto => {
            const valorTotal = produto.quantidade * produto.precoEntrada;
            totalValor += valorTotal;
            
            const row = `
                <tr>
                    <td>${produto.codigo}</td>
                    <td>${produto.nome}</td>
                    <td>${produto.categoria}</td>
                    <td>${produto.quantidade.toFixed(3)}</td>
                    <td>${produto.unidade}</td>
                    <td>R$ ${produto.precoEntrada.toFixed(2)}</td>
                    <td>R$ ${produto.precoVenda.toFixed(2)}</td>
                    <td>R$ ${valorTotal.toFixed(2)}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        
        const totalEstoqueValor = document.getElementById('totalEstoqueValor');
        if (totalEstoqueValor) {
            totalEstoqueValor.textContent = `R$ ${totalValor.toFixed(2)}`;
        }
        
        // Carregar categorias no filtro
        const selectCategorias = document.getElementById('filtroCategoria');
        if (selectCategorias) {
            selectCategorias.innerHTML = '<option value="todos">Todas as Categorias</option>';
            this.sistema.getCategorias().forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria;
                option.textContent = categoria;
                selectCategorias.appendChild(option);
            });
        }
    }
    
    carregarRelatorioAvarias() {
        const tbody = document.getElementById('avariasTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (this.sistema.avarias.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Nenhuma avaria registrada</td>
                </tr>
            `;
            const totalPerdasAvaria = document.getElementById('totalPerdasAvaria');
            if (totalPerdasAvaria) totalPerdasAvaria.textContent = 'R$ 0.00';
            return;
        }
        
        let totalPerdas = 0;
        
        this.sistema.avarias.sort((a, b) => new Date(b.data) - new Date(a.data)).forEach(avaria => {
            const dataFormatada = new Date(avaria.data).toLocaleDateString('pt-BR');
            const horaFormatada = new Date(avaria.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const valorPerda = avaria.precoCusto || 0;
            totalPerdas += valorPerda;
            
            const row = `
                <tr>
                    <td>${dataFormatada} ${horaFormatada}</td>
                    <td>${avaria.produtoNome}</td>
                    <td>${avaria.quantidade.toFixed(3)}</td>
                    <td>${avaria.motivo}</td>
                    <td>${avaria.observacao || '-'}</td>
                    <td>R$ ${valorPerda.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-vermelho excluir-avaria" data-id="${avaria.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        
        const totalPerdasAvaria = document.getElementById('totalPerdasAvaria');
        if (totalPerdasAvaria) {
            totalPerdasAvaria.textContent = `R$ ${totalPerdas.toFixed(2)}`;
        }
        
        // Adicionar event listeners
        setTimeout(() => {
            document.querySelectorAll('.excluir-avaria').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = parseInt(e.target.closest('button').getAttribute('data-id'));
                    if (this.sistema.excluirAvaria(id)) {
                        this.carregarRelatorioAvarias();
                        alert('Avaria excluída e estoque restaurado!');
                    }
                });
            });
        }, 100);
    }
    
    gerarRelatorioCaixa() {
        const filteredCaixas = this.sistema.filtrarCaixas(
            document.getElementById('dataInicio').value,
            document.getElementById('dataFim').value,
            document.getElementById('operadorRelatorio').value,
            document.getElementById('statusCaixa').value
        );
        
        const tbody = document.getElementById('caixaTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        let totalGeral = 0;
        
        if (filteredCaixas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">Nenhum caixa encontrado para os filtros selecionados</td>
                </tr>
            `;
            const totalGeralCaixa = document.getElementById('totalGeralCaixa');
            if (totalGeralCaixa) totalGeralCaixa.textContent = 'R$ 0.00';
            return;
        }
        
        filteredCaixas.forEach(caixa => {
            const operador = this.sistema.buscarOperadorPorId(caixa.operadorId);
            const totalVendas = caixa.total;
            totalGeral += totalVendas;
            
            const dataAberturaFormatada = new Date(caixa.dataAbertura).toLocaleDateString('pt-BR');
            const horaAberturaFormatada = new Date(caixa.dataAbertura).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            const row = `
                <tr>
                    <td>${dataAberturaFormatada} ${horaAberturaFormatada}</td>
                    <td>${operador ? operador.nome : 'N/A'}</td>
                    <td>${caixa.vendas.length}</td>
                    <td>R$ ${totalVendas.toFixed(2)}</td>
                    <td>
                        <span class="status-caixa ${caixa.fechado ? 'status-fechado' : 'status-aberto'}">
                            ${caixa.fechado ? 'Fechado' : 'Aberto'}
                        </span>
                    </td>
                    <td>
                        ${caixa.vendas.length > 0 ? 
                            `<button class="btn btn-azul ver-detalhes" data-id="${caixa.id}">
                                <i class="fas fa-eye"></i> Detalhes
                            </button>` : ''
                        }
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        
        const totalGeralCaixa = document.getElementById('totalGeralCaixa');
        if (totalGeralCaixa) {
            totalGeralCaixa.textContent = `R$ ${totalGeral.toFixed(2)}`;
        }
        
        // Adicionar event listeners
        setTimeout(() => {
            document.querySelectorAll('.ver-detalhes').forEach(button => {
                button.addEventListener('click', (e) => {
                    const caixaId = parseInt(e.target.closest('button').getAttribute('data-id'));
                    this.verDetalhesCaixa(caixaId);
                });
            });
        }, 100);
    }
    
    verDetalhesCaixa(caixaId) {
        const caixa = this.sistema.caixas.find(c => c.id == caixaId);
        if (!caixa) return;
        
        let html = `
            <div style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <h3>Detalhes do Caixa</h3>
                <p><strong>Abertura:</strong> ${new Date(caixa.dataAbertura).toLocaleString('pt-BR')}</p>
                <p><strong>Operador:</strong> ${caixa.operadorNome}</p>
                <p><strong>Status:</strong> ${caixa.fechado ? 'Fechado' : 'Aberto'}</p>
                ${caixa.dataFechamento ? `<p><strong>Fechamento:</strong> ${new Date(caixa.dataFechamento).toLocaleString('pt-BR')}</p>` : ''}
                <hr>
                <h4>Vendas deste Caixa (${caixa.vendas.length})</h4>
        `;
        
        if (caixa.vendas.length > 0) {
            html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
            html += `
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th style="padding: 8px; border: 1px solid #ddd;">Data/Hora</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Itens</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Total</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Pagamento</th>
                    </tr>
                </thead>
                <tbody>
            `;
            
            caixa.vendas.forEach(venda => {
                html += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(venda.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${venda.itens.length} itens</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">R$ ${venda.total.toFixed(2)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${venda.formaPagamento}</td>
                    </tr>
                `;
            });
            
            html += '</tbody>';
            html += `
                <tfoot>
                    <tr style="background: #f8f8f8; font-weight: bold;">
                        <td colspan="2" style="padding: 8px; border: 1px solid #ddd;">Total do Caixa:</td>
                        <td colspan="2" style="padding: 8px; border: 1px solid #ddd;">R$ ${caixa.total.toFixed(2)}</td>
                    </tr>
                </tfoot>
            `;
            html += '</table>';
        } else {
            html += '<p>Nenhuma venda registrada neste caixa.</p>';
        }
        
        html += `
            <div style="margin-top: 20px; text-align: center;">
                <button id="btnFecharDetalhes" class="btn btn-voltar">Fechar</button>
            </div>
        `;
        
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = html;
        modalDiv.style.position = 'fixed';
        modalDiv.style.top = '50%';
        modalDiv.style.left = '50%';
        modalDiv.style.transform = 'translate(-50%, -50%)';
        modalDiv.style.backgroundColor = 'white';
        modalDiv.style.padding = '20px';
        modalDiv.style.borderRadius = '10px';
        modalDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        modalDiv.style.zIndex = '1001';
        
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '1000';
        
        document.body.appendChild(overlay);
        document.body.appendChild(modalDiv);
        
        document.getElementById('btnFecharDetalhes').addEventListener('click', () => {
            document.body.removeChild(overlay);
            document.body.removeChild(modalDiv);
        });
    }
    
    // ==================== MÉTODOS DE OPERADORES ====================
    
    carregarOperadoresAdmin() {
        const tbody = document.getElementById('operadoresTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.sistema.operadores.forEach(operador => {
            const row = `
                <tr>
                    <td>${operador.nome}</td>
                    <td>${operador.usuario}</td>
                    <td>${new Date(operador.dataCadastro).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-vermelho excluir-operador" data-id="${operador.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        
        // Adicionar event listeners
        setTimeout(() => {
            document.querySelectorAll('.excluir-operador').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = parseInt(e.target.closest('button').getAttribute('data-id'));
                    this.excluirOperador(id);
                });
            });
        }, 100);
    }
    
    excluirOperador(id) {
        if (this.sistema.operadores.length <= 1) {
            alert('É necessário ter pelo menos um operador!');
            return;
        }
        
        if (!confirm('Tem certeza que deseja excluir este operador?')) return;
        
        this.sistema.excluirOperador(id);
        this.carregarOperadoresAdmin();
        this.carregarOperadoresSelect();
        this.carregarOperadoresRelatorio();
        alert('Operador excluído com sucesso!');
    }
    
    cadastrarOperador() {
        const senha = document.getElementById('novoOperadorSenha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;
        
        if (senha !== confirmarSenha) {
            alert('As senhas não coincidem!');
            return;
        }
        
        const operador = this.sistema.cadastrarOperador({
            nome: document.getElementById('novoOperadorNome').value.trim(),
            usuario: document.getElementById('novoOperadorUsuario').value.trim(),
            senha: senha
        });
        
        if (operador) {
            alert('Operador cadastrado com sucesso!');
            
            document.getElementById('novoOperadorNome').value = '';
            document.getElementById('novoOperadorUsuario').value = '';
            document.getElementById('novoOperadorSenha').value = '';
            document.getElementById('confirmarSenha').value = '';
            
            this.carregarOperadoresAdmin();
            this.carregarOperadoresSelect();
            this.carregarOperadoresRelatorio();
        }
    }
    
    // ==================== MÉTODOS AUXILIARES ====================
    
    carregarOperadoresSelect() {
        const select = document.getElementById('operador');
        if (select) {
            select.innerHTML = '<option value="">Selecione um operador</option>';
            
            this.sistema.operadores.forEach(operador => {
                const option = document.createElement('option');
                option.value = operador.id;
                option.textContent = `${operador.nome} (${operador.usuario})`;
                select.appendChild(option);
            });
        }
    }
    
    carregarOperadoresRelatorio() {
        const select = document.getElementById('operadorRelatorio');
        if (select) {
            select.innerHTML = '<option value="todos">Todos os Operadores</option>';
            
            this.sistema.operadores.forEach(operador => {
                const option = document.createElement('option');
                option.value = operador.id;
                option.textContent = operador.nome;
                select.appendChild(option);
            });
        }
    }
    
    carregarCategorias() {
        const categorias = this.sistema.getCategorias();
        const select = document.getElementById('filtroCategoria');
        if (select) {
            select.innerHTML = '<option value="todos">Todas as Categorias</option>';
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria;
                option.textContent = categoria;
                select.appendChild(option);
            });
        }
    }
    
    mostrarMensagemErro(elementId, mensagem) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = mensagem;
            element.classList.add('show');
        }
    }
    
    esconderMensagemErro(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = '';
            element.classList.remove('show');
        }
    }
    
    // ==================== CONFIGURAÇÃO DE EVENT LISTENERS ====================
    
    configurarEventListeners() {
        console.log("Configurando event listeners...");
        
        // Configurar datas padrão
        const hoje = new Date().toISOString().split('T')[0];
        const dataInicio = document.getElementById('dataInicio');
        const dataFim = document.getElementById('dataFim');
        
        if (dataInicio) dataInicio.value = hoje;
        if (dataFim) dataFim.value = hoje;
        
        // Event delegation para botões principais
        document.addEventListener('click', (event) => {
            console.log("Click event:", event.target);
            
            // Botão Modo Administrador
            if (event.target.closest('#btnAdminLogin')) {
                document.getElementById('loginScreen').classList.add('hidden');
                document.getElementById('adminLoginScreen').classList.remove('hidden');
                document.getElementById('adminPassword').focus();
            }
            
            // Botão Caixa PDV
            if (event.target.closest('#btnCaixaLogin')) {
                this.carregarOperadoresSelect();
                document.getElementById('loginScreen').classList.add('hidden');
                document.getElementById('caixaLoginScreen').classList.remove('hidden');
            }
            
            // Botões de voltar
            if (event.target.closest('#btnVoltarAdmin') || event.target.closest('#btnVoltarCaixa')) {
                this.backToMain();
            }
            
            // Botões do menu administrador
            if (event.target.closest('.menu-btn')) {
                const btn = event.target.closest('.menu-btn');
                const sectionId = btn.getAttribute('data-section');
                if (sectionId) {
                    this.showSection(sectionId);
                }
            }
            
            // Botões de formas de pagamento
            if (event.target.closest('.forma-pagamento-btn')) {
                const btn = event.target.closest('.forma-pagamento-btn');
                const tipo = btn.getAttribute('data-pagamento');
                this.selecionarPagamento(tipo);
            }
        });
        
        // Botões de login
        const btnLoginAdmin = document.getElementById('btnLoginAdmin');
        if (btnLoginAdmin) {
            btnLoginAdmin.addEventListener('click', () => this.loginAdmin());
        }
        
        const btnLoginCaixa = document.getElementById('btnLoginCaixa');
        if (btnLoginCaixa) {
            btnLoginCaixa.addEventListener('click', () => this.loginCaixa());
        }
        
        // Campos com Enter
        const adminPassword = document.getElementById('adminPassword');
        if (adminPassword) {
            adminPassword.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') this.loginAdmin();
            });
        }
        
        const caixaPassword = document.getElementById('caixaPassword');
        if (caixaPassword) {
            caixaPassword.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') this.loginCaixa();
            });
        }
        
        // Botões do modo administrador
        const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');
        if (btnLogoutAdmin) {
            btnLogoutAdmin.addEventListener('click', () => this.backToMain());
        }
        
        // Botões de formulários administrador
        const btnCadastrarProduto = document.getElementById('btnCadastrarProduto');
        if (btnCadastrarProduto) {
            btnCadastrarProduto.addEventListener('click', () => this.cadastrarProduto());
        }
        
        const btnRegistrarEntrada = document.getElementById('btnRegistrarEntrada');
        if (btnRegistrarEntrada) {
            btnRegistrarEntrada.addEventListener('click', () => this.registrarEntrada());
        }
        
        const btnRegistrarAvaria = document.getElementById('btnRegistrarAvaria');
        if (btnRegistrarAvaria) {
            btnRegistrarAvaria.addEventListener('click', () => this.registrarAvaria());
        }
        
        const btnCadastrarOperador = document.getElementById('btnCadastrarOperador');
        if (btnCadastrarOperador) {
            btnCadastrarOperador.addEventListener('click', () => this.cadastrarOperador());
        }
        
        const btnGerarRelatorioCaixa = document.getElementById('btnGerarRelatorioCaixa');
        if (btnGerarRelatorioCaixa) {
            btnGerarRelatorioCaixa.addEventListener('click', () => this.gerarRelatorioCaixa());
        }
        
        // Botões do modo caixa
        const btnFinalizarVenda = document.getElementById('btnFinalizarVenda');
        if (btnFinalizarVenda) {
            btnFinalizarVenda.addEventListener('click', () => {
                if (this.sistema.carrinho.length === 0) {
                    alert('Adicione produtos ao carrinho primeiro!');
                    return;
                }
                
                const formasPagamento = document.getElementById('formasPagamento');
                if (formasPagamento) formasPagamento.classList.remove('hidden');
                
                document.querySelectorAll('.carrinho-footer').forEach(el => {
                    el.classList.add('hidden');
                });
                
                document.querySelectorAll('.carrinho-items').forEach(el => {
                    el.classList.add('hidden');
                });
            });
        }
        
        const btnEncerrarCaixa = document.getElementById('btnEncerrarCaixa');
        if (btnEncerrarCaixa) {
            btnEncerrarCaixa.addEventListener('click', () => {
                if (this.sistema.carrinho.length > 0) {
                    if (!confirm('Há itens no carrinho. Deseja realmente encerrar o caixa?')) {
                        return;
                    }
                }
                
                if (confirm('Deseja realmente encerrar o caixa?')) {
                    this.sistema.encerrarCaixa();
                    this.backToMain();
                }
            });
        }
        
        // Botão para cancelar carrinho
        const btnCancelarCarrinho = document.getElementById('btnCancelarCarrinho');
        if (btnCancelarCarrinho) {
            btnCancelarCarrinho.addEventListener('click', () => {
                if (this.sistema.carrinho.length > 0) {
                    if (confirm('Deseja realmente cancelar esta compra? Todos os itens serão removidos.')) {
                        this.sistema.limparCarrinho();
                        this.atualizarCarrinho();
                        const buscaProduto = document.getElementById('buscaProduto');
                        if (buscaProduto) buscaProduto.value = '';
                        this.mostrarMensagemBusca();
                    }
                }
            });
        }
        
        // Botão para voltar do pagamento
        const btnVoltarPagamento = document.getElementById('btnVoltarPagamento');
        if (btnVoltarPagamento) {
            btnVoltarPagamento.addEventListener('click', () => {
                const formasPagamento = document.getElementById('formasPagamento');
                if (formasPagamento) formasPagamento.classList.add('hidden');
                
                document.querySelectorAll('.carrinho-footer').forEach(el => {
                    el.classList.remove('hidden');
                });
                
                document.querySelectorAll('.carrinho-items').forEach(el => {
                    el.classList.remove('hidden');
                });
                this.selecionarPagamento(null);
            });
        }
        
        // Busca de produtos no PDV
        const buscaProduto = document.getElementById('buscaProduto');
        if (buscaProduto) {
            buscaProduto.addEventListener('keyup', () => this.buscarProdutoPDV());
        }
        
        // Cálculo de troco
        const valorPago = document.getElementById('valorPago');
        if (valorPago) {
            valorPago.addEventListener('keyup', () => this.calcularTroco());
        }
        
        // Finalização de venda
        const btnConcluirVenda = document.getElementById('btnConcluirVenda');
        if (btnConcluirVenda) {
            btnConcluirVenda.addEventListener('click', () => this.concluirPagamento());
        }
        
        // Cupom fiscal
        const btnFecharCupom = document.getElementById('btnFecharCupom');
        if (btnFecharCupom) {
            btnFecharCupom.addEventListener('click', () => {
                const cupomModal = document.getElementById('cupomModal');
                if (cupomModal) cupomModal.style.display = 'none';
            });
        }
        
        const btnImprimirCupom = document.getElementById('btnImprimirCupom');
        if (btnImprimirCupom) {
            btnImprimirCupom.addEventListener('click', () => this.imprimirCupom());
        }
        
        // Eventos para selects
        const produtoSelect = document.getElementById('produtoSelect');
        if (produtoSelect) {
            produtoSelect.addEventListener('change', () => this.carregarInfoProduto());
        }
        
        console.log("Event listeners configurados!");
    }
    
    imprimirCupom() {
        const cupomContent = document.getElementById('cupomContent');
        if (!cupomContent) return;
        
        const cupomHTML = cupomContent.innerHTML;
        const janelaImpressao = window.open('', '_blank');
        janelaImpressao.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cupom Fiscal</title>
                <style>
                    body { 
                        font-family: 'Courier New', monospace; 
                        font-size: 12px;
                        margin: 0;
                        padding: 10px;
                    }
                    .cupom-item { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-bottom: 5px;
                    }
                    .text-center { text-align: center; }
                    .cupom-header { 
                        text-align: center; 
                        margin-bottom: 15px;
                        border-bottom: 1px dashed #000;
                        padding-bottom: 10px;
                    }
                </style>
            </head>
            <body>
                ${cupomHTML}
            </body>
            </html>
        `);
        janelaImpressao.document.close();
        janelaImpressao.focus();
        janelaImpressao.print();
        janelaImpressao.close();
    }
}

// ==================== INICIALIZAÇÃO DO SISTEMA ====================

let sistemaPDV;
let interfacePDV;

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado, inicializando sistema PDV...");
    sistemaPDV = new SistemaPDV();
    interfacePDV = new InterfacePDV(sistemaPDV);
});