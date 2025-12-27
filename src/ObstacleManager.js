class ObstacleManager {
    constructor(game) {
        this.game = game;
        this.obstacles = [];
        this.projectiles = []; // Store active projectiles
        this.spawnTimer = 0;
        this.heavyTimer = 0;
        this.chargerTimer = 0;
        this.trajectoryTimer = 0;
        this.explodingTimer = 0;
        this.thresholds = { heavy: false, charger: false, trajectory: false, exploding: false };
    }

    reset() {
        this.obstacles = [];
        this.projectiles = [];
        this.spawnTimer = 0;
        this.heavyTimer = 0;
        this.chargerTimer = 0;
        this.trajectoryTimer = 0;
        this.explodingTimer = 0;
        this.thresholds = { heavy: false, charger: false, trajectory: false, exploding: false };
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }

    update(deltaTime) {
        this.spawnTimer += deltaTime;
        this.heavyTimer += deltaTime;
        this.chargerTimer += deltaTime;
        this.trajectoryTimer += deltaTime;
        this.explodingTimer += deltaTime;

        // 1. Regular Obstacles (Normal Spawn Rate)
        // Adjust spawn rate slightly based on difficulty
        const interval = Math.max(500, 2000 - (this.game.difficultyManager ? this.game.difficultyManager.difficultyLevel * 100 : 0));

        if (this.spawnTimer > interval) {
            this.obstacles.push(new Obstacle(this.game));
            this.spawnTimer = 0;
        }

        // 2. Heavy Obstacle (Red) - Every 10s if Score > 200
        if (this.game.scoreManager.score > 200) {
            if (this.heavyTimer > 10000) {
                this.obstacles.push(new HeavyObstacle(this.game));
                this.heavyTimer = 0;
            }
        }

        // 3. Charger Obstacle (White) - Every 20s if Score > 300
        if (this.game.scoreManager.score >= 300) {
            if (!this.thresholds.charger) {
                this.obstacles.push(new ChargerObstacle(this.game));
                this.thresholds.charger = true;
                this.chargerTimer = 0;
            }
            if (this.chargerTimer > 20000) {
                this.obstacles.push(new ChargerObstacle(this.game));
                this.chargerTimer = 0;
            }
        }

        // 4. Trajectory Obstacle (Orange) - Every 15s if Score > 150
        if (this.game.scoreManager.score >= 150) {
            if (!this.thresholds.trajectory) {
                this.obstacles.push(new TrajectoryObstacle(this.game));
                this.thresholds.trajectory = true;
                this.trajectoryTimer = 0;
            }
            if (this.trajectoryTimer > 15000) {
                this.obstacles.push(new TrajectoryObstacle(this.game));
                this.trajectoryTimer = 0;
            }
        }

        // 5. Exploding Enemy (Dark Green) - Every 10s if Score > 400
        if (this.game.scoreManager.score >= 400) {
            if (!this.thresholds.exploding) {
                this.obstacles.push(new ExplodingEnemy(this.game));
                this.thresholds.exploding = true;
                this.explodingTimer = 0;
            }
            if (this.explodingTimer > 10000) {
                this.obstacles.push(new ExplodingEnemy(this.game));
                this.explodingTimer = 0;
            }
        }

        // Update obstacles
        this.obstacles.forEach(obstacle => obstacle.update(deltaTime));
        // Update projectiles
        this.projectiles.forEach(p => p.update(deltaTime));

        // Cleanup
        this.obstacles = this.obstacles.filter(obstacle => !obstacle.markedForDeletion);
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
    }

    draw(ctx) {
        this.obstacles.forEach(obstacle => obstacle.draw(ctx));
        this.projectiles.forEach(p => p.draw(ctx));
    }

    checkCollision(player) {
        // Invulnerability Check (Dash)
        if (player.isInvulnerable) return false;

        // Check normal obstacles (ignore harmless ones)
        const hitObstacle = this.obstacles.some(obstacle => {
            if (obstacle.isHarmless) return false;
            return checkCollision(player, obstacle);
        });

        if (hitObstacle) return true;

        // Check projectiles (always harmful)
        const hitProjectile = this.projectiles.some(p => checkCollision(player, p));

        return hitProjectile;
    }
}
