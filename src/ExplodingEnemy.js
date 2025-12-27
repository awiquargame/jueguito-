class ExplodingEnemy {
    constructor(game) {
        this.game = game;
        this.width = 40;
        this.height = 40;
        this.markedForDeletion = false;
        this.color = '#006400'; // Dark Green
        this.isHarmless = true; // Body does not hurt player

        this.spawn();

        this.timer = 0;
        this.moveDuration = 2000; // Move for 2 seconds
        this.explodeTimer = 0;
        this.hasExploded = false;

        this.particles = [];
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
        } else {
            // Give time for particles to fade before deleting
            this.explodeTimer += deltaTime;
            if (this.explodeTimer > 500) { // 0.5s after explosion
                this.markedForDeletion = true;
            }
        }

        // Spawn Particles (Dark Green)
        if (!this.hasExploded) {
            if (Math.random() < 0.3) {
                this.particles.push({
                    x: this.x + this.width / 2 + (Math.random() * 20 - 10),
                    y: this.y + this.height / 2 + (Math.random() * 20 - 10),
                    vx: (Math.random() - 0.5),
                    vy: (Math.random() - 0.5),
                    life: 300,
                    maxLife: 300,
                    size: Math.random() * 3 + 2,
                    color: this.color
                });
            }
        }

        // Update Particles
        this.particles.forEach(p => {
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            p.life -= deltaTime;
            p.alpha = p.life / p.maxLife;
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    explode() {
        // Spawn Projectiles in all directions (360 degrees)
        const projectileCount = 12; // Increased count for 360 coverage
        const stepAngle = (Math.PI * 2) / projectileCount;

        for (let i = 0; i < projectileCount; i++) {
            const angle = i * stepAngle;

            const speed = 6 + Math.random() * 2; // Fast projectiles
            const pVx = Math.cos(angle) * speed;
            const pVy = Math.sin(angle) * speed;

            this.game.obstacleManager.addProjectile(
                new Projectile(this.game, this.x + this.width / 2, this.y + this.height / 2, pVx, pVy)
            );
        }

        // Explosion visual effect (particles)
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 500,
                maxLife: 500,
                size: Math.random() * 5 + 3,
                color: this.color
            });
        }
    }

    draw(ctx) {
        ctx.save();

        // Draw Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });

        if (!this.hasExploded) {
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Optional: Draw a "core" or warning indicator?
            // Simple solid dark green box as requested.
        }

        ctx.restore();
    }
}
