class PowerUp {
    constructor(game) {
        this.game = game;
        this.width = 30;
        this.height = 30;
        this.markedForDeletion = false;

        // Spawn logic similar to enemies but slower
        this.spawn();

        this.particles = [];
        this.color = '#39ff14'; // Toxic Lime
    }

    spawn() {
        const edge = Math.floor(Math.random() * 4);

        // Slower base speed (0.5 to 1.5)
        const baseSpeed = 100; // divider context

        switch (edge) {
            case 0: // Top
                this.x = Math.random() * this.game.width;
                this.y = -this.height;
                this.vx = (Math.random() - 0.5);
                this.vy = Math.random() * 1 + 0.5;
                break;
            case 1: // Right
                this.x = this.game.width;
                this.y = Math.random() * this.game.height;
                this.vx = -(Math.random() * 1 + 0.5);
                this.vy = (Math.random() - 0.5);
                break;
            case 2: // Bottom
                this.x = Math.random() * this.game.width;
                this.y = this.game.height;
                this.vx = (Math.random() - 0.5);
                this.vy = -(Math.random() * 1 + 0.5);
                break;
            case 3: // Left
                this.x = -this.width;
                this.y = Math.random() * this.game.height;
                this.vx = Math.random() * 1 + 0.5;
                this.vy = (Math.random() - 0.5);
                break;
        }
    }

    update(deltaTime) {
        const timeScale = deltaTime / 16.7;

        this.x += this.vx * timeScale;
        this.y += this.vy * timeScale;

        // Particles
        if (Math.random() < 0.2) {
            this.particles.push({
                x: this.x + this.width / 2 + (Math.random() * 10 - 5),
                y: this.y + this.height / 2 + (Math.random() * 10 - 5),
                vx: -this.vx * 0.5, // Less spread for powerup
                vy: -this.vy * 0.5,
                life: 300,
                maxLife: 300,
                size: Math.random() * 3 + 2,
                color: this.color
            });
        }
        this.particles.forEach(p => {
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            p.life -= deltaTime;
            p.alpha = p.life / p.maxLife;
        });
        this.particles = this.particles.filter(p => p.life > 0);

        // Cleanup
        if (this.x > this.game.width + 100 || this.x < -100 ||
            this.y > this.game.height + 100 || this.y < -100) {
            this.markedForDeletion = true;
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
        ctx.globalAlpha = 1.0;

        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        // diamond shape or circle to distinguish from enemies
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
