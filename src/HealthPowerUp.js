class HealthPowerUp extends PowerUp {
    constructor(game) {
        super(game);
        this.color = '#ff69b4'; // Hot Pink / Purple-ish
        this.width = 30;
        this.height = 30;
    }

    draw(ctx) {
        ctx.save();

        // Particles
        if (this.game.settings.shouldDrawParticles()) {
            this.particles.forEach(p => {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            });
        }
        ctx.globalAlpha = 1.0;

        // Shadow
        ctx.shadowBlur = this.game.settings.getShadowBlur(15);
        ctx.shadowColor = this.color;

        ctx.fillStyle = this.color;

        // Draw Heart Shape
        const x = this.x + this.width / 2;
        const y = this.y + this.height / 2;
        const size = this.width / 2;

        ctx.beginPath();
        ctx.moveTo(x, y + size * 0.7);
        ctx.bezierCurveTo(x + size, y, x + size, y - size, x, y - size * 0.5);
        ctx.bezierCurveTo(x - size, y - size, x - size, y, x, y + size * 0.7);
        ctx.fill();

        ctx.restore();
    }
}
