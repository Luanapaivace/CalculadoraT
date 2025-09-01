const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
const botoesLetras = document.getElementById("botoes-letras");
letras.forEach(l => {
    const btn = document.createElement("button");
    btn.className = "letra";
    btn.textContent = l;
    btn.onclick = () => inserir(l);
    botoesLetras.appendChild(btn);
});

const operadores = {
    "¬": (p) => !p,
    "∧": (p, q) => p && q,
    "∨": (p, q) => p || q,
    "⊕": (p, q) => p !== q,
    "→": (p, q) => !p || q,
    "↔": (p, q) => p === q
};

function inserir(valor) {
    document.getElementById("expressao").value += valor;
}
function apagar() {
    const display = document.getElementById("expressao");
    display.value = display.value.slice(0, -1);
}
function limpar() {
    document.getElementById("expressao").value = "";
    document.getElementById("resultado").innerHTML = "";
}

function calcular() {
    const formula = document.getElementById("expressao").value.trim();
    const resultadoDiv = document.getElementById("resultado");
    try {
        let variaveis = [...new Set(formula.replace(/[^A-Z]/g, '').split(''))];
        if (variaveis.length === 0) throw "Fórmula inválida.";
        variaveis.sort();
        const combinacoes = gerarCombinacoes(variaveis.length);
        const tabela = avaliarTabela(formula, variaveis, combinacoes);
        let htmlTabela = renderizarTabela(variaveis, tabela);
        const classificacao = classificarTabela(tabela);
        htmlTabela += `<p><strong>Classificação:</strong> ${classificacao}</p>`;
        resultadoDiv.innerHTML = htmlTabela;
    } catch (erro) {
        resultadoDiv.innerHTML = `<p style="color:red;">Erro: ${erro}</p>`;
    }
}

function gerarCombinacoes(n) {
    const linhas = [];
    for (let i = 0; i < (1 << n); i++) {
        const linha = [];
        for (let j = 0; j < n; j++) {
            linha.push(Boolean((1 << (n - j - 1)) & i));
        }
        linhas.push(linha);
    }
    linhas.forEach(linha => linha.forEach((v, i) => linha[i] = !v));
    return linhas;
}

function avaliarTabela(formula, variaveis, combinacoes) {
    return combinacoes.map(linha => {
        const contexto = Object.fromEntries(variaveis.map((v, i) => [v, linha[i]]));
        return [linha, avaliarExpressao(formula, contexto)];
    });
}

function avaliarExpressao(expr, contexto) {
    let interpretada = expr.replace(/[A-Z]/g, m => contexto[m] ? 'true' : 'false');
    const pilhaValores = [];
    const pilhaOperadores = [];
    const prioridade = { '¬': 5, '∧': 4, '∨': 3, '⊕': 2, '→': 1, '↔': 0 };

    const aplicarOperador = () => {
        const op = pilhaOperadores.pop();
        if (op === '¬') {
            const p = pilhaValores.pop();
            pilhaValores.push(operadores[op](p));
        } else {
            const q = pilhaValores.pop();
            const p = pilhaValores.pop();
            pilhaValores.push(operadores[op](p, q));
        }
    };

    for (let i = 0; i < interpretada.length; i++) {
        const char = interpretada[i];
        if (char === 't' || char === 'f') {
            pilhaValores.push(char === 't');
            i += char === 't' ? 3 : 4;
        } else if (char === '(') pilhaOperadores.push(char);
        else if (char === ')') {
            while (pilhaOperadores.length && pilhaOperadores[pilhaOperadores.length - 1] !== '(') aplicarOperador();
            pilhaOperadores.pop();
        } else if (char in operadores) {
            while (pilhaOperadores.length && prioridade[char] <= prioridade[pilhaOperadores[pilhaOperadores.length - 1]]) aplicarOperador();
            pilhaOperadores.push(char);
        }
    }
    while (pilhaOperadores.length) aplicarOperador();
    return pilhaValores.pop();
}

function renderizarTabela(variaveis, tabela) {
    let html = '<table class="tabela"><tr>' + variaveis.map(v => `<th>${v}</th>`).join('') + '<th>Resultado</th></tr>';
    tabela.forEach(([linha, resultado]) => {
        html += '<tr>' + linha.map(v => `<td>${v ? 'V' : 'F'}</td>`).join('') + `<td>${resultado ? 'V' : 'F'}</td></tr>`;
    });
    html += '</table>';
    return html;
}

function classificarTabela(tabela) {
    const resultados = tabela.map(([, res]) => res);
    if (resultados.every(r => r)) return "Tautologia";
    if (resultados.every(r => !r)) return "Contradição";
    return "Contingência";
}
