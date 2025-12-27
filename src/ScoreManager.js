class ScoreManager {
    constructor(game) {
        this.game = game;
        this.score = 0;
        this.highScore = 0; // Reset on game load (Session High Score)
    }

    reset() {
        this.score = 0;
        // We do NOT reset highScore here, as it tracks the session best
    }

    update(deltaTime) {
        // Score based on survival time (e.g., 10 points per second)
        this.score += (deltaTime / 100);
        this.updateHUD();
    }

    updateHUD() {
        if (this.game.hud) {
            const scoreEl = document.getElementById('score-val');
            if (scoreEl) {
                scoreEl.innerText = Math.floor(this.score);
            }
        }
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('neon_survive_highscore', this.highScore);
        }
    }
}
