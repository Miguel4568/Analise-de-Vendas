document.addEventListener('DOMContentLoaded', () => {
    initSidebarNav();
    initMobileMenu();
    initSmoothScroll();
    initScrollSpy();
    carregarDados();
});

function carregarDados() {
    const dados = window.DADOS_VENDAS;
    if (!dados) {
        return;
    }

    const etapas = [
        () => preencherKPIs(dados.kpis),
        () => preencherCardsRegioes(dados.cards_regioes),
        () => preencherPicos(dados.picos),
        () => preencherDestaquesProds(dados.destaques_produtos),
        () => preencherTabelaProdutos(dados.produtos),
        () => preencherTabelaVendedores(dados.vendedores),
        () => preencherTabelaRegioes(dados.regioes),
        () => preencherTabelaTemporal(dados.temporal),
        () => preencherFiltros(dados.filtros),
        () => iniciarTabelaVendas(dados.vendas),
        () => renderizarGraficos(dados),
    ];

    etapas.forEach((fn, idx) => {
        try {
            fn();
        } catch (err) {
            console.error(`Erro na etapa ${idx}:`, err);
        }
    });
}

function renderizarGraficos(dados) {
    if (typeof Chart === 'undefined') return;

    const cores = ['#006FFF', '#004299', '#0284c7', '#10b981', '#f59e0b', '#3b82f6'];
    const fmtUSD = v => '$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    const ctxRegiao = document.getElementById('chart-distribuicao-regiao');
    if (ctxRegiao && dados.regioes) {
        new Chart(ctxRegiao, {
            type: 'doughnut',
            data: {
                labels: dados.regioes.map(r => r.regiao),
                datasets: [{
                    data: dados.regioes.map(r => r.faturamento),
                    backgroundColor: cores,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.label}: ${fmtUSD(ctx.parsed)}`,
                        },
                    },
                },
            },
        });
    }

    const ctxTendencia = document.getElementById('chart-tendencia-geral');
    if (ctxTendencia && dados.temporal) {
        new Chart(ctxTendencia, {
            type: 'line',
            data: {
                labels: dados.temporal.map(t => t.periodo),
                datasets: [{
                    label: 'Faturamento (USD)',
                    data: dados.temporal.map(t => t.faturamento),
                    borderColor: '#006FFF',
                    backgroundColor: 'rgba(0, 111, 255, 0.12)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${fmtUSD(ctx.parsed.y)}`,
                        },
                    },
                },
                scales: {
                    y: {
                        ticks: {
                            callback: v => '$ ' + Number(v).toLocaleString('pt-BR'),
                        },
                    },
                },
            },
        });
    }

    const ctxMelhores = document.getElementById('chart-produtos-melhores');
    if (ctxMelhores && dados.destaques_produtos && dados.destaques_produtos.melhores) {
        const melhores = dados.destaques_produtos.melhores;
        new Chart(ctxMelhores, {
            type: 'bar',
            data: {
                labels: melhores.map(p => p.produto),
                datasets: [{
                    label: 'Faturamento (USD)',
                    data: melhores.map(p => p.faturamento),
                    backgroundColor: ['#22c55e', '#16a34a', '#4ade80'],
                    borderRadius: 6,
                }],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${fmtUSD(ctx.parsed.x)}`,
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: {
                            callback: v => '$ ' + Number(v).toLocaleString('pt-BR'),
                        },
                    },
                },
            },
        });
    }

    const ctxPiores = document.getElementById('chart-produtos-piores');
    if (ctxPiores && dados.destaques_produtos && dados.destaques_produtos.piores) {
        const piores = dados.destaques_produtos.piores;
        new Chart(ctxPiores, {
            type: 'bar',
            data: {
                labels: piores.map(p => p.produto),
                datasets: [{
                    label: 'Faturamento (USD)',
                    data: piores.map(p => p.faturamento),
                    backgroundColor: ['#ef4444', '#f87171', '#fca5a5'],
                    borderRadius: 6,
                }],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${fmtUSD(ctx.parsed.x)}`,
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: {
                            callback: v => '$ ' + Number(v).toLocaleString('pt-BR'),
                        },
                    },
                },
            },
        });
    }

    const ctxProdutos = document.getElementById('chart-comparativo-produtos');
    if (ctxProdutos && dados.produtos) {
        new Chart(ctxProdutos, {
            type: 'bar',
            data: {
                labels: dados.produtos.map(p => p.produto),
                datasets: [{
                    label: 'Faturamento (USD)',
                    data: dados.produtos.map(p => p.faturamento),
                    backgroundColor: '#006FFF',
                    borderRadius: 6,
                }],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${fmtUSD(ctx.parsed.x)}`,
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: {
                            callback: v => '$ ' + Number(v).toLocaleString('pt-BR'),
                        },
                    },
                },
            },
        });
    }

    const ctxFatVend = document.getElementById('chart-faturamento-vendedor');
    if (ctxFatVend && dados.vendedores) {
        new Chart(ctxFatVend, {
            type: 'bar',
            data: {
                labels: dados.vendedores.map(v => v.vendedor),
                datasets: [{
                    label: 'Faturamento (USD)',
                    data: dados.vendedores.map(v => v.faturamento),
                    backgroundColor: cores,
                    borderRadius: 6,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${fmtUSD(ctx.parsed.y)}`,
                        },
                    },
                },
                scales: {
                    y: {
                        ticks: {
                            callback: v => '$ ' + Number(v).toLocaleString('pt-BR'),
                        },
                    },
                },
            },
        });
    }

    const ctxPedVend = document.getElementById('chart-pedidos-vendedor');
    if (ctxPedVend && dados.vendedores) {
        new Chart(ctxPedVend, {
            type: 'pie',
            data: {
                labels: dados.vendedores.map(v => v.vendedor),
                datasets: [{
                    data: dados.vendedores.map(v => v.total_pedidos),
                    backgroundColor: cores,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.label}: ${ctx.parsed} pedidos`,
                        },
                    },
                },
            },
        });
    }

    const ctxCompRegiao = document.getElementById('chart-comparativo-regiao');
    if (ctxCompRegiao && dados.regioes) {
        new Chart(ctxCompRegiao, {
            type: 'bar',
            data: {
                labels: dados.regioes.map(r => r.regiao),
                datasets: [{
                    label: 'Faturamento (USD)',
                    data: dados.regioes.map(r => r.faturamento),
                    backgroundColor: '#06b6d4',
                    borderRadius: 6,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${fmtUSD(ctx.parsed.y)}`,
                        },
                    },
                },
                scales: {
                    y: {
                        ticks: {
                            callback: v => '$ ' + Number(v).toLocaleString('pt-BR'),
                        },
                    },
                },
            },
        });
    }

    const ctxEvolucao = document.getElementById('chart-evolucao-mensal');
    if (ctxEvolucao && dados.temporal) {
        new Chart(ctxEvolucao, {
            type: 'bar',
            data: {
                labels: dados.temporal.map(t => t.periodo),
                datasets: [
                    {
                        type: 'line',
                        label: 'Tendência (USD)',
                        data: dados.temporal.map(t => t.faturamento),
                        borderColor: '#004299',
                        borderWidth: 2.5,
                        tension: 0.3,
                        pointRadius: 4,
                    },
                    {
                        type: 'bar',
                        label: 'Faturamento Mensal (USD)',
                        data: dados.temporal.map(t => t.faturamento),
                        backgroundColor: 'rgba(0, 111, 255, 0.22)',
                        borderRadius: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.dataset.label}: ${fmtUSD(ctx.parsed.y)}`,
                        },
                    },
                },
                scales: {
                    y: {
                        ticks: {
                            callback: v => '$ ' + Number(v).toLocaleString('pt-BR'),
                        },
                    },
                },
            },
        });
    }
}

function preencherKPIs(kpis) {
    if (!kpis) return;
    const fmtD = v => '$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const fmtN = v => Number(v).toLocaleString('pt-BR');

    const cards = document.querySelectorAll('#visao-geral .kpi-card');
    if (!cards.length) return;

    const valores = [
        fmtD(kpis.faturamento_total),
        fmtN(kpis.total_pedidos),
        fmtN(kpis.produtos_vendidos),
        fmtD(kpis.ticket_medio),
        fmtN(kpis.num_vendedores),
        fmtN(kpis.num_regioes),
    ];

    cards.forEach((card, i) => {
        const el = card.querySelector('.kpi-value');
        if (el && valores[i] !== undefined) el.textContent = valores[i];
    });
}

function preencherCardsRegioes(regioes) {
    if (!regioes) return;
    const grid = document.querySelector('.cards-region-grid');
    if (!grid) return;

    grid.innerHTML = regioes.map(r => `
        <div class="region-box">
            <div class="region-badge-icon">${r.emoji}</div>
            <h5>${r.regiao}</h5>
            <div class="region-total">$ ${Number(r.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div class="region-share">${r.participacao_pct.toFixed(1)} % do faturamento</div>
            <div class="text-muted small mt-1">${r.total_pedidos} pedidos</div>
        </div>
    `).join('');
}

function preencherPicos(picos) {
    if (!picos) return;
    const maiorCard = document.querySelector('#temporal .kpi-card.green .kpi-data');
    if (maiorCard) {
        maiorCard.querySelector('.kpi-value').textContent = picos.maior.periodo;
        maiorCard.querySelector('.kpi-meta').textContent =
            'Faturamento: $ ' + Number(picos.maior.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }
    const menorCard = document.querySelector('#temporal .kpi-card.red .kpi-data');
    if (menorCard) {
        menorCard.querySelector('.kpi-value').textContent = picos.menor.periodo;
        menorCard.querySelector('.kpi-meta').textContent =
            'Faturamento: $ ' + Number(picos.menor.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }
}

function preencherDestaquesProds(destaques) {
    if (!destaques) return;
    const boxMelhores = document.getElementById('destaque-melhores');
    const boxPiores = document.getElementById('destaque-piores');

    function renderDestaque(box, lista, tipo) {
        if (!box || !lista) return;
        box.innerHTML = lista.map(p => `
            <div class="destaque-item ${tipo}">
                <span class="destaque-rank">#${p.ranking}</span>
                <span class="destaque-nome">${p.produto}</span>
                <span class="destaque-valor">$ ${Number(p.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>`).join('');
    }

    renderDestaque(boxMelhores, destaques.melhores, 'top');
    renderDestaque(boxPiores, destaques.piores, 'low');
}

function preencherTabelaProdutos(produtos) {
    const tbody = document.getElementById('tbody-produtos');
    if (!tbody || !produtos) return;

    const labelStatus = { top: 'Destaque', mid: 'Regular', low: 'Baixo' };

    tbody.innerHTML = produtos.map(p => `
        <tr>
            <td>${p.ranking}</td>
            <td>${p.produto}</td>
            <td>${Number(p.quantidade_vendida).toLocaleString('pt-BR')}</td>
            <td>$ ${Number(p.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td><span class="badge-status ${p.status}">${labelStatus[p.status]}</span></td>
        </tr>`).join('');
}

function preencherTabelaVendedores(vendedores) {
    const tbody = document.getElementById('tbody-vendedores');
    if (!tbody || !vendedores) return;

    const labelTxt = { top: '⭐ Top', mid: 'Regular', low: 'Atenção' };

    tbody.innerHTML = vendedores.map(v => `
        <tr>
            <td><strong>${v.posicao}º</strong></td>
            <td>${v.vendedor}</td>
            <td>${v.total_pedidos} pedidos / ${Number(v.quantidade_total).toLocaleString('pt-BR')} itens</td>
            <td>$ ${Number(v.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td><span class="badge-status ${v.classificacao}">${labelTxt[v.classificacao]}</span></td>
        </tr>`).join('');
}

function preencherTabelaRegioes(regioes) {
    const tbody = document.getElementById('tbody-regioes');
    if (!tbody || !regioes) return;

    tbody.innerHTML = regioes.map(r => `
        <tr>
            <td>${r.regiao}</td>
            <td>$ ${Number(r.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td>${r.total_pedidos}</td>
            <td>${r.participacao_pct.toFixed(1)} %</td>
        </tr>`).join('');
}

function preencherTabelaTemporal(temporal) {
    const tbody = document.getElementById('tbody-temporal');
    if (!tbody || !temporal) return;

    tbody.innerHTML = temporal.map(t => {
        const evo = t.evolucao_pct;
        let evoHtml = '—';
        if (evo !== null && evo !== undefined) {
            const cls = evo >= 0 ? 'text-success' : 'text-danger';
            const sinal = evo >= 0 ? '▲' : '▼';
            evoHtml = `<span class="${cls}">${sinal} ${Math.abs(evo).toFixed(1)} %</span>`;
        }
        return `
        <tr>
            <td>${t.periodo}</td>
            <td>$ ${Number(t.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td>${t.total_pedidos}</td>
            <td>${Number(t.quantidade).toLocaleString('pt-BR')}</td>
            <td>${evoHtml}</td>
        </tr>`;
    }).join('');
}

let _todasVendas = [];
let _vendasFiltradas = [];
let _paginaAtual = 1;
const LINHAS_PAG = 20;

function iniciarTabelaVendas(vendas) {
    _todasVendas = vendas || [];
    _vendasFiltradas = _todasVendas;
    renderizarTabelaVendas();
    renderizarPaginacao();
    initFiltros();
}

function renderizarTabelaVendas() {
    const tbody = document.getElementById('tbody-vendas');
    if (!tbody) return;

    const inicio = (_paginaAtual - 1) * LINHAS_PAG;
    const slice = _vendasFiltradas.slice(inicio, inicio + LINHAS_PAG);

    if (!slice.length) {
        tbody.innerHTML = `
            <tr><td colspan="9" class="table-empty-row">
                <i class="bi bi-search"></i>
                <span>Nenhum registro encontrado.</span>
            </td></tr>`;
    } else {
        tbody.innerHTML = slice.map(v => `
            <tr>
                <td>${v.id_pedido}</td>
                <td>${v.data_venda}</td>
                <td>${v.produto}</td>
                <td>${v.quantidade}</td>
                <td>$ ${Number(v.preco_unitario_usd).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>$ ${Number(v.total_venda_usd).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>$ ${Number(v.faturamento_usd).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>${v.regiao}</td>
                <td>${v.vendedor}</td>
            </tr>`).join('');
    }

    const info = document.querySelector('.pagination-info');
    if (info) {
        const total = _vendasFiltradas.length;
        info.textContent = total
            ? `Exibindo ${inicio + 1}–${Math.min(inicio + LINHAS_PAG, total)} de ${total} registros`
            : 'Nenhum registro encontrado';
    }
}

function renderizarPaginacao() {
    const container = document.querySelector('.pagination-buttons');
    if (!container) return;

    const totalPags = Math.max(1, Math.ceil(_vendasFiltradas.length / LINHAS_PAG));
    const delta = 2;
    const paginas = [];

    for (let p = 1; p <= totalPags; p++) {
        if (p === 1 || p === totalPags || (p >= _paginaAtual - delta && p <= _paginaAtual + delta)) {
            paginas.push(p);
        }
    }

    const comReticencias = [];
    for (let i = 0; i < paginas.length; i++) {
        if (i > 0 && paginas[i] - paginas[i - 1] > 1) comReticencias.push('...');
        comReticencias.push(paginas[i]);
    }

    container.innerHTML =
        `<span class="page-link-btn${_paginaAtual === 1 ? ' disabled' : ''}" data-page="prev">
            <i class="bi bi-chevron-left"></i>
        </span>` +
        comReticencias.map(p =>
            p === '...'
                ? `<span class="page-link-btn disabled">…</span>`
                : `<span class="page-link-btn${p === _paginaAtual ? ' active' : ''}" data-page="${p}">${p}</span>`
        ).join('') +
        `<span class="page-link-btn${_paginaAtual === totalPags ? ' disabled' : ''}" data-page="next">
            <i class="bi bi-chevron-right"></i>
        </span>`;

    container.querySelectorAll('.page-link-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = btn.dataset.page;
            if (p === 'prev') _paginaAtual = Math.max(1, _paginaAtual - 1);
            else if (p === 'next') _paginaAtual = Math.min(totalPags, _paginaAtual + 1);
            else _paginaAtual = Number(p);
            renderizarTabelaVendas();
            renderizarPaginacao();
        });
    });
}

function preencherFiltros(filtros) {
    if (!filtros) return;
    function populaSelect(id, lista) {
        const sel = document.getElementById(id);
        if (!sel || !lista) return;
        lista.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item;
            opt.textContent = item;
            sel.appendChild(opt);
        });
    }
    populaSelect('sel-produto', filtros.produtos);
    populaSelect('sel-vendedor', filtros.vendedores);
    populaSelect('sel-regiao', filtros.regioes);
}

function initFiltros() {
    const searchInput = document.getElementById('input-busca');
    const selProduto  = document.getElementById('sel-produto');
    const selVendedor = document.getElementById('sel-vendedor');
    const selRegiao   = document.getElementById('sel-regiao');
    const dataInicio  = document.getElementById('data-inicio');
    const dataFim     = document.getElementById('data-fim');
    const btnFiltrar  = document.querySelector('.btn-filter-action');

    function aplicarFiltros() {
        const busca    = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const produto  = selProduto  ? selProduto.value  : '';
        const vendedor = selVendedor ? selVendedor.value : '';
        const regiao   = selRegiao   ? selRegiao.value   : '';
        const dInicio  = dataInicio  ? dataInicio.value  : '';
        const dFim     = dataFim     ? dataFim.value     : '';

        _vendasFiltradas = _todasVendas.filter(v => {
            if (busca) {
                const linha = Object.values(v).join(' ').toLowerCase();
                if (!linha.includes(busca)) return false;
            }
            if (produto  && v.produto  !== produto)  return false;
            if (vendedor && v.vendedor !== vendedor) return false;
            if (regiao   && v.regiao   !== regiao)   return false;
            if (dInicio || dFim) {
                const p = v.data_venda.split('/');
                const dataVenda = new Date(`${p[2]}-${p[1]}-${p[0]}`);
                if (dInicio && dataVenda < new Date(dInicio)) return false;
                if (dFim    && dataVenda > new Date(dFim))    return false;
            }
            return true;
        });

        _paginaAtual = 1;
        renderizarTabelaVendas();
        renderizarPaginacao();
    }

    if (searchInput) searchInput.addEventListener('input', aplicarFiltros);
    if (btnFiltrar)  btnFiltrar.addEventListener('click', aplicarFiltros);
    [selProduto, selVendedor, selRegiao, dataInicio, dataFim].forEach(el => {
        if (el) el.addEventListener('change', aplicarFiltros);
    });
}

function initSidebarNav() {
    const links = document.querySelectorAll('.nav-link-item');
    links.forEach(link => {
        link.addEventListener('click', () => {
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) sidebar.classList.remove('open');
        });
    });
}

function initMobileMenu() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    const btn = document.createElement('button');
    btn.id = 'menu-toggle';
    btn.innerHTML = '<i class="bi bi-list"></i>';
    btn.setAttribute('aria-label', 'Abrir menu');
    btn.style.cssText = `
        display: none; background: #07090e; border: 1px solid rgba(0, 111, 255, 0.25);
        border-radius: 8px; padding: 6px 10px; font-size: 20px;
        cursor: pointer; color: #006FFF; line-height: 1; margin-right: 12px;`;
    topbar.prepend(btn);

    const mq = window.matchMedia('(max-width: 768px)');
    const toggle = () => { btn.style.display = mq.matches ? 'block' : 'none'; };
    toggle();
    mq.addEventListener('change', toggle);

    btn.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.toggle('open');
    });

    document.addEventListener('click', e => {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        if (!sidebar.contains(e.target) && !btn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

function initSmoothScroll() {
    document.querySelectorAll('.nav-link-item').forEach(link => {
        link.addEventListener('click', e => {
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('#')) return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function initScrollSpy() {
    const sections = document.querySelectorAll('.section-anchor');
    const links    = document.querySelectorAll('.nav-link-item');
    if (!sections.length || !links.length) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                links.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) link.classList.add('active');
                });
            }
        });
    }, { rootMargin: '-80px 0px -60% 0px', threshold: 0 });

    sections.forEach(s => observer.observe(s));
}
