class PurpleOctagonBoss {
    constructor(game) {
        this.game = game;
        this.width = 100;
        this.height = 100;
        this.markedForDeletion = false;
        this.color = '#800080'; // Purple
        this.name = "MIMIC OCTAGON"; // "Octógono Imitador" or something cool
        this.visible = true; // Indispensable para colisiones

        this.health = 3;
        this.maxHealth = 3;

        // Initialize Vulnerability
        this.isVulnerable = false;
        this.vulnerabilityTimer = 0;
        this.vulnerabilityCooldown = 12000; // 12 seconds (Slightly faster than Blue's 15s)
        this.vulnerabilityDuration = 3000; // 3 seconds

        // Blink logic
        this.blinkState = false;
        this.blinkTimer = 0;

        // Spawn Position (Top Center)
        this.x = this.game.width / 2 - this.width / 2;
        this.y = -150;
        this.targetY = 80; // Hover position

        // State Machine
        this.state = 'ENTERING'; // ENTERING, HOVERING, ATTACKING, SPAWNING_MINIONS, DYING
        this.timer = 0;

        // Movement
        this.vx = 0;
        this.vy = 0;
        this.speed = 3;
        this.angle = 0;

        // Attack Timer
        this.attackCooldown = 3000; // Attack every 3s
        this.nextAttackTimer = 0;

        // Current Action Data
        this.currentAttackType = 'NONE';
        this.actionTimer = 0;
        this.actionDuration = 0;

        // Dash Attack Props
        this.dashTargetX = 0;
        this.dashTargetY = 0;

        // Smash Attack Props
        this.smashState = 'IDLE';

        // Laser Props
        // Uses obstacleManager

        // Special Props
        this.specialCharging = false;

        // Ensure game knows boss is active
        this.game.bossActive = true;
        this.game.boss = this;
        this.introPlayed = false;
    }

    update(deltaTime) {
        this.timer += deltaTime;

        // Generic Rotation (Slow spin)
        if (this.state !== 'ATTACKING') {
            this.angle += 0.02 * (deltaTime / 16.7);
        }

        // Vulnerability Cycle
        if (!this.state.includes('DYING')) {
            if (!this.isVulnerable) {
                this.vulnerabilityTimer += deltaTime;
                if (this.vulnerabilityTimer >= this.vulnerabilityCooldown) {
                    this.startVulnerability();
                }
            } else {
                this.vulnerabilityTimer += deltaTime;
                this.blinkTimer += deltaTime;
                if (this.blinkTimer > 100) {
                    this.blinkState = !this.blinkState;
                    this.blinkTimer = 0;
                }
                if (this.vulnerabilityTimer >= this.vulnerabilityDuration) {
                    this.endVulnerability();
                }
            }
        }

        // State Machine
        switch (this.state) {
            case 'ENTERING':
                if (this.y < this.targetY) {
                    this.y += 2 * (deltaTime / 16.7);
                } else {
                    this.state = 'HOVERING';
                    this.timer = 0;
                }
                break;

            case 'HOVERING':
                // Hover Motion (Smooth Lerp)
                const hoverOffset = Math.sin(this.timer / 600) * 15;
                const desiredY = this.targetY + hoverOffset;

                this.y += (desiredY - this.y) * 0.05 * (deltaTime / 16.7);

                // Seek Player on X slightly
                const dx = (this.game.player.x + this.game.player.width / 2) - (this.x + this.width / 2);
                this.x += (dx * 0.01) * (deltaTime / 16.7);

                // Boundaries
                if (this.x < 0) this.x = 0;
                if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;

                this.nextAttackTimer += deltaTime;

                // Faster attack rate if vulnerable (Constant Spawning)
                const currentCooldown = this.isVulnerable ? 800 : this.attackCooldown;

                if (this.nextAttackTimer >= currentCooldown) {
                    if (this.isVulnerable) {
                        this.spawnMinions();
                    } else {
                        this.chooseAttack();
                    }
                    this.nextAttackTimer = 0;
                }
                break;

            case 'ATTACKING':
                this.updateAttack(deltaTime);
                break;

            case 'SPAWNING_MINIONS':
                // Handled in trigger
                this.timer += deltaTime;
                if (this.timer > 1000) {
                    this.state = 'HOVERING';
                }
                break;

            case 'DYING':
                this.angle += 0.2 * (deltaTime / 16.7);
                break;
        }
    }

    startVulnerability() {
        this.isVulnerable = true;
        this.vulnerabilityTimer = 0;
        this.addFloatingText("SHIELD DOWN!", "#FFFFFF");
    }

    endVulnerability() {
        this.isVulnerable = false;
        this.vulnerabilityTimer = 0;
        this.blinkState = false;
        this.addFloatingText("SHIELD UP!", this.color);
    }

