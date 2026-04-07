class DecagonBoss extends Boss {
    constructor(game) {
        super(game, 'dark_decagon');
        this.name = "DARKNESS DECAGON";
        this.color = "#1a0033"; // Deep dark purple
        this.glowColor = "#ff00ff"; // Pink/Magenta glow for contrast
        this.health = 8;
        this.maxHealth = 8;
        this.shape = 'decagon';
        this.width = 120;
        this.height = 120;
        
        // Attack config
        this.attackInterval = 3000;
        this.vulnCooldown = 8000;
        
        // Darkness Level Integration
        this.game.isDarknessLevel = true;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Ensure darkness level is active while boss is alive
        this.game.isDarknessLevel = true;
        
        // Custom Dash Attack for Decagon
        if (!this.isVulnerable && !this.isDashing && !this.isSpecialAttacking) {
            this.dashTimer += deltaTime;
            if (this.dashTimer >= 4000) {
                this.startShadowDash();
                this.dashTimer = 0;
            }
        }
    }

    startShadowDash() {
        this.addFloatingText("SHADOW DASH!", "#ff00ff");
        this.startDashAttack();
    }

    drawShape(ctx, w, h) {
        const r = w / 2;
        const sides = 10;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const a = (Math.PI * 2 * i) / sides - Math.PI / 2;
            ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
        }
        ctx.closePath();
    }

    die() {
        this.game.isDarknessLevel = false;
        super.die();
    }
}
