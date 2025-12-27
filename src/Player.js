class Player {
    constructor(game) {
        this.game = game;
        this.width = 40;
        this.height = 40;
        this.x = 0;
        this.y = 0;
        this.speed = 0.5; // pixels per ms

        // Jelly Effect Props
        this.scaleX = 1;
        this.scaleY = 1;

        // Dash Props
        this.canDash = true;
        this.dashCooldown = 0;
        this.dashMaxCooldown = 2000;
        this.isDashing = false;
        this.dashDuration = 200;
        this.dashTimer = 0;
        this.isInvulnerable = false;
        this.ghosts = [];

        // Movement Memory
        this.lastMoveX = 1; // Default right
        this.lastMoveY = 0;
        this.dashVelX = 0;
        this.dashVelY = 0;

        this.particles = [];
        this.updateColor();

        // JAKE Skin Prop
        this.skinImage = null;
        this.jakeImage = new Image();
        this.jakeImage.src = 'assets/Skins/jake.png';

        // Speed PowerUp Props
        this.speedMultiplier = 1.0;
        this.speedBoostTimer = 0;

        this.reset();
    }

    updateColor() {
        // Fetch color from the game's skin manager
        const currentSkin = this.game.skinManager.getCurrentSkin();
        this.color = currentSkin.color;

        if (currentSkin.id === 'jake') {
            this.skinImage = this.jakeImage;
        } else {
            this.skinImage = null; // Reset to vector skin when changing normal skins
        }
    }

    activateJakeSkin() {
        this.skinImage = this.jakeImage;
        this.color = '#FFFF00'; // Yellow particles
        console.log("JAKE Skin Activated!");
    }

    reset() {
        this.x = this.game.width / 2 - this.width / 2;
        this.y = this.game.height / 2 - this.height / 2;
        this.scaleX = 1;
        this.scaleY = 1;
        this.particles = [];
        this.ghosts = [];
        this.dashCooldown = 0;
        this.isDashing = false;
        this.isInvulnerable = false;
        this.isDead = false; // Reset dead state

        // Shield Props
        this.shieldActive = false;
        this.shieldTimer = 0;


        this.lastMoveX = 1;
        this.lastMoveY = 0;
        this.dashVelX = 0;
        this.dashVelY = 0;
    }

    attemptDash() {
        if (this.dashCooldown <= 0) {
            this.startDash();
        }
    }

    startDash() {
        this.isDashing = true;
        this.isInvulnerable = true;
        this.dashCooldown = this.dashMaxCooldown;
        this.dashTimer = 0;

        // Play Dash Sound
        if (this.game.dashSound) {
            this.game.dashSound.currentTime = 0;
            this.game.dashSound.play().catch(e => { });
        }

        // Determine Dash Direction
        const input = this.game.input.keys;
        let dx = 0;
        let dy = 0;

        if (input.up) dy = -1;
        if (input.down) dy = 1;
        if (input.left) dx = -1;
        if (input.right) dx = 1;

        // If no input, use last known direction
        if (dx === 0 && dy === 0) {
            dx = this.lastMoveX;
            dy = this.lastMoveY;
        }

        // Normalize (simple version)
        if (dx !== 0 && dy !== 0) {
            // approximate normalization for diagonals so dash distance is consistent
            dx *= 0.707;
            dy *= 0.707;
        }

        this.dashVelX = dx;
        this.dashVelY = dy;
    }


    update(deltaTime) {
        if (this.isDead) {
            // Only update particles
            this.particles.forEach(p => {
                p.x += p.vx * (deltaTime / 16);
                p.y += p.vy * (deltaTime / 16);
                p.life -= deltaTime;
                p.alpha = p.life / p.maxLife;
            });
            this.particles = this.particles.filter(p => p.life > 0);
            return;
        }

        const input = this.game.input.keys;

        // Dash State Management
        if (this.isDashing) {
            this.dashTimer += deltaTime;
            if (this.dashTimer > this.dashDuration) {
                this.isDashing = false;
                this.isInvulnerable = this.shieldActive; // Revert to shield state
            }
        }

        // Cooldown Management
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
            if (this.dashCooldown < 0) this.dashCooldown = 0;
        }

        // Shield Timer
        if (this.shieldActive) {
            this.shieldTimer -= deltaTime;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
                if (!this.isDashing) this.isInvulnerable = false;
            }
        }

        // Speed Boost Timer
        if (this.speedBoostTimer > 0) {
            this.speedBoostTimer -= deltaTime;
            if (this.speedBoostTimer <= 0) {
                this.speedMultiplier = 1.0;
                this.speedBoostTimer = 0;
            }
        }

        // Update UI
        const dashBar = document.getElementById('dash-bar');
        if (dashBar) {
            const pct = 100 - (this.dashCooldown / this.dashMaxCooldown * 100);
            dashBar.style.width = pct + '%';
        }

        let moveX = 0;
        let moveY = 0;
        let moving = false;

        if (this.isDashing) {

            // Move based on locked Dash Direction
            // Dash speed multiplier: 4x
            const dashSpeed = this.speed * 4;
            this.x += this.dashVelX * dashSpeed * deltaTime;
            this.y += this.dashVelY * dashSpeed * deltaTime;

            moveX = this.dashVelX;
            moveY = this.dashVelY;
            moving = true; // Always "moving" when dashing

        } else {
            // Standard Movement
            const velocity = this.speed * this.speedMultiplier * deltaTime;

            if (input.up) { this.y -= velocity; moveY = -1; moving = true; }
            if (input.down) { this.y += velocity; moveY = 1; moving = true; }
            if (input.left) { this.x -= velocity; moveX = -1; moving = true; }
            if (input.right) { this.x += velocity; moveX = 1; moving = true; }

            // Update Memory ONLY when actually moving
            if (moving) {
                // Determine raw direction for memory
                let lastX = 0;
                let lastY = 0;
                if (input.up) lastY = -1;
                if (input.down) lastY = 1;
                if (input.left) lastX = -1;
                if (input.right) lastX = 1;

                // Only update if we have a direction (which we should if moving is true)
                if (lastX !== 0 || lastY !== 0) {
                    this.lastMoveX = lastX;
                    this.lastMoveY = lastY;
                }
            }
        }

        // Jelly Logic
        let targetScaleX = 1;
        let targetScaleY = 1;

        // Initialize rotation if not exists
        if (typeof this.rotation === 'undefined') this.rotation = 0;

        if (moving) {
            // Stretch along the axis of movement
            targetScaleX = 1.3; // Length
            targetScaleY = 0.7; // Width

            // Calculate target rotation based on movement vector
            // We use atan2(y, x)
            const targetRotation = Math.atan2(moveY, moveX);

            // Smooth rotation (shortest path)
            let diff = targetRotation - this.rotation;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;

            this.rotation += diff * 0.2; // Lerp rotation
        } else {
            // Reset scales to normal when not moving
            // We keep rotation as is or let it stay at last angle
        }

        // Use lerp for smooth transition
        const lerpSpeed = 0.15;
        this.scaleX += (targetScaleX - this.scaleX) * lerpSpeed;
        this.scaleY += (targetScaleY - this.scaleY) * lerpSpeed;

        // Spawn Particles and Ghosts
        if (moving) {
            this.spawnParticles(moveX, moveY);
            if (this.isDashing) {
                // Spawn Ghost
                if (Math.random() < 0.8) { // Frequent ghosts
                    this.ghosts.push({
                        x: this.x,
                        y: this.y,
                        alpha: 0.6,
                        life: 200, // Short life
                        maxLife: 200,
                        scaleX: this.scaleX,
                        scaleY: this.scaleY,
                        color: this.color
                    });
                }
            }
        }

        // Update Particles
        this.particles.forEach(p => {
            p.x += p.vx * (deltaTime / 16);
            p.y += p.vy * (deltaTime / 16);
            p.life -= deltaTime;
            p.alpha = p.life / p.maxLife;
        });
        this.particles = this.particles.filter(p => p.life > 0);

        // Update Ghosts
        this.ghosts.forEach(g => {
            g.life -= deltaTime;
            g.alpha = (g.life / g.maxLife) * 0.6;
        });
        this.ghosts = this.ghosts.filter(g => g.life > 0);

        // Boundary checks
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > this.game.height) this.y = this.game.height - this.height;
    }

    spawnParticles(dirX, dirY) {
        // Spawn a few particles
        const count = this.isDashing ? 5 : 2; // More particles when dashing
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: this.x + this.width / 2 + (Math.random() * 20 - 10),
                y: this.y + this.height / 2 + (Math.random() * 20 - 10),
                vx: -dirX * (Math.random() * 2 + 1) + (Math.random() - 0.5),
                vy: -dirY * (Math.random() * 2 + 1) + (Math.random() - 0.5),
                life: 300,
                maxLife: 300,
                size: Math.random() * 5 + 2,
                color: this.color
            });
        }
    }

    explode() {
        this.isDead = true;
        this.particles = []; // Clear existing trail particles

        // 1. Split into 4 big chunks
        const chunks = [
            { vx: -2, vy: -2 }, // Top-Left
            { vx: 2, vy: -2 },  // Top-Right
            { vx: -2, vy: 2 },  // Bottom-Left
            { vx: 2, vy: 2 }    // Bottom-Right
        ];

        chunks.forEach(chunk => {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: chunk.vx + (Math.random() - 0.5),
                vy: chunk.vy + (Math.random() - 0.5),
                life: 1000,
                maxLife: 1000,
                size: this.width / 2.5, // Large chunks
                color: this.color
            });
        });

        // 2. Explosion Dust (Many small particles)
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 800 + Math.random() * 400,
                maxLife: 1200,
                size: Math.random() * 8 + 3,
                color: this.color
            });
        }
    }

    activateShield(duration) {
        this.shieldActive = true;
        this.shieldTimer = duration;
        this.isInvulnerable = true;
    }

    activateSpeedBoost(duration) {
        this.speedMultiplier = 1.5;
        this.speedBoostTimer = duration;
    }

    draw(ctx) {
        ctx.save();

        // Draw Ghosts
        this.ghosts.forEach(g => {
            ctx.save();
            ctx.globalAlpha = g.alpha;
            ctx.translate(g.x + this.width / 2, g.y + this.height / 2);
            ctx.scale(g.scaleX, g.scaleY);
            ctx.fillStyle = g.color;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        });

        // Draw Particles (before player loc adjustment)
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1.0;

        if (this.isDead) {
            ctx.restore();
            return; // Don't draw the main body if dead
        }

        // Draw Shield
        if (this.shieldActive) {
            ctx.save();
            ctx.strokeStyle = '#E0FFFF'; // Light Cyan
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#E0FFFF';

            // Pulse effect
            const pulse = Math.sin(Date.now() / 100) * 5;
            const radius = Math.max(this.width, this.height) / 1.5 + 5 + pulse;

            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Slight fill
            ctx.fillStyle = 'rgba(224, 255, 255, 0.2)';
            ctx.fill();
            ctx.restore();

            // Draw Timer Text
            ctx.save();
            ctx.font = 'bold 20px "Outfit", sans-serif';
            ctx.fillStyle = '#E0FFFF';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'black';
            // Position above player
            ctx.fillText((this.shieldTimer / 1000).toFixed(1) + 's', this.x + this.width / 2, this.y - 10);
            ctx.restore();
        }

        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        // Apply Jelly Transform
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.translate(centerX, centerY);
        if (this.rotation) ctx.rotate(this.rotation);
        ctx.scale(this.scaleX, this.scaleY);

        if (this.skinImage) {
            // Draw JAKE or other image skin
            ctx.drawImage(this.skinImage, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // Draw default vector skin
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

            // Inner detail to look "techy"
            ctx.fillStyle = '#fff';
            ctx.fillRect((-this.width / 2) + 10, (-this.height / 2) + 10, this.width - 20, this.height - 20);
        }

        ctx.restore();
    }
}
