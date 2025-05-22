document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const statusDisplay = document.getElementById('status');
    const countdownDisplay = document.getElementById('countdown');
    const cells = document.querySelectorAll('.cell');
    const resetButton = document.getElementById('reset-btn');
    const resetScoreButton = document.getElementById('reset-score-btn');
    const starsContainer = document.getElementById('stars-container');
    const scoreX = document.getElementById('score-x');
    const scoreO = document.getElementById('score-o');
    const scoreDraw = document.getElementById('score-draw');
    
    // Create stars in the background
    createStars();
    
    // Game state variables
    let gameActive = true;
    let currentPlayer = 'X';
    let gameState = ['', '', '', '', '', '', '', '', ''];
    let resetTimer = null;
    
    // Score tracking
    let scores = {
        X: 0,
        O: 0,
        draws: 0
    };
    
    // Load scores from local storage if available
    loadScores();
    
    const winningConditions = [
        [0, 1, 2], // top row
        [3, 4, 5], // middle row
        [6, 7, 8], // bottom row
        [0, 3, 6], // left column
        [1, 4, 7], // middle column
        [2, 5, 8], // right column
        [0, 4, 8], // diagonal top-left to bottom-right
        [2, 4, 6]  // diagonal top-right to bottom-left
    ];
    
    const winningMessage = () => `Player ${currentPlayer} has won!`;
    const drawMessage = () => `Game ended in a draw!`;
    const currentPlayerTurn = () => `Player ${currentPlayer}'s turn`;
    
    statusDisplay.textContent = currentPlayerTurn();
    
    // Add neon flicker effect to the title
    const title = document.querySelector('h1');
    setInterval(() => {
        const intensity = 0.5 + Math.random() * 0.5;
        title.style.textShadow = `0 0 10px rgba(0, 255, 255, ${intensity})`;
    }, 150); // Slightly reduced frequency for better performance
    
    function createStars() {
        // Clear any existing stars
        starsContainer.innerHTML = '';
        
        // Number of stars based on screen size
        const screenArea = window.innerWidth * window.innerHeight;
        const starCount = Math.floor(screenArea / 3000); // Adjust for density
        
        for (let i = 0; i < starCount; i++) {
            createStar();
        }
    }
    
    function createStar() {
        const star = document.createElement('div');
        star.classList.add('star');
        
        // Random position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        
        // Random size (0.5px - 3px)
        const size = 0.5 + Math.random() * 2.5;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // Random opacity
        star.style.opacity = 0.3 + Math.random() * 0.7;
        
        // Set animation properties
        const twinkleDuration = 3 + Math.random() * 5;
        star.style.setProperty('--twinkle-duration', `${twinkleDuration}s`);
        
        // Add movement animation
        if (Math.random() > 0.3) { // Only animate some stars for performance
            const moveX = -15 + Math.random() * 30;
            const moveY = -15 + Math.random() * 30;
            star.style.setProperty('--move-x', `${moveX}px`);
            star.style.setProperty('--move-y', `${moveY}px`);
            
            const moveDuration = 30 + Math.random() * 70;
            star.style.animation = `
                twinkle ${twinkleDuration}s ease-in-out infinite,
                move ${moveDuration}s linear infinite alternate
            `;
        }
        
        starsContainer.appendChild(star);
    }
    
    // Handle browser resize
    window.addEventListener('resize', debounce(() => {
        createStars();
    }, 250));
    
    // Debounce function to optimize resize handling
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function handleCellClick(event) {
        const clickedCell = event.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));
        
        if (gameState[clickedCellIndex] !== '' || !gameActive) {
            return;
        }
        
        handleCellPlayed(clickedCell, clickedCellIndex);
        handleResultValidation();
    }
    
    function handleCellPlayed(clickedCell, clickedCellIndex) {
        gameState[clickedCellIndex] = currentPlayer;
        clickedCell.textContent = currentPlayer;
        clickedCell.classList.add(currentPlayer.toLowerCase());
        
        // Add click effect with requestAnimationFrame for smoother animation
        clickedCell.style.transform = 'scale(1.1) translateZ(10px)';
        
        // Using requestAnimationFrame for smoother transition
        requestAnimationFrame(() => {
            setTimeout(() => {
                requestAnimationFrame(() => {
                    clickedCell.style.transform = '';
                });
            }, 200);
        });
    }
    
    function handleResultValidation() {
        let roundWon = false;
        let winningLine = null;
        
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            
            if (
                gameState[a] === '' ||
                gameState[b] === '' ||
                gameState[c] === ''
            ) {
                continue;
            }
            
            if (
                gameState[a] === gameState[b] &&
                gameState[b] === gameState[c]
            ) {
                roundWon = true;
                winningLine = [a, b, c];
                break;
            }
        }
        
        if (roundWon) {
            statusDisplay.textContent = winningMessage();
            gameActive = false;
            
            // Update score
            scores[currentPlayer]++;
            updateScoreDisplay();
            saveScores();
            
            // Highlight winning cells with enhanced neon effect
            winningLine.forEach(index => {
                cells[index].classList.add('winning');
            });
            
            // Add victory glow to container with requestAnimationFrame
            requestAnimationFrame(() => {
                document.querySelector('.game-section').style.boxShadow = 
                    currentPlayer === 'X' 
                        ? '0 0 40px rgba(255, 0, 255, 0.6)' 
                        : '0 0 40px rgba(0, 255, 0, 0.6)';
            });
            
            // Add extra stars for celebration
            for (let i = 0; i < 20; i++) {
                setTimeout(() => createStar(), i * 100);
            }
            
            // Start auto-reset timer
            startResetCountdown(5);
            
            return;
        }
        
        // Check for draw
        if (!gameState.includes('')) {
            statusDisplay.textContent = drawMessage();
            gameActive = false;
            
            // Update draw score
            scores.draws++;
            updateScoreDisplay();
            saveScores();
            
            // Start auto-reset timer
            startResetCountdown(5);
            
            return;
        }
        
        // Change player turn
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        statusDisplay.textContent = currentPlayerTurn();
        
        // Update status color based on current player
        requestAnimationFrame(() => {
            statusDisplay.style.color = currentPlayer === 'X' ? '#ff00ff' : '#00ff00';
            statusDisplay.style.textShadow = 
                currentPlayer === 'X' 
                    ? '0 0 8px rgba(255, 0, 255, 0.7)' 
                    : '0 0 8px rgba(0, 255, 0, 0.7)';
        });
    }
    
    function startResetCountdown(seconds) {
        // Clear any existing timers
        if (resetTimer) {
            clearInterval(resetTimer);
        }
        
        let timeLeft = seconds;
        updateCountdown(timeLeft);
        
        resetTimer = setInterval(() => {
            timeLeft--;
            updateCountdown(timeLeft);
            
            if (timeLeft <= 0) {
                clearInterval(resetTimer);
                resetTimer = null;
                handleReset();
            }
        }, 1000);
    }
    
    function updateCountdown(seconds) {
        countdownDisplay.textContent = seconds > 0 
            ? `Game resets in ${seconds}s` 
            : '';
        
        // Add pulse effect to countdown
        countdownDisplay.style.transform = 'scale(1.2)';
        setTimeout(() => {
            countdownDisplay.style.transform = 'scale(1)';
        }, 200);
    }
    
    function updateScoreDisplay() {
        // Remove previous highlight classes
        scoreX.classList.remove('highlight');
        scoreO.classList.remove('highlight');
        scoreDraw.classList.remove('highlight');
        
        // Update score text
        scoreX.textContent = scores.X;
        scoreO.textContent = scores.O;
        scoreDraw.textContent = scores.draws;
        
        // Add highlight class to the updated score
        if (currentPlayer === 'X' && gameActive === false && !gameState.includes('')) {
            scoreDraw.classList.add('highlight');
        } else if (currentPlayer === 'X' && gameActive === false) {
            scoreX.classList.add('highlight');
        } else if (currentPlayer === 'O' && gameActive === false) {
            scoreO.classList.add('highlight');
        }
    }
    
    function saveScores() {
        localStorage.setItem('tictactoeScores', JSON.stringify(scores));
    }
    
    function loadScores() {
        const savedScores = localStorage.getItem('tictactoeScores');
        if (savedScores) {
            scores = JSON.parse(savedScores);
            updateScoreDisplay();
        }
    }
    
    function handleReset() {
        // Clear any active reset timer
        if (resetTimer) {
            clearInterval(resetTimer);
            resetTimer = null;
        }
        
        // Clear countdown display
        countdownDisplay.textContent = '';
        
        gameActive = true;
        currentPlayer = 'X';
        gameState = ['', '', '', '', '', '', '', '', ''];
        
        requestAnimationFrame(() => {
            statusDisplay.textContent = currentPlayerTurn();
            statusDisplay.style.color = '#0ff';
            statusDisplay.style.textShadow = '0 0 8px rgba(0, 255, 255, 0.7)';
            
            // Reset container glow
            document.querySelector('.game-section').style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.25)';
            
            cells.forEach(cell => {
                cell.textContent = '';
                cell.classList.remove('x');
                cell.classList.remove('o');
                cell.classList.remove('winning');
            });
        });
        
        // Add reset effect with requestAnimationFrame
        resetButton.style.transform = 'scale(1.1)';
        
        requestAnimationFrame(() => {
            setTimeout(() => {
                requestAnimationFrame(() => {
                    resetButton.style.transform = '';
                });
            }, 200);
        });
        
        // Refresh stars
        createStars();
    }
    
    function handleResetScore() {
        // Reset scores
        scores = {
            X: 0,
            O: 0,
            draws: 0
        };
        
        // Update display
        updateScoreDisplay();
        
        // Save to local storage
        saveScores();
        
        // Add button animation
        resetScoreButton.style.transform = 'scale(1.1)';
        setTimeout(() => {
            resetScoreButton.style.transform = '';
        }, 200);
        
        // Create celebration stars
        for (let i = 0; i < 10; i++) {
            setTimeout(() => createStar(), i * 50);
        }
    }
    
    // Event listeners
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    resetButton.addEventListener('click', handleReset);
    resetScoreButton.addEventListener('click', handleResetScore);
}); 