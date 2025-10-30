// Aguarda o DOM estar completamente carregado para iniciar o script
document.addEventListener('DOMContentLoaded', () => {
    // Seletores de elementos do DOM
    const formTransacao = document.getElementById('form-transacao');
    const descricaoInput = document.getElementById('descricao');
    const valorInput = document.getElementById('valor');
    const tipoInput = document.getElementById('tipo');
    const corpoTabela = document.getElementById('corpo-tabela');
    const saldoDisplay = document.getElementById('saldo-display');

    // Estrutura de dados principal
    let transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];

    // --- FUNÇÕES DE MANIPULAÇÃO DE DADOS ---

    const salvarNoLocalStorage = () => {
        localStorage.setItem('transacoes', JSON.stringify(transacoes));
    };

    const adicionarTransacao = (descricao, valor, tipo) => {
        if (descricao.trim() === '' || isNaN(valor) || valor === 0) {
            alert('Por favor, preencha a descrição e um valor válido.');
            return;
        }

        const novaTransacao = {
            id: Date.now(), // ID único baseado no timestamp
            descricao: descricao,
            valor: parseFloat(valor),
            tipo: tipo,
            data: new Date().toISOString()
        };

        transacoes.push(novaTransacao);
        salvarNoLocalStorage();
        atualizarInterface();
        limparFormulario();
    };

    const excluirTransacao = (id) => {
        transacoes = transacoes.filter(transacao => transacao.id !== id);
        salvarNoLocalStorage();
        atualizarInterface();
    };

    // --- FUNÇÕES DE CÁLCULO ---

    const calcularSaldo = () => {
        return transacoes.reduce((acc, transacao) => {
            return transacao.tipo === 'receita' ? acc + transacao.valor : acc - transacao.valor;
        }, 0);
    };

    // --- FUNÇÕES DE INTERFACE (DOM) ---

    const formatarMoeda = (valor) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatarData = (dataISO) => {
        const data = new Date(dataISO);
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const atualizarSaldo = () => {
        const saldo = calcularSaldo();
        saldoDisplay.textContent = formatarMoeda(saldo);
        saldoDisplay.className = saldo >= 0 ? 'receita' : 'despesa';
    };

    const renderizarExtrato = () => {
        corpoTabela.innerHTML = ''; // Limpa a tabela antes de renderizar

        transacoes.forEach(transacao => {
            const tr = document.createElement('tr');
            const classeValor = transacao.tipo === 'receita' ? 'receita' : 'despesa';
            const sinal = transacao.tipo === 'receita' ? '' : '- ';

            tr.innerHTML = `
                <td>${formatarData(transacao.data)}</td>
                <td>${transacao.descricao}</td>
                <td class="${classeValor}">${transacao.tipo.charAt(0).toUpperCase() + transacao.tipo.slice(1)}</td>
                <td class="${classeValor}">${sinal}${formatarMoeda(Math.abs(transacao.valor))}</td>
                <td>
                    <button class="acoes-btn btn-excluir" data-id="${transacao.id}" title="Excluir">
                        🗑️
                    </button>
                </td>
            `;
            corpoTabela.appendChild(tr);
        });
    };

    const limparFormulario = () => {
        descricaoInput.value = '';
        valorInput.value = '';
        descricaoInput.focus();
    };

    const atualizarInterface = () => {
        renderizarExtrato();
        atualizarSaldo();
    };

    // --- EVENT LISTENERS ---

    formTransacao.addEventListener('submit', (event) => {
        event.preventDefault(); // Evita o recarregamento da página
        adicionarTransacao(descricaoInput.value, valorInput.value, tipoInput.value);
    });

    corpoTabela.addEventListener('click', (event) => {
        if (event.target.classList.contains('btn-excluir')) {
            const id = Number(event.target.getAttribute('data-id'));
            if (confirm('Tem certeza que deseja excluir esta transação?')) {
                excluirTransacao(id);
            }
        }
    });

    // --- INICIALIZAÇÃO ---

    const inicializarApp = () => {
        atualizarInterface();
    };

    inicializarApp(); // Ponto de entrada do aplicativo
});
