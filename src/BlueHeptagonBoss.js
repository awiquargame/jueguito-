class BlueHeptagonBoss {
    constructor(game) {
        this.game = game;
        this.width = 100;
        this.height = 100;
        this.markedForDeletion = false;
        this.color = '#00008B'; // Dark Blue
        this.name = "SNIPER HEPTAGON";
        this.visible = true; // Indispensable para colisiones

        this.health = 3;
        this.maxHealth = 3;
        // Initialize Vulnerability
        this.isVulnerable = false;
        this.vulnerabilityTimer = 0;
        this.vulnerabilityCooldown = 15000; // 15 seconds
        this.vulnerabilityDuration = 3000; // 3 seconds

        // Blink logic
        this.blinkState = false;
        this.blinkTimer = 0;

        // Spawn Position (Top Center)
        this.x = this.game.width / 2 - this.width / 2;
        this.y = -150;
        this.targetY = 100; // Hover position

        // State Machine
        this.state = 'ENTERING'; // ENTERING, HOVERING, ATTACKING_STAR, SPAWNING_MINIONS, DYING
        this.timer = 0;

        // Movement
        this.vx = 0;
        this.vy = 0;
        this.angle = 0; // For rotation

        // Attack Timers
        this.attackCooldown = 2000;
        this.nextAttackTimer = 0;

        // Star Attack
        this.starAimTimer = 0;
        this.starAimDuration = 1000;

        // Reference to Game
        // Ensure game knows boss is active
        this.game.bossActive = true;
        this.game.boss = this;

        // Intro Cinematic Flag
        this.introPlayed = false;
    }

    update(deltaTime) {
        this.timer += deltaTime;

        // Rotation
        this.angle += 0.01 * (deltaTime / 16.7);

        // Vulnerability Cycle
        if (!this.state.includes('DYING')) {
            if (!this.isVulnerable) {
                this.vulnerabilityTimer += deltaTime;
                if (this.vulnerabilityTimer >= this.vulnerabilityCooldown) {
                    this.isVulnerable = true;
                    this.vulnerabilityTimer = 0; // Reset for duration count
                    this.addFloatingText("SHIELD DOWN!", "#FFFFFF");
                }
            } else {
                // Active Vulnerability
                this.vulnerabilityTimer += deltaTime;

                // Blink White
                this.blinkTimer += deltaTime;
                if (this.blinkTimer > 100) {
                    this.blinkState = !this.blinkState;
                    this.blinkTimer = 0;
                }

                if (this.vulnerabilityTimer >= this.vulnerabilityDuration) {
                    this.isVulnerable = false;
                    this.vulnerabilityTimer = 0; // Reset for cooldown count
                    this.blinkState = false;
                    this.addFloatingText("SHIELD UP!", "#00008B");
                }
            }
        }

        switch (this.state) {
            case 'ENTERING':
                // Move down to targetY
                if (this.y < this.targetY) {
                    this.y += 2 * (deltaTime / 16.7);
                } else {
                    this.state = 'HOVERING';
                    this.timer = 0;
                    // this.addFloatingText("I AM THE SHADOW!", "#00008B"); // Too noisy
                }
                break;

            case 'HOVERING':
                // Hover motion
                this.y = this.targetY + Math.sin(this.timer / 500) * 10;

                this.nextAttackTimer += deltaTime;
                if (this.nextAttackTimer > this.attackCooldown) {
                    this.nextAttackTimer = 0;
                    // Random Attack
                    if (Math.random() < 0.5) {
                        this.state = 'ATTACKING_STAR';
                        this.starAimTimer = 0;
                    } else {
                        this.state = 'SPAWNING_MINIONS';
                        this.timer = 0; // Reset timer for spawn delay
                        this.spawnMinions();
                    }
                }
                break;

            case 'ATTACKING_STAR':
                this.starAimTimer += deltaTime;
                if (this.starAimTimer > this.starAimDuration) {
                    this.fireStarAttack();
                    this.state = 'HOVERING';
                }
                break;

            case 'SPAWNING_MINIONS':
                // Spawning is instant in this logic, wait a bit then go back to hovering
                if (this.timer > 1000) {
                    this.state = 'HOVERING';
                }
                break;

            case 'DYING':
                this.angle += 0.1 * (deltaTime / 16.7);
                // Handled by Game.triggerBossDeath()
                break;
        }
    }

    spawnMinions() {
        const color = '#000066';
        const points = 5;
        const radius = 150 + Math.random() * 100; // Variable radius
        const offsetAngle = Math.random() * Math.PI * 2; // Fixed but random rotation for the whole star

        for (let i = 0; i < points; i++) {
            const e = new DiamondEnemy(this.game, color);
            const angle = offsetAngle + (i * (Math.PI * 2) / points);

            // Calculate target position based on star pattern
            let tx = this.game.width / 2 + Math.cos(angle) * radius;
            let ty = this.game.height / 2 + Math.sin(angle) * radius;

            // Add individual fluctuation to target so they don't overlap perfectly across summon cycles
            tx += (Math.random() - 0.5) * 100;
            ty += (Math.random() - 0.5) * 100;

            // Constrain to screen
            tx = Math.max(50, Math.min(this.game.width - 50, tx));
            ty = Math.max(50, Math.min(this.game.height - 50, ty));

            e.setDestination(this.x + this.width / 2, this.y + this.height / 2, tx, ty);
            this.game.obstacleManager.obstacles.push(e);
        }

        this.addFloatingText("STAR FORMATION!", "#0000FF");
    }

    fireStarAttack() {
        // Star Pattern: 5 points
        const points = 5;
        const speed = 6;
        const angleOffset = this.angle; // Rotate with boss

        for (let i = 0; i < points; i++) {
            const angle = angleOffset + (i * (Math.PI * 2) / points);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            const p = new Projectile(this.game, this.x + this.width / 2, this.y + this.height / 2, vx, vy, '#00008B');
            this.game.obstacleManager.addProjectile(p);
        }

        this.addFloatingText("STAR BURST!", "#00008B");
    }

    takeDamage(bypass = false) {
        if (this.state === 'DYING' || (!this.isVulnerable && !bypass)) return; // Only take damage if vulnerable or bypassed

        this.health--;
        this.game.triggerShake(200, 5);
        this.addFloatingText(`HIT! ${this.health} LEFT`, "#FF0000");

        if (this.health <= 0) {
            this.state = 'DYING';
            this.timer = 0;
            this.isVulnerable = false;

            // Use Game's method to trigger sequence and prevent bugs
            this.game.triggerBossDeath();

            this.addFloatingText("NOOOO!", "#00008B");

            // Big Explosion Effect
            for (let i = 0; i < 20; i++) {
                this.game.obstacleManager.triggerShieldExplosion({
                    x: this.x + Math.random() * this.width,
                    y: this.y + Math.random() * this.height,
                    width: 10, height: 10, color: this.color
                });
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle);

        // Draw Aiming Star
        if (this.state === 'ATTACKING_STAR') {
            // Blink effect
            if (Math.floor(this.starAimTimer / 100) % 2 === 0) {
                ctx.beginPath();
                ctx.strokeStyle = '#0000FF'; // Lighter blue aim
                ctx.lineWidth = 2;
                const points = 5;
                const radius = 200; // Aim length
                for (let i = 0; i < points; i++) {
                    const angle = (i * (Math.PI * 2) / points);
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }
                ctx.stroke();
            }
        }

        // Draw Heptagon (7 sides)
        if (this.isVulnerable && this.blinkState) {
            ctx.fillStyle = '#FFFFFF'; // White Blink
        } else {
            ctx.fillStyle = this.color;
        }

        const sides = 7;
        const radius = this.width / 2;

        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = i * (Math.PI * 2) / sides;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();

        ctx.shadowBlur = this.game.settings.getShadowBlur(20);
        ctx.shadowColor = this.color;
        ctx.fill();

        // Inner detail (Core - Weak Point Visual)
        // If blinking white, maybe keep core dark or blink too? Let's keep core dark for contrast
        ctx.beginPath();
        const innerRadius = radius * 0.4;
        for (let i = 0; i < sides; i++) {
            const angle = i * (Math.PI * 2) / sides;
            const px = Math.cos(angle) * innerRadius;
            const py = Math.sin(angle) * innerRadius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = '#000033'; // Deep dark core
        ctx.fill();

        // Glowing Core Center
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
        // If vulnerable, core turns Green? Or just stays blue?
        // User said "parpadea en blanco", so the body blinks.
        ctx.fillStyle = this.state === 'DYING' ? '#FF0000' : (this.isVulnerable ? '#00FF00' : '#4444FF');
        ctx.shadowBlur = this.game.settings.getShadowBlur(15);
        ctx.shadowColor = '#8888FF';
        ctx.fill();

        ctx.restore();

        // START HEALTH BAR
        // Reset transform to draw UI in screen space
        ctx.save();

        // Ensure UI is constant size/pos
        const barWidth = this.game.width * 0.8;
        const barHeight = 40;
        const barX = (this.game.width - barWidth) / 2;
        const barY = this.game.height - 60;
        const segmentGap = 10;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Outfit", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText("HP", barX, barY - 15);

        // Segments
        const totalGap = segmentGap * (this.maxHealth - 1);
        const segmentWidth = (barWidth - totalGap) / this.maxHealth;

        for (let i = 0; i < this.maxHealth; i++) {
            const segX = barX + i * (segmentWidth + segmentGap);
            if (i < this.health) {
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(segX, barY, segmentWidth, barHeight);
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(segX, barY, segmentWidth, barHeight);
            }
        }
        ctx.restore();
        // END HEALTH BAR
    }

    addFloatingText(text, color) {
        if (this.game && this.game.addFloatingText) {
            this.game.addFloatingText(this.x + this.width / 2, this.y, text, color);
        }
    }
}
