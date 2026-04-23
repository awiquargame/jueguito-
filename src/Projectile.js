class Projectile {
    constructor(game, x, y, vx, vy, type, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 6;
        this.height = 6;
        this.type = type || 'square';
        this.markedForDeletion = false;
        this.color = color || '#006400';
        this.angle = 0;
        this.spinSpeed = (Math.random() - 0.5) * 0.2;
    }

    update(deltaTime) {
        const timeScale = deltaTime / 16.7;
        this.x += this.vx * timeScale;
        this.y += this.vy * timeScale;
        this.angle += this.spinSpeed * timeScale;

        // Remove if out of bounds
        if (this.x < -50 || this.x > this.game.width + 50 ||
            this.y < -50 || this.y > this.game.height + 50) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle);

        ctx.shadowBlur = this.game.settings.getShadowBlur(10);
        ctx.shadowColor = this.color;

        ctx.fillStyle = this.color;
        if (this.type === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'triangle') {
            ctx.beginPath();
            // Centered Triangle
            ctx.moveTo(0, -this.height / 2);
            ctx.lineTo(this.width / 2, this.height / 2);
            ctx.lineTo(-this.width / 2, this.height / 2);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }
        ctx.restore();
    }
}
