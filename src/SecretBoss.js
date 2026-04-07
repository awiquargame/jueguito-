class SecretBoss extends Boss {
    constructor(game) {
        super(game, 'secret');
        this.type = 'secret';
        this.name = "ABSOLUTE VOID";
        this.color = '#111111'; // Darker Gray
        this.width = 120;
        this.height = 120;

        // Final position (Center)
        this.targetX = this.game.width / 2 - this.width / 2;
        this.targetY = this.game.height / 3;

        this.x = this.targetX;
        this.y = -200;

        this.visible = true; // Ensure visibility on spawn

        this.health = 10;
        this.maxHealth = 10;
        this.shape = 'circle';

        this.phase = 1;

        this.attackInterval = 1000; // Very Fast Attacks
        this.attackTimer = 0;
        this.currentAttack = null;
        this.attackState = 'ENTRY';

        this.isVulnerable = false;
        this.vulnCounter = 0;
        this.isFinalSequence = false;
        this.finalTimer = 0;
        this.sword = null;
        this.cinematicActive = false;

        this.angle = 0;

        // Background Particles
        this.bgParticles = [];
        for (let i = 0; i < 50; i++) {
            this.bgParticles.push({
                x: Math.random() * this.game.width,
                y: Math.random() * this.game.height,
                vy: - (Math.random() * 2 + 1), // Rising
                size: Math.random() * 3 + 1,
                alpha: Math.random() * 0.5 + 0.1
            });
        }
    }

    update(deltaTime) {
        if (this.markedForDeletion) return;

        // Smooth Movement
        if (this.attackState === 'DYING') {
            this.updateEpicDeath(deltaTime);
            return;
        }

        if (this.attackState === 'ENTRY') {
            const dy = this.targetY - this.y;
            this.y += dy * 0.05; // Ease out
            if (Math.abs(dy) < 1) {
                this.y = this.targetY;
                this.attackState = 'IDLE';
                this.attackTimer = 1000;
            }
            return;
        }

        // Phase Logic
        if (this.health <= 7 && this.health > 4 && this.phase !== 2) this.phase = 2;
        else if (this.health <= 4 && this.health > 1 && this.phase !== 3) this.phase = 3;
        else if (this.health <= 1 && !this.isFinalSequence) {
            this.startFinalSequence();
        }

        if (this.cinematicActive) {
            if (this.game.input && this.game.input.keys[' ']) {
                this.die();
                this.cinematicActive = false;
            }
            return;
        }

        if (this.isFinalSequence) {
            this.updateFinalSequence(deltaTime);
            return;
        }

        if (this.isVulnerable) {
            this.vulnerabilityTimer -= deltaTime;
            this.blinkTimer += deltaTime;
            if (this.blinkTimer > 50) {
                this.blinkState = !this.blinkState;
                this.blinkTimer = 0;
            }
            if (this.vulnerabilityTimer <= 0) {
                this.endVulnerability();
            }
            return;
        }

        // Attack Logic
        if (this.currentAttack) {
            this.currentAttack.update(deltaTime);
            if (this.currentAttack.isFinished) {
                this.currentAttack = null;
                this.attackTimer = 0;
                this.visible = true; // Ensure visibility
                this.x = this.targetX;
                this.y = this.targetY;

                this.vulnCounter++;
                if (this.vulnCounter >= 3) {
                    this.startVulnerability();
                    this.vulnCounter = 0;
                }
            }
        } else {
            this.attackTimer += deltaTime;
            if (this.attackTimer >= this.attackInterval) {
                this.chooseAttack();
            }
            // Fix: Keep boss stationary (No hovering)
            this.y = this.targetY;
            this.x = this.targetX;
        }

        // Update Background Particles
        this.bgParticles.forEach(p => {
            p.y += p.vy * (deltaTime / 16);
            if (p.y < 0) {
                p.y = this.game.height;
                p.x = Math.random() * this.game.width;
            }
        });
    }

    chooseAttack() {
        if (this.phase === 1) {
            if (Math.random() < 0.5) this.currentAttack = new SplitAttack(this, 3); // Was 2
            else this.currentAttack = new ExplosionAreaAttack(this, false);
        } else if (this.phase === 2) {
            if (Math.random() < 0.5) this.currentAttack = new SplitAttack(this, 5); // Was 3
            else this.currentAttack = new ExplosionAreaAttack(this, true);
        } else if (this.phase === 3) {
            if (Math.random() < 0.5) this.currentAttack = new VortexAttack(this); // Stronger pull logic in class
            else this.currentAttack = new CannonAttack(this);
        }
        if (this.currentAttack) this.addFloatingText(this.currentAttack.name, "#fff");
    }

    startFinalSequence() {
        this.isFinalSequence = true;
        this.health = 1;
        this.isVulnerable = false;
        this.finalTimer = 7000;
        this.game.triggerShake(1000, 5);
        this.addFloatingText("SURVIVE!", "#FF0000");
        this.game.zoomTarget = 0.5;
        this.attackState = 'WAITING_FOR_KILL'; // New state
    }

    updateFinalSequence(deltaTime) {
        if (this.finalTimer > 0) {
            this.finalTimer -= deltaTime;
            this.angle += 0.1;
            // Bullet Hell (Balanced)
            if (Math.random() < 0.3) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 4 + Math.random() * 4;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                const type = Math.random() < 0.5 ? 'circle' : 'triangle';
                const hue = Math.random() * 360;
                const obs = new Projectile(this.game,
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    vx, vy, type, `hsl(${hue},100%,50%)`);
                this.game.obstacleManager.obstacles.push(obs);
            }
        } else if (this.attackState === 'WAITING_FOR_KILL') {
            this.game.zoomTarget = 1.0;
            this.isVulnerable = true;
            this.blinkState = Math.floor(Date.now() / 100) % 2 === 0; // Fast blink

            // Check for Dash Kill
            const p = this.game.player;
            if (p.isDashing) {
                if (Math.hypot(p.x + p.width / 2 - (this.x + this.width / 2), p.y + p.height / 2 - (this.y + this.height / 2)) < this.width / 2 + p.width / 2) {
                    this.die();
                }
            }
        }
    }

    // Removed spawnSword

    die() {
        this.visible = true;
        this.attackState = 'DYING'; // Custom Dying State
        this.deathTimer = 0;
        this.game.scoreManager.highScore = 10000;
        this.game.scoreManager.saveHighScore();

        // Initial Impact
        this.game.triggerShake(500, 20);
        this.game.addFloatingText(this.game.width / 2, this.game.height / 2, "FATAL ERROR", "#FF0000");
    }

    updateEpicDeath(dt) {
        this.deathTimer += dt;

        // 1. "Critical Error" Phase (0-4s)
        if (this.deathTimer < 4000) {
            // Constant Shake
            if (this.deathTimer % 500 < 20) this.game.triggerShake(200, 5);

            // Flashing
            this.visible = Math.floor(this.deathTimer / 100) % 2 === 0;

            // Spawn random glitches/particles
            if (Math.random() < 0.5) {
                this.game.obstacleManager.obstacles.push(new ExplosionEffect(this.game,
                    this.x + Math.random() * this.width,
                    this.y + Math.random() * this.height,
                    '#fff', 10, 10));
            }
        }
        // 2. "Collapse" Phase (4-7s)
        else if (this.deathTimer < 7000) {
            this.visible = true;
            // Implosion/White out effect handled in draw
            if (this.deathTimer % 1000 < 20) this.addFloatingText("SYSTEM FAILURE", "#FF0000");
        }
        // 3. End (7s)
        else {
            this.game.victory();
        }
    }

    startVulnerability() {
        this.isVulnerable = true;
        this.vulnerabilityTimer = 3000;
        this.addFloatingText("HIT ME!", "#FFFFFF");
    }
    endVulnerability() {
        this.isVulnerable = false;
        this.blinkState = false;
    }

    drawBackground(ctx) {
        // Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.game.height);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(1, '#220022'); // Dark Purple at bottom
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.game.width, this.game.height);

        // Particles
        ctx.save();
        ctx.fillStyle = '#ffffff';
        this.bgParticles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    draw(ctx) {
        if (this.attackState === 'WAITING_FOR_KILL') {
            // Draw Prompt continuously
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(Date.now() / 200) * 0.5})`;
            ctx.font = 'bold 40px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 10;
            ctx.fillText("¡ACABA CON ESTO!", this.game.width / 2, this.game.height / 2 + 200);
            ctx.restore();
        }

        // Draw Current Attack Effects FIRST (behind boss usually, or overlay)
        if (this.currentAttack) {
            this.currentAttack.draw(ctx);
        }

        // 1. VOID AURA (Rotating Dashed Ring)
        if (this.visible) {
            ctx.save();
            ctx.strokeStyle = '#330033'; // Dark Purple
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 10]);
            ctx.rotate(this.game.gameTime / 1000); // Slow rotation
            ctx.beginPath();
            ctx.arc(0, 0, this.width * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // 2. GLITCH EFFECT (Random Offset Layers)
            // Occurs randomly
            const isGlitch = Math.random() < 0.1;
            const offsetX = isGlitch ? (Math.random() - 0.5) * 10 : 0;
            const offsetY = isGlitch ? (Math.random() - 0.5) * 10 : 0;

            // Draw Red Split (Glitch)
            if (isGlitch) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#ff0000';
                ctx.translate(offsetX, offsetY);
                ctx.beginPath();
                ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Draw Cyan Split (Glitch)
            if (isGlitch) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#00ffff';
                ctx.translate(-offsetX, -offsetY);
                ctx.beginPath();
                ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // MAIN BODY
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

            if (this.isVulnerable && this.blinkState) {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#ffffff'; // Blink white
            } else {
                ctx.fillStyle = this.color;
            }

            ctx.shadowBlur = 30;
            ctx.shadowColor = this.color;

            // Base Circle
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fill();

            // CORE (Unstable)
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 40 + Math.random() * 20; // Pulsing shadow
            ctx.shadowColor = '#ffffff';
            const coreSize = 15 + Math.sin(this.game.gameTime / 200) * 5; // Pulsing size
            ctx.beginPath();
            ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Eyes (Empty Void)
            if (this.phase === 3) {
                // Angry Eyes
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.moveTo(10, -10);
                ctx.lineTo(30, -20);
                ctx.lineTo(30, -5);
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(-10, -10);
                ctx.lineTo(-30, -20);
                ctx.lineTo(-30, -5);
                ctx.fill();
            } else {
                // Normal "Void" Eyes (White/Empty)
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(20, -10, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(-20, -10, 8, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();

            // Health Bar
            if (!this.isFinalSequence && this.health > 1) {
                const barWidth = this.game.width * 0.8;
                const barHeight = 40;
                const barX = (this.game.width - barWidth) / 2;
                const barY = this.game.height - 60;
                const segmentGap = 10;
                const segmentWidth = (barWidth - (segmentGap * (this.maxHealth - 1))) / this.maxHealth;

                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

                for (let i = 0; i < this.maxHealth; i++) {
                    const segX = barX + i * (segmentWidth + segmentGap);
                    if (i < this.health) {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(segX, barY, segmentWidth, barHeight);
                    } else {
                        ctx.fillStyle = 'rgba(255,255,255,0.2)';
                        ctx.fillRect(segX, barY, segmentWidth, barHeight);
                    }
                }
            }
            this.drawGlitchCorners(ctx);
        }
    }

    drawGlitchCorners(ctx) {
        // Epic Death Visuals
        if (this.attackState === 'DYING') {
            const w = this.game.width;
            const h = this.game.height;

            // Phase 2: White Fade Out
            if (this.deathTimer > 4000) {
                const alpha = (this.deathTimer - 4000) / 3000;
                ctx.save();
                ctx.globalAlpha = Math.min(alpha, 1.0);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, w, h);
                ctx.restore();
            }

            // Extreme Glitching
            ctx.save();
            ctx.globalCompositeOperation = 'exclusion';
            for (let i = 0; i < 20; i++) {
                ctx.fillStyle = Math.random() < 0.5 ? '#ff00ff' : '#00ffff';
                const rx = Math.random() * w;
                const ry = Math.random() * h;
                const rw = Math.random() * w;
                const rh = Math.random() * 10;
                ctx.fillRect(rx, ry, rw, rh);
            }
            ctx.restore();
            return;
        }

        // Intensity based on missing health (0.0 to 1.0)
        // Max health is 10. 
        let lostHealth = this.maxHealth - this.health;
        // Clamp 0
        if (lostHealth < 0) lostHealth = 0;

        let intensity = lostHealth / this.maxHealth;

        // Boost intensity in final sequence (Health is 1 or 0)
        if (this.isFinalSequence) intensity = 1.0;

        // Base chance to show effect increases with intensity
        // Low intensity = rare glitches. High intensity = constant chaos.
        if (Math.random() > (0.2 + intensity * 0.8)) return;

        const w = this.game.width;
        const h = this.game.height;
        // Corner area size grows
        const cornerSize = 50 + (intensity * 250);

        ctx.save();
        // 'exclusion' or 'difference' creates a nice digital glitch inverted look
        ctx.globalCompositeOperation = 'exclusion';

        const corners = [
            { x: 0, y: 0, dx: 1, dy: 1 },    // TL
            { x: w, y: 0, dx: -1, dy: 1 },   // TR
            { x: 0, y: h, dx: 1, dy: -1 },   // BL
            { x: w, y: h, dx: -1, dy: -1 }   // BR
        ];

        corners.forEach(c => {
            // Randomly skip corners if intensity is low
            if (Math.random() > (0.3 + intensity * 0.7)) return;

            // Number of glitch artifacts
            const numArtifacts = Math.floor(intensity * 10) + 2;

            for (let i = 0; i < numArtifacts; i++) {
                // Random offset from corner
                const ox = Math.random() * cornerSize * c.dx;
                const oy = Math.random() * cornerSize * c.dy;

                // Size of rect
                const rw = Math.random() * (cornerSize / 2);
                const rh = Math.random() * 10 + 2; // Thin strips often look laggy

                // Colors: Magenta, Cyan, White, Limit
                const colors = ['#ff00ff', '#00ffff', '#ffffff', '#ff0000'];
                ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];

                ctx.fillRect(c.x + ox, c.y + oy, rw, rh);
            }
        });

        ctx.restore();
    }
}

class SplitAttack {

    constructor(boss, count) {
        this.boss = boss;
        this.count = count;
        this.balls = [];
        this.name = "SPLIT";
        this.timer = 0;
        this.duration = 4000;
        this.isFinished = false;
        this.state = 'OUT'; // OUT, BOUNCE, IN

        this.items = []; // Local visual items

        // Create visual balls at boss center
        const cx = boss.x + boss.width / 2;
        const cy = boss.y + boss.height / 2;

        for (let i = 0; i < count; i++) {
            this.items.push({
                x: cx, y: cy,
                targetX: cx + (Math.random() - 0.5) * 400,
                targetY: cy + (Math.random() - 0.5) * 400,
                vx: (Math.random() - 0.5) * 25,
                vy: (Math.random() - 0.5) * 25,
                r: 20,
                trail: [] // Store previous positions
            });
        }
        this.boss.visible = false;
    }

    update(dt) {
        this.timer += dt;

        // Update Trails
        this.items.forEach(b => {
            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 10) b.trail.shift();
        });

        if (this.state === 'OUT') {
            let reached = true;
            this.items.forEach(b => {
                b.x += (b.targetX - b.x) * 0.1;
                b.y += (b.targetY - b.y) * 0.1;
                if (Math.hypot(b.targetX - b.x, b.targetY - b.y) > 5) reached = false;
                // Collision Check during OUT (Forgiving hitbox)
                const p = this.boss.game.player;
                if (Math.hypot(p.x + p.width / 2 - b.x, p.y + p.height / 2 - b.y) < b.r + (p.width / 2) * 0.8) {
                    p.takeDamage();
                }
            });
            if (reached) {
                this.state = 'BOUNCE';
                this.bounceTimer = 0;
            }
        } else if (this.state === 'BOUNCE') {
            this.bounceTimer += dt;
            this.items.forEach(b => {
                b.x += b.vx;
                b.y += b.vy;
                // Bounce walls
                if (b.x < 0 || b.x > this.boss.game.width) b.vx *= -1;
                if (b.y < 0 || b.y > this.boss.game.height) b.vy *= -1;
                // Collision Check during BOUNCE (Forgiving hitbox)
                const p = this.boss.game.player;
                if (Math.hypot(p.x + p.width / 2 - b.x, p.y + p.height / 2 - b.y) < b.r + (p.width / 2) * 0.8) {
                    p.takeDamage();
                }
            });
            if (this.bounceTimer > 2000) this.state = 'IN';
        } else if (this.state === 'IN') {
            const cx = this.boss.x + this.boss.width / 2;
            const cy = this.boss.y + this.boss.height / 2;
            let reached = true;
            this.items.forEach(b => {
                b.x += (cx - b.x) * 0.1;
                b.y += (cy - b.y) * 0.1;
                if (Math.hypot(cx - b.x, cy - b.y) > 5) reached = false;
                // Collision Check during IN (Forgiving hitbox)
                const p = this.boss.game.player;
                if (Math.hypot(p.x + p.width / 2 - b.x, p.y + p.height / 2 - b.y) < b.r + (p.width / 2) * 0.8) {
                    p.takeDamage();
                }
            });
            if (reached) {
                this.boss.visible = true;
                this.isFinished = true;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        const isPhase2 = this.boss.phase >= 2;
        const mainColor = isPhase2 ? '#ff4400' : '#ffffff'; // Orange/Red in Phase 2
        const trailColor = isPhase2 ? '#ff0000' : '#ff00ff'; // Red trail in Phase 2

        this.items.forEach(b => {
            // Draw Trail
            ctx.beginPath();
            ctx.strokeStyle = trailColor;
            ctx.lineWidth = isPhase2 ? 15 : 10; // Thicker trail
            ctx.lineCap = 'round';
            if (b.trail.length > 0) {
                ctx.moveTo(b.trail[0].x, b.trail[0].y);
                for (let i = 1; i < b.trail.length; i++) {
                    ctx.lineTo(b.trail[i].x, b.trail[i].y);
                }
                ctx.globalAlpha = 0.5;
                ctx.stroke();
            }

            // Draw Ball
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = mainColor;
            ctx.shadowBlur = isPhase2 ? 30 : 20;
            ctx.shadowColor = trailColor;
            ctx.beginPath();
            // Pulsing size (Faster in Phase 2)
            const speed = isPhase2 ? 50 : 100;
            const pulse = Math.sin(this.timer / speed) * (isPhase2 ? 8 : 5);
            ctx.arc(b.x, b.y, b.r + pulse, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = trailColor;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r * 0.6, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }
}

class ExplosionAreaAttack {
    constructor(boss, particles) {
        this.boss = boss;
        this.particles = particles;
        this.name = "BLAST";
        this.areas = [];
        this.timer = 0;
        this.duration = 1500; // Faster explosion (was 3000)
        this.isFinished = false;

        for (let i = 0; i < 3; i++) {
            this.areas.push({
                x: Math.random() * (boss.game.width - 100),
                y: Math.random() * (boss.game.height - 100),
                w: 120, h: 120,
                exploded: false
            });
        }
    }
    update(dt) {
        this.timer += dt;
        if (this.timer > this.duration + 500) this.isFinished = true;

        if (this.timer >= this.duration && !this.areas[0].exploded) {
            this.areas.forEach(a => {
                a.exploded = true;
                this.boss.game.triggerShake(200, 5);
                // Damage
                const p = this.boss.game.player;
                const cx = a.x + a.w / 2;
                const cy = a.y + a.h / 2;
                if (Math.hypot(p.x + p.width / 2 - cx, p.y + p.height / 2 - cy) < a.w / 2) {
                    p.takeDamage();
                }

                // Visual Explosion
                const ex = new ExplosionEffect(this.boss.game, a.x, a.y, '#FF0000', a.w, a.h);
                this.boss.game.obstacleManager.obstacles.push(ex);

                if (this.particles) {
                    for (let i = 0; i < 8; i++) {
                        const o = new Obstacle(this.boss.game);
                        o.x = cx; o.y = cy;
                        o.vx = (Math.random() - 0.5) * 12;
                        o.vy = (Math.random() - 0.5) * 12;
                        this.boss.game.obstacleManager.obstacles.push(o);
                    }
                }
            });
        }
    }

    draw(ctx) {
        const isPhase2 = this.boss.phase >= 2;

        this.areas.forEach(a => {
            if (a.exploded) return;
            const progress = this.timer / this.duration;
            ctx.save();

            // Jitter effect for warning (Shaking circle)
            // Phase 2: More violent shake
            const shakeThreshold = isPhase2 ? 0.3 : 0.7;
            const shakeAmount = isPhase2 ? 15 : 10;
            const jitter = progress > shakeThreshold ? (Math.random() - 0.5) * shakeAmount : 0;

            const cx = a.x + a.w / 2 + jitter;
            const cy = a.y + a.h / 2 + jitter;

            // Warning Circle color
            // Phase 2: Orange/Red strobe vs Red strobe
            // Just make it faster and maybe brighter
            const strobeSpeed = isPhase2 ? 30 : 50;
            ctx.strokeStyle = `rgba(255, ${isPhase2 ? 100 : 0}, 0, ${0.5 + Math.sin(this.timer / strobeSpeed) * 0.5})`;
            ctx.lineWidth = 5 + progress * 5;
            ctx.setLineDash([20, 10]);

            // Rotating outer ring
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(this.timer / (isPhase2 ? 100 : 200));
            ctx.beginPath();
            ctx.arc(0, 0, a.w / 2, 0, Math.PI * 2);
            ctx.stroke();

            // Phase 2: Double Ring
            if (isPhase2) {
                ctx.beginPath();
                ctx.arc(0, 0, a.w / 2 * 0.8, 0, Math.PI * 2);
                ctx.setLineDash([10, 5]);
                ctx.stroke();
            }
            ctx.restore();

            // Inner Fill
            ctx.fillStyle = `rgba(255, 0, 0, ${progress * 0.8})`;
            ctx.beginPath();
            ctx.arc(cx, cy, a.w / 2 * progress, 0, Math.PI * 2);
            ctx.fill();

            // Text Warning
            if (progress > 0.5) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 20px "Outfit", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const text = isPhase2 ? "CRITICAL" : "TARGET LOCKED";
                ctx.fillText(text, cx, cy);
            }

            ctx.restore();
        });
    }
}

class VortexAttack {
    constructor(boss) {
        this.boss = boss;
        this.name = "VORTEX";
        this.timer = 0;
        this.duration = 6000; // Slightly longer for the intro
        this.isFinished = false;

        // Start at Boss Position
        this.x = boss.x + boss.width / 2;
        this.y = boss.y + boss.height / 2;

        // Target: Center of Screen
        this.targetX = boss.game.width / 2;
        this.targetY = boss.game.height / 2;

        this.currentRadius = 0; // Starts small
        this.maxRadius = 250;

        this.particles = [];
        this.boss.visible = false; // Boss "becomes" the vortex
    }

    update(dt) {
        this.timer += dt;
        if (this.timer > this.duration) {
            this.boss.visible = true;
            this.isFinished = true;
            this.boss.x = this.targetX - this.boss.width / 2; // Ensure boss pops out at center
            this.boss.y = this.targetY - this.boss.height / 2;
            return;
        }

        // Animate Position (Lerp to center) - First 2 seconds
        if (this.timer < 2000) {
            const t = this.timer / 2000;
            // Ease out cubic
            const ease = 1 - Math.pow(1 - t, 3);
            this.x = this.x + (this.targetX - this.x) * 0.05; // Smooth drift
            this.y = this.y + (this.targetY - this.y) * 0.05;
        }

        // Gets bigger
        if (this.currentRadius < this.maxRadius) {
            this.currentRadius += dt * 0.1;
        }

        // Spawn Particles at edge (Dynamic Radius)
        if (Math.random() < 0.5) {
            const angle = Math.random() * Math.PI * 2;
            const r = this.currentRadius + 150; // Start outside current radius
            this.particles.push({
                x: this.x + Math.cos(angle) * r,
                y: this.y + Math.sin(angle) * r,
                vx: 0, vy: 0,
                life: 1.0,
                color: Math.random() < 0.5 ? '#ff00ff' : '#ffffff'
            });
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            const dx = this.x - p.x;
            const dy = this.y - p.y;
            const dist = Math.hypot(dx, dy);

            p.x += (dx / dist) * 15; // Move to center
            p.y += (dy / dist) * 15;
            p.life -= dt / 1000;

            if (dist < 20 || p.life <= 0) this.particles.splice(i, 1);
        }

        // Pull Player
        const p = this.boss.game.player;
        const dx = this.x - (p.x + p.width / 2);
        const dy = this.y - (p.y + p.height / 2);
        const dist = Math.hypot(dx, dy) || 1;

        // Attraction (Tuned)
        const maxForce = 12.0;
        const forceVal = 2500 / dist;
        const f = Math.min(forceVal, maxForce);

        // Apply force
        p.x += (dx / dist) * f * (dt / 16);
        p.y += (dy / dist) * f * (dt / 16);

        // Damage at center
        if (dist < 40) {
            p.takeDamage();
        }
    }

    draw(ctx) {
        // Draw Vortex

        // Particles
        ctx.save();
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.timer / 100);

        // Dark Void Center
        ctx.beginPath();
        const drawRadius = Math.min(this.currentRadius, 40); // Center hole cap
        ctx.arc(0, 0, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Accretion Disk Lines
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 3;
        const lineLen = this.currentRadius; // Lines grow with radius
        for (let i = 0; i < 12; i++) {
            ctx.rotate(Math.PI / 6);
            ctx.beginPath();
            const offset = (this.timer * 0.1) % 50;
            ctx.moveTo(drawRadius + 10, 0);
            ctx.lineTo(lineLen - offset, 20);
            ctx.stroke();
        }
        ctx.restore();
    }
}

class CannonAttack {
    constructor(boss) {
        this.boss = boss;
        this.name = "CANNONS";
        this.timer = 0;
        this.isFinished = false;
        this.shotTimer = 0;
        this.flashes = []; // Store muzzle flashes
    }
    update(dt) {
        this.timer += dt;
        this.boss.angle += 0.05 + (this.timer / 6000) * 0.1; // Accelerate spin

        // Update Flashes
        for (let i = this.flashes.length - 1; i >= 0; i--) {
            this.flashes[i].life -= dt;
            if (this.flashes[i].life <= 0) this.flashes.splice(i, 1);
        }

        this.shotTimer += dt;
        if (this.shotTimer > 400) {
            this.shotTimer = 0;
            // Sound
            if (this.boss.game.sfxVolume > 0) {
                // Optional: Add sound trigger if available
            }

            for (let i = 0; i < 8; i++) {
                const angle = this.boss.angle + (Math.PI / 2 * i);
                const speed = 10;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;

                // Spawn Projectile (Energy Bolt)
                const p = new Projectile(this.boss.game,
                    this.boss.x + this.boss.width / 2 + vx * 2, // Offset slightly
                    this.boss.y + this.boss.height / 2 + vy * 2,
                    vx, vy, 'rect', '#00ffff'); // Cyan Bolts
                p.width = 40; // Long
                p.height = 10; // Thin
                p.rotation = angle; // Rotate to match direction (Projectile class needs to handle this?)
                // Projectile class usually draws rects aligned? 
                // Let's check Projectile.js if I can. 
                // Assuming standard Projectile just draws rect. 
                // If not, I might need a custom draw for these.
                // Revert to 'circle' but different color if unsafe.
                // Let's stick to 'circle' but Cyan and fast for safety, or check Projectile.js.
                // Actually, let's use 'circle' but bigger and cyan.
                p.type = 'circle';
                p.width = 25;
                p.height = 25;

                this.boss.game.obstacleManager.obstacles.push(p);

                // Add Muzzle Flash at the perimeter
                const radius = this.boss.width / 2;
                const fx = Math.cos(angle) * radius;
                const fy = Math.sin(angle) * radius;
                this.flashes.push({ x: fx, y: fy, life: 100, angle: angle });
            }
        }
        if (this.timer > 6000) this.isFinished = true;
    }
    draw(ctx) {
        const cx = this.boss.game.width / 2; // Boss is always center? No, Boss moves.
        // Boss draw function translates to boss center.
        // We should draw relative to Boss center if we are called inside boss.draw?
        // Wait, Boss.draw calls currentAttack.draw(ctx) AFTER translating to boss center?
        // Let's check Boss.draw mechanism or SecretBoss.draw.
        // SecretBoss.draw calls this.currentAttack.draw(ctx) BEFORE translating for body.
        // So we are currently in World Coordinates?
        // SecretBoss.js Line 248: this.currentAttack.draw(ctx). Wrapper does NOT save/restore or translate.
        // So we need to translate to Boss center.

        const centerX = this.boss.x + this.boss.width / 2;
        const centerY = this.boss.y + this.boss.height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);

        // Draw Cannons (8 orbiting rectangles)

        // Laser Sights (Draw BEFORE Cannons)
        if (this.shotTimer > 200) { // Aiming phase
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                const angle = this.boss.angle + (Math.PI / 2 * i);
                ctx.beginPath();
                ctx.moveTo(0, 0); // Center relative
                // Draw line outwards
                ctx.lineTo(Math.cos(angle) * 1000, Math.sin(angle) * 1000);
                ctx.stroke();
            }
            ctx.restore();
        }

        ctx.fillStyle = '#555';
        for (let i = 0; i < 8; i++) {
            const angle = this.boss.angle + (Math.PI / 2 * i);
            ctx.save();
            ctx.rotate(angle);
            ctx.translate(this.boss.width / 2, 0); // Move to edge
            ctx.fillRect(0, -10, 30, 20); // Barrel
            ctx.restore();
        }

        // Draw Flashes
        ctx.fillStyle = '#ffff00';
        for (const f of this.flashes) {
            ctx.save();
            ctx.translate(f.x, f.y); // Relative to boss center
            ctx.rotate(f.angle);
            ctx.globalAlpha = f.life / 100;
            ctx.beginPath();
            ctx.arc(15, 0, 20, 0, Math.PI * 2); // Flash at tip
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    }
}