    chooseAttack() {
        const rand = Math.random();
        // Weighted Random
        // Dash: 22.5%
        // Laser: 22.5%
        // Smash: 22.5%
        // Star: 22.5%
        // Explosion: 10% (Reduced)

        if (rand < 0.225) {
            this.startDashAttack();
        } else if (rand < 0.45) {
            this.startLaserAttack();
        } else if (rand < 0.675) {
            this.startSmashAttack();
        } else if (rand < 0.90) {
            this.startStarBurst();
        } else {
            this.startExplosionRing();
        }
    }

    // --- ATTACKS ---

    startDashAttack() {
        this.state = 'ATTACKING';
        this.currentAttackType = 'DASH';
        this.actionTimer = 0;
        this.addFloatingText("DASH!", "#FF0000"); // Red hint

        // Aim
        const p = this.game.player;
        const dx = (p.x + p.width / 2) - (this.x + this.width / 2);
        const dy = (p.y + p.height / 2) - (this.y + this.height / 2);
        const dist = Math.hypot(dx, dy);

        const speed = 12;
        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;
        this.actionDuration = 1500; // 1.5s dash
    }

    startLaserAttack() {
        this.state = 'ATTACKING';
        this.currentAttackType = 'LASER';
        this.actionTimer = 0;
        this.actionDuration = 1000; // Short pause
        this.addFloatingText("LASER!", "#FFA500"); // Orange hint

        // Spawn Lasers immediately
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const p = this.game.player;
        const angle = Math.atan2((p.y + p.height / 2) - cy, (p.x + p.width / 2) - cx);

        // 3 Lasers
        this.game.obstacleManager.obstacles.push(new Laser(this.game, cx, cy, angle, this));
        this.game.obstacleManager.obstacles.push(new Laser(this.game, cx, cy, angle + 0.4, this));
        this.game.obstacleManager.obstacles.push(new Laser(this.game, cx, cy, angle - 0.4, this));
    }

    startSmashAttack() {
        this.state = 'ATTACKING';
        this.currentAttackType = 'SMASH';
        this.smashState = 'DOWN';
        this.actionTimer = 0;
        this.addFloatingText("SMASH!", "#00FF00"); // Green hint
        this.vx = 0; // Stop X movement
    }

    startExplosionRing() {
        this.state = 'ATTACKING';
        this.currentAttackType = 'EXPLOSION';
        this.actionTimer = 0;
        this.actionDuration = 2000; // Charge time
        this.addFloatingText("BOOM!", "#006400"); // Dark Green hint
        this.specialCharging = true;
    }

    startStarBurst() {
        this.state = 'ATTACKING';
        this.currentAttackType = 'STAR';
        this.actionTimer = 0;
        this.actionDuration = 500; // Quick
        this.addFloatingText("STARS!", "#0000FF"); // Blue hint

        // Fire logic
        const points = 8; // 8 for Octagon!
        const speed = 7;
        for (let i = 0; i < points; i++) {
            const a = (Math.PI * 2 * i) / points + this.angle;
            const vx = Math.cos(a) * speed;
            const vy = Math.sin(a) * speed;
            const proj = new Projectile(this.game, this.x + this.width / 2, this.y + this.height / 2, vx, vy, this.color);
            this.game.obstacleManager.addProjectile(proj);
        }
    }

    spawnMinions() {
        // Do not change state, just spawn
        // this.state = 'SPAWNING_MINIONS'; 
        this.addFloatingText("MINIONS!", "#FFFFFF");

        // Spawn "Gran cantidad" of "Enemigos básicos" but "Muy lentos"
        // Reduced count per wave since we spawn more often now
        const count = 5;
        const startX = 50;
        const gap = (this.game.width - 100) / count;

        for (let i = 0; i < count; i++) {
            const obs = new Obstacle(this.game);
            // Override properties
            obs.x = startX + i * gap;
            obs.y = -80 - (Math.random() * 40); // Within -120 to -80 range

            // Slow speed
            obs.vx = (Math.random() - 0.5) * 1; // Very little horizontal
            obs.vy = 1 + Math.random() * 1; // Slow falling (Normal is ~3-5)

            // Maybe make them color matching? Or basic?
            // "Basicos" usually implies Purple/Pink default or standard look.
            // Let's leave them default or set to match boss? 
            // "Enemigos básicos" implies standard Obstacle.

            this.game.obstacleManager.obstacles.push(obs);
        }
    }

    // --- UPDATE ATTACK LOGIC ---

