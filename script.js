// Aguarda o DOM estar completamente carregado para iniciar o script
document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DE ELEMENTOS DO DOM ---
    const btnNovaTarefa = document.getElementById('btn-nova-tarefa');
    const listaTarefasContainer = document.getElementById('lista-tarefas');

    // Contadores
    const totalTarefasDisplay = document.getElementById('total-tarefas');
    const tarefasPendentesDisplay = document.getElementById('tarefas-pendentes');
    const tarefasConcluidasDisplay = document.getElementById('tarefas-concluidas');

    // Ferramentas da Lista
    const buscaInput = document.getElementById('busca-tarefa');
    const filtrosContainer = document.getElementById('filtros');
    const ordenarSelect = document.getElementById('ordenar-por');

    // Elementos do Modal de Tarefa
    const modalTarefa = document.getElementById('modal-tarefa');
    const modalTitulo = document.getElementById('modal-titulo');
    const fecharModalTarefa = document.getElementById('fechar-modal-tarefa');
    const formTarefa = document.getElementById('form-tarefa');
    const nomeTarefaInput = document.getElementById('nome-tarefa');
    const dataVencimentoInput = document.getElementById('data-vencimento');
    const prioridadeInput = document.getElementById('prioridade');
    const submitButton = formTarefa.querySelector('button[type="submit"]');

    // Elementos de Feedback
    const notificacao = document.getElementById('notificacao');
    const modalConfirmacao = document.getElementById('modal-confirmacao');
    const modalMensagem = document.getElementById('modal-mensagem');
    const btnConfirmar = document.getElementById('btn-confirmar');
    const btnCancelar = document.getElementById('btn-cancelar');

    // --- ESTRUTURA DE DADOS E ESTADO DA APLICAÇÃO ---
    let tarefas = JSON.parse(localStorage.getItem('tarefas')) || [];
    let modoEdicao = false;
    let idEmEdicao = null;
    let filtroAtual = 'todas';
    let ordemAtual = 'data';
    let termoBusca = '';

    // --- FUNÇÕES DO MODAL DE TAREFA ---
    const abrirModalTarefa = () => modalTarefa.classList.add('mostrar');
    const fecharModalTarefaFunc = () => {
        modalTarefa.classList.remove('mostrar');
        cancelarEdicao();
    };

    // --- FUNÇÕES DE FEEDBACK (reutilizadas) ---
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
    const salvarNoLocalStorage = () => localStorage.setItem('tarefas', JSON.stringify(tarefas));

    const adicionarTarefa = (nome, dataVencimento, prioridade) => {
        if (nome.trim() === '' || dataVencimento === '') {
            mostrarNotificacao('Por favor, preencha o nome e a data da tarefa.', 'erro');
            return;
        }
        const novaTarefa = { id: Date.now(), nome, dataVencimento, prioridade, concluida: false };
        tarefas.push(novaTarefa);
        finalizarAcao();
        mostrarNotificacao('Tarefa adicionada com sucesso!');
    };

    const editarTarefa = (id, novosValores) => {
        const index = tarefas.findIndex(t => t.id === id);
        if (index === -1) return;
        tarefas[index] = { ...tarefas[index], ...novosValores };
        finalizarAcao();
        mostrarNotificacao('Tarefa atualizada com sucesso!');
    };

    const excluirTarefa = (id) => {
        tarefas = tarefas.filter(t => t.id !== id);
        salvarNoLocalStorage(); // Salva antes de atualizar a UI
        atualizarInterfaceCompleta();
        mostrarNotificacao('Tarefa excluída com sucesso.');
    };

    const alternarStatusTarefa = (id) => {
        const tarefa = tarefas.find(t => t.id === id);
        if (tarefa) {
            tarefa.concluida = !tarefa.concluida;
            salvarNoLocalStorage();
            atualizarInterfaceCompleta();
        }
    };

    const finalizarAcao = () => {
        salvarNoLocalStorage();
        atualizarInterfaceCompleta();
        fecharModalTarefaFunc();
    }

    // --- LÓGICA DE EDIÇÃO ---
    const iniciarEdicao = (id) => {
        const tarefa = tarefas.find(t => t.id === id);
        if (!tarefa) return;

        modoEdicao = true;
        idEmEdicao = id;

        modalTitulo.textContent = 'Editar Tarefa';
        submitButton.textContent = 'Atualizar Tarefa';
        nomeTarefaInput.value = tarefa.nome;
        dataVencimentoInput.value = tarefa.dataVencimento;
        prioridadeInput.value = tarefa.prioridade;

        abrirModalTarefa();
    };

    const cancelarEdicao = () => {
        modoEdicao = false;
        idEmEdicao = null;
        modalTitulo.textContent = 'Nova Tarefa';
        submitButton.textContent = 'Adicionar Tarefa';
        formTarefa.reset();
    };

    // --- FUNÇÕES DE RENDERIZAÇÃO E UI ---
    const atualizarContadores = () => {
        const concluidas = tarefas.filter(t => t.concluida).length;
        const pendentes = tarefas.length - concluidas;
        totalTarefasDisplay.textContent = tarefas.length;
        tarefasPendentesDisplay.textContent = pendentes;
        tarefasConcluidasDisplay.textContent = concluidas;
    };

    const renderizarTarefas = () => {
        // 1. Filtrar
        let tarefasFiltradas = tarefas;
        if (filtroAtual === 'pendentes') {
            tarefasFiltradas = tarefas.filter(t => !t.concluida);
        } else if (filtroAtual === 'concluidas') {
            tarefasFiltradas = tarefas.filter(t => t.concluida);
        }

        // 2. Buscar
        if (termoBusca) {
            tarefasFiltradas = tarefasFiltradas.filter(t => t.nome.toLowerCase().includes(termoBusca.toLowerCase()));
        }

        // 3. Ordenar
        const prioridadeValor = { baixa: 1, media: 2, alta: 3 };
        tarefasFiltradas.sort((a, b) => {
            if (ordemAtual === 'prioridade') {
                return prioridadeValor[b.prioridade] - prioridadeValor[a.prioridade];
            }
            // Padrão é ordenar por data
            return new Date(a.dataVencimento) - new Date(b.dataVencimento);
        });

        // 4. Renderizar no DOM
        listaTarefasContainer.innerHTML = tarefasFiltradas.map(tarefa => criarElementoTarefa(tarefa)).join('');
    };

    const criarElementoTarefa = (tarefa) => {
        const dataFormatada = new Date(tarefa.dataVencimento + 'T00:00:00-03:00').toLocaleDateString('pt-BR');
        return `
            <div class="tarefa ${tarefa.concluida ? 'concluida' : ''}" data-prioridade="${tarefa.prioridade}">
                <div class="tarefa-info">
                    <button class="status-btn" data-id="${tarefa.id}">
                        <span class="checkbox">${tarefa.concluida ? '✔' : ''}</span>
                    </button>
                    <div class="tarefa-texto">
                        <h3>${tarefa.nome}</h3>
                        <p>Vencimento: ${dataFormatada}</p>
                    </div>
                </div>
                <div class="tarefa-acoes">
                    <span class="prioridade-tag">${tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}</span>
                    <button class="acoes-btn btn-editar" data-id="${tarefa.id}" title="Editar">✏️</button>
                    <button class="acoes-btn btn-excluir" data-id="${tarefa.id}" title="Excluir">🗑️</button>
                </div>
            </div>
        `;
    };

    const atualizarInterfaceCompleta = () => {
        atualizarContadores();
        renderizarTarefas();
    };

    // --- EVENT LISTENERS ---
    btnNovaTarefa.addEventListener('click', () => {
        cancelarEdicao(); // Garante que o modal abra em modo de criação
        abrirModalTarefa();
    });
    fecharModalTarefa.addEventListener('click', fecharModalTarefaFunc);
    modalTarefa.addEventListener('click', (e) => {
        if (e.target === modalTarefa) fecharModalTarefaFunc();
    });

    formTarefa.addEventListener('submit', (event) => {
        event.preventDefault();
        const dados = {
            nome: nomeTarefaInput.value,
            dataVencimento: dataVencimentoInput.value,
            prioridade: prioridadeInput.value
        };
        if (modoEdicao) {
            editarTarefa(idEmEdicao, dados);
        } else {
            adicionarTarefa(dados.nome, dados.dataVencimento, dados.prioridade);
        }
    });

    listaTarefasContainer.addEventListener('click', (event) => {
        const target = event.target;
        const id = Number(target.closest('.tarefa-info .status-btn, .tarefa-acoes .acoes-btn')?.getAttribute('data-id'));
        if (!id) return;

        if (target.closest('.status-btn')) {
            alternarStatusTarefa(id);
        } else if (target.closest('.btn-editar')) {
            iniciarEdicao(id);
        } else if (target.closest('.btn-excluir')) {
            mostrarModalConfirmacao('Tem certeza que deseja excluir esta tarefa?', () => excluirTarefa(id));
        }
    });

    buscaInput.addEventListener('input', (e) => {
        termoBusca = e.target.value;
        renderizarTarefas();
    });

    filtrosContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('filtro-btn')) {
            document.querySelector('.filtro-btn.ativo').classList.remove('ativo');
            e.target.classList.add('ativo');
            filtroAtual = e.target.dataset.filtro;
            renderizarTarefas();
        }
    });

    ordenarSelect.addEventListener('change', (e) => {
        ordemAtual = e.target.value;
        renderizarTarefas();
    });

    // --- INICIALIZAÇÃO ---
    const inicializarApp = () => {
        atualizarInterfaceCompleta();
    };
    inicializarApp();
});
