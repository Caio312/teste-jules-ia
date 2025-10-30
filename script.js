// Aguarda o DOM estar completamente carregado para iniciar o script
document.addEventListener('DOMContentLoaded', () => {
    // Seletores de elementos do DOM
    const formTransacao = document.getElementById('form-transacao');
    const descricaoInput = document.getElementById('descricao');
    const valorInput = document.getElementById('valor');
    const tipoInput = document.getElementById('tipo');
    const categoriaInput = document.getElementById('categoria');
    const corpoTabela = document.getElementById('corpo-tabela');
    const saldoDisplay = document.getElementById('saldo-display');

    // Elementos do Modal de Transação
    const modalTransacao = document.getElementById('modal-transacao');
    const btnNovaTransacao = document.getElementById('btn-nova-transacao');
    const fecharModalTransacao = document.getElementById('fechar-modal-transacao');
    const modalTitulo = document.getElementById('modal-titulo');
    const submitButton = formTransacao.querySelector('button[type="submit"]');

    // Elementos de Feedback
    const notificacao = document.getElementById('notificacao');
    const modalConfirmacao = document.getElementById('modal-confirmacao');
    const modalMensagem = document.getElementById('modal-mensagem');
    const btnConfirmar = document.getElementById('btn-confirmar');
    const btnCancelar = document.getElementById('btn-cancelar');

    // Estrutura de dados
    let transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
    let modoEdicao = false;
    let idEmEdicao = null;

    const categorias = {
        receita: ['Salário', 'Freelance', 'Investimentos', 'Outros'],
        despesa: ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Outros']
    };

    // --- FUNÇÕES DO MODAL DE TRANSAÇÃO ---
    const abrirModalTransacao = () => {
        atualizarTextoBotao();
        modalTransacao.classList.add('mostrar');
    };

    const fecharModalTransacaoFunc = () => {
        modalTransacao.classList.remove('mostrar');
        cancelarEdicao();
    };

    // --- FUNÇÕES DE FEEDBACK ---
    const mostrarNotificacao = (mensagem, tipo = 'sucesso') => {
        notificacao.textContent = mensagem;
        notificacao.className = `notificacao ${tipo}`;
        notificacao.classList.add('mostrar');
        setTimeout(() => notificacao.classList.remove('mostrar'), 3000);
    };

    const mostrarModalConfirmacao = (mensagem, callbackConfirmacao) => {
        modalMensagem.textContent = mensagem;
        modalConfirmacao.classList.add('mostrar');

        const confirmarAcao = () => {
            modalConfirmacao.classList.remove('mostrar');
            callbackConfirmacao();
            removerListeners();
        };

        const cancelarAcao = () => {
            modalConfirmacao.classList.remove('mostrar');
            removerListeners();
        };

        const removerListeners = () => {
            btnConfirmar.removeEventListener('click', confirmarAcao);
            btnCancelar.removeEventListener('click', cancelarAcao);
        };

        btnConfirmar.addEventListener('click', confirmarAcao);
        btnCancelar.addEventListener('click', cancelarAcao);
    };

    // --- FUNÇÕES DE MANIPULAÇÃO DE DADOS ---
    const salvarNoLocalStorage = () => localStorage.setItem('transacoes', JSON.stringify(transacoes));

    const adicionarTransacao = (descricao, valor, tipo, categoria) => {
        if (descricao.trim() === '' || isNaN(valor) || valor === 0) {
            mostrarNotificacao('Por favor, preencha todos os campos corretamente.', 'erro');
            return;
        }
        const novaTransacao = { id: Date.now(), descricao, valor: parseFloat(valor), tipo, categoria, data: new Date().toISOString() };
        transacoes.push(novaTransacao);
        salvarNoLocalStorage();
        atualizarInterface();
        fecharModalTransacaoFunc();
        mostrarNotificacao('Transação adicionada com sucesso!');
    };

    const editarTransacao = (id, novosValores) => {
        const index = transacoes.findIndex(t => t.id === id);
        if (index === -1) return;
        transacoes[index] = { ...transacoes[index], ...novosValores };
        salvarNoLocalStorage();
        atualizarInterface();
        fecharModalTransacaoFunc();
        mostrarNotificacao('Transação atualizada com sucesso!');
    };

    const excluirTransacao = (id) => {
        transacoes = transacoes.filter(t => t.id !== id);
        salvarNoLocalStorage();
        atualizarInterface();
        mostrarNotificacao('Transação excluída com sucesso.');
    };

    // --- LÓGICA DE EDIÇÃO ---
    const iniciarEdicao = (id) => {
        const transacao = transacoes.find(t => t.id === id);
        if (!transacao) return;

        modoEdicao = true;
        idEmEdicao = id;

        modalTitulo.textContent = 'Editar Transação';
        descricaoInput.value = transacao.descricao;
        valorInput.value = transacao.valor;
        tipoInput.value = transacao.tipo;
        popularCategorias();
        categoriaInput.value = transacao.categoria;
        atualizarTextoBotao();

        abrirModalTransacao();
    };

    const cancelarEdicao = () => {
        modoEdicao = false;
        idEmEdicao = null;
        modalTitulo.textContent = 'Nova Transação';
        limparFormulario();
        atualizarTextoBotao();
    };

    // --- FUNÇÕES DE CÁLCULO ---
    const calcularSaldo = () => transacoes.reduce((acc, t) => t.tipo === 'receita' ? acc + t.valor : acc - t.valor, 0);

    // --- FUNÇÕES DE INTERFACE (DOM) ---
    const atualizarTextoBotao = () => {
        if (modoEdicao) {
            submitButton.textContent = 'Atualizar Transação';
        } else {
            const tipo = tipoInput.value;
            submitButton.textContent = tipo === 'receita' ? 'Salvar Receita' : 'Salvar Despesa';
        }
    };

    const popularCategorias = () => {
        const tipoSelecionado = tipoInput.value;
        categoriaInput.innerHTML = categorias[tipoSelecionado].map(cat => `<option value="${cat}">${cat}</option>`).join('');
    };

    const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatarData = (dataISO) => new Date(dataISO).toLocaleDateString('pt-BR');

    const atualizarSaldo = () => {
        const saldo = calcularSaldo();
        saldoDisplay.textContent = formatarMoeda(saldo);
        saldoDisplay.className = saldo >= 0 ? 'receita' : 'despesa';
    };

    const renderizarExtrato = () => {
        corpoTabela.innerHTML = transacoes.map(transacao => {
            const classeValor = transacao.tipo === 'receita' ? 'receita' : 'despesa';
            const sinal = transacao.tipo === 'receita' ? '' : '- ';
            return `
                <tr>
                    <td>${formatarData(transacao.data)}</td>
                    <td>${transacao.descricao}</td>
                    <td>${transacao.categoria || 'N/A'}</td>
                    <td class="${classeValor}">${transacao.tipo.charAt(0).toUpperCase() + transacao.tipo.slice(1)}</td>
                    <td class="${classeValor}">${sinal}${formatarMoeda(Math.abs(transacao.valor))}</td>
                    <td>
                        <button class="acoes-btn btn-editar" data-id="${transacao.id}" title="Editar">
                            <span class="btn-icon">✏️</span>
                            <span class="btn-label">Editar</span>
                        </button>
                        <button class="acoes-btn btn-excluir" data-id="${transacao.id}" title="Excluir">
                            <span class="btn-icon">🗑️</span>
                            <span class="btn-label">Excluir</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    };

    const limparFormulario = () => {
        formTransacao.reset();
        popularCategorias();
        descricaoInput.focus();
    };

    const atualizarInterface = () => {
        renderizarExtrato();
        atualizarSaldo();
    };

    // --- EVENT LISTENERS ---
    btnNovaTransacao.addEventListener('click', abrirModalTransacao);
    fecharModalTransacao.addEventListener('click', fecharModalTransacaoFunc);
    modalTransacao.addEventListener('click', (e) => {
        if (e.target === modalTransacao) fecharModalTransacaoFunc();
    });

    tipoInput.addEventListener('change', () => {
        popularCategorias();
        atualizarTextoBotao();
    });

    formTransacao.addEventListener('submit', (event) => {
        event.preventDefault();
        const dadosForm = {
            descricao: descricaoInput.value,
            valor: parseFloat(valorInput.value),
            tipo: tipoInput.value,
            categoria: categoriaInput.value
        };
        if (modoEdicao) editarTransacao(idEmEdicao, dadosForm);
        else adicionarTransacao(dadosForm.descricao, dadosForm.valor, dadosForm.tipo, dadosForm.categoria);
    });

    corpoTabela.addEventListener('click', (event) => {
        const target = event.target.closest('.acoes-btn');
        if (!target) return;
        const id = Number(target.getAttribute('data-id'));

        if (target.classList.contains('btn-editar')) {
            iniciarEdicao(id);
        } else if (target.classList.contains('btn-excluir')) {
            mostrarModalConfirmacao('Tem certeza que deseja excluir esta transação?', () => excluirTransacao(id));
        }
    });

    // --- INICIALIZAÇÃO ---
    const inicializarApp = () => {
        popularCategorias();
        atualizarInterface();
    };
    inicializarApp();
});
