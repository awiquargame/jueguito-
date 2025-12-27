class LocalizationManager {
    constructor() {
        this.currentLang = 'es'; // Default language
        this.dictionary = {
            "es": {
                "menu.title": "NEON AVOIDANCE",
                "menu.subtitle": "Esquiva los obstáculos. Sobrevive al caos.",
                "btn.play": "JUGAR",
                "btn.skins": "ASPECTOS",
                "btn.settings": "AJUSTES",
                "menu.controls.move": "Usa <span>WASD</span> o <span>FLECHAS</span> para moverte",
                "menu.controls.pause": "<span>P</span> para Pausar",
                "skins.title": "SELECCIONAR ASPECTO",
                "btn.prev": "<",
                "btn.next": ">",
                "btn.back": "VOLVER",
                "settings.title": "AJUSTES",
                "settings.music": "VOLUMEN MÚSICA",
                "settings.sfx": "VOLUMEN SFX",
                "settings.language": "IDIOMA: ESPAÑOL",
                "settings.size": "TAMAÑO: ",
                "size.small": "PEQUEÑO",
                "size.normal": "NORMAL",
                "size.large": "GRANDE",
                "size.fullscreen": "PANTALLA COMPLETA",
                "pause.title": "PAUSA",
                "btn.resume": "REANUDAR",
                "btn.menu": "MENÚ PRINCIPAL",
                "gameover.title": "JUEGO TERMINADO",
                "gameover.score": "PUNTOS: ",
                "gameover.best": "MEJOR: ",
                "btn.retry": "REINTENTAR",
                "hud.score": "PUNTUACIÓN: ",
                "hud.slowmo": "CÁMARA LENTA: ",
                "skins.locked": "Bloqueado",
                "floating.score": "+"
            },
            "en": {
                "menu.title": "NEON AVOIDANCE",
                "menu.subtitle": "Dodge the obstacles. Survive the chaos.",
                "btn.play": "PLAY",
                "btn.skins": "SKINS",
                "btn.settings": "SETTINGS",
                "menu.controls.move": "Use <span>WASD</span> or <span>ARROWS</span> to move",
                "menu.controls.pause": "<span>P</span> to Pause",
                "skins.title": "SELECT SKIN",
                "btn.prev": "<",
                "btn.next": ">",
                "btn.back": "BACK",
                "settings.title": "SETTINGS",
                "settings.music": "MUSIC VOLUME",
                "settings.sfx": "SFX VOLUME",
                "settings.language": "LANGUAGE: ENGLISH",
                "settings.size": "SIZE: ",
                "size.small": "SMALL",
                "size.normal": "NORMAL",
                "size.large": "LARGE",
                "size.fullscreen": "FULL SCREEN",
                "pause.title": "PAUSED",
                "btn.resume": "RESUME",
                "btn.menu": "MAIN MENU",
                "gameover.title": "GAME OVER",
                "gameover.score": "SCORE: ",
                "gameover.best": "BEST: ",
                "btn.retry": "RETRY",
                "hud.score": "SCORE: ",
                "hud.slowmo": "SLOW MOTION: ",
                "skins.locked": "Locked",
                "floating.score": "+"
            }
        };
    }

    setLanguage(lang) {
        if (!this.dictionary[lang]) return;
        this.currentLang = lang;
        this.updateDOM();

        // Save preference if we had local storage (optional for now)
        // localStorage.setItem('lang', lang); 
    }

    toggleLanguage() {
        const newLang = this.currentLang === 'es' ? 'en' : 'es';
        this.setLanguage(newLang);
        return newLang;
    }

    getString(key) {
        return this.dictionary[this.currentLang][key] || key;
    }

    updateDOM() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.dictionary[this.currentLang][key];
            if (translation) {
                // If the translation contains HTML (like spans), use innerHTML
                if (translation.includes('<')) {
                    el.innerHTML = translation;
                } else {
                    el.innerText = translation;
                }
            }
        });

        // Special case for dynamic text that might need concatenation (handled in Game.js mainly, but static UI here)
    }
}
