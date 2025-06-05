document.addEventListener("DOMContentLoaded", () => {
  const needle = document.getElementById("needle");
  const hitButton = document.getElementById("hitButton");
  const p1ScoreEl = document.getElementById("player1Score");
  const p2ScoreEl = document.getElementById("player2Score");
  const winnerMessage = document.getElementById("winnerMessage");

  let angle = -90;
  let increasing = true;
  let animationId;
  let isStopped = false;
  let currentPlayer = 1;
  let scores = { 1: null, 2: null };
  let gameOver = false;

  const hammer = document.getElementById("hammer");

  function handleHit() {
    if (isStopped || gameOver) return;

    isStopped = true;
    cancelAnimationFrame(animationId);

    animateHammer(); // 🔨 animate the hammer hit

    const score = calculateScore(angle);
    scores[currentPlayer] = score;
    updateScores();

    if (currentPlayer === 1) {
      currentPlayer = 2;
      hitButton.textContent = "Player 2: HIT (Space)";
      setTimeout(() => {
        resetNeedle();
        startNeedle();
      }, 800);
    } else {
      checkWinner();
    }
  }

  function animateNeedle() {
    if (isStopped || gameOver) return;

    if (increasing) {
      angle += getSpeed(angle);
      if (angle >= 90) {
        angle = 90;
        increasing = false;
      }
    } else {
      angle -= getSpeed(angle);
      if (angle <= -90) {
        angle = -90;
        increasing = true;
      }
    }

    needle.style.transform = `rotate(${angle}deg)`;
    animationId = requestAnimationFrame(animateNeedle);
  }

  function getSpeed(angle) {
    const maxSpeed = 3;
    const minSpeed = 0.5;
    const normalized = Math.abs(angle) / 90;
    return maxSpeed - normalized * (maxSpeed - minSpeed);
  }

  function calculateScore(angle) {
    const deviation = Math.abs(angle);
    return Math.max(0, Math.round(100 - deviation * 1.1));
  }

  function updateUI() {
    p1ScoreEl.textContent = `Player 1: ${scores[1] !== null ? scores[1] : "00"}`;
    p2ScoreEl.textContent = `Player 2: ${scores[2] !== null ? scores[2] : "00"}`;
  }

  function resetGame() {
    scores = { 1: null, 2: null };
    currentPlayer = 1;
    angle = -90;
    increasing = true;
    isStopped = false;
    gameOver = false;
    updateUI();
    winnerMessage.textContent = "";
    hitButton.textContent = "Player 1: HIT (Space)";
    hitButton.disabled = false;
    animateNeedle();
  }

  function declareWinner() {
    const [score1, score2] = [scores[1], scores[2]];
    if (score1 > score2) {
      winnerMessage.textContent = "🏆 Player 1 Wins!";
    } else if (score2 > score1) {
      winnerMessage.textContent = "🏆 Player 2 Wins!";
    } else {
      winnerMessage.textContent = "🤝 It's a Tie!";
    }

    hitButton.textContent = "Game Over (Press Enter to Restart)";
    hitButton.disabled = true;
    gameOver = true;
  }

  function handleHit() {
  if (!isStopped && !gameOver) {
    isStopped = true;
    cancelAnimationFrame(animationId);

    animateHammer();

    const score = calculateScore(angle);
    scores[currentPlayer] = score;
    updateUI();

    if (currentPlayer === 1) {
      currentPlayer = 2;
      hitButton.textContent = "Player 2: HIT (Space)";
      setTimeout(() => {
        isStopped = false;
        angle = -90;
        increasing = true;
        animateNeedle();
      }, 800);
    } else {
      declareWinner();
    }
  }
}


  function animateHammer() {
    hammer.classList.add("hit");
    setTimeout(() => {
      hammer.classList.remove("hit");
    }, 200);
  }

  hitButton.addEventListener("click", handleHit);

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      handleHit(); // Spacebar to stop needle
    } else if (e.code === "Enter" && gameOver) {
      resetGame(); // Enter to restart
    }
  });

  animateNeedle(); // Start game on load
});
