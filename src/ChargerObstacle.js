class ChargerObstacle {
    constructor(game) {
        this.game = game;
        this.width = Math.random() * 30 + 30; // ~1.3x normal (normal is 20-50, this is 30-60?) 
        // User asked for x1.3 larger than normal. Normal is 20-50. 
        // Let's say 40-60.
        this.width = 50;
        this.height = 50;
        this.color = '#ffffff';
        this.markedForDeletion = false;

        // Spawn logic (Entering screen)
        // Spawn at edges like normal obstacle
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { this.x = Math.random() * this.game.width; this.y = -this.height; }
        else if (edge === 1) { this.x = this.game.width; this.y = Math.random() * this.game.height; }
        else if (edge === 2) { this.x = Math.random() * this.game.width; this.y = this.game.height; }
        else { this.x = -this.width; this.y = Math.random() * this.game.height; }

        this.vx = 0;
        this.vy = 0;

        // States
        this.STATES = { ENTER: 0, AIM: 1, CHARGE: 2 };
        this.state = this.STATES.ENTER;

        this.timer = 0;
        this.aimTime = 3000; // 3 seconds

        // Enter Phase target (center of screen area mostly)
        this.targetX = Math.random() * (this.game.width - 100) + 50;
        this.targetY = Math.random() * (this.game.height - 100) + 50;
        this.particles = [];
    }

    update(deltaTime) {
        const timeScale = deltaTime / 16.7;
        this.timer += deltaTime;

        if (this.state === this.STATES.ENTER) {
            // Move towards random point in screen
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Particles slightly for movement
            if (Math.random() < 0.2) this.spawnParticles(dx / dist, dy / dist);

            if (dist < 10) {
                this.state = this.STATES.AIM;
                this.timer = 0;
            } else {
                this.x += (dx / dist) * 3 * timeScale;
                this.y += (dy / dist) * 3 * timeScale;
            }

        } else if (this.state === this.STATES.AIM) {
            // Track Player
            // Doesn't move, just waits.
            if (this.timer > this.aimTime) {
                this.state = this.STATES.CHARGE;
                // Lock target
                const dx = this.game.player.x - this.x;
                const dy = this.game.player.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                // Launch speed
                const speed = 15; // Fast!
                this.vx = (dx / dist) * speed;
                this.vy = (dy / dist) * speed;
            }

        } else if (this.state === this.STATES.CHARGE) {
            this.x += this.vx * timeScale;
            this.y += this.vy * timeScale;

            // Heavy particles for Charge
            this.spawnParticles(this.vx / 5, this.vy / 5);
            this.spawnParticles(this.vx / 5, this.vy / 5); // double

            // Remove if out of bounds
            if (this.x > this.game.width + 100 || this.x < -100 ||
                this.y > this.game.height + 100 || this.y < -100) {
                this.markedForDeletion = true;
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

    spawnParticles(dx, dy) {
        this.particles.push({
            x: this.x + this.width / 2 + (Math.random() * 20 - 10),
            y: this.y + this.height / 2 + (Math.random() * 20 - 10),
            vx: -dx * (Math.random() + 0.5),
            vy: -dy * (Math.random() + 0.5),
            life: 300,
            maxLife: 300,
            size: Math.random() * 5 + 2,
            color: this.color
        });
    }

    draw(ctx) {
        ctx.save();

        // Draw Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = this.color;

        if (this.state === this.STATES.AIM) {
            // Flashing effect or Aim Line
            // Draw Aim Line to player
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
            ctx.lineTo(this.game.player.x + this.game.player.width / 2, this.game.player.y + this.game.player.height / 2);
            ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
            ctx.setLineDash([5, 5]);
            ctx.stroke();

            // Shake effect
            if (Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.shadowBlur = this.game.settings.getShadowBlur(20);
                ctx.shadowColor = 'red';
            }
        }

        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}
