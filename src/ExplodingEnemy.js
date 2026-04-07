class ExplodingEnemy {
    constructor(game) {
        this.game = game;
        this.width = 40;
        this.height = 40;
        this.markedForDeletion = false;
        this.color = '#006400'; // Dark Green
        this.isHarmless = false; // Is collisionable (hurts player, or destroys if shield)

        this.spawn();

        this.timer = 0;
        this.moveDuration = 2000; // Move for 2 seconds
        this.explodeTimer = 0;
        this.hasExploded = false;

        this.particles = [];
        this.spawnParticles = true; // Default to true
    }

    spawn() {
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        const speed = 3;

        switch (edge) {
            case 0: // Top
                this.x = Math.random() * this.game.width;
                this.y = -this.height;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = speed;
                break;
            case 1: // Right
                this.x = this.game.width;
                this.y = Math.random() * this.game.height;
                this.vx = -speed;
                this.vy = (Math.random() - 0.5) * 2;
                break;
            case 2: // Bottom
                this.x = Math.random() * this.game.width;
                this.y = this.game.height;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = -speed;
                break;
            case 3: // Left
                this.x = -this.width;
                this.y = Math.random() * this.game.height;
                this.vx = speed;
                this.vy = (Math.random() - 0.5) * 2;
                break;
        }

        // Store initial velocity as "forward" direction for projectiles
        this.dirX = this.vx;
        this.dirY = this.vy;
        // Normalize direction
        const len = Math.hypot(this.dirX, this.dirY);
        if (len > 0) {
            this.dirX /= len;
            this.dirY /= len;
        }
    }

    update(deltaTime) {
        this.timer += deltaTime;
        const timeScale = deltaTime / 16.7;

        if (this.timer < this.moveDuration) {
            // Move
            this.x += this.vx * timeScale;
            this.y += this.vy * timeScale;
        } else if (!this.hasExploded) {
            // Stop and Explode
            this.hasExploded = true;
            this.explode();
        }
        // No need to wait for particles anymore
    }

    explode() {
        // Spawn Projectiles in all directions (360 degrees)
        const count = this.projectileCount || 12; // Allow custom count, default 12
        const stepAngle = (Math.PI * 2) / count;

        for (let i = 0; i < count; i++) {
            const angle = i * stepAngle;

            const speed = 6 + Math.random() * 2; // Fast projectiles
            const pVx = Math.cos(angle) * speed;
            const pVy = Math.sin(angle) * speed;

            this.game.obstacleManager.addProjectile(
                new Projectile(this.game, this.x + this.width / 2, this.y + this.height / 2, pVx, pVy)
            );
        }

        // Explosion visual effect (particles)
        if (this.spawnParticles) {
            const ex = new ExplosionEffect(
                this.game,
                this.x,
                this.y,
                this.color,
                this.width,
                this.height
            );
            this.game.obstacleManager.obstacles.push(ex);
        }

        // Mark for deletion immediately as ExplosionEffect handles the visuals
        this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();

        if (!this.hasExploded) {
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = this.color;
            ctx.shadowBlur = this.game.settings.getShadowBlur(15);
            ctx.shadowColor = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Optional: Draw a "core" or warning indicator?
            // Simple solid dark green box as requested.
        }

        ctx.restore();
    }
}