    updateAttack(deltaTime) {
        this.actionTimer += deltaTime;

        if (this.currentAttackType === 'DASH') {
            // Spin fast
            this.angle += 0.5;

            // Move
            this.x += this.vx * (deltaTime / 16.7);
            this.y += this.vy * (deltaTime / 16.7);

            // Bounce
            if (this.x <= 0 || this.x + this.width >= this.game.width) this.vx *= -1;
            if (this.y <= 0 || this.y + this.height >= this.game.height) this.vy *= -1;

            if (this.actionTimer >= this.actionDuration) {
                this.state = 'HOVERING';
                this.vx = 0;
                this.vy = 0;
            }

        } else if (this.currentAttackType === 'SMASH') {
            const speed = 20;
            if (this.smashState === 'DOWN') {
                this.y += speed * (deltaTime / 16.7);
                if (this.y + this.height >= this.game.height - 20) {
                    this.y = this.game.height - this.height - 20;
                    this.smashState = 'RETURN';
                    this.game.triggerShake(500, 20);
                    // Splash?
                    this.spawnSplash();
                }
            } else if (this.smashState === 'RETURN') {
                this.y -= (speed / 4) * (deltaTime / 16.7);
                if (this.y <= this.targetY + 20) {
                    // Start hovering near target to allow smooth lerp
                    this.state = 'HOVERING';
                }
            }

        } else if (this.currentAttackType === 'EXPLOSION') {
            // Charge then Boom
            if (this.specialCharging) {
                // Blink Red
                if (Math.floor(this.actionTimer / 50) % 2 === 0) {
                    this.color = '#FF0000';
                } else {
                    this.color = '#800080';
                }

                if (this.actionTimer >= 1500) {
                    this.specialCharging = false;
                    this.color = '#800080';
                    this.triggerExplosionRing();
                    this.state = 'HOVERING';
                }
            }
        } else if (this.currentAttackType === 'LASER' || this.currentAttackType === 'STAR') {
            // Just wait duration then return
            if (this.actionTimer >= this.actionDuration) {
                this.state = 'HOVERING';
            }
        }
    }

    triggerExplosionRing() {
        const count = 8;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const radius = 80;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const ex = new ExplodingEnemy(this.game);
            const sx = cx + Math.cos(angle) * radius;
            const sy = cy + Math.sin(angle) * radius;

            ex.x = sx - ex.width / 2;
            ex.y = sy - ex.height / 2;
            ex.vx = Math.cos(angle) * 5;
            ex.vy = Math.sin(angle) * 5;
            ex.moveDuration = 600; // Short fuse
            ex.color = '#800080';

            this.game.obstacleManager.obstacles.push(ex);
        }
    }

    spawnSplash() {
        const count = 15;
        for (let i = 0; i < count; i++) {
            const obs = new Obstacle(this.game);
            obs.x = this.x + (Math.random() * this.width * 2) - (this.width / 2);
            obs.y = this.game.height - 20;
            obs.width = 15; obs.height = 15;
            obs.vx = (Math.random() - 0.5) * 15;
            obs.vy = -(Math.random() * 10 + 5);
            obs.color = this.color;
            this.game.obstacleManager.obstacles.push(obs);
        }
    }


    takeDamage(bypass = false) {
        if (this.state === 'DYING' || (!this.isVulnerable && !bypass)) return;

        this.health--;
        this.game.triggerShake(200, 5);
        this.addFloatingText(`HIT! ${this.health} LEFT`, "#FF0000");

        this.endVulnerability(); // Force shield up

        if (this.health <= 0) {
            this.state = 'DYING';
            this.game.triggerBossDeath();
            this.addFloatingText("IMPOSSIBLE!", "#800080");
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle);

        // Draw Octagon
        if (this.isVulnerable && this.blinkState) {
            ctx.fillStyle = '#FFFFFF';
        } else {
            ctx.fillStyle = this.color;
        }

        ctx.shadowBlur = this.game.settings.getShadowBlur(20);
        ctx.shadowColor = this.color;

        const sides = 8;
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
        ctx.fill();

        // Inner Detail (Another Octagon rotated?)
        ctx.fillStyle = '#4B0082'; // Indigo/Dark Purple
        ctx.beginPath();
        const innerRadius = radius * 0.6;
        for (let i = 0; i < sides; i++) {
            // Offset angle slightly
            const angle = i * (Math.PI * 2) / sides + Math.PI / 8;
            const px = Math.cos(angle) * innerRadius;
            const py = Math.sin(angle) * innerRadius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Center Eye/Core
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = this.isVulnerable ? '#00FF00' : '#FF00FF';
        ctx.fill();

        ctx.restore();

        // HEALTH BAR
        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        // Copied Logic
        ctx.save();
        const barWidth = this.game.width * 0.8;
        const barHeight = 40;
        const barX = (this.game.width - barWidth) / 2;
        const barY = this.game.height - 60;
        const segmentGap = 10;
        const totalGap = segmentGap * (this.maxHealth - 1);
        const segmentWidth = (barWidth - totalGap) / this.maxHealth;

        // Bg
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Outfit", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText("HP", barX, barY - 15);

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
    }

    addFloatingText(text, color) {
        if (this.game && this.game.addFloatingText) {
            this.game.addFloatingText(this.x + this.width / 2, this.y, text, color);
        }
    }
}
