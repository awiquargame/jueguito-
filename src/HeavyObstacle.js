class HeavyObstacle extends Obstacle {
    constructor(game, speedScale = 1.0) {
        super(game, speedScale);
        this.width = Math.random() * 40 + 60; // Larger: 60-100
        this.height = Math.random() * 40 + 60; // Larger: 60-100
        this.color = '#ff0000'; // Red

        // Override spawn velocity for slowness
        this.vx *= 0.5;
        this.vy *= 0.5;
    }

    draw(ctx) {
        ctx.save();

        // Draw Particles (inherited from Obstacle)
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1.0;

        ctx.shadowBlur = this.game.settings.getShadowBlur(15);
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color; // Fill it to look "heavy"/solid
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.restore();
    }
}
