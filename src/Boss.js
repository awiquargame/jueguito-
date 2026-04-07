class Boss {
    constructor(game, type = 'red') {
        this.game = game;
        this.type = type;
        this.width = 100;
        this.height = 100;
        this.x = this.game.width / 2 - this.width / 2;
        this.y = 50; // Hover at top

        // Configuration based on type
        if (this.type === 'yellow') {
            this.color = '#ffff00'; // Yellow
            this.name = "YELLOW SENTINEL";
            this.health = 4;
            this.maxHealth = 4;
            this.shape = 'triangle';
        } else if (this.type === 'orange') {
            this.color = '#ff8000'; // Orange
            this.name = "ORANGE PRISM";
            this.health = 4;
            this.maxHealth = 4;
            this.shape = 'rhombus';
        } else if (this.type === 'green') {
            this.color = '#00ff00'; // Green
            this.name = "GREEN PENTAGON";
            this.health = 5;
            this.maxHealth = 5;
            this.shape = 'pentagon';
        } else if (this.type === 'dark_green') {
            this.color = '#006400'; // Dark Green
            this.name = "DARK HEXAGON";
            this.health = 2; // Reduced to 2 as requested
            this.maxHealth = 2;
            this.shape = 'hexagon';
        } else {
            // Default Red
            this.color = '#ff0000'; // Red
            this.name = "RED GLITCH";
            this.health = 3;
            this.maxHealth = 3;
            this.shape = 'square';
        }

        // Timers
        this.attackTimer = 0;
        this.vulnerabilityTimer = 0;
        this.isVulnerable = false;
        this.blinkTimer = 0;
        this.blinkState = false;

        // Dash Attack Config
        this.dashTimer = 0;
        this.isDashing = false;
        this.dashDuration = 0;
        this.angle = 0;

        // Smash Attack State (Green)
        this.smashState = 'IDLE'; // IDLE, DOWN, IMPACT, RETURN
        this.smashTargetY = 0;

        // Special Attack State (Dark Green)
        this.specialTimer = 0;
        this.isSpecialAttacking = false;
        this.specialState = 'IDLE'; // IDLE, CHARGING, EXPLODING

        // Attack config
        this.attackInterval = 4000; // Attack every 4s (Slower)

        // Vulnerability config
        this.vulnCooldown = 10000; // 10s
        this.vulnDuration = 3000; // 3s

        // Movement
        this.speed = 2;
        this.vx = this.speed;

        this.visible = true; // Fix: Ensure boss is visible for collision logic
        this.markedForDeletion = false;
    }

    update(deltaTime) {
        // Movement Logic
        if (this.isDashing) {
            this.updateDash(deltaTime);
        } else if (this.smashState !== 'IDLE') {
            // Smash Logic
            this.updateSmash(deltaTime);
        } else if (this.isSpecialAttacking) {
            // Special Attack Logic (Dark Green)
            this.updateSpecialAttack(deltaTime);
        } else {
            // Normal Hover Movement
            this.x += this.vx * (deltaTime / 16);
            if (this.x <= 0) {
                this.x = 0;
                this.vx = Math.abs(this.vx);
            } else if (this.x + this.width >= this.game.width) {
                this.x = this.game.width - this.width;
                this.vx = -Math.abs(this.vx);
            }

            // Return to top Y=50 if needed
            if (Math.abs(this.y - 50) > 2) {
                if (this.y > 50) this.y -= 2 * (deltaTime / 16);
                else this.y += 2 * (deltaTime / 16);
            } else {
                this.y = 50;
            }
            this.angle = 0;
        }

        // BOSS SPECIAL ATTACK CHECKERS
        if (this.type === 'yellow') {
            if (!this.isVulnerable && !this.isDashing) {
                this.dashTimer += deltaTime;
                if (this.dashTimer >= 5000) {
                    this.startDashAttack();
                    this.dashTimer = 0;
                }
            }
        } else if (this.type === 'orange') {
            // Orange Laser Attack
            if (!this.isVulnerable) {
                this.dashTimer += deltaTime; // Recycling dashTimer for Laser interval
                if (this.dashTimer >= 4000) { // Every 4s
                    this.startLaserAttack();
                    this.dashTimer = 0;
                }
            }
        } else if (this.type === 'green') {
            // Green Smash Attack
            if (!this.isVulnerable && this.smashState === 'IDLE') {
                this.dashTimer += deltaTime;
                if (this.dashTimer >= 5000) { // Every 5s
                    this.startSmashAttack();
                    this.dashTimer = 0;
                }
            }
        } else if (this.type === 'dark_green') {
            // Dark Green Special Attack
            if (!this.isVulnerable && !this.isSpecialAttacking) {
                this.dashTimer += deltaTime;
                if (this.dashTimer >= 4000) { // Every 4s? Maybe slower since it's boss
                    this.startSpecialAttack();
                    this.dashTimer = 0;
                }
            }
        }

        // Vulnerability Cycle
        if (!this.isVulnerable) {
            this.vulnerabilityTimer += deltaTime;
            if (this.vulnerabilityTimer >= this.vulnCooldown) {
                this.startVulnerability();
            }
        } else {
            this.vulnerabilityTimer -= deltaTime; // Countdown duration
            this.blinkTimer += deltaTime;
            if (this.blinkTimer > 100) { // Blink speed
                this.blinkState = !this.blinkState;
                this.blinkTimer = 0;
            }

            if (this.vulnerabilityTimer <= 0) {
                this.endVulnerability();
            }
        }

        // Attacks (Minion Spawn)
        // Keep normal attacks running? User didn't say stop.
        // Maybe pause during dash/smash/special?
        if (!this.isDashing && this.smashState === 'IDLE' && !this.isSpecialAttacking) {
            this.attackTimer += deltaTime;
            if (this.attackTimer >= this.attackInterval) {
                this.attack();
                this.attackTimer = 0;
            }
        }
    }

    startDashAttack() {
        // Telegraph
        this.addFloatingText("DASH!", "#FFFF00");
        this.dashState = 'WINDUP';
        this.dashWindupTimer = 0;
        this.isDashing = true; // Use this to trigger update logic
        this.angle = 0;

        // Target calculation happens at start of DASH phase, not Windup? 
        // Or calculate now and lock it? Let's calculate now but update later if tracking.
        // Simple: Calculate now.
    }

    updateDash(deltaTime) {
        if (this.dashState === 'WINDUP') {
            this.dashWindupTimer += deltaTime;
            // Visual Effect: Shake or pull back
            this.x += (Math.random() - 0.5) * 5;

            if (this.dashWindupTimer >= 800) { // 0.8s Windup
                this.dashState = 'DASHING';
                this.dashDuration = 1500;

                // Launch!
                const ctx = this.x + this.width / 2;
                const cty = this.y + this.height / 2;
                const px = this.game.player.x + this.game.player.width / 2;
                const py = this.game.player.y + this.game.player.height / 2;
                const dx = px - ctx;
                const dy = py - cty;
                const dist = Math.hypot(dx, dy);
                const speed = 15; // Fast!

                this.vx = (dx / dist) * speed;
                this.vy = (dy / dist) * speed;
            }
        } else if (this.dashState === 'DASHING') {
            this.x += this.vx * (deltaTime / 16);
            this.y += this.vy * (deltaTime / 16);
            this.angle += 0.3 * (deltaTime / 16); // Fast spin

            // Bounce
            if (this.x <= 0 || this.x + this.width >= this.game.width) this.vx *= -1;
            if (this.y <= 0 || this.y + this.height >= this.game.height) this.vy *= -1;

            this.dashDuration -= deltaTime;
            if (this.dashDuration <= 0) {
                this.isDashing = false;
                this.dashState = 'IDLE';
                this.angle = 0;
                this.vx = this.speed; // Reset normal speed
            }
        }
    }

    startLaserAttack() {
        this.addFloatingText("LASER!", "#FFA500");

        // Spawn 3 Lasers aiming at player with spread
        const px = this.game.player.x + this.game.player.width / 2;
        const py = this.game.player.y + this.game.player.height / 2;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const angle = Math.atan2(py - cy, px - cx);

        // Center Laser
        this.game.obstacleManager.obstacles.push(new Laser(this.game, cx, cy, angle, this));
        // Side Lasers
        this.game.obstacleManager.obstacles.push(new Laser(this.game, cx, cy, angle + 0.3, this));
        this.game.obstacleManager.obstacles.push(new Laser(this.game, cx, cy, angle - 0.3, this));
    }

    startSmashAttack() {
        this.addFloatingText("SMASH!", "#00FF00");
        this.smashState = 'DOWN';
        this.vx = 0;
        this.vy = 0; // Start at 0 for gravity
    }

    updateSmash(deltaTime) {
        const gravity = 0.5;
        const maxSpeed = 20;

        if (this.smashState === 'DOWN') {
            this.vy += gravity * (deltaTime / 16);
            if (this.vy > maxSpeed) this.vy = maxSpeed;

            this.y += this.vy * (deltaTime / 16);

            if (this.y + this.height >= this.game.height - 20) {
                this.y = this.game.height - this.height - 20;
                this.smashState = 'IMPACT';
                this.triggerSmashImpact();
            }
        } else if (this.smashState === 'IMPACT') {
            // Brief pause
            this.smashState = 'RETURN';
        } else if (this.smashState === 'RETURN') {
            this.y -= 5 * (deltaTime / 16); // Constant return speed
            if (this.y <= 50) {
                this.y = 50;
                this.smashState = 'IDLE';
                this.vx = this.speed; // Resume hover
            }
        }
    }

    triggerSmashImpact() {
        this.game.triggerShake(500, 20);

        // Visual Impact Explosion
        const impactEx = new ExplosionEffect(
            this.game,
            this.x,
            this.y + this.height - 20,
            this.color,
            this.width,
            40 // Flattened explosion
        );
        this.game.obstacleManager.obstacles.push(impactEx);

        // Splash Particles (Cover 50% of screen)
        // We will spawn many small Obstacles flying UP
        const particleCount = 20;

        for (let i = 0; i < particleCount; i++) {
            // Use Obstacle class but customize
            const obs = new Obstacle(this.game);

            // Override properties to act as splash particle
            obs.x = this.x + (Math.random() * this.width * 2) - (this.width / 2); // Spread around impact
            obs.y = this.y + this.height;
            obs.width = Math.random() * 10 + 10; // Small
            obs.height = Math.random() * 10 + 10;

            obs.vx = (Math.random() - 0.5) * 10; // Random horizontal spread
            obs.vy = -(Math.random() * 5 + 10); // Fast UP

            obs.color = this.color; // Green

            this.game.obstacleManager.obstacles.push(obs);
        }
    }

    startSpecialAttack() {
        this.addFloatingText("BURST!", "#006400");
        this.isSpecialAttacking = true;
        this.specialState = 'CHARGING';
        this.specialTimer = 0;
        this.blinkState = false;
        this.blinkTimer = 0;
        // Stop movement
        this.vx = 0;
    }

    updateSpecialAttack(deltaTime) {
        if (this.specialState === 'CHARGING') {
            // Blink rapidly
            this.specialTimer += deltaTime;
            this.blinkTimer += deltaTime;
            if (this.blinkTimer > 50) { // Very fast blink
                this.blinkState = !this.blinkState;
                this.blinkTimer = 0;
            }

            if (this.specialTimer >= 1500) { // Charge for 1.5s
                this.specialState = 'EXPLODING';
                this.triggerSpecialExplosion();
            }
        } else if (this.specialState === 'EXPLODING') {
            // Just a brief state to reset
            this.isSpecialAttacking = false;
            this.specialState = 'IDLE';
            this.vx = this.speed; // Resume logic
            this.blinkState = false; // Stop blinking
        }
    }

    triggerSpecialExplosion() {
        try {
            // No screen shake as requested: "no tiene que emitir partículas" (interpreted as no extra FX)

            // Spawn ring of ExplodingEnemies that explode quickly
            // "Salen de cada uno de sus lados" -> 6 sides -> 6 enemies
            const count = 6;
            const radius = 60; // Start closer to body
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;

            // Ensure ExplodingEnemy exists
            if (typeof ExplodingEnemy === 'undefined') return;

            for (let i = 0; i < count; i++) {
                // Align with Hexagon Sides (offset by 30 degrees from vertices?)
                // Hexagon vertices are drawn starting at -90 degrees (top).
                // i=0 is -90. i=1 is -30.
                // Let's spawn them exactly at the vertices or face centers?
                // "Salen de sus lados" likely means radiating outward. 6 directions is standard.
                // Let's stick to vertices alignment for visual clarity (matches the points).
                const angle = (Math.PI * 2 * i) / count - Math.PI / 2; // -90 deg start

                const exX = cx + Math.cos(angle) * radius;
                const exY = cy + Math.sin(angle) * radius;

                const obs = new ExplodingEnemy(this.game);
                obs.x = exX - obs.width / 2;
                obs.y = exY - obs.height / 2;

                // Fast outward velocity
                const speed = 8;
                obs.vx = Math.cos(angle) * speed;
                obs.vy = Math.sin(angle) * speed;

                obs.moveDuration = 500; // Explode after 0.5s (short fuse)
                obs.color = this.color; // Use Boss Color
                obs.spawnParticles = false; // Decrease visual clutter / requested removal of red particles
                obs.projectileCount = 6; // Reduced count "un poco" (half)

                this.game.obstacleManager.obstacles.push(obs);
            }
        } catch (e) {
            console.error("Error in triggerSpecialExplosion:", e);
        }
    }

    startVulnerability() {
        this.addFloatingText("HIT ME!", "#FFFFFF");
        this.isVulnerable = true;
        this.vulnerabilityTimer = this.vulnDuration;
        // Optional: Play alert sound?
    }

    endVulnerability() {
        this.isVulnerable = false;
        this.vulnerabilityTimer = 0;
        this.blinkState = false;
    }

    addFloatingText(text, color) {
        if (this.game && this.game.addFloatingText) {
            // Center text on boss
            this.game.addFloatingText(this.x + this.width / 2, this.y, text, color);
        }
    }

    attack() {
        // Telegraph for all bosses (Generic Summon)
        this.addFloatingText("SUMMON!", this.color);

        // Randomly choose attack
        const rand = Math.random();

        if (this.type === 'yellow') {
            // Yellow Boss: Generates Red (Heavy) and White (Charger) enemies
            if (rand < 0.5) {
                // Spawn Heavy (Red)
                const obs = new HeavyObstacle(this.game);
                obs.x = this.x + this.width / 2 - obs.width / 2;
                obs.y = this.y + this.height;
                obs.vx = (Math.random() - 0.5) * 4;
                obs.vy = 2;
                this.game.obstacleManager.obstacles.push(obs);
            } else {
                // Spawn Charger (White)
                const obs = new ChargerObstacle(this.game);
                obs.x = this.x + this.width / 2;
                obs.y = this.y + this.height;
                obs.state = obs.STATES.AIM; // Skip enter, go to aim
                this.game.obstacleManager.obstacles.push(obs);
            }

        } else if (this.type === 'orange') {
            // Orange Boss: Generates White and Orange enemies
            if (rand < 0.5) {
                // Charger (White)
                const obs = new ChargerObstacle(this.game);
                obs.x = this.x + this.width / 2;
                obs.y = this.y + this.height;
                obs.state = obs.STATES.AIM;
                this.game.obstacleManager.obstacles.push(obs);
            } else {
                // Trajectory (Orange)
                const obs = new TrajectoryObstacle(this.game, this.x + this.width / 2, this.y + this.height);
                this.game.obstacleManager.obstacles.push(obs);
            }
        } else if (this.type === 'green') {
            // Green Boss: Generates Normal (Purple) and Orange enemies
            // "enemigos normales y corrientes, pero que sean en una gran cantidad"
            if (rand < 0.5) {
                // Spawn Trajectory (Orange)
                const obs = new TrajectoryObstacle(this.game, this.x + this.width / 2, this.y + this.height);
                this.game.obstacleManager.obstacles.push(obs);
            } else {
                // Spawn Normal (Purple) Burst
                // "Gran cantidad" -> Burst of 3-5
                for (let i = 0; i < 4; i++) {
                    const obs = new Obstacle(this.game);
                    obs.x = this.x + (Math.random() * this.width);
                    obs.y = this.y + this.height;
                    obs.vx = (Math.random() - 0.5) * 8; // Wide spread
                    obs.vy = Math.random() * 3 + 3;
                    this.game.obstacleManager.obstacles.push(obs);
                }
            }
        } else if (this.type === 'dark_green') {
            // Dark Green Boss
            // Attacks: Burst of Exploding Enemies
            if (rand < 0.6) {
                // Spawn Exploding Enemy (Green) - Burst
                for (let i = 0; i < 3; i++) {
                    const obs = new ExplodingEnemy(this.game);
                    obs.x = this.x + this.width / 2 + (Math.random() - 0.5) * 50;
                    obs.y = this.y + this.height;
                    obs.vx = (Math.random() - 0.5) * 6;
                    obs.vy = 4 + Math.random() * 2;
                    this.game.obstacleManager.obstacles.push(obs);
                }
            } else {
                // Just spawn one aimed
                const obs = new ExplodingEnemy(this.game);
                obs.x = this.x + this.width / 2;
                obs.y = this.y + this.height;
                obs.vx = (Math.random() - 0.5) * 2;
                obs.vy = 5;
                this.game.obstacleManager.obstacles.push(obs);
            }
        } else {
            // Red Boss: Generates Orange and Green enemies
            if (rand < 0.5) {
                // Spawn Trajectory Obstacle (Orange)
                const obs = new TrajectoryObstacle(this.game, this.x + this.width / 2, this.y + this.height);
                this.game.obstacleManager.obstacles.push(obs);
            } else {
                // Spawn Exploding Enemy (Green)
                const obs = new ExplodingEnemy(this.game);
                // Spawn at Boss center
                obs.x = this.x + this.width / 2;
                obs.y = this.y + this.height;
                obs.vx = (Math.random() - 0.5) * 4;
                obs.vy = 3;
                // explodging enemy handles its own particles so we just push it
                this.game.obstacleManager.obstacles.push(obs);
            }
        }
    }

    takeDamage() {
        this.health--;

        // Reset vulnerability immediate
        this.endVulnerability();

        // Visual feedback (shake or flash red?)
        this.game.triggerShake(500, 20);

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        // Trigger 3s Animation in Game
        this.game.triggerBossDeath();
    }

    finalExplode() {
        this.markedForDeletion = true;

        // Massive Explosion
        for (let i = 0; i < 10; i++) {
            // Create multiple explosion effects
            const ex = new ExplosionEffect(this.game,
                this.x + Math.random() * this.width,
                this.y + Math.random() * this.height,
                this.color,
                this.width * 1.5, this.height * 1.5
            );
            this.game.obstacleManager.obstacles.push(ex);
        }

        // Play Big Sound
        if (this.game.deathSound) {
            this.game.deathSound.currentTime = 0;
            this.game.deathSound.play().catch(e => { });
        }
    }

    draw(ctx) {
        ctx.save();

        // 1. NEON PULSE EFFECT (Global Scale)
        const pulse = 1 + Math.sin(this.game.gameTime / 200) * 0.05;

        // Move to Center
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        ctx.translate(cx, cy);
        ctx.scale(pulse, pulse);

        // Rotation logic
        if (this.isDashing || this.smashState === 'DOWN' || this.smashState === 'RETURN' || this.isSpecialAttacking) {
            if (this.isSpecialAttacking) this.angle += 0.5;
            ctx.rotate(this.angle);
        }

        // Determine Colors
        let mainColor = this.color;
        let glowColor = this.color;
        let coreColor = '#FFFFFF'; // Bright core

        if (this.type === 'dark_green') {
            glowColor = '#00FF00'; // Force bright neon green glow for dark boss
        }

        // Blink Logic
        if (this.isVulnerable && this.blinkState) {
            mainColor = '#FFFFFF';
            glowColor = '#FFFFFF';
            coreColor = '#FF0000';
        } else if (this.isSpecialAttacking && this.blinkState) {
            mainColor = '#FF0000';
            glowColor = '#FF0000';
            coreColor = '#FFFF00';
        }

        // 2. LAYER 1: OUTER GLOW (The Neon Rim)
        // Use STROKE instead of FILL to be transparent inside
        ctx.shadowBlur = this.game.settings.getShadowBlur ? this.game.settings.getShadowBlur(30) : 30;
        ctx.shadowColor = glowColor;
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 12; // Thick Neon Line
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Draw Main Shape (Outline)
        this.drawShape(ctx, this.width - ctx.lineWidth, this.height - ctx.lineWidth); // Slight inset for stroke
        ctx.stroke();

        // 3. LAYER 2: CORE (The Rotating Soul)

        ctx.save(); // Save dash rotation state

        // Core Rotation Calculation
        const coreRotationSpeed = 0.004; // Slower
        const coreAngle = this.game.gameTime * coreRotationSpeed;

        ctx.rotate(coreAngle);

        ctx.shadowBlur = this.game.settings.getShadowBlur ? this.game.settings.getShadowBlur(20) : 20;
        ctx.shadowColor = glowColor;
        ctx.fillStyle = coreColor;

        const coreScale = 0.20; // Smaller to avoid touching rim
        ctx.scale(coreScale, coreScale);

        // Draw Core (Filled)
        this.drawShape(ctx, this.width, this.height);
        ctx.fill();

        ctx.restore(); // Restore core rotation

        // Restore Coordinate System
        ctx.restore();

        // 5. HEALTH BAR (Standard)
        this.drawHealthBar(ctx);
    }

    drawShape(ctx, w, h) {
        const hw = w / 2;
        const hh = h / 2;

        ctx.beginPath();
        if (this.shape === 'triangle') {
            ctx.moveTo(0, -hh); // Top
            ctx.lineTo(hw, hh); // Bottom Right
            ctx.lineTo(-hw, hh); // Bottom Left
        } else if (this.shape === 'rhombus') {
            ctx.moveTo(0, -hh); // Top
            ctx.lineTo(hw, 0);  // Right
            ctx.lineTo(0, hh);  // Bottom
            ctx.lineTo(-hw, 0); // Left
        } else if (this.shape === 'pentagon') {
            const r = w / 2;
            for (let i = 0; i < 5; i++) {
                const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
            }
        } else if (this.shape === 'hexagon') {
            const r = w / 2;
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
            }
        } else {
            // Square (Default)
            ctx.rect(-hw, -hh, w, h);
        }
        ctx.closePath();
    }

    drawHealthBar(ctx) {
        // Reset transform if dashing or special attacking (health bar shouldn't rotate)
        // Note: We handled save/restore in draw(), so ctx is clean here.

        // Apply Death Alpha for Health Bar Fade
        const currentAlpha = (this.deathAlpha !== undefined) ? this.deathAlpha : 1;
        if (currentAlpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = currentAlpha;

        // Disable shadow for UI
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        const barWidth = this.game.width * 0.8; // 80% of screen
        const barHeight = 40;
        const barX = (this.game.width - barWidth) / 2;
        const barY = this.game.height - 60; // Bottom margin

        const segmentGap = 10;
        const totalGap = segmentGap * (this.maxHealth - 1);
        const segmentWidth = (barWidth - totalGap) / this.maxHealth;

        // Background Bar Container
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

        // Draw "HP" Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Outfit", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText("HP", barX, barY - 15);

        // Health Segments
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
}
