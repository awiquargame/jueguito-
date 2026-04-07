class ScoreManager {
    constructor(game) {
        this.game = game;
        this.score = 0;
        this.highScore = 0; // Reset on game load (Session High Score)
        this.coins = 0; // DISABLED LOCAL STORAGE FOR COINS (User Request)

        // Cache DOM elements
        this.scoreEl = document.getElementById('score-val');
        this.labelEl = document.getElementById('hud-score-label');
        this.lastRenderedScore = -1;
    }

    reset() {
        this.score = 0;
        this.lastRenderedScore = -1;
        // We do NOT reset highScore here, as it tracks the session best
    }

    update(deltaTime) {
        if (this.game.currentState === this.game.STATES.COLOSSEUM) {
            this.updateHUD();
            return;
        }

        if (this.game.bossActive) {
            this.updateHUD(); // Still update HUD to ensure label is correct if state changed
            return;
        }

        // Score based on survival time (e.g., 10 points per second)
        this.score += (deltaTime / 100);
        this.updateHUD();
    }

    updateHUD() {
        if (this.game.hud && this.scoreEl) {
            if (this.game.currentState === this.game.STATES.COLOSSEUM) {
                // Show bosses defeated
                const labelText = this.game.localizationManager.getString('hud.bosses');
                if (this.labelEl) this.labelEl.innerText = labelText;

                const currentBosses = this.game.bossesDefeated;
                if (this.scoreEl.innerText !== currentBosses.toString()) {
                    this.scoreEl.innerText = currentBosses;
                }
            } else {
                // Normal Mode
                const labelText = this.game.localizationManager.getString('hud.score');
                if (this.labelEl) this.labelEl.innerText = labelText;

                const currentScore = Math.floor(this.score);
                if (currentScore !== this.lastRenderedScore) {
                    this.scoreEl.innerText = currentScore;
                    this.lastRenderedScore = currentScore;
                }
            }
        }
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('neon_survive_highscore', this.highScore);
        }
    }

    addCoins(amount) {
        this.coins += amount;
        // localStorage.setItem('neon_survive_coins', this.coins); // DISABLED
        if (this.game.accountManager) this.game.accountManager.saveProgress();
    }

    spendCoins(amount) {
        if (this.coins >= amount) {
            this.coins -= amount;
            // localStorage.setItem('neon_survive_coins', this.coins); // DISABLED
            if (this.game.accountManager) this.game.accountManager.saveProgress();
            return true;
        }
        return false;
    }
}
