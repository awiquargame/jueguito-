class PowerUpManager {
    constructor(game) {
        this.game = game;
        this.powerUps = [];
        this.spawnTimer = 0;
        this.scorePowerUpTimer = 0;
        this.spawnInterval = 23000; // 23 seconds exact (SlowMo)

        // Shield PowerUp Props
        this.shieldPowerUpTimer = 0;
        this.shieldInterval = 20000; // 20 seconds
        this.hasShieldSpawnedOnce = false;



        // Speed PowerUp Props
        this.speedPowerUpTimer = 0;
        this.speedInterval = 14000; // 14 seconds
        this.speedPowerUpTimer = 0;
        this.speedInterval = 14000; // 14 seconds
        this.hasSpeedSpawnedOnce = false;

        this.spawnedHealthScores = [];

    }

    reset() {
        this.powerUps = [];
        this.spawnTimer = 0;
        this.scorePowerUpTimer = 0;
        this.shieldPowerUpTimer = 0;
        this.hasShieldSpawnedOnce = false;
        this.speedPowerUpTimer = 0;
        this.hasSpeedSpawnedOnce = false;
        this.spawnedHealthScores = [];

    }

    update(deltaTime) {
        // BOSS MODE: Stop PowerUp Spawns
        if (!this.game.bossActive) {
            // Standard PowerUp (SlowMo)
            this.spawnTimer += deltaTime;
            if (this.spawnTimer > this.spawnInterval) {
                this.powerUps.push(new PowerUp(this.game));
                this.spawnTimer = 0;
            }

            // Score PowerUp (Yellow) - Every 9s if score > 50
            if (this.game.scoreManager.score > 50) {
                this.scorePowerUpTimer += deltaTime;
                if (this.scorePowerUpTimer > 9000) {
                    this.powerUps.push(new ScorePowerUp(this.game));
                    this.scorePowerUpTimer = 0;
                }
            }

            // Shield PowerUp (Light Cyan) - Starting at 150 pts, every 20s
            if (this.game.scoreManager.score >= 150) {

                // Immediate spawn for the first time
                if (!this.hasShieldSpawnedOnce) {
                    this.powerUps.push(new ShieldPowerUp(this.game));
                    this.hasShieldSpawnedOnce = true;
                    this.shieldPowerUpTimer = 0; // Reset timer for next one
                }

                this.shieldPowerUpTimer += deltaTime;

                if (this.shieldPowerUpTimer > this.shieldInterval) {
                    this.powerUps.push(new ShieldPowerUp(this.game));
                    this.shieldPowerUpTimer = 0;
                }
                if (this.shieldPowerUpTimer > this.shieldInterval) {
                    this.powerUps.push(new ShieldPowerUp(this.game));
                    this.shieldPowerUpTimer = 0;
                }
            }

            // Speed PowerUp (Light Blue) - Starting at 250 pts, every 14s
            if (this.game.scoreManager.score >= 250) {
                if (!this.hasSpeedSpawnedOnce) {
                    this.powerUps.push(new SpeedPowerUp(this.game));
                    this.hasSpeedSpawnedOnce = true;
                    this.speedPowerUpTimer = 0;
                }

                this.speedPowerUpTimer += deltaTime;
                if (this.speedPowerUpTimer > this.speedInterval) {
                    this.powerUps.push(new SpeedPowerUp(this.game));
                    this.speedPowerUpTimer = 0;
                }
            }

            // Health PowerUp (Heart)
            // Spawns ONLY at specific score thresholds: 500, 1010, 1200, 1300
            const score = this.game.scoreManager.score;
            const healthThresholds = [500, 1010, 1200, 1300];

            healthThresholds.forEach(threshold => {
                if (score >= threshold && !this.spawnedHealthScores.includes(threshold)) {
                    this.powerUps.push(new HealthPowerUp(this.game));
                    this.spawnedHealthScores.push(threshold);
                }
            });
        }

        // Update movement
        this.powerUps.forEach(p => p.update(deltaTime));

        // Cleanup
        this.powerUps = this.powerUps.filter(p => !p.markedForDeletion);
    }

    draw(ctx) {
        this.powerUps.forEach(p => p.draw(ctx));
    }

    checkCollision(player) {
        return this.powerUps.find(p => checkCollision(player, p));
    }

    remove(powerUp) {
        this.powerUps = this.powerUps.filter(p => p !== powerUp);
    }
}
