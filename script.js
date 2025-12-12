
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
        this.dataAtualizacao = new Date().toISOString();
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
        this.totalDinheiro = 0;
        this.totalCartao = 0;
        this.totalPix = 0;
        this.fechado = false;
        this.saldoInicial = 0;
        this.sangrias = [];
        this.suprimentos = [];
    }
    
    adicionarVenda(venda) {
        this.vendas.push(venda);
        this.total += venda.total;
        
        // Atualizar totais por forma de pagamento
        if (venda.formaPagamento === 'dinheiro') {
            this.totalDinheiro += venda.total;
        } else if (venda.formaPagamento === 'cartao') {
            this.totalCartao += venda.total;
        } else if (venda.formaPagamento === 'pix') {
            this.totalPix += venda.total;
        }
    }
    
    adicionarSangria(valor, motivo, responsavel) {
        this.sangrias.push({
            data: new Date().toISOString(),
            valor: valor,
            motivo: motivo,
            responsavel: responsavel
        });
    }
    
    adicionarSuprimento(valor, motivo, responsavel) {
        this.suprimentos.push({
            data: new Date().toISOString(),
            valor: valor,
            motivo: motivo,
            responsavel: responsavel
        });
    }
    
    fechar(saldoFinal = 0) {
        this.dataFechamento = new Date().toISOString();
        this.saldoFinal = saldoFinal;
        this.fechado = true;
    }
    
    calcularSaldoAtual() {
        let saldo = this.saldoInicial;
        saldo += this.totalDinheiro; // Entrada de vendas em dinheiro
        
        // Subtrair sangrias
        this.sangrias.forEach(s => saldo -= s.valor);
        
        // Adicionar suprimentos
        this.suprimentos.forEach(s => saldo += s.valor);
        
        return saldo;
    }
    
    getResumo() {
        return {
            totalVendas: this.vendas.length,
            totalValor: this.total,
            totalDinheiro: this.totalDinheiro,
            totalCartao: this.totalCartao,
            totalPix: this.totalPix,
            saldoInicial: this.saldoInicial,
            saldoFinal: this.saldoFinal || this.calcularSaldoAtual(),
            sangrias: this.sangrias,
            suprimentos: this.suprimentos,
            vendasPorHora: this.getVendasPorHora()
        };
    }
    
    getVendasPorHora() {
        const vendasPorHora = {};
        this.vendas.forEach(venda => {
            const hora = new Date(venda.data).getHours();
            if (!vendasPorHora[hora]) {
                vendasPorHora[hora] = { quantidade: 0, valor: 0 };
            }
            vendasPorHora[hora].quantidade++;
            vendasPorHora[hora].valor += venda.total;
        });
        return vendasPorHora;
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
        
        // Definir prefixo para as chaves do localStorage
        this.STORAGE_PREFIX = 'pdv_';
        
        // Inicializar todas as propriedades com chaves específicas
        this.estoque = this.carregarDados('estoque') || [];
        this.operadores = this.carregarDados('operadores') || [];
        this.vendas = this.carregarDados('vendas') || [];
        this.avarias = this.carregarDados('avarias') || [];
        this.caixas = this.carregarDados('caixas') || [];
        this.entradas = this.carregarDados('entradas') || [];
        
        // Estado atual da sessão
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
            vendas: this.vendas.length,
            avarias: this.avarias.length,
            caixas: this.caixas.length,
            entradas: this.entradas.length
        });
    }
    
    // ==================== MÉTODOS DE PERSISTÊNCIA ====================
    
    carregarDados(chave) {
        try {
            const dados = localStorage.getItem(`${this.STORAGE_PREFIX}${chave}`);
            return dados ? JSON.parse(dados) : null;
        } catch (error) {
            console.error(`Erro ao carregar ${chave}:`, error);
            return null;
        }
    }
    
    salvarDados(chave, dados) {
        try {
            localStorage.setItem(`${this.STORAGE_PREFIX}${chave}`, JSON.stringify(dados));
            return true;
        } catch (error) {
            console.error(`Erro ao salvar ${chave}:`, error);
            return false;
        }
    }
    
    salvarEstoque() {
        return this.salvarDados('estoque', this.estoque);
    }
    
    salvarOperadores() {
        return this.salvarDados('operadores', this.operadores);
    }
    
    salvarVendas() {
        return this.salvarDados('vendas', this.vendas);
    }
    
    salvarAvarias() {
        return this.salvarDados('avarias', this.avarias);
    }
    
    salvarCaixas() {
        return this.salvarDados('caixas', this.caixas);
    }
    
    salvarEntradas() {
        return this.salvarDados('entradas', this.entradas);
    }
    
    // Método para limpar todos os dados (para desenvolvimento)
    limparTodosDados() {
        const chaves = ['estoque', 'operadores', 'vendas', 'avarias', 'caixas', 'entradas'];
        chaves.forEach(chave => {
            localStorage.removeItem(`${this.STORAGE_PREFIX}${chave}`);
        });
        console.log("Todos os dados foram limpos!");
        return true;
    }
    
    carregarEstoqueExemplo() {
        console.log("Carregando estoque de exemplo...");
        this.estoque = [
            new Produto(1, "AR001", "Arroz Tipo 1 5kg", 18.50, 25.90, "unidade", 50, 10, "Alimentos"),
            new Produto(2, "FE001", "Feijão Carioca 1kg", 7.80, 12.50, "unidade", 30, 5, "Alimentos"),
            new Produto(3, "AC001", "Açúcar Cristal 1kg", 3.20, 5.90, "unidade", 40, 8, "Alimentos"),
            new Produto(4, "CA001", "Café em Pó 500g", 11.90, 18.50, "unidade", 25, 5, "Alimentos"),
            new Produto(5, "LE001", "Leite Integral 1L", 4.20, 6.90, "unidade", 60, 15, "Laticínios"),
            new Produto(6, "OL001", "Óleo de Soja 900ml", 5.90, 9.50, "unidade", 45, 10, "Alimentos"),
            new Produto(7, "SA001", "Sal Refinado 1kg", 1.50, 3.90, "unidade", 35, 8, "Alimentos"),
            new Produto(8, "BO001", "Biscoito Cream Cracker", 4.50, 7.90, "unidade", 20, 5, "Alimentos"),
            new Produto(9, "RE001", "Refrigerante 2L", 6.50, 10.90, "unidade", 30, 10, "Bebidas"),
            new Produto(10, "AG001", "Água Mineral 500ml", 1.20, 2.90, "unidade", 50, 15, "Bebidas")
        ];
        this.salvarEstoque();
        console.log("Estoque de exemplo carregado com 10 produtos");
    }
    
    // ==================== MÉTODOS DE DASHBOARD ====================
    
    getVendasPorPeriodo(periodo) {
        const agora = new Date();
        let dataInicio = new Date();
        
        switch(periodo) {
            case 'today':
                dataInicio.setHours(0, 0, 0, 0);
                break;
            case 'week':
                dataInicio.setDate(agora.getDate() - 7);
                break;
            case 'month':
                dataInicio.setMonth(agora.getMonth() - 1);
                break;
            default:
                dataInicio.setHours(0, 0, 0, 0);
        }
        
        // Filtrar vendas do período
        const vendasPeriodo = this.vendas.filter(venda => 
            new Date(venda.data) >= dataInicio
        );
        
        // Calcular estatísticas
        let totalVendas = 0;
        let totalDinheiro = 0;
        let totalCartao = 0;
        let totalPix = 0;
        let quantidadeVendas = vendasPeriodo.length;
        
        vendasPeriodo.forEach(venda => {
            totalVendas += venda.total;
            
            if (venda.formaPagamento === 'dinheiro') {
                totalDinheiro += venda.total;
            } else if (venda.formaPagamento === 'cartao') {
                totalCartao += venda.total;
            } else if (venda.formaPagamento === 'pix') {
                totalPix += venda.total;
            }
        });
        
        const ticketMedio = quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0;
        
        // Obter top 5 produtos mais vendidos
        const topProdutos = this.getTopProdutosVendidos(dataInicio, agora);
        
        return {
            totalVendas,
            quantidadeVendas,
            ticketMedio,
            totalDinheiro,
            totalCartao,
            totalPix,
            topProdutos,
            periodo: periodo,
            dataInicio,
            dataFim: agora
        };
    }
    
    getTopProdutosVendidos(dataInicio, dataFim) {
        // Filtrar vendas do período
        const vendasPeriodo = this.vendas.filter(venda => 
            new Date(venda.data) >= dataInicio && new Date(venda.data) <= dataFim
        );
        
        // Agrupar produtos
        const produtosMap = {};
        
        vendasPeriodo.forEach(venda => {
            venda.itens.forEach(item => {
                if (!produtosMap[item.produtoId]) {
                    produtosMap[item.produtoId] = {
                        produtoId: item.produtoId,
                        nome: item.nome,
                        codigo: item.codigo,
                        quantidade: 0,
                        valorTotal: 0
                    };
                }
                
                produtosMap[item.produtoId].quantidade += item.quantidade;
                produtosMap[item.produtoId].valorTotal += item.getSubtotal();
            });
        });
        
        // Converter para array e ordenar
        const produtosArray = Object.values(produtosMap);
        produtosArray.sort((a, b) => b.valorTotal - a.valorTotal);
        
        return produtosArray.slice(0, 5); // Retorna apenas os 5 primeiros
    }
    
    // ==================== MÉTODOS DE PRODUTOS ====================
    
    buscarProdutoPorId(id) {
        // Converter ID para número para garantir comparação correta
        const idNum = typeof id === 'string' ? parseInt(id) : id;
        return this.estoque.find(p => p.id === idNum);
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
        return true;
    }
    
    // ==================== MÉTODOS DE CARRINHO ====================
    
    adicionarAoCarrinho(produtoId, quantidade) {
        const produto = this.buscarProdutoPorId(produtoId);
        if (!produto) {
            console.error("Produto não encontrado:", produtoId);
            return false;
        }
        
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
        if (index < 0 || index >= this.carrinho.length) return;
        
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
        if (index >= 0 && index < this.carrinho.length) {
            this.carrinho.splice(index, 1);
        }
    }
    
    limparCarrinho() {
        this.carrinho = [];
    }
    
    getTotalCarrinho() {
        return this.carrinho.reduce((total, item) => total + item.getSubtotal(), 0);
    }
    
    // ==================== MÉTODOS DE VENDA ====================
    
    concluirVenda(formaPagamento, valorPago = 0) {
        if (this.carrinho.length === 0) {
            alert('Carrinho vazio!');
            return null;
        }
        
        if (!this.operadorAtual || !this.caixaAtual) {
            alert('Sessão inválida! Faça login novamente.');
            return null;
        }
        
        // Verificar estoque
        for (const item of this.carrinho) {
            const produto = this.buscarProdutoPorId(item.produtoId);
            if (!produto) {
                alert(`Produto não encontrado: ${item.nome}`);
                return null;
            }
            
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
                
                // Verificar se precisa alertar sobre estoque baixo
                if (produto.quantidade <= produto.estoqueMinimo) {
                    console.warn(`Alerta: Estoque baixo para ${produto.nome}! Restam: ${produto.quantidade}`);
                }
            }
        });
        
        // Adicionar venda ao caixa
        this.caixaAtual.adicionarVenda(venda);
        
        // Salvar dados
        this.vendas.push(venda);
        this.salvarEstoque();
        this.salvarVendas();
        this.salvarCaixas();
        
        console.log("Venda concluída:", venda);
        return venda;
    }
    
    // ==================== MÉTODOS DE CAIXA ====================
    
    abrirCaixa(operador) {
        if (!operador) {
            alert('Operador inválido!');
            return false;
        }
        
        this.operadorAtual = operador;
        this.caixaAtual = new Caixa(operador.id, operador.nome);
        this.limparCarrinho();
        
        console.log(`Caixa aberto por ${operador.nome} (ID: ${operador.id})`);
        return true;
    }
    
    encerrarCaixa() {
        if (!this.caixaAtual) {
            alert('Nenhum caixa aberto!');
            return false;
        }
        
        if (this.carrinho.length > 0) {
            if (!confirm('Há itens no carrinho. Deseja realmente encerrar o caixa?')) {
                return false;
            }
        }
        
        this.caixaAtual.fechar();
        this.caixas.push(this.caixaAtual);
        this.salvarCaixas();
        
        const totalVendas = this.caixaAtual.total;
        const mensagem = `Caixa encerrado!\n\nTotal de vendas: R$ ${totalVendas.toFixed(2)}\nNúmero de vendas: ${this.caixaAtual.vendas.length}\n\nOperador: ${this.caixaAtual.operadorNome}`;
        
        alert(mensagem);
        
        this.caixaAtual = null;
        this.operadorAtual = null;
        this.limparCarrinho();
        
        return true;
    }
    
    // ==================== MÉTODOS DE OPERADORES ====================
    
    buscarOperadorPorId(id) {
        // Converter ID para número
        const idNum = typeof id === 'string' ? parseInt(id) : id;
        return this.operadores.find(o => o.id === idNum);
    }
    
    buscarOperadorPorUsuario(usuario) {
        return this.operadores.find(o => o.usuario === usuario);
    }
    
    cadastrarOperador(dados) {
        // Verificar se usuário já existe
        if (this.buscarOperadorPorUsuario(dados.usuario)) {
            alert('Já existe um operador com este nome de usuário!');
            return null;
        }
        
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
    
    atualizarOperador(id, dados) {
        const operador = this.buscarOperadorPorId(id);
        if (operador) {
            // Verificar se o novo usuário já existe (se for diferente)
            if (dados.usuario && dados.usuario !== operador.usuario) {
                const usuarioExistente = this.buscarOperadorPorUsuario(dados.usuario);
                if (usuarioExistente && usuarioExistente.id !== id) {
                    alert('Já existe um operador com este nome de usuário!');
                    return null;
                }
            }
            
            operador.nome = dados.nome || operador.nome;
            operador.usuario = dados.usuario || operador.usuario;
            if (dados.senha) {
                operador.senha = dados.senha;
            }
            operador.dataAtualizacao = new Date().toISOString();
            this.salvarOperadores();
            return operador;
        }
        return null;
    }
    
    excluirOperador(id) {
        if (this.operadores.length <= 1) {
            alert('É necessário ter pelo menos um operador!');
            return false;
        }
        
        // Verificar se o operador está com caixa aberto
        const caixaAberto = this.caixas.find(c => !c.fechado && c.operadorId == id);
        if (caixaAberto) {
            alert('Este operador tem um caixa aberto. Feche o caixa antes de excluir!');
            return false;
        }
        
        this.operadores = this.operadores.filter(o => o.id !== id);
        this.salvarOperadores();
        return true;
    }
    
    // ==================== MÉTODOS DE AVARIA ====================
    
    registrarAvaria(dados) {
        console.log("=== REGISTRANDO AVARIA ===");
        console.log("Dados recebidos:", dados);
        
        // Converter produtoId para número
        const produtoId = typeof dados.produtoId === 'string' ? parseInt(dados.produtoId) : dados.produtoId;
        
        console.log("Buscando produto com ID:", produtoId, "Tipo:", typeof produtoId);
        
        const produto = this.buscarProdutoPorId(produtoId);
        
        if (!produto) {
            console.error("Produto não encontrado! ID:", produtoId);
            console.log("Estoque disponível:", this.estoque.map(p => ({id: p.id, nome: p.nome})));
            alert('Produto não encontrado!');
            return null;
        }

        console.log("Produto encontrado:", produto.nome);
        
        if (produto.quantidade < dados.quantidade) {
            alert(`Quantidade insuficiente em estoque! Disponível: ${produto.quantidade.toFixed(3)} ${produto.unidade}`);
            return null;
        }

        // Reduzir estoque
        produto.quantidade -= dados.quantidade;
        produto.quantidade = parseFloat(produto.quantidade.toFixed(3));

        // Calcular custo da avaria
        const custoAvaria = produto.precoEntrada * dados.quantidade;
        
        // Gerar ID único para avaria
        const avariaId = Date.now() + Math.floor(Math.random() * 1000);
        
        const avaria = new Avaria(
            produto.id,
            produto.nome,
            dados.quantidade,
            dados.motivo,
            dados.observacao,
            custoAvaria
        );
        
        // Atribuir ID gerado
        avaria.id = avariaId;

        this.avarias.push(avaria);

        // Salvar alterações
        const estoqueSalvo = this.salvarEstoque();
        const avariasSalvas = this.salvarAvarias();

        if (estoqueSalvo && avariasSalvas) {
            console.log("✅ Avaria registrada com sucesso:", avaria);
            return avaria;
        } else {
            alert('Erro ao salvar avaria!');
            return null;
        }
    }
    
    excluirAvaria(id) {
        const avariaIndex = this.avarias.findIndex(a => a.id === id);
        if (avariaIndex !== -1) {
            const avaria = this.avarias[avariaIndex];
            const produto = this.buscarProdutoPorId(avaria.produtoId);
            if (produto) {
                // Restaurar estoque
                produto.quantidade += avaria.quantidade;
                produto.quantidade = parseFloat(produto.quantidade.toFixed(3));
            }
            
            // Remover avaria
            this.avarias.splice(avariaIndex, 1);
            
            // Salvar alterações
            const estoqueSalvo = this.salvarEstoque();
            const avariasSalvas = this.salvarAvarias();
            
            if (estoqueSalvo && avariasSalvas) {
                console.log("Avaria excluída e estoque restaurado:", avaria);
                return true;
            }
        }
        return false;
    }
    
    // ==================== MÉTODOS DE ENTRADA ====================
    
    registrarEntrada(dados) {
        const produto = this.buscarProdutoPorId(dados.produtoId);
        if (!produto) {
            alert('Produto não encontrado!');
            return null;
        }
        
        // Aumentar estoque
        produto.quantidade += dados.quantidade;
        produto.quantidade = parseFloat(produto.quantidade.toFixed(3));
        
        // Atualizar preço de custo se fornecido
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
        
        // Salvar alterações
        const estoqueSalvo = this.salvarEstoque();
        const entradasSalvas = this.salvarEntradas();
        
        if (estoqueSalvo && entradasSalvas) {
            console.log("Entrada registrada:", entrada);
            return entrada;
        } else {
            alert('Erro ao salvar entrada!');
            return null;
        }
    }
    
    // ==================== MÉTODOS DE FILTRO E RELATÓRIOS ====================
    
    filtrarProdutosPorTermo(termo) {
        if (!termo) return [];
        
        const termoLower = termo.toLowerCase();
        return this.estoque.filter(produto => 
            produto.ativo !== false && 
            produto.quantidade > 0 &&
            (produto.nome.toLowerCase().includes(termoLower) || 
             produto.codigo.toLowerCase().includes(termoLower) ||
             produto.categoria.toLowerCase().includes(termoLower))
        );
    }
    
    getCategorias() {
        const categorias = [...new Set(this.estoque.map(p => p.categoria))];
        return categorias.filter(c => c); // Remove valores vazios
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
    
    // Relatório de avarias por produto
    gerarRelatorioAvariasProdutos(dataInicio, dataFim) {
        let avariasFiltradas = this.filtrarAvariasPorData(dataInicio, dataFim);
        
        // Agrupar avarias por produto
        const relatorioPorProduto = {};
        
        avariasFiltradas.forEach(avaria => {
            if (!relatorioPorProduto[avaria.produtoId]) {
                relatorioPorProduto[avaria.produtoId] = {
                    produtoId: avaria.produtoId,
                    produtoNome: avaria.produtoNome,
                    totalQuantidade: 0,
                    totalValor: 0,
                    avarias: []
                };
            }
            
            relatorioPorProduto[avaria.produtoId].totalQuantidade += avaria.quantidade;
            relatorioPorProduto[avaria.produtoId].totalValor += avaria.precoCusto || 0;
            relatorioPorProduto[avaria.produtoId].avarias.push(avaria);
        });
        
        return Object.values(relatorioPorProduto).sort((a, b) => b.totalQuantidade - a.totalQuantidade);
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
            // Converter para número para comparação
            const operadorIdNum = typeof operadorId === 'string' ? parseInt(operadorId) : operadorId;
            filteredCaixas = filteredCaixas.filter(c => c.operadorId === operadorIdNum);
        }
        
        if (status !== 'todos') {
            filteredCaixas = filteredCaixas.filter(c => 
                status === 'aberto' ? !c.fechado : c.fechado
            );
        }
        
        return filteredCaixas.sort((a, b) => new Date(b.dataAbertura) - new Date(a.dataAbertura));
    }
    
    // Obter vendas detalhadas de um caixa específico
    obterVendasDetalhadasCaixa(caixaId) {
        // Converter caixaId para número
        const caixaIdNum = typeof caixaId === 'string' ? parseInt(caixaId) : caixaId;
        const caixa = this.caixas.find(c => c.id === caixaIdNum);
        return caixa ? caixa.vendas : [];
    }
    
    // Relatório de vendas por produto
    gerarRelatorioVendasPorProduto(dataInicio, dataFim) {
        let vendasFiltradas = [...this.vendas];
        
        if (dataInicio) {
            const inicio = new Date(dataInicio);
            inicio.setHours(0, 0, 0, 0);
            vendasFiltradas = vendasFiltradas.filter(v => new Date(v.data) >= inicio);
        }
        
        if (dataFim) {
            const fim = new Date(dataFim);
            fim.setHours(23, 59, 59, 999);
            vendasFiltradas = vendasFiltradas.filter(v => new Date(v.data) <= fim);
        }
        
        // Agrupar vendas por produto
        const relatorioPorProduto = {};
        
        vendasFiltradas.forEach(venda => {
            venda.itens.forEach(item => {
                if (!relatorioPorProduto[item.produtoId]) {
                    relatorioPorProduto[item.produtoId] = {
                        produtoId: item.produtoId,
                        codigo: item.codigo,
                        nome: item.nome,
                        totalQuantidade: 0,
                        totalVendido: 0,
                        vendas: []
                    };
                }
                
                relatorioPorProduto[item.produtoId].totalQuantidade += item.quantidade;
                relatorioPorProduto[item.produtoId].totalVendido += item.getSubtotal();
                relatorioPorProduto[item.produtoId].vendas.push({
                    vendaId: venda.id,
                    data: venda.data,
                    quantidade: item.quantidade,
                    valor: item.getSubtotal()
                });
            });
        });
        
        return Object.values(relatorioPorProduto).sort((a, b) => b.totalVendido - a.totalVendido);
    }
    
    // ==================== MÉTODOS DE DETALHES DO CAIXA ====================
    
    obterDetalhesCompletosCaixa(caixaId) {
        // Converter caixaId para número
        const caixaIdNum = typeof caixaId === 'string' ? parseInt(caixaId) : caixaId;
        const caixa = this.caixas.find(c => c.id === caixaIdNum);
        
        if (!caixa) {   
            return null;
        }
        
        // Obter resumo do caixa
        const resumo = caixa.getResumo();
        
        // Obter vendas detalhadas
        const vendas = caixa.vendas;
        
        // Calcular estatísticas adicionais
        const estatisticas = {
            mediaPorVenda: vendas.length > 0 ? resumo.totalValor / vendas.length : 0,
            horaPico: this.calcularHoraPico(caixa),
            produtoMaisVendido: this.calcularProdutoMaisVendido(vendas),
            formasPagamento: {
                dinheiro: resumo.totalDinheiro,
                cartao: resumo.totalCartao,
                pix: resumo.totalPix
            }
        };
        
        return {
            caixa,
            resumo,
            vendas,
            estatisticas,
            detalhesVendas: vendas.map(venda => ({
                id: venda.id,
                data: venda.data,
                total: venda.total,
                formaPagamento: venda.formaPagamento,
                itens: venda.itens.map(item => ({
                    produtoId: item.produtoId,
                    nome: item.nome,
                    quantidade: item.quantidade,
                    preco: item.preco,
                    subtotal: item.getSubtotal()
                }))
            }))
        };
    }
    
    calcularHoraPico(caixa) {
        const vendasPorHora = caixa.getVendasPorHora();
        let horaPico = null;
        let maxVendas = 0;
        
        for (const [hora, dados] of Object.entries(vendasPorHora)) {
            if (dados.quantidade > maxVendas) {
                maxVendas = dados.quantidade;
                horaPico = hora;
            }
        }
        
        return horaPico ? `${horaPico}:00 - ${parseInt(horaPico) + 1}:00` : 'N/A';
    }
    
    calcularProdutoMaisVendido(vendas) {
        const produtosMap = {};
        
        vendas.forEach(venda => {
            venda.itens.forEach(item => {
                if (!produtosMap[item.produtoId]) {
                    produtosMap[item.produtoId] = {
                        produtoId: item.produtoId,
                        nome: item.nome,
                        quantidade: 0
                    };
                }
                produtosMap[item.produtoId].quantidade += item.quantidade;
            });
        });
        
        let produtoMaisVendido = null;
        let maxQuantidade = 0;
        
        for (const produto of Object.values(produtosMap)) {
            if (produto.quantidade > maxQuantidade) {
                maxQuantidade = produto.quantidade;
                produtoMaisVendido = produto;
            }
        }
        
        return produtoMaisVendido;
    }
}

