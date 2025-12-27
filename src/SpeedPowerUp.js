class SpeedPowerUp extends PowerUp {
    constructor(game) {
        super(game);
        this.color = '#ADD8E6'; // Light Blue
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        // Draw Circle shape for Speed
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Particles
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.translate(p.x, p.y);
            ctx.fillRect(0, 0, p.size, p.size);
            ctx.restore();
        });

        ctx.restore();
    }
}
