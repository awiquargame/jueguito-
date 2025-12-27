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

        // Increase difficulty every 5 seconds
        if (this.elapsedTime > 5000 * this.difficultyLevel) {
            this.difficultyLevel++;
            this.speedMultiplier += 0.1;
            // console.log(`Difficulty Increased: ${this.difficultyLevel}, SpeedMult: ${this.speedMultiplier}`);
        }
    }
}
