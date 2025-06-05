const ROWS = 6;
const COLS = 7;

let board = [];
let currentPlayer = 'red'; 
let blockedColumn = -1;   
let gameOver = false;
let timers = { red: 30, yellow: 30 };
let timerInterval = null;

const boardElement = document.getElementById('board');
const messageElement = document.getElementById('message');
const blockSelect = document.getElementById('blockSelect');
const confirmBlock = document.getElementById('confirmBlock');
const redTimerElement = document.getElementById('redTimer');
const yellowTimerElement = document.getElementById('yellowTimer');
const redTimerBar = document.getElementById('redTimerBar');
const yellowTimerBar = document.getElementById('yellowTimerBar');
const leaderboardEl = document.getElementById('leaderboard');
const resetBtn = document.getElementById('resetBtn');

let blockConfirmed = false;

// Add sounds using free URLs
const sounds = {
  drop: new Audio('https://freesound.org/data/previews/256/256113_3263906-lq.mp3'),
  error: new Audio('https://freesound.org/data/previews/415/415209_5121236-lq.mp3'),
  win: new Audio('https://freesound.org/data/previews/331/331912_3248244-lq.mp3'),
  draw: new Audio('https://freesound.org/data/previews/170/170144_2398407-lq.mp3'),
};

// Helper to safely read and initialize leaderboard from localStorage
function getLeaderboard() {
  const stored = localStorage.getItem('discBattleLeaderboard');
  if (!stored) {
    return { red: 0, yellow: 0, draws: 0 };
  }
  try {
    const parsed = JSON.parse(stored);
    return {
      red: typeof parsed.red === 'number' ? parsed.red : 0,
      yellow: typeof parsed.yellow === 'number' ? parsed.yellow : 0,
      draws: typeof parsed.draws === 'number' ? parsed.draws : 0,
    };
  } catch {
    return { red: 0, yellow: 0, draws: 0 };
  }
}

let leaderboard = getLeaderboard();

function initBoard() {
  board = [];
  boardElement.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < COLS; c++) {
      board[r][c] = null;
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener('click', () => handleCellClick(c));
      boardElement.appendChild(cell);
    }
  }
  blockedColumn = -1;
  blockConfirmed = false;
  confirmBlock.disabled = false;
  blockSelect.disabled = false;
  updateBlockOptions();
  messageElement.textContent = `Player ${capitalize(currentPlayer)}: Opponent blocks a column.`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateBlockOptions() {
  blockSelect.innerHTML = '';
  for (let c = 0; c < COLS; c++) {
    if (!isColumnFull(c)) {
      const option = document.createElement('option');
      option.value = c;
      option.textContent = `Column ${c + 1}`;
      blockSelect.appendChild(option);
    }
  }
  const availableColumns = [];
  for (let c = 0; c < COLS; c++) {
    if (!isColumnFull(c)) availableColumns.push(c);
  }
  const blockAllowed = availableColumns.some(col => col !== blockedColumn && !isColumnFull(col));
  if (!blockAllowed) {
    blockSelect.innerHTML = '';
    const option = document.createElement('option');
    option.textContent = 'No block possible';
    option.disabled = true;
    blockSelect.appendChild(option);
    confirmBlock.disabled = true;
  } else {
    confirmBlock.disabled = false;
  }
}

function isColumnFull(col) {
  return board[0][col] !== null;
}

function handleCellClick(col) {
  if (!blockConfirmed) {
    sounds.error.play();
    alert('Wait until the blocked column is confirmed by opponent!');
    return;
  }
  if (gameOver) return;

  if (col === blockedColumn) {
    sounds.error.play();
    alert('This column is blocked for your turn!');
    return;
  }
  if (isColumnFull(col)) {
    sounds.error.play();
    alert('Column is full!');
    return;
  }

  dropDisc(col);
}

