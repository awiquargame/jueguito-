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
        this.diamondTimer = 0;
        this.thresholds = { heavy: false, charger: false, trajectory: false, exploding: false, diamond: false };
    }

    reset() {
        this.obstacles = [];
        this.projectiles = [];
        this.spawnTimer = 0;
        this.heavyTimer = 0;
        this.chargerTimer = 0;
        this.trajectoryTimer = 0;
        this.explodingTimer = 0;
        this.diamondTimer = 0;
        this.thresholds = { heavy: false, charger: false, trajectory: false, exploding: false, diamond: false };
    }

    resetSpawners() {
        // Called after boss fight to stagger enemies back in
        this.spawnTimer = 0;
        this.heavyTimer = 0;
        this.chargerTimer = 0;
        this.trajectoryTimer = 0;
        this.explodingTimer = 0;
        this.diamondTimer = 0;
        // We DO NOT reset thresholds, so they don't do the "first time" logic again if already passed,
        // or maybe we SHOULD to ensure they obey standard intervals?
        // Actually thresholds just gate the *first* spawn or allow checking score.
        // Determining logic:
        // If score > 300, logic spawns if timer > 20000.
        // So resetting timers to 0 is sufficient to force the full wait period.
    }

    triggerShieldExplosion(target) {
        target.markedForDeletion = true; // Remove the original object immediately

        // Create a visual explosion effect
        // If it's an enemy/obstacle, use its color and dimensions
        // If it's a projectile, use its color (usually yellow or red)

        let color = target.color || '#fff';
        let w = target.width || 20;
        let h = target.height || 20;

        // Create the effect and add it to the obstacles list (duck-typed as harmless)
        const explosion = new ExplosionEffect(this.game, target.x, target.y, color, w, h);
        this.obstacles.push(explosion);

        // Play explosion sound (reuse death sound or create new?) 
        // User didn't ask for sound but "satisfying" implies sound usually. 
        // Using death sound might vary satisfaction, but let's stick to visuals first as requested.
        // Or maybe reuse the player's death sound but softer?
        if (this.game.deathSound) {
            // Clone audio to allow overlapping sounds
            const sfx = this.game.deathSound.cloneNode();
            // Use current SFX volume (default to 1.0 if undefined, but allow 0)
            const vol = (this.game.sfxVolume !== undefined) ? this.game.sfxVolume : 1.0;
            sfx.volume = vol * 0.5; // Lower volume
            sfx.play().catch(e => { });
        }
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
        this.diamondTimer += deltaTime;

        // BOSS MODE: Check if active to skip spawns
        if (!this.game.bossActive) {

            // Competitive Multiplier
            const compMult = this.game.isCompetitiveMode ? 0.75 : 1.0; // 25% faster spawns (intervals are 75%)

            // 1. Regular Obstacles (Normal Spawn Rate)
            // Adjust spawn rate slightly based on difficulty
            let interval = Math.max(500, 2000 - (this.game.difficultyManager ? this.game.difficultyManager.difficultyLevel * 100 : 0));
            interval *= compMult;

            // Post-Boss Grace Period Ramp Up
            if (this.game.bossDeathTime > 0) {
                const timeSinceDeath = Date.now() - this.game.bossDeathTime;
                if (timeSinceDeath < 10000) { // 10 seconds transition
                    const ramp = timeSinceDeath / 10000; // 0 to 1
                    // Multiply interval: At 0 -> 5x slower. At 1 -> 1x (Normal)
                    // Formula: interval * (1 + 4 * (1 - ramp))
                    // Example: Ramp 0 -> 1 + 4(1) = 5. Ramp 0.5 -> 1 + 4(0.5) = 3. Ramp 1 -> 1.
                    const multiplier = 1 + 4 * (1 - ramp);
                    interval *= multiplier;
                }
            }

            if (this.spawnTimer > interval) {
                this.obstacles.push(new Obstacle(this.game, 0.85)); // 15% Slower
                this.spawnTimer = 0;
            }

            // 2. Heavy Obstacle (Red) - Every 10s if Score > 200
            if (this.game.scoreManager.score > 200) {
                if (this.heavyTimer > 10000 * compMult) {
                    this.obstacles.push(new HeavyObstacle(this.game, 0.85)); // 15% Slower
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
                if (this.chargerTimer > 20000 * compMult) {
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
                if (this.trajectoryTimer > 15000 * compMult) {
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
                if (this.explodingTimer > 10000 * compMult) {
                    this.obstacles.push(new ExplodingEnemy(this.game));
                    this.explodingTimer = 0;
                }

                // 6. Diamond Enemy (Blue) - Every 12s if Score > 700
                if (this.game.scoreManager.score >= 700) {
                    if (!this.thresholds.diamond) {
                        this.obstacles.push(new DiamondEnemy(this.game));
                        this.thresholds.diamond = true;
                        this.diamondTimer = 0;
                    }
                    if (this.diamondTimer > 12000 * compMult) {
                        this.obstacles.push(new DiamondEnemy(this.game));
                        this.diamondTimer = 0;
                    }
                }
            }
        } // End of !bossActive check

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
        // No strict invulnerability check here anymore. 
        // We return the object so Game.js can decide whether to Explode it (shield) or Die (normal).

        // Check normal obstacles (ignore harmless ones)
        const hitObstacle = this.obstacles.find(obstacle => {
            if (obstacle.isHarmless) return false;
            return checkCollision(player, obstacle);
        });

        if (hitObstacle) return hitObstacle;

        // Check projectiles (always harmful)
        const hitProjectile = this.projectiles.find(p => checkCollision(player, p));

        return hitProjectile; // Returns object or undefined
    }
}