// ==================== CLASSE DE INTERFACE ATUALIZADA ====================

class InterfacePDV {
    constructor(sistema) {
        this.sistema = sistema;
        this.produtoSelecionadoParaAdicionar = null;
        this.periodoDashboard = 'today';
        
        // Configurar listeners após um pequeno delay para garantir que o DOM está pronto
        setTimeout(() => {
            this.configurarEventListeners();
            this.atualizarContadores();
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
            'dashboard', // Adicionado dashboard
            'cadastroProduto', 
            'gerenciarProdutos', 
            'produtosAvariados',
            'avariaProduto', 
            'relatorioEstoque', 
            'relatorioCaixa',
            'gerenciarOperadores',
            'relatorioAvariasProduto',
            'relatorioVendasProduto'
        ];
        
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.add('hidden');
        });
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            
            switch(sectionId) {
                case 'dashboard':
                    this.carregarDashboard();
                    break;
                case 'gerenciarProdutos':
                    this.carregarProdutosAdmin();
                    break;
                case 'produtosAvariados':
                    this.carregarProdutosAvariados();
                    break;
                case 'avariaProduto':
                    this.carregarProdutosSelect();
                    break;
                case 'relatorioEstoque':
                    this.carregarRelatorioEstoque();
                    break;
                case 'relatorioCaixa':
                    this.carregarOperadoresRelatorio();
                    this.carregarRelatorioCaixa();
                    break;
                case 'gerenciarOperadores':
                    this.carregarOperadoresAdmin();
                    break;
                case 'relatorioVendasProduto':
                    this.carregarRelatorioVendasPorProduto();
                    break;
                case 'relatorioAvariasProduto':
                    this.carregarRelatorioAvariasPorProduto();
                    break;
            }
        }
    }
    
    // ==================== DASHBOARD ====================
    
    carregarDashboard() {
        console.log("Carregando dashboard para período:", this.periodoDashboard);
        
        // Atualizar botões de período
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-period') === this.periodoDashboard) {
                btn.classList.add('active');
            }
        });
        
        // Obter dados do período
        const dadosPeriodo = this.sistema.getVendasPorPeriodo(this.periodoDashboard);
        
        // Atualizar estatísticas principais
        document.getElementById('totalVendasDashboard').textContent = 
            `R$ ${dadosPeriodo.totalVendas.toFixed(2)}`;
        document.getElementById('quantidadeVendasDashboard').textContent = 
            dadosPeriodo.quantidadeVendas;
        document.getElementById('ticketMedioDashboard').textContent = 
            `R$ ${dadosPeriodo.ticketMedio.toFixed(2)}`;
        
        // Atualizar formas de pagamento
        document.getElementById('totalDinheiro').textContent = 
            `R$ ${dadosPeriodo.totalDinheiro.toFixed(2)}`;
        document.getElementById('totalCartao').textContent = 
            `R$ ${dadosPeriodo.totalCartao.toFixed(2)}`;
        document.getElementById('totalPix').textContent = 
            `R$ ${dadosPeriodo.totalPix.toFixed(2)}`;
        
        // Atualizar período nos cards
        let periodoTexto = '';
        switch(this.periodoDashboard) {
            case 'today': periodoTexto = 'Hoje'; break;
            case 'week': periodoTexto = 'Esta Semana'; break;
            case 'month': periodoTexto = 'Este Mês'; break;
        }
        document.getElementById('periodoTopProdutos').textContent = periodoTexto;
        document.getElementById('periodoPagamento').textContent = periodoTexto;
        
        // Carregar top produtos
        this.carregarTopProdutosDashboard(dadosPeriodo.topProdutos);
        
        // Calcular comparações (simplificado)
        this.calcularComparacoesDashboard(dadosPeriodo);
    }
    
    carregarTopProdutosDashboard(topProdutos) {
        const tbody = document.getElementById('topProdutosTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (topProdutos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 20px;">Nenhuma venda no período</td>
                </tr>
            `;
            return;
        }
        
        topProdutos.forEach((produto, index) => {
            const row = `
                <tr>
                    <td>${produto.nome}</td>
                    <td>${produto.quantidade.toFixed(3)}</td>
                    <td>R$ ${produto.valorTotal.toFixed(2)}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }
    
    calcularComparacoesDashboard(dadosAtuais) {
        // Calcular período anterior para comparação
        let periodoAnterior = '';
        switch(this.periodoDashboard) {
            case 'today':
                periodoAnterior = 'ontem';
                break;
            case 'week':
                periodoAnterior = 'semana anterior';
                break;
            case 'month':
                periodoAnterior = 'mês anterior';
                break;
        }
        
        // Para simplificar, vamos usar valores fictícios
        const comparacaoVendas = '+5%';
        const comparacaoQuantidade = '+3%';
        const comparacaoTicket = '+2%';
        
        document.getElementById('comparacaoVendas').textContent = 
            `${comparacaoVendas} vs ${periodoAnterior}`;
        document.getElementById('comparacaoQuantidade').textContent = 
            `${comparacaoQuantidade} vs ${periodoAnterior}`;
        document.getElementById('comparacaoTicket').textContent = 
            `${comparacaoTicket} vs ${periodoAnterior}`;
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
            this.showSection('dashboard'); // Muda para dashboard por padrão
            this.carregarProdutosSelect();
            this.carregarOperadoresRelatorio();
            this.atualizarContadores();
        } else {
            this.mostrarMensagemErro('adminError', 'Senha incorreta!');
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
            const sucesso = this.sistema.abrirCaixa(operador);
            
            if (sucesso) {
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
                    const dataAtual = new Date().toLocaleTimeString('pt-BR');
                    infoCaixa.textContent = `Aberto às ${dataAtual}`;
                }
                
                // Limpar campo de busca e mostrar mensagem inicial
                const buscaProduto = document.getElementById('buscaProduto');
                if (buscaProduto) {
                    buscaProduto.value = '';
                }
                this.mostrarMensagemBusca();
                this.atualizarCarrinho();
            }
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
                    <small>ou use o scanner de código de barras</small>
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
            const estoqueCritico = produto.quantidade <= (produto.estoqueMinimo * 0.5);
            
            const item = document.createElement('div');
            item.className = 'produto-card';
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <strong>${produto.nome}</strong>
                        <p style="margin: 5px 0; color: #666;">Código: ${produto.codigo}</p>
                        <p style="margin: 5px 0;">
                            Estoque: ${produto.quantidade.toFixed(3)} ${produto.unidade} 
                            ${estoqueCritico ? '<span style="background: #ffebee; color: #d32f2f; padding: 2px 6px; border-radius: 10px; font-size: 0.8rem; margin-left: 5px;">CRÍTICO</span>' : 
                              estoqueBaixo ? '<span style="background: #fff3e0; color: #f57c00; padding: 2px 6px; border-radius: 10px; font-size: 0.8rem; margin-left: 5px;">BAIXO</span>' : ''}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.3rem; font-weight: bold; color: #27ae60;">R$ ${produto.precoVenda.toFixed(2)}</div>
                        <small style="color: #95a5a6;">por ${produto.unidade === 'unidade' ? 'un' : produto.unidade}</small>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                    <button class="diminuir-produto" data-id="${produto.id}" style="background: white; border: 1px solid #bdc3c7; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" class="quantidade-input" id="quantidade-${produto.id}" 
                           value="1" min="0.001" step="0.001" style="width: 80px; text-align: center; padding: 8px; border: 2px solid #bdc3c7; border-radius: 8px;">
                    <button class="aumentar-produto" data-id="${produto.id}" style="background: white; border: 1px solid #bdc3c7; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn-adicionar-quantidade" data-id="${produto.id}" style="background: #27ae60; color: white; padding: 8px 15px; border-radius: 20px; border: none; cursor: pointer;">
                        <i class="fas fa-plus"></i> Adicionar
                    </button>
                </div>
                <div style="margin-top: 10px;">
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
        const contadorItens = document.getElementById('contadorItens');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.sistema.carrinho.length === 0) {
            container.innerHTML = `
                <div class="empty-state" id="carrinhoVazio">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Carrinho vazio</p>
                    <small>Adicione produtos para iniciar uma venda</small>
                </div>
            `;
            const btnFinalizar = document.getElementById('btnFinalizarVenda');
            const btnCancelar = document.getElementById('btnCancelarCarrinho');
            if (btnFinalizar) btnFinalizar.disabled = true;
            if (btnCancelar) btnCancelar.disabled = true;
            if (contadorItens) contadorItens.textContent = '0';
        } else {
            const btnFinalizar = document.getElementById('btnFinalizarVenda');
            const btnCancelar = document.getElementById('btnCancelarCarrinho');
            if (btnFinalizar) btnFinalizar.disabled = false;
            if (btnCancelar) btnCancelar.disabled = false;
            if (contadorItens) contadorItens.textContent = this.sistema.carrinho.length.toString();
            
            this.sistema.carrinho.forEach((item, index) => {
                const subtotal = item.getSubtotal();
                
                const itemElement = document.createElement('div');
                itemElement.className = 'carrinho-item';
                itemElement.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <div style="font-weight: bold;">${item.nome}</div>
                        <div style="font-weight: bold; color: #27ae60;">R$ ${subtotal.toFixed(2)}</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="color: #666; font-size: 0.9rem;">Código: ${item.codigo}</span><br>
                            <span style="color: #666; font-size: 0.9rem;">${item.quantidade.toFixed(3)} ${item.unidade} x R$ ${item.preco.toFixed(2)}</span><br>
                            <small style="color: #95a5a6;">Valor unitário: R$ ${item.preco.toFixed(2)}/${item.unidade === 'unidade' ? 'un' : item.unidade}</small>
                        </div>
                        <div>
                            <button class="remover-item-carrinho" data-index="${index}" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;" title="Remover">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(itemElement);
            });
        }
        
        const total = this.sistema.getTotalCarrinho();
        if (totalElement) totalElement.textContent = total.toFixed(2);
        
        // Adicionar event listeners para os botões de remover
        setTimeout(() => {
            document.querySelectorAll('.remover-item-carrinho').forEach(button => {
                button.addEventListener('click', (e) => {
                    const index = parseInt(e.target.closest('button').getAttribute('data-index'));
                    this.sistema.removerDoCarrinho(index);
                    this.atualizarCarrinho();
                });
            });
        }, 100);
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
                
                const carrinhoFooter = document.querySelector('.carrinho-footer');
                if (carrinhoFooter) carrinhoFooter.classList.remove('hidden');
                
                const carrinhoItems = document.getElementById('carrinhoItemsContainer');
                if (carrinhoItems) carrinhoItems.classList.remove('hidden');
                
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
        const cupomTotais = document.getElementById('cupomTotais');
        const cupomPagamento = document.getElementById('cupomPagamento');
        const cupomTroco = document.getElementById('cupomTroco');
        const cupomData = document.getElementById('cupomData');
        const cupomOperador = document.getElementById('cupomOperador');
        
        if (cupomData) cupomData.textContent = `Data: ${new Date(venda.data).toLocaleString('pt-BR')}`;
        if (cupomOperador) cupomOperador.textContent = `Operador: ${venda.operadorNome}`;
        if (cupomItens) cupomItens.innerHTML = '';
        
        if (cupomItens) {
            venda.itens.forEach(item => {
                const subtotal = item.getSubtotal();
                const itemElement = document.createElement('div');
                itemElement.className = 'cupom-item';
                itemElement.style = 'display: flex; justify-content: space-between; margin-bottom: 5px;';
                itemElement.innerHTML = `
                    <span>${item.nome.substring(0, 20)} ${item.quantidade.toFixed(3)}${item.unidade === 'unidade' ? 'un' : item.unidade.substring(0, 1)} x ${item.preco.toFixed(2)}</span>
                    <span>${subtotal.toFixed(2)}</span>
                `;
                cupomItens.appendChild(itemElement);
            });
        }
        
        if (cupomTotais) {
            cupomTotais.innerHTML = `
                <div class="cupom-item" style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px;">
                    <span>TOTAL</span>
                    <span>${venda.total.toFixed(2)}</span>
                </div>
            `;
        }
        
        if (cupomPagamento) {
            cupomPagamento.innerHTML = `
                <div class="cupom-item" style="display: flex; justify-content: space-between; margin-top: 5px;">
                    <span>Pagamento: ${venda.formaPagamento.toUpperCase()}</span>
                    <span></span>
                </div>
            `;
        }
        
        if (cupomTroco) {
            if (venda.formaPagamento === 'dinheiro' && venda.troco > 0) {
                cupomTroco.innerHTML = `
                    <div class="cupom-item" style="display: flex; justify-content: space-between; margin-top: 5px;">
                        <span>Troco:</span>
                        <span>${venda.troco.toFixed(2)}</span>
                    </div>
                `;
            } else {
                cupomTroco.innerHTML = '';
            }
        }
        
        cupomModal.style.display = 'flex';
    }
    
    // ==================== MÉTODOS ADMINISTRADOR ====================
    
    atualizarContadores() {
        const contadorProdutos = document.getElementById('contadorProdutos');
        const contadorOperadores = document.getElementById('contadorOperadores');
        
        if (contadorProdutos) {
            contadorProdutos.textContent = this.sistema.estoque.length;
        }
        
        if (contadorOperadores) {
            contadorOperadores.textContent = this.sistema.operadores.length;
        }
    }
    
    carregarProdutosAdmin() {
        const tbody = document.getElementById('produtosTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.sistema.estoque.forEach(produto => {
            const estoqueBaixo = produto.quantidade <= produto.estoqueMinimo;
            
            const row = `
                <tr>
                    <td>${produto.codigo}</td>
                    <td>${produto.nome}</td>
                    <td>${produto.quantidade.toFixed(3)} ${produto.unidade}</td>
                    <td>R$ ${produto.precoVenda.toFixed(2)}</td>
                    <td>
                        <button class="editar-produto-admin" data-id="${produto.id}" style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="excluir-produto-admin" data-id="${produto.id}" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        
        // Adicionar event listeners
        setTimeout(() => {
            document.querySelectorAll('.editar-produto-admin').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = parseInt(e.target.closest('button').getAttribute('data-id'));
                    this.editarProduto(id);
                });
            });
            
            document.querySelectorAll('.excluir-produto-admin').forEach(button => {
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
        
        const preco = parseFloat(novoPreco);
        if (isNaN(preco) || preco <= 0) {
            alert('Preço inválido!');
            return;
        }
        
        this.sistema.atualizarProduto(id, {
            nome: novoNome,
            precoVenda: preco
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
        const codigo = document.getElementById('produtoCodigo').value.trim();
        const nome = document.getElementById('produtoNome').value.trim();
        const precoEntrada = parseFloat(document.getElementById('precoEntrada').value) || 0;
        const precoVenda = parseFloat(document.getElementById('precoVenda').value) || 0;
        const unidade = document.getElementById('unidadeMedida').value;
        const quantidade = parseFloat(document.getElementById('quantidadeInicial').value) || 0;
        const estoqueMinimo = parseFloat(document.getElementById('estoqueMinimo').value) || 0;
        const categoria = document.getElementById('categoriaProduto').value.trim() || 'Geral';
        
        // Validações
        if (!codigo || !nome) {
            alert('Código e nome são obrigatórios!');
            return;
        }
        
        if (precoVenda <= 0) {
            alert('Preço de venda deve ser maior que zero!');
            return;
        }
        
        // Verificar se código já existe
        const produtoExistente = this.sistema.buscarProdutoPorCodigo(codigo);
        if (produtoExistente) {
            alert('Já existe um produto com este código!');
            return;
        }
        
        const produto = this.sistema.cadastrarProduto({
            codigo: codigo,
            nome: nome,
            precoEntrada: precoEntrada,
            precoVenda: precoVenda,
            unidade: unidade,
            quantidade: quantidade,
            estoqueMinimo: estoqueMinimo,
            categoria: categoria
        });
        
        if (produto) {
            alert('Produto cadastrado com sucesso!');
            this.atualizarContadores();
            
            // Limpar formulário
            document.getElementById('produtoCodigo').value = '';
            document.getElementById('produtoNome').value = '';
            document.getElementById('precoEntrada').value = '';
            document.getElementById('precoVenda').value = '';
            document.getElementById('quantidadeInicial').value = '0';
            document.getElementById('estoqueMinimo').value = '0';
            document.getElementById('categoriaProduto').value = '';
            
            this.carregarProdutosAdmin();
            this.carregarProdutosSelect();
        }
    }
    
    carregarProdutosSelect() {
        const selects = ['produtoAvaria'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Selecione um produto</option>';
                
                // Ordenar produtos por nome para facilitar
                const produtosOrdenados = [...this.sistema.estoque].sort((a, b) => a.nome.localeCompare(b.nome));
                
                produtosOrdenados.forEach(produto => {
                    const option = document.createElement('option');
                    option.value = produto.id.toString();
                    option.textContent = `${produto.codigo} - ${produto.nome} (${produto.quantidade.toFixed(3)} ${produto.unidade})`;
                    select.appendChild(option);
                });
                
                console.log(`Select ${selectId} carregado com ${produtosOrdenados.length} produtos`);
            }
        });
    }
    
    // ==================== MÉTODOS DE PRODUTOS AVARIADOS ====================
    
    carregarProdutosAvariados() {
        const container = document.getElementById('listaProdutosAvariados');
        if (!container) return;
        
        // Agrupar avarias por produto
        const produtosAvariados = {};
        
        this.sistema.avarias.forEach(avaria => {
            if (!produtosAvariados[avaria.produtoId]) {
                produtosAvariados[avaria.produtoId] = {
                    produtoId: avaria.produtoId,
                    produtoNome: avaria.produtoNome,
                    totalQuantidade: 0,
                    totalValor: 0,
                    avarias: [],
                    produto: this.sistema.buscarProdutoPorId(avaria.produtoId)
                };
            }
            
            produtosAvariados[avaria.produtoId].totalQuantidade += avaria.quantidade;
            produtosAvariados[avaria.produtoId].totalValor += avaria.precoCusto || 0;
            produtosAvariados[avaria.produtoId].avarias.push(avaria);
        });
        
        const produtosArray = Object.values(produtosAvariados);
        
        if (produtosArray.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Nenhum produto avariado registrado</p>
                    <small>Todos os produtos estão em bom estado</small>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h3 style="color: #2c3e50;">Produtos Avariados</h3>
                <p style="color: #95a5a6;">Total de produtos com avarias: ${produtosArray.length}</p>
            </div>
        `;
        
        produtosArray.sort((a, b) => b.totalValor - a.totalValor).forEach((produtoAvariado, index) => {
            const produto = produtoAvariado.produto;
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'produto-card';
            itemDiv.style.marginBottom = '15px';
            itemDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <strong>${produtoAvariado.produtoNome}</strong>
                        ${produto ? `<p style="margin: 5px 0; color: #666;">Código: ${produto.codigo}</p>` : ''}
                        <p style="margin: 5px 0;"><strong>Quantidade Total Avariada:</strong> ${produtoAvariado.totalQuantidade.toFixed(3)} ${produto ? produto.unidade : 'un'}</p>
                        <p style="margin: 5px 0;"><strong>Valor Total Perdido:</strong> R$ ${produtoAvariado.totalValor.toFixed(2)}</p>
                        <p style="margin: 5px 0;"><strong>Número de Avarias:</strong> ${produtoAvariado.avarias.length}</p>
                    </div>
                    <div style="margin-left: 20px;">
                        <button class="ver-avarias-produto-detalhes" data-index="${index}" style="background: #3498db; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-eye"></i> Ver Detalhes
                        </button>
                    </div>
                </div>
            `;
            
            container.appendChild(itemDiv);
        });
        
        // Adicionar event listeners CORRETAMENTE
        setTimeout(() => {
            document.querySelectorAll('.ver-avarias-produto-detalhes').forEach(button => {
                button.addEventListener('click', (e) => {
                    const index = parseInt(e.target.closest('button').getAttribute('data-index'));
                    const produtoAvariado = produtosArray[index];
                    this.verDetalhesProdutoAvariado(produtoAvariado);
                });
            });
        }, 100);
    }
    
    verDetalhesProdutoAvariado(produtoAvariado) {
        let html = `
            <div style="max-width: 800px; max-height: 80vh; overflow-y: auto; padding: 20px; background: white; border-radius: 10px;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">Detalhes de Avarias - ${produtoAvariado.produtoNome}</h3>
                ${produtoAvariado.produto ? `<p><strong>Código:</strong> ${produtoAvariado.produto.codigo}</p>` : ''}
                <p><strong>Total Avariado:</strong> ${produtoAvariado.totalQuantidade.toFixed(3)} ${produtoAvariado.produto ? produtoAvariado.produto.unidade : 'un'}</p>
                <p><strong>Valor Total Perdido:</strong> R$ ${produtoAvariado.totalValor.toFixed(2)}</p>
                <hr style="margin: 15px 0;">
                <h4 style="color: #2c3e50; margin-bottom: 10px;">Registros de Avarias (${produtoAvariado.avarias.length})</h4>
        `;
        
        if (produtoAvariado.avarias.length > 0) {
            html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
            html += `
                <thead>
                    <tr style="background: #ecf0f1;">
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Data/Hora</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Quantidade</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Motivo</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Observação</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Valor Perda</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Ações</th>
                    </tr>
                </thead>
                <tbody>
            `;
            
            produtoAvariado.avarias.sort((a, b) => new Date(b.data) - new Date(a.data)).forEach(avaria => {
                const dataFormatada = new Date(avaria.data).toLocaleDateString('pt-BR');
                const horaFormatada = new Date(avaria.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                html += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">${dataFormatada} ${horaFormatada}</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">${avaria.quantidade.toFixed(3)}</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">${avaria.motivo}</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">${avaria.observacao || '-'}</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">R$ ${(avaria.precoCusto || 0).toFixed(2)}</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">
                            <button class="excluir-avaria-detalhe" data-id="${avaria.id}" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody>';
            html += '</table>';
        } else {
            html += '<p>Nenhuma avaria registrada para este produto.</p>';
        }
        
        html += `
            <div style="margin-top: 20px; text-align: center;">
                <button id="btnFecharDetalhesAvariasModal" style="background: #95a5a6; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Fechar</button>
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
        
        // Event listener para fechar
        document.getElementById('btnFecharDetalhesAvariasModal').addEventListener('click', () => {
            document.body.removeChild(overlay);
            document.body.removeChild(modalDiv);
        });
        
        // Event listeners para excluir avarias
        setTimeout(() => {
            document.querySelectorAll('.excluir-avaria-detalhe').forEach(button => {
                button.addEventListener('click', (e) => {
                    const avariaId = parseInt(e.target.closest('button').getAttribute('data-id'));
                    if (confirm('Tem certeza que deseja excluir esta avaria e restaurar o estoque?')) {
                        if (this.sistema.excluirAvaria(avariaId)) {
                            // Fechar modal e recarregar
                            document.body.removeChild(overlay);
                            document.body.removeChild(modalDiv);
                            this.carregarProdutosAvariados();
                            alert('Avaria excluída e estoque restaurado!');
                        }
                    }
                });
            });
        }, 100);
    }
    
    // ==================== REGISTRAR AVARIA ====================
    
    registrarAvaria() {
        try {
            const produtoSelect = document.getElementById('produtoAvaria');
            const quantidadeInput = document.getElementById('quantidadeAvaria');
            const motivoSelect = document.getElementById('motivoAvaria');
            const observacaoTextarea = document.getElementById('observacaoAvaria');
            
            const produtoId = produtoSelect.value;
            const quantidade = parseFloat(quantidadeInput.value);
            const motivo = motivoSelect.value;
            const observacao = observacaoTextarea.value;
            
            console.log("=== TENTATIVA DE REGISTRAR AVARIA ===");
            console.log("Produto ID:", produtoId, "Tipo:", typeof produtoId);
            console.log("Quantidade:", quantidade);
            console.log("Motivo:", motivo);
            console.log("Observação:", observacao);
            
            // Validações
            if (!produtoId || produtoId === "") {
                alert('Selecione um produto!');
                produtoSelect.focus();
                return;
            }
            
            if (!quantidade || isNaN(quantidade) || quantidade <= 0) {
                alert('Digite uma quantidade válida!');
                quantidadeInput.focus();
                quantidadeInput.select();
                return;
            }
            
            if (!motivo || motivo === "") {
                alert('Informe o motivo da avaria!');
                motivoSelect.focus();
                return;
            }
            
            // Converter para número
            const produtoIdNum = parseInt(produtoId);
            
            // Verificar se produto existe
            const produto = this.sistema.buscarProdutoPorId(produtoIdNum);
            if (!produto) {
                console.error("Produto não encontrado. ID:", produtoIdNum);
                console.log("Produtos disponíveis:", this.sistema.estoque);
                alert(`Produto não encontrado! Por favor, selecione um produto válido.`);
                return;
            }
            
            // Verificar estoque
            if (produto.quantidade < quantidade) {
                alert(`Estoque insuficiente! Disponível: ${produto.quantidade.toFixed(3)} ${produto.unidade}`);
                quantidadeInput.value = produto.quantidade.toString();
                quantidadeInput.focus();
                quantidadeInput.select();
                return;
            }
            
            // Registrar avaria
            const avaria = this.sistema.registrarAvaria({
                produtoId: produtoIdNum,
                quantidade: quantidade,
                motivo: motivo,
                observacao: observacao
            });
            
            if (avaria) {
                alert(`✅ Avaria registrada com sucesso!\n\nProduto: ${produto.nome}\nQuantidade: ${avaria.quantidade} ${produto.unidade}\nMotivo: ${avaria.motivo}`);
                
                // Limpar formulário
                produtoSelect.value = '';
                quantidadeInput.value = '';
                motivoSelect.value = '';
                observacaoTextarea.value = '';
                
                // Recarregar seções
                setTimeout(() => {
                    this.carregarProdutosSelect();
                    this.carregarProdutosAdmin();
                    this.carregarProdutosAvariados();
                }, 100);
                
            } else {
                alert('❌ Erro ao registrar avaria!');
            }
            
        } catch (error) {
            console.error("Erro ao registrar avaria:", error);
            alert(`Erro ao registrar avaria: ${error.message}`);
        }
    }
    
    // ==================== MÉTODOS DE RELATÓRIOS ====================
    
    carregarRelatorioEstoque() {
        const tbody = document.getElementById('estoqueTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        let totalValor = 0;
        let totalProdutos = 0;
        
        this.sistema.estoque.forEach(produto => {
            totalProdutos++;
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
        
        const totalProdutosElement = document.getElementById('totalProdutos');
        if (totalProdutosElement) {
            totalProdutosElement.textContent = totalProdutos.toString();
        }
    }
    
    carregarRelatorioCaixa() {
        const hoje = new Date().toISOString().split('T')[0];
        const dataInicio = document.getElementById('dataInicio');
        const dataFim = document.getElementById('dataFim');
        
        if (dataInicio) dataInicio.value = hoje;
        if (dataFim) dataFim.value = hoje;
        
        this.gerarRelatorioCaixa();
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
        let totalCaixas = 0;
        let totalVendas = 0;
        
        if (filteredCaixas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">Nenhum caixa encontrado para os filtros selecionados</td>
                </tr>
            `;
            const totalGeralCaixa = document.getElementById('totalGeralCaixa');
            if (totalGeralCaixa) totalGeralCaixa.textContent = 'R$ 0.00';
            return;
        }
        
        filteredCaixas.forEach(caixa => {
            totalCaixas++;
            const operador = this.sistema.buscarOperadorPorId(caixa.operadorId);
            const totalVendasCaixa = caixa.total;
            totalGeral += totalVendasCaixa;
            totalVendas += caixa.vendas.length;
            
            const dataAberturaFormatada = new Date(caixa.dataAbertura).toLocaleDateString('pt-BR');
            const horaAberturaFormatada = new Date(caixa.dataAbertura).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            const row = `
                <tr>
                    <td>${dataAberturaFormatada} ${horaAberturaFormatada}</td>
                    <td>${operador ? operador.nome : 'N/A'}</td>
                    <td>${caixa.vendas.length}</td>
                    <td>R$ ${totalVendasCaixa.toFixed(2)}</td>
                    <td>
                        <span class="status-caixa ${caixa.fechado ? 'status-fechado' : 'status-aberto'}">
                            ${caixa.fechado ? 'Fechado' : 'Aberto'}
                        </span>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        
        const totalGeralCaixa = document.getElementById('totalGeralCaixa');
        if (totalGeralCaixa) {
            totalGeralCaixa.textContent = `R$ ${totalGeral.toFixed(2)}`;
        }
        
        // Atualizar estatísticas
        document.getElementById('totalCaixas').textContent = totalCaixas;
        document.getElementById('totalVendasCaixa').textContent = totalVendas;
        
        // CORREÇÃO: Adicionar event listeners para os botões de detalhes
        setTimeout(() => {
            document.querySelectorAll('.ver-detalhes-caixa-relatorio').forEach(button => {
                button.addEventListener('click', (e) => {
                    const caixaId = parseInt(e.target.closest('button').getAttribute('data-id'));
                    this.verDetalhesCaixa(caixaId);
                });
            });
        }, 100);
    }
    
    // ==================== MÉTODOS DE DETALHES DO CAIXA ====================
    
    verDetalhesCaixa(caixaId) {
        console.log("Ver detalhes do caixa:", caixaId);
        
        const dadosCaixa = this.sistema.obterDetalhesCompletosCaixa(caixaId);
        if (!dadosCaixa) {
            alert("Caixa não encontrado!");
            return;
        }
        
        const { caixa, resumo, vendas, estatisticas, detalhesVendas } = dadosCaixa;
        
        let html = `
            <div style="max-width: 1000px; max-height: 90vh; overflow-y: auto; padding: 30px; background: white; border-radius: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                    <div>
                        <h3 style="color: #2c3e50; margin-bottom: 10px;">Detalhes do Caixa #${caixa.id}</h3>
                        <p><strong>Operador:</strong> ${caixa.operadorNome}</p>
                        <p><strong>Abertura:</strong> ${new Date(caixa.dataAbertura).toLocaleString('pt-BR')}</p>
                        ${caixa.dataFechamento ? `<p><strong>Fechamento:</strong> ${new Date(caixa.dataFechamento).toLocaleString('pt-BR')}</p>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <span class="status-caixa ${caixa.fechado ? 'status-fechado' : 'status-aberto'}" style="font-size: 1.1rem;">
                            ${caixa.fechado ? 'FECHADO' : 'ABERTO'}
                        </span>
                    </div>
                </div>
                
                <!-- Resumo do Caixa -->
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">Resumo do Caixa</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <p><strong>Total de Vendas:</strong> ${resumo.totalVendas}</p>
                            <p><strong>Valor Total:</strong> R$ ${resumo.totalValor.toFixed(2)}</p>
                            <p><strong>Ticket Médio:</strong> R$ ${estatisticas.mediaPorVenda.toFixed(2)}</p>
                        </div>
                        <div>
                            <p><strong>Hora Pico:</strong> ${estatisticas.horaPico}</p>
                            <p><strong>Produto Mais Vendido:</strong> ${estatisticas.produtoMaisVendido ? estatisticas.produtoMaisVendido.nome : 'N/A'}</p>
                            ${estatisticas.produtoMaisVendido ? `<p><strong>Quantidade:</strong> ${estatisticas.produtoMaisVendido.quantidade.toFixed(3)}</p>` : ''}
                        </div>
                    </div>
                    
                    <!-- Formas de Pagamento -->
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                        <h5 style="color: #2c3e50; margin-bottom: 10px;">Formas de Pagamento</h5>
                        <div style="display: flex; justify-content: space-between;">
                            <div style="text-align: center;">
                                <div style="font-size: 1.2rem; font-weight: bold; color: #27ae60;">R$ ${resumo.totalDinheiro.toFixed(2)}</div>
                                <div style="color: #7f8c8d;">Dinheiro</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.2rem; font-weight: bold; color: #3498db;">R$ ${resumo.totalCartao.toFixed(2)}</div>
                                <div style="color: #7f8c8d;">Cartão</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 1.2rem; font-weight: bold; color: #9b59b6;">R$ ${resumo.totalPix.toFixed(2)}</div>
                                <div style="color: #7f8c8d;">PIX</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Sangrias e Suprimentos -->
                    ${caixa.sangrias.length > 0 || caixa.suprimentos.length > 0 ? `
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                            <h5 style="color: #2c3e50; margin-bottom: 10px;">Movimentações</h5>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                ${caixa.sangrias.length > 0 ? `
                                    <div>
                                        <p><strong>Sangrias:</strong> ${caixa.sangrias.length}</p>
                                        <p><strong>Total Sangrias:</strong> R$ ${caixa.sangrias.reduce((total, s) => total + s.valor, 0).toFixed(2)}</p>
                                    </div>
                                ` : ''}
                                ${caixa.suprimentos.length > 0 ? `
                                    <div>
                                        <p><strong>Suprimentos:</strong> ${caixa.suprimentos.length}</p>
                                        <p><strong>Total Suprimentos:</strong> R$ ${caixa.suprimentos.reduce((total, s) => total + s.valor, 0).toFixed(2)}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Saldos -->
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <p><strong>Saldo Inicial:</strong> R$ ${caixa.saldoInicial.toFixed(2)}</p>
                            </div>
                            <div>
                                <p><strong>Saldo Final:</strong> R$ ${resumo.saldoFinal.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Vendas Detalhadas -->
                <div>
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">Vendas Detalhadas (${vendas.length})</h4>
        `;
        
        if (vendas.length > 0) {
            html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
            html += `
                <thead>
                    <tr style="background: #ecf0f1;">
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">ID Venda</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Data/Hora</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Itens</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Total</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Pagamento</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Detalhes</th>
                    </tr>
                </thead>
                <tbody>
            `;
            
            detalhesVendas.forEach(detalhe => {
                const dataFormatada = new Date(detalhe.data).toLocaleDateString('pt-BR');
                const horaFormatada = new Date(detalhe.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                html += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">${detalhe.id}</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">${dataFormatada} ${horaFormatada}</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">${detalhe.itens.length} itens</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">R$ ${detalhe.total.toFixed(2)}</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">${detalhe.formaPagamento}</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">
                            <button class="ver-itens-venda-detalhes" data-vendaid="${detalhe.id}" style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-list"></i> Ver
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody>';
            html += '</table>';
        } else {
            html += '<p>Nenhuma venda registrada neste caixa.</p>';
        }
        
        html += `
                </div>
                
                <!-- Botão de impressão -->
                <div style="margin-top: 20px; text-align: center;">
                    <button id="btnImprimirDetalhesCaixa" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                        <i class="fas fa-print"></i> Imprimir Relatório
                    </button>
                    <button id="btnFecharDetalhesCaixaModal" style="background: #95a5a6; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = html;
        modalDiv.style.position = 'fixed';
        modalDiv.style.top = '0';
        modalDiv.style.left = '0';
        modalDiv.style.width = '100%';
        modalDiv.style.height = '100%';
        modalDiv.style.backgroundColor = 'white';
        modalDiv.style.padding = '20px';
        modalDiv.style.overflowY = 'auto';
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
        
        // Event listeners
        document.getElementById('btnFecharDetalhesCaixaModal').addEventListener('click', () => {
            document.body.removeChild(overlay);
            document.body.removeChild(modalDiv);
        });
        
        document.getElementById('btnImprimirDetalhesCaixa').addEventListener('click', () => {
            this.imprimirRelatorioCaixa(dadosCaixa);
        });
        
        // Adicionar event listeners para ver itens da venda
        setTimeout(() => {
            document.querySelectorAll('.ver-itens-venda-detalhes').forEach(button => {
                button.addEventListener('click', (e) => {
                    const vendaId = parseInt(e.target.closest('button').getAttribute('data-vendaid'));
                    this.verItensVenda(vendaId);
                });
            });
        }, 100);
    }
    
    imprimirRelatorioCaixa(dadosCaixa) {
        const { caixa, resumo, estatisticas, detalhesVendas } = dadosCaixa;
        
        const conteudo = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Relatório do Caixa #${caixa.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #2c3e50; }
                    h2 { color: #34495e; margin-top: 20px; }
                    .resumo { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
                    th { background: #ecf0f1; }
                    .total { font-weight: bold; }
                    @media print {
                        .no-print { display: none; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>Relatório do Caixa #${caixa.id}</h1>
                <p><strong>Operador:</strong> ${caixa.operadorNome}</p>
                <p><strong>Abertura:</strong> ${new Date(caixa.dataAbertura).toLocaleString('pt-BR')}</p>
                ${caixa.dataFechamento ? `<p><strong>Fechamento:</strong> ${new Date(caixa.dataFechamento).toLocaleString('pt-BR')}</p>` : ''}
                <p><strong>Status:</strong> ${caixa.fechado ? 'Fechado' : 'Aberto'}</p>
                
                <div class="resumo">
                    <h2>Resumo</h2>
                    <p><strong>Total de Vendas:</strong> ${resumo.totalVendas}</p>
                    <p><strong>Valor Total:</strong> R$ ${resumo.totalValor.toFixed(2)}</p>
                    <p><strong>Ticket Médio:</strong> R$ ${estatisticas.mediaPorVenda.toFixed(2)}</p>
                    <p><strong>Hora Pico:</strong> ${estatisticas.horaPico}</p>
                    
                    <h3>Formas de Pagamento</h3>
                    <p>Dinheiro: R$ ${resumo.totalDinheiro.toFixed(2)}</p>
                    <p>Cartão: R$ ${resumo.totalCartao.toFixed(2)}</p>
                    <p>PIX: R$ ${resumo.totalPix.toFixed(2)}</p>
                    
                    ${caixa.sangrias.length > 0 ? `
                        <h3>Sangrias</h3>
                        <p>Total: R$ ${caixa.sangrias.reduce((total, s) => total + s.valor, 0).toFixed(2)}</p>
                    ` : ''}
                    
                    ${caixa.suprimentos.length > 0 ? `
                        <h3>Suprimentos</h3>
                        <p>Total: R$ ${caixa.suprimentos.reduce((total, s) => total + s.valor, 0).toFixed(2)}</p>
                    ` : ''}
                    
                    <p><strong>Saldo Inicial:</strong> R$ ${caixa.saldoInicial.toFixed(2)}</p>
                    <p><strong>Saldo Final:</strong> R$ ${resumo.saldoFinal.toFixed(2)}</p>
                </div>
                
                <h2>Vendas Detalhadas</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Data/Hora</th>
                            <th>Itens</th>
                            <th>Total</th>
                            <th>Pagamento</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${detalhesVendas.map(venda => `
                            <tr>
                                <td>${venda.id}</td>
                                <td>${new Date(venda.data).toLocaleString('pt-BR')}</td>
                                <td>${venda.itens.length}</td>
                                <td>R$ ${venda.total.toFixed(2)}</td>
                                <td>${venda.formaPagamento}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="no-print" style="margin-top: 20px;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Imprimir
                    </button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                        Fechar
                    </button>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;
        
        const janelaImpressao = window.open('', '_blank');
        janelaImpressao.document.write(conteudo);
        janelaImpressao.document.close();
    }
    
    verItensVenda(vendaId) {
        const venda = this.sistema.vendas.find(v => v.id == vendaId);
        if (!venda) return;
        
        let html = `
            <div style="max-width: 600px; max-height: 80vh; overflow-y: auto; padding: 20px; background: white; border-radius: 10px;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">Itens da Venda #${venda.id}</h3>
                <p><strong>Data:</strong> ${new Date(venda.data).toLocaleString('pt-BR')}</p>
                <p><strong>Total:</strong> R$ ${venda.total.toFixed(2)}</p>
                <p><strong>Pagamento:</strong> ${venda.formaPagamento}</p>
                ${venda.troco > 0 ? `<p><strong>Troco:</strong> R$ ${venda.troco.toFixed(2)}</p>` : ''}
                <p><strong>Operador:</strong> ${venda.operadorNome}</p>
                <hr style="margin: 15px 0;">
                <h4 style="color: #2c3e50; margin-bottom: 10px;">Produtos Vendidos (${venda.itens.length})</h4>
        `;
        
        if (venda.itens.length > 0) {
            html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
            html += `
                <thead>
                    <tr style="background: #ecf0f1;">
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Produto</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Quantidade</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Preço Unit.</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
            `;
            
            venda.itens.forEach(item => {
                html += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">${item.nome}</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">${item.quantidade.toFixed(3)} ${item.unidade}</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">R$ ${item.preco.toFixed(2)}</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">R$ ${item.getSubtotal().toFixed(2)}</td>
                    </tr>
                `;
            });
            
            html += '</tbody>';
            html += '</table>';
        } else {
            html += '<p>Nenhum item encontrado nesta venda.</p>';
        }
        
        html += `
            <div style="margin-top: 20px; text-align: center;">
                <button id="btnFecharItensVendaModal" style="background: #95a5a6; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Fechar</button>
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
        
        document.getElementById('btnFecharItensVendaModal').addEventListener('click', () => {
            document.body.removeChild(overlay);
            document.body.removeChild(modalDiv);
        });
    }
    
    // ==================== RELATÓRIO DE VENDAS POR PRODUTO ====================
    
    carregarRelatorioVendasPorProduto() {
        const hoje = new Date().toISOString().split('T')[0];
        const dataInicio = document.getElementById('dataInicioVendasProduto');
        const dataFim = document.getElementById('dataFimVendasProduto');
        
        if (dataInicio) dataInicio.value = hoje;
        if (dataFim) dataFim.value = hoje;
        
        this.gerarRelatorioVendasPorProduto();
    }
    
    gerarRelatorioVendasPorProduto() {
        const dataInicio = document.getElementById('dataInicioVendasProduto').value;
        const dataFim = document.getElementById('dataFimVendasProduto').value;
        
        const relatorio = this.sistema.gerarRelatorioVendasPorProduto(dataInicio, dataFim);
        
        const tbody = document.getElementById('vendasProdutoTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (relatorio.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">Nenhuma venda encontrada para o período selecionado</td>
                </tr>
            `;
            document.getElementById('totalVendasProduto').textContent = 'R$ 0.00';
            document.getElementById('totalQuantidadeVendasProduto').textContent = '0.000';
            return;
        }
        
        let totalGeral = 0;
        let totalQuantidadeGeral = 0;
        
        relatorio.forEach(item => {
            totalGeral += item.totalVendido;
            totalQuantidadeGeral += item.totalQuantidade;
            
            const row = `
                <tr>
                    <td>${item.codigo}</td>
                    <td>${item.nome}</td>
                    <td>${item.totalQuantidade.toFixed(3)}</td>
                    <td>${item.vendas.length}</td>
                    <td>R$ ${item.totalVendido.toFixed(2)}</td>
                    <td>
                        <button class="ver-detalhes-vendas-produto-relatorio" data-produtoid="${item.produtoId}" data-datainicio="${dataInicio}" data-datafim="${dataFim}" style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-eye"></i> Detalhes
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        
        document.getElementById('totalVendasProduto').textContent = `R$ ${totalGeral.toFixed(2)}`;
        document.getElementById('totalQuantidadeVendasProduto').textContent = totalQuantidadeGeral.toFixed(3);
        
        // Adicionar event listeners
        setTimeout(() => {
            document.querySelectorAll('.ver-detalhes-vendas-produto-relatorio').forEach(button => {
                button.addEventListener('click', (e) => {
                    const produtoId = button.getAttribute('data-produtoid');
                    const dataInicio = button.getAttribute('data-datainicio');
                    const dataFim = button.getAttribute('data-datafim');
                    this.verDetalhesVendasProduto(produtoId, dataInicio, dataFim);
                });
            });
        }, 100);
    }
    
    verDetalhesVendasProduto(produtoId, dataInicio, dataFim) {
        const produto = this.sistema.buscarProdutoPorId(parseInt(produtoId));
        if (!produto) return;
        
        // Filtrar vendas do período
        let vendasFiltradas = [...this.sistema.vendas];
        
        if (dataInicio) {
            const inicio = new Date(dataInicio);
            inicio.setHours(0, 0, 0, 0);
            vendasFiltradas = vendasFiltradas.filter(v => new Date(v.data) >= inicio);
        }
        
        if (dataFim) {
            const fim = new Date(dataFim);
            fim.setHours(23, 59, 59, 999);
            vendasFiltradas = vendasFiltradas.filter(v => new Date(v.data) <= fim);
        }
        
        // Filtrar itens do produto específico
        const vendasDoProduto = [];
        let totalQuantidade = 0;
        let totalValor = 0;
        
        vendasFiltradas.forEach(venda => {
            const itensProduto = venda.itens.filter(item => item.produtoId == produtoId);
            
            if (itensProduto.length > 0) {
                itensProduto.forEach(item => {
                    totalQuantidade += item.quantidade;
                    totalValor += item.getSubtotal();
                });
                
                vendasDoProduto.push({
                    venda: venda,
                    itens: itensProduto
                });
            }
        });
        
        let html = `
            <div style="max-width: 800px; max-height: 80vh; overflow-y: auto; padding: 20px; background: white; border-radius: 10px;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">Detalhes de Vendas - ${produto.nome}</h3>
                <p><strong>Código:</strong> ${produto.codigo}</p>
                <p><strong>Período:</strong> ${dataInicio} a ${dataFim}</p>
                <p><strong>Total Vendido:</strong> ${totalQuantidade.toFixed(3)} ${produto.unidade}</p>
                <p><strong>Valor Total:</strong> R$ ${totalValor.toFixed(2)}</p>
                <hr style="margin: 15px 0;">
                <h4 style="color: #2c3e50; margin-bottom: 10px;">Vendas Detalhadas (${vendasDoProduto.length})</h4>
        `;
        
        if (vendasDoProduto.length > 0) {
            html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
            html += `
                <thead>
                    <tr style="background: #ecf0f1;">
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Data/Hora</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Venda ID</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Quantidade</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Valor</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Operador</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Pagamento</th>
                    </tr>
                </thead>
                <tbody>
            `;
            
            vendasDoProduto.forEach(({venda, itens}) => {
                const dataFormatada = new Date(venda.data).toLocaleDateString('pt-BR');
                const horaFormatada = new Date(venda.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                itens.forEach(item => {
                    html += `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #bdc3c7;">${dataFormatada} ${horaFormatada}</td>
                            <td style="padding: 8px; border: 1px solid #bdc3c7;">${venda.id}</td>
                            <td style="padding: 8px; border: 1px solid #bdc3c7;">${item.quantidade.toFixed(3)} ${item.unidade}</td>
                            <td style="padding: 8px; border: 1px solid #bdc3c7;">R$ ${item.getSubtotal().toFixed(2)}</td>
                            <td style="padding: 8px; border: 1px solid #bdc3c7;">${venda.operadorNome}</td>
                            <td style="padding: 8px; border: 1px solid #bdc3c7;">${venda.formaPagamento}</td>
                        </tr>
                    `;
                });
            });
            
            html += '</tbody>';
            html += '</table>';
        } else {
            html += '<p>Nenhuma venda encontrada para este produto no período selecionado.</p>';
        }
        
        html += `
            <div style="margin-top: 20px; text-align: center;">
                <button id="btnFecharDetalhesVendasProdutoModal" style="background: #95a5a6; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Fechar</button>
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
        
        document.getElementById('btnFecharDetalhesVendasProdutoModal').addEventListener('click', () => {
            document.body.removeChild(overlay);
            document.body.removeChild(modalDiv);
        });
    }
    
    // ==================== RELATÓRIO DE AVARIAS POR PRODUTO ====================
    
    carregarRelatorioAvariasPorProduto() {
        const hoje = new Date().toISOString().split('T')[0];
        const dataInicio = document.getElementById('dataInicioAvariasProduto');
        const dataFim = document.getElementById('dataFimAvariasProduto');
        
        if (dataInicio) dataInicio.value = hoje;
        if (dataFim) dataFim.value = hoje;
        
        this.gerarRelatorioAvariasProduto();
    }
    
    gerarRelatorioAvariasProduto() {
        const dataInicio = document.getElementById('dataInicioAvariasProduto').value;
        const dataFim = document.getElementById('dataFimAvariasProduto').value;
        
        const relatorio = this.sistema.gerarRelatorioAvariasProdutos(dataInicio, dataFim);
        
        const tbody = document.getElementById('avariasProdutoTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (relatorio.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">Nenhuma avaria encontrada para o período selecionado</td>
                </tr>
            `;
            document.getElementById('totalAvariasProduto').textContent = 'R$ 0.00';
            return;
        }
        
        let totalGeral = 0;
        
        relatorio.forEach(item => {
            totalGeral += item.totalValor;
            
            const row = `
                <tr>
                    <td>${item.produtoNome}</td>
                    <td>${item.totalQuantidade.toFixed(3)}</td>
                    <td>${item.avarias.length}</td>
                    <td>R$ ${item.totalValor.toFixed(2)}</td>
                    <td>
                        <button class="ver-detalhes-avarias-produto-relatorio" data-produtoid="${item.produtoId}" data-datainicio="${dataInicio}" data-datafim="${dataFim}" style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-eye"></i> Detalhes
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        
        document.getElementById('totalAvariasProduto').textContent = `R$ ${totalGeral.toFixed(2)}`;
        
        // Adicionar event listeners
        setTimeout(() => {
            document.querySelectorAll('.ver-detalhes-avarias-produto-relatorio').forEach(button => {
                button.addEventListener('click', (e) => {
                    const produtoId = button.getAttribute('data-produtoid');
                    const dataInicio = button.getAttribute('data-datainicio');
                    const dataFim = button.getAttribute('data-datafim');
                    this.verDetalhesAvariasProduto(produtoId, dataInicio, dataFim);
                });
            });
        }, 100);
    }
    
    verDetalhesAvariasProduto(produtoId, dataInicio, dataFim) {
        const produto = this.sistema.buscarProdutoPorId(parseInt(produtoId));
        if (!produto) return;
        
        const avariasFiltradas = this.sistema.filtrarAvariasPorData(dataInicio, dataFim)
            .filter(a => a.produtoId == produtoId);
        
        let html = `
            <div style="max-width: 800px; max-height: 80vh; overflow-y: auto; padding: 20px; background: white; border-radius: 10px;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">Detalhes de Avarias - ${produto.nome}</h3>
                <p><strong>Código:</strong> ${produto.codigo}</p>
                <p><strong>Período:</strong> ${dataInicio} a ${dataFim}</p>
                <p><strong>Total de Avarias:</strong> ${avariasFiltradas.length}</p>
                <hr style="margin: 15px 0;">
                <h4 style="color: #2c3e50; margin-bottom: 10px;">Avarias Detalhadas</h4>
        `;
        
        if (avariasFiltradas.length > 0) {
            html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
            html += `
                <thead>
                    <tr style="background: #ecf0f1;">
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Data/Hora</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Quantidade</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Motivo</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Observação</th>
                        <th style="padding: 10px; border: 1px solid #bdc3c7;">Valor Perda</th>
                    </tr>
                </thead>
                <tbody>
            `;
            
            let totalQuantidade = 0;
            let totalValor = 0;
            
            avariasFiltradas.forEach(avaria => {
                totalQuantidade += avaria.quantidade;
                totalValor += avaria.precoCusto || 0;
                
                const dataFormatada = new Date(avaria.data).toLocaleDateString('pt-BR');
                const horaFormatada = new Date(avaria.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                html += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">${dataFormatada} ${horaFormatada}</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">${avaria.quantidade.toFixed(3)} ${produto.unidade}</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">${avaria.motivo}</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">${avaria.observacao || '-'}</td>
                        <td style="padding: 8px; border: 1px solid #bdc3c7;">R$ ${(avaria.precoCusto || 0).toFixed(2)}</td>
                    </tr>
                `;
            });
            
            html += '</tbody>';
            html += `
                <tfoot>
                    <tr style="background: #f8f8f8; font-weight: bold;">
                        <td style="padding: 10px; border: 1px solid #bdc3c7;">TOTAL</td>
                        <td style="padding: 10px; border: 1px solid #bdc3c7;">${totalQuantidade.toFixed(3)} ${produto.unidade}</td>
                        <td colspan="2" style="padding: 10px; border: 1px solid #bdc3c7;"></td>
                        <td style="padding: 10px; border: 1px solid #bdc3c7;">R$ ${totalValor.toFixed(2)}</td>
                    </tr>
                </tfoot>
            `;
            html += '</table>';
        } else {
            html += '<p>Nenhuma avaria encontrada para este produto no período selecionado.</p>';
        }
        
        html += `
            <div style="margin-top: 20px; text-align: center;">
                <button id="btnFecharDetalhesAvariasProdutoModal" style="background: #95a5a6; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Fechar</button>
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
        
        document.getElementById('btnFecharDetalhesAvariasProdutoModal').addEventListener('click', () => {
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
            const dataAtualizacao = operador.dataAtualizacao ? 
                new Date(operador.dataAtualizacao).toLocaleDateString() : 
                'Não alterado';
            
            const row = `
                <tr>
                    <td>${operador.nome}</td>
                    <td>${operador.usuario}</td>
                    <td>${new Date(operador.dataCadastro).toLocaleDateString()}</td>
                    <td>${dataAtualizacao}</td>
                    <td>
                        <button class="editar-operador-admin" data-id="${operador.id}" style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="excluir-operador-admin" data-id="${operador.id}" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        
        // Adicionar event listeners
        setTimeout(() => {
            document.querySelectorAll('.editar-operador-admin').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = parseInt(e.target.closest('button').getAttribute('data-id'));
                    this.editarOperador(id);
                });
            });
            
            document.querySelectorAll('.excluir-operador-admin').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = parseInt(e.target.closest('button').getAttribute('data-id'));
                    this.excluirOperador(id);
                });
            });
        }, 100);
    }
    
    editarOperador(id) {
        const operador = this.sistema.buscarOperadorPorId(id);
        if (!operador) return;
        
        // Criar formulário de edição
        let html = `
            <div style="max-width: 400px; padding: 20px; background: white; border-radius: 10px;">
                <h3 style="color: #2c3e50; margin-bottom: 20px;">Editar Operador</h3>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #2c3e50;">Nome:</label>
                    <input type="text" id="editarOperadorNome" value="${operador.nome}" style="width: 100%; padding: 10px; border: 2px solid #bdc3c7; border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #2c3e50;">Usuário:</label>
                    <input type="text" id="editarOperadorUsuario" value="${operador.usuario}" style="width: 100%; padding: 10px; border: 2px solid #bdc3c7; border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #2c3e50;">Nova Senha (deixe em branco para manter a atual):</label>
                    <input type="password" id="editarOperadorSenha" placeholder="Nova senha" style="width: 100%; padding: 10px; border: 2px solid #bdc3c7; border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #2c3e50;">Confirmar Nova Senha:</label>
                    <input type="password" id="editarOperadorConfirmarSenha" placeholder="Confirmar nova senha" style="width: 100%; padding: 10px; border: 2px solid #bdc3c7; border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="text-align: center;">
                    <button id="btnSalvarEdicaoOperadorModal" style="background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                        <i class="fas fa-save"></i> Salvar
                    </button>
                    <button id="btnCancelarEdicaoOperadorModal" style="background: #95a5a6; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        Cancelar
                    </button>
                </div>
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
        
        document.getElementById('btnSalvarEdicaoOperadorModal').addEventListener('click', () => {
            const nome = document.getElementById('editarOperadorNome').value.trim();
            const usuario = document.getElementById('editarOperadorUsuario').value.trim();
            const senha = document.getElementById('editarOperadorSenha').value;
            const confirmarSenha = document.getElementById('editarOperadorConfirmarSenha').value;
            
            if (!nome || !usuario) {
                alert('Nome e usuário são obrigatórios!');
                return;
            }
            
            if (senha && senha !== confirmarSenha) {
                alert('As senhas não coincidem!');
                return;
            }
            
            const dadosAtualizacao = {
                nome: nome,
                usuario: usuario
            };
            
            if (senha) {
                dadosAtualizacao.senha = senha;
            }
            
            const operadorAtualizado = this.sistema.atualizarOperador(id, dadosAtualizacao);
            
            if (operadorAtualizado) {
                alert('Operador atualizado com sucesso!');
                this.carregarOperadoresAdmin();
                this.carregarOperadoresSelect();
                this.carregarOperadoresRelatorio();
                this.atualizarContadores();
            } else {
                alert('Erro ao atualizar operador!');
            }
            
            document.body.removeChild(overlay);
            document.body.removeChild(modalDiv);
        });
        
        document.getElementById('btnCancelarEdicaoOperadorModal').addEventListener('click', () => {
            document.body.removeChild(overlay);
            document.body.removeChild(modalDiv);
        });
    }
    
    excluirOperador(id) {
        if (this.sistema.operadores.length <= 1) {
            alert('É necessário ter pelo menos um operador!');
            return;
        }
        
        if (!confirm('Tem certeza que deseja excluir este operador?')) return;
        
        if (this.sistema.excluirOperador(id)) {
            this.carregarOperadoresAdmin();
            this.carregarOperadoresSelect();
            this.carregarOperadoresRelatorio();
            this.atualizarContadores();
            alert('Operador excluído com sucesso!');
        } else {
            alert('Erro ao excluir operador!');
        }
    }
    
    cadastrarOperador() {
        const nome = document.getElementById('novoOperadorNome').value.trim();
        const usuario = document.getElementById('novoOperadorUsuario').value.trim();
        const senha = document.getElementById('novoOperadorSenha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;
        
        if (!nome || !usuario || !senha) {
            alert('Preencha todos os campos!');
            return;
        }
        
        if (senha !== confirmarSenha) {
            alert('As senhas não coincidem!');
            return;
        }
        
        const operador = this.sistema.cadastrarOperador({
            nome: nome,
            usuario: usuario,
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
            this.atualizarContadores();
        }
    }
    
    // ==================== MÉTODOS AUXILIARES ====================
    
    carregarOperadoresSelect() {
        const select = document.getElementById('operador');
        if (select) {
            select.innerHTML = '<option value="">Selecione um operador</option>';
            
            this.sistema.operadores.forEach(operador => {
                const option = document.createElement('option');
                option.value = operador.id.toString();
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
                option.value = operador.id.toString();
                option.textContent = operador.nome;
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
        
        // Configurar datas para diferentes relatórios
        const dataCampos = [
            'dataInicio', 'dataFim',
            'dataInicioVendasProduto', 'dataFimVendasProduto',
            'dataInicioAvariasProduto', 'dataFimAvariasProduto'
        ];
        
        dataCampos.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.value = hoje;
        });
        
        // Event delegation para botões principais
        document.addEventListener('click', (event) => {
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
            
            // Botões do dashboard (período)
            if (event.target.closest('.period-btn')) {
                const btn = event.target.closest('.period-btn');
                const periodo = btn.getAttribute('data-period');
                this.periodoDashboard = periodo;
                this.carregarDashboard();
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
                
                const carrinhoFooter = document.querySelector('.carrinho-footer');
                if (carrinhoFooter) carrinhoFooter.classList.add('hidden');
                
                const carrinhoItems = document.getElementById('carrinhoItemsContainer');
                if (carrinhoItems) carrinhoItems.classList.add('hidden');
            });
        }
        
        const btnEncerrarCaixa = document.getElementById('btnEncerrarCaixa');
        if (btnEncerrarCaixa) {
            btnEncerrarCaixa.addEventListener('click', () => {
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
                
                const carrinhoFooter = document.querySelector('.carrinho-footer');
                if (carrinhoFooter) carrinhoFooter.classList.remove('hidden');
                
                const carrinhoItems = document.getElementById('carrinhoItemsContainer');
                if (carrinhoItems) carrinhoItems.classList.remove('hidden');
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
        
        // Botões para gerar relatórios
        const btnGerarRelatorioVendasProduto = document.getElementById('btnGerarRelatorioVendasProduto');
        if (btnGerarRelatorioVendasProduto) {
            btnGerarRelatorioVendasProduto.addEventListener('click', () => this.gerarRelatorioVendasPorProduto());
        }
        
        const btnGerarRelatorioAvariasProduto = document.getElementById('btnGerarRelatorioAvariasProduto');
        if (btnGerarRelatorioAvariasProduto) {
            btnGerarRelatorioAvariasProduto.addEventListener('click', () => this.gerarRelatorioAvariasProduto());
        }
        
        // Botão para limpar dados (apenas para desenvolvimento)
        const btnLimparDados = document.getElementById('btnLimparDados');
        if (btnLimparDados) {
            btnLimparDados.addEventListener('click', () => {
                if (confirm('ATENÇÃO: Isso irá apagar TODOS os dados do sistema. Tem certeza?')) {
                    if (this.sistema.limparTodosDados()) {
                        alert('Dados limpos! O sistema será recarregado.');
                        location.reload();
                    }
                }
            });
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
                    @media print {
                        body { margin: 0; padding: 5px; }
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="margin-bottom: 10px; text-align: center;">
                    <button onclick="window.print()" style="padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer;">
                        Imprimir
                    </button>
                    <button onclick="window.close()" style="padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer; margin-left: 10px;">
                        Fechar
                    </button>
                </div>
                ${cupomHTML}
            </body>
            </html>
        `);
        janelaImpressao.document.close();
        janelaImpressao.focus();
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