function dropDisc(col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === null) {
      board[r][col] = currentPlayer;
      updateBoardUI();
      sounds.drop.play();
      if (checkWin(r, col)) {
        endGame(currentPlayer, `Player ${capitalize(currentPlayer)} wins!`);
        sounds.win.play();
      } else if (isBoardFull()) {
        endGame(null, "It's a draw!");
        sounds.draw.play();
      } else {
        switchPlayer();
      }
      return;
    }
  }
}

function updateBoardUI() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = boardElement.children[r * COLS + c];
      cell.classList.remove('red', 'yellow', 'blocked');
      if (board[r][c]) {
        cell.classList.add(board[r][c]);
      }
      if (c === blockedColumn) {
        cell.classList.add('blocked');
      }
    }
  }
}

function checkWin(row, col) {
  const player = board[row][col];
  const directions = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 1, dc: 1 },
    { dr: 1, dc: -1 }
  ];
  for (let {dr, dc} of directions) {
    let count = 1;
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      count++;
      r += dr;
      c += dc;
    }
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      count++;
      r -= dr;
      c -= dc;
    }
    if (count >= 4) return true;
  }
  return false;
}

function isBoardFull() {
  for (let c = 0; c < COLS; c++) {
    if (!isColumnFull(c)) return false;
  }
  return true;
}

function switchPlayer() {
  currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
  blockedColumn = -1;
  blockConfirmed = false;
  confirmBlock.disabled = false;
  blockSelect.disabled = false;
  timers[currentPlayer] = 30;
  updateTimersUI();
  updateBlockOptions();
  messageElement.textContent = `Player ${capitalize(currentPlayer)}: Opponent blocks a column.`;
  stopTimer();
}

function startTimer() {
  stopTimer();
  timerInterval = setInterval(() => {
    timers[currentPlayer]--;
    if (timers[currentPlayer] <= 0) {
      timers[currentPlayer] = 0;
      updateTimersUI();
      stopTimer();
      const otherPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
      endGame(otherPlayer, `Time's up! Player ${capitalize(otherPlayer)} wins!`);
      sounds.win.play();
      return;
    }
    updateTimersUI();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimersUI() {
  redTimerElement.textContent = timers.red;
  yellowTimerElement.textContent = timers.yellow;

  redTimerBar.style.width = (timers.red / 30) * 100 + '%';
  yellowTimerBar.style.width = (timers.yellow / 30) * 100 + '%';
}

function confirmBlockedColumn() {
  if (blockSelect.disabled) return;
  const selected = parseInt(blockSelect.value);
  if (isNaN(selected)) {
    alert('Please select a valid column to block.');
    sounds.error.play();
    return;
  }
  if (selected === blockedColumn) {
    alert('Column already blocked.');
    sounds.error.play();
    return;
  }
  blockedColumn = selected;
  blockConfirmed = true;
  confirmBlock.disabled = true;
  blockSelect.disabled = true;

  updateBoardUI();

  // Start timer on confirmed block
  startTimer();

  messageElement.textContent = `Player ${capitalize(currentPlayer)}: Make your move!`;
}

function endGame(winner, msg) {
  gameOver = true;
  stopTimer();
  messageElement.textContent = msg;

  if (winner === 'red') leaderboard.red++;
  else if (winner === 'yellow') leaderboard.yellow++;
  else leaderboard.draws++;

  localStorage.setItem('discBattleLeaderboard', JSON.stringify(leaderboard));
  updateLeaderboardUI();
}

function updateLeaderboardUI() {
  leaderboardEl.textContent = `Leaderboard — Red: ${leaderboard.red} | Yellow: ${leaderboard.yellow} | Draws: ${leaderboard.draws}`;
}

resetBtn.addEventListener('click', () => {
  gameOver = false;
  currentPlayer = 'red';
  timers.red = 30;
  timers.yellow = 30;
  updateLeaderboardUI();
  initBoard();
  updateTimersUI();
  messageElement.textContent = `Player ${capitalize(currentPlayer)}: Opponent blocks a column.`;
  stopTimer();
});

confirmBlock.addEventListener('click', confirmBlockedColumn);

// Initialize on page load
initBoard();
updateLeaderboardUI();
updateTimersUI();
