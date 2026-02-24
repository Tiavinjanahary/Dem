const LEVELS = {
    easy: { size: 10, mines: 15 },
    medium: { size: 16, mines: 40 },
    hard: { size: 22, mines: 99 }
};

let config = LEVELS.easy;
let board = [];
let mines = new Set();
let gameOver = false;
let firstClick = true;
let timerInterval;
let secondsElapsed = 0;

const boardEl = document.getElementById('board');
const modeSwitch = document.getElementById('mode-switch');
const timerEl = document.getElementById('timer');

function formatTime(s) {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function init() {
    config = LEVELS[document.getElementById('level-select').value];
    boardEl.style.gridTemplateColumns = `repeat(${config.size}, 32px)`;
    boardEl.innerHTML = '';
    board = [];
    mines.clear();
    gameOver = false;
    firstClick = true;
    secondsElapsed = 0;
    clearInterval(timerInterval);
    
    timerEl.textContent = "00:00";
    document.getElementById('mine-count').textContent = config.mines;

    for (let r = 0; r < config.size; r++) {
        board[r] = [];
        for (let c = 0; c < config.size; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.addEventListener('click', () => handleCellClick(r, c));
            cell.addEventListener('contextmenu', (e) => { 
                e.preventDefault(); 
                toggleFlag(r, c); 
            });
            boardEl.appendChild(cell);
            board[r][c] = cell;
        }
    }
}

function handleCellClick(r, c) {
    if (gameOver) return;
    const cell = board[r][c];

    // Mode Drapeau activé via le switch
    if (modeSwitch.checked && !cell.classList.contains('revealed')) {
        toggleFlag(r, c);
        return;
    }

    if (cell.classList.contains('flag')) return;

    // Premier clic : Génération "No-Guess" de départ
    if (firstClick) {
        firstClick = false;
        generateMines(r, c);
        startTimer();
    }

    // Déjà révélé : Chording (Double clic fonctionnel sur chiffre)
    if (cell.classList.contains('revealed')) {
        attemptChording(r, c);
        return;
    }

    // Explosion
    if (mines.has(`${r}-${c}`)) {
        endGame(false);
        return;
    }

    reveal(r, c);
    checkWin();
}

function toggleFlag(r, c) {
    const cell = board[r][c];
    if (cell.classList.contains('revealed')) return;
    
    cell.classList.toggle('flag');
    cell.innerText = cell.classList.contains('flag') ? '🚩' : '';
    
    const countEl = document.getElementById('mine-count');
    let current = parseInt(countEl.textContent);
    countEl.textContent = cell.classList.contains('flag') ? current - 1 : current + 1;
}

function reveal(r, c) {
    if (r < 0 || r >= config.size || c < 0 || c >= config.size) return;
    const cell = board[r][c];
    if (cell.classList.contains('revealed') || cell.classList.contains('flag')) return;

    cell.classList.add('revealed');
    let mineCount = 0;

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (mines.has(`${r + i}-${c + j}`)) mineCount++;
        }
    }

    if (mineCount > 0) {
        cell.innerText = mineCount;
        cell.classList.add(`n${mineCount}`);
    } else {
        // Propagation si zéro
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) reveal(r + i, c + j);
        }
    }
}

function attemptChording(r, c) {
    const value = parseInt(board[r][c].innerText);
    if (!value) return;

    let flags = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (board[r+i]?.[c+j]?.classList.contains('flag')) flags++;
        }
    }

    if (flags === value) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const nr = r+i, nc = c+j;
                if (board[nr]?.[nc] && !board[nr][nc].classList.contains('revealed')) {
                    if (mines.has(`${nr}-${nc}`) && !board[nr][nc].classList.contains('flag')) {
                        endGame(false);
                        return;
                    }
                    reveal(nr, nc);
                }
            }
        }
        checkWin();
    }
}

function generateMines(exR, exC) {
    while (mines.size < config.mines) {
        let r = Math.floor(Math.random() * config.size);
        let c = Math.floor(Math.random() * config.size);
        // On évite le clic de départ et ses 8 voisins directs
        if (Math.abs(r - exR) > 1 || Math.abs(c - exC) > 1) {
            mines.add(`${r}-${c}`);
        }
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        secondsElapsed++;
        timerEl.textContent = formatTime(secondsElapsed);
    }, 1000);
}

function endGame(win) {
    gameOver = true;
    clearInterval(timerInterval);
    mines.forEach(m => {
        const [r, c] = m.split('-');
        board[r][c].classList.add('mine');
        board[r][c].innerText = '💣';
    });
    alert(win ? "Félicitations ! 🎉 Temps : " + formatTime(secondsElapsed) : "BOOM ! Perdu. 💀");
}

function checkWin() {
    const revealed = document.querySelectorAll('.cell.revealed').length;
    if (revealed === (config.size * config.size) - config.mines) {
        endGame(true);
    }
}

// Interactivité UI
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

modeSwitch.addEventListener('change', () => {
    document.getElementById('mode-text').innerText = modeSwitch.checked ? 
        "Mode : Drapeau (Clic gauche)" : "Mode : Creuser (Clic gauche)";
});

document.getElementById('level-select').addEventListener('change', init);
document.getElementById('reset-btn').addEventListener('click', init);

window.onload = init;