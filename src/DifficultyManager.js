class DifficultyManager {
    constructor(game) {
        this.game = game;
        this.difficultyLevel = 1;
        this.speedMultiplier = 1;
        this.elapsedTime = 0;
    }

    reset() {
        this.difficultyLevel = 1;
        this.speedMultiplier = 1;
        this.elapsedTime = 0;
    }

    update(deltaTime) {
        this.elapsedTime += deltaTime;

        // Increase difficulty every 10 seconds (easier)
        if (this.elapsedTime > 10000 * this.difficultyLevel) {
            this.difficultyLevel++;
            this.speedMultiplier += 0.05; // Slower speed increase
        }
    }
}
