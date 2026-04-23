class Obstacle {
    constructor(game, speedScale = 1.0) {
        this.game = game;
        this.speedScale = speedScale; // Store for valid usage
        this.width = Math.random() * 12 + 14; 
        this.height = Math.random() * 12 + 14;
        this.markedForDeletion = false;

        // RandomSpawn logic
        this.spawn();

        this.particles = [];
        this.color = '#bc13fe';
    }

    spawn() {
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

        switch (edge) {
            case 0: // Top
                this.x = Math.random() * this.game.width;
                this.y = -this.height;
                // Faster horizontal drift: -2 to 2 | Faster vertical speed: 3 to 6
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = Math.random() * 3 + 3;
                break;
            case 1: // Right
                this.x = this.game.width;
                this.y = Math.random() * this.game.height;
                // Faster horizontal speed: -3 to -6 | Faster vertical drift: -2 to 2
                this.vx = -(Math.random() * 3 + 3);
                this.vy = (Math.random() - 0.5) * 4;
                break;
            case 2: // Bottom
                this.x = Math.random() * this.game.width;
                this.y = this.game.height;
                // Faster horizontal drift: -2 to 2 | Faster vertical speed: -3 to -6
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = -(Math.random() * 3 + 3);
                break;
            case 3: // Left
                this.x = -this.width;
                this.y = Math.random() * this.game.height;
                // Faster horizontal speed: 3 to 6 | Faster vertical drift: -2 to 2
                this.vx = Math.random() * 3 + 3;
                this.vy = (Math.random() - 0.5) * 4;
                break;
        }

        // Apply difficulty multiplier
        const speedMult = this.game.difficultyManager.speedMultiplier;
        this.vx *= speedMult * this.speedScale;
        this.vy *= speedMult * this.speedScale;
    }

    update(deltaTime) {
        const timeScale = deltaTime / 16.7;

        this.x += this.vx * timeScale;
        this.y += this.vy * timeScale;

        // Spawn Particles
        this.spawnParticles();

        // Update Particles
        this.particles.forEach(p => {
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            p.life -= deltaTime;
            p.alpha = 1.0; // No fade
        });
        this.particles = this.particles.filter(p => p.life > 0);

        // Check if out of bounds to remove
        if (this.x > this.game.width + 100 || this.x < -100 ||
            this.y > this.game.height + 100 || this.y < -200) {
            this.markedForDeletion = true;
        }
    }

    spawnParticles() {
        if (!this.game.settings.shouldDrawParticles()) return;
        if (Math.random() < 0.3) { // Limit spawn rate
            this.particles.push({
                x: this.x + this.width / 2 + (Math.random() * 20 - 10),
                y: this.y + this.height / 2 + (Math.random() * 20 - 10),
                vx: -this.vx * 0.5 + (Math.random() - 0.5),
                vy: -this.vy * 0.5 + (Math.random() - 0.5),
                life: 300,
                maxLife: 300,
                size: Math.random() * 5 + 2,
                color: this.color
            });
        }
    }

    draw(ctx) {
        ctx.save();

        // Draw Particles
        if (this.game.settings.shouldDrawParticles()) {
            this.particles.forEach(p => {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            });
        }
        ctx.globalAlpha = 1.0;

        ctx.shadowBlur = this.game.settings.getShadowBlur(10);
        ctx.shadowColor = this.color;

        // Fill (Requested by user)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.strokeStyle = '#fff'; // White border for contrast like heavy? 
        // Or keep original color stroke and just fill? 
        // Original code was strokeStyle = this.color. 
        // User asked for "relleno". 
        // If I fill with same color, stroke is redundant unless it's a different color.
        // Let's make it look solid neon: Fill + White Border (classic neon style) OR Fill + Same Color Border.
        // HeavyObstacle is Red Fill + White Border.
        // Regular is Purple. Let's do Purple Fill + White Border to match style? 
        // Or just Purple Fill + Purple Border.
        // Let's stick to Purple Fill. The stroke adds linewidth.
        ctx.strokeStyle = this.color;
        // To make it distinct from Heavy (which has white border), let's keep purple border.

        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}
