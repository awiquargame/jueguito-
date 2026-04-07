class SettingsManager {
    constructor() {
        this.defaults = {
            quality: 'HIGH', // LOW, MEDIUM, HIGH
            fpsLimit: 60,    // 30, 60, 144 (or 'UNLIMITED' but let's stick to numbers for math)
            neon: true,      // Glow effects
            particles: true, // Particle effects
            screenSize: 1,    // 0=Small, 1=Normal, 2=Large, 3=Full
            musicVolume: 50, // 0-100
            sfxVolume: 15    // 0-100
        };
        this.settings = this.loadSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('neon_survive_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { ...this.defaults, ...parsed };
            } catch (e) {
                console.error("Failed to parse settings", e);
                return { ...this.defaults };
            }
        }
        return { ...this.defaults };
    }

    saveSettings() {
        localStorage.setItem('neon_survive_settings', JSON.stringify(this.settings));
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }

    // Helper to get shadow blur based on settings
    getShadowBlur(defaultBlur) {
        if (!this.settings.neon || this.settings.quality === 'LOW') return 0;
        if (this.settings.quality === 'MEDIUM') return defaultBlur * 0.5;
        return defaultBlur;
    }

    shouldDrawParticles() {
        return this.settings.particles && this.settings.quality !== 'LOW';
    }

    hexToRgba(hex, alpha) {
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length == 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
        }
        return `rgba(255, 255, 255, ${alpha})`; // Fallback
    }
}
