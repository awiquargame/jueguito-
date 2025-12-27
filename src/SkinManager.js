class SkinManager {
    constructor() {
        this.skins = [
            { id: 'cyan', name: 'Cyan Neón', color: '#00f3ff', unlockScore: 0 },
            { id: 'purple', name: 'Púrpura Cyber', color: '#bc13fe', unlockScore: 100 },
            { id: 'lime', name: 'Lima Tóxico', color: '#39ff14', unlockScore: 150 },
            { id: 'rose', name: 'Rosa Intenso', color: '#ff007f', unlockScore: 250 },
            { id: 'yellow', name: 'Amarillo Solar', color: '#ffea00', unlockScore: 350 },
            { id: 'white', name: 'Blanco Puro', color: '#ffffff', unlockScore: 550 },
            { id: 'orange', name: 'Naranja Neón', color: '#ff8c00', unlockScore: 650 },
            { id: 'deeppink', name: 'Rosa Profundo', color: '#ff1493', unlockScore: 750 },
            { id: 'teal', name: 'Turquesa Eléctrico', color: '#008080', unlockScore: 900 },
            { id: 'gold', name: 'Oro Real', color: '#ffd700', unlockScore: 1100 },
            { id: 'crimson', name: 'Rojo Carmesí', color: '#dc143c', unlockScore: 1300 },
            { id: 'indigo', name: 'Azul Índigo', color: '#4b0082', unlockScore: 1500 },
            { id: 'jake', name: 'JAKE', color: '#FFD700', unlockScore: 999999, isSecret: true } // Secret Skin
        ];

        this.currentSkinId = 'cyan'; // Reset to default on game load
    }

    getSkins() {
        return this.skins;
    }

    getCurrentSkin() {
        return this.skins.find(s => s.id === this.currentSkinId) || this.skins[0];
    }

    isUnlocked(skinId, highScore) {
        const skin = this.skins.find(s => s.id === skinId);
        if (!skin) return false;
        if (skin.isSecret) {
            // Check specific unlock condition (e.g. from localStorage or special event)
            // For now, checks if 'jake_secret_unlocked' exists in localStorage
            return localStorage.getItem('jake_secret_unlocked') === 'true';
        }
        return highScore >= skin.unlockScore;
    }

    selectSkin(id, highScore) {
        if (this.isUnlocked(id, highScore)) {
            this.currentSkinId = id;
            localStorage.setItem('neon_survive_skin', id);
            return true;
        }
        return false;
    }
}
