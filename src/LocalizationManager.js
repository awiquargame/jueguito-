class LocalizationManager {
    constructor() {
        this.currentLang = 'es'; // Default language
        this.dictionary = {
            "es": {
                "menu.title": "Dashing into neo",
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
                "settings.graphics": "GRÁFICOS",
                "settings.reset": "BORRAR DATOS",
                "graphics.title": "GRÁFICOS",
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
                "hud.bosses": "JEFES DERROTADOS: ",
                "hud.slowmo": "CÁMARA LENTA: ",
                "skins.locked": "Bloqueado",
                "floating.score": "+",
                "upgrades.title": "MEJORAS",
                "upgrades.tab_basic": "BÁSICAS",
                "upgrades.tab_special": "HABILIDADES",
                "upgrades.speed": "VELOCIDAD",
                "upgrades.speed_desc": "Aumenta velocidad base.",
                "upgrades.dash": "RECARGA DASH",
                "upgrades.dash_desc": "Menor tiempo de espera.",
                "upgrades.extra_speed": "VELOCIDAD+",
                "upgrades.extra_speed_desc": "Pequeño impulso extra de velocidad.",
                "upgrades.dash_attack": "DASH MORTAL",
                "upgrades.dash_attack_desc": "El Dash destruye a los enemigos.",
                "upgrades.dash_score": "DASH DE MONEDAS",
                "upgrades.dash_score_desc": "Atravesar enemigos da monedas.",
                "upgrades.adrenaline": "ADRENALINA",
                "upgrades.adrenaline_desc": "La velocidad aumenta con la puntuación.",
                "upgrades.slot_speed": "MOVIMIENTO",
                "upgrades.slot_dash": "DASH",
                "upgrades.empty": "VACÍO",
                "btn.owned": "COMPRADO",
                "tools.heart.name": "Corazón Extra",
                "tools.heart.desc": "Comienza con un corazón extra.",
                "tools.score.name": "Impulso de Puntos",
                "tools.score.desc": "Aumenta el valor de los potenciadores de puntos.",
                "tools.flag.name": "Banderín",
                "tools.flag.desc": "Coloca un banderín al morir que te permite revivir una vez.",
                "tools.edit.name": "EL PODER DEL EDIT",
                "tools.edit.desc": "25% de probabilidad de DETENER EL TIEMPO al dashear."
            },
            "en": {
                "menu.title": "Dashing into neo",
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
                "settings.graphics": "GRAPHICS",
                "settings.reset": "RESET DATA",
                "graphics.title": "GRAPHICS",
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
                "hud.bosses": "BOSSES DEFEATED: ",
                "hud.slowmo": "SLOW MOTION: ",
                "skins.locked": "Locked",
                "floating.score": "+",
                "upgrades.title": "UPGRADES",
                "upgrades.tab_basic": "BASIC",
                "upgrades.tab_special": "ABILITIES",
                "upgrades.speed": "SPEED",
                "upgrades.speed_desc": "Increases base speed.",
                "upgrades.dash": "DASH COOLDOWN",
                "upgrades.dash_desc": "Reduces cooldown time.",
                "upgrades.extra_speed": "SPEED+",
                "upgrades.extra_speed_desc": "Small extra speed boost.",
                "upgrades.dash_attack": "DEADLY DASH",
                "upgrades.dash_attack_desc": "Dash destroys enemies.",
                "upgrades.dash_score": "COIN DASH",
                "upgrades.dash_score_desc": "Dashing through enemies gives coins.",
                "upgrades.adrenaline": "ADRENALINE",
                "upgrades.adrenaline_desc": "Speed increases with score.",
                "btn.owned": "OWNED",
                "tools.heart.name": "Extra Heart",
                "tools.heart.desc": "Start with an extra heart.",
                "tools.score.name": "Score Boost",
                "tools.score.desc": "Increases the value of score power-ups.",
                "tools.flag.name": "Flag",
                "tools.flag.desc": "Places a flag upon death allowing you to revive once.",
                "tools.edit.name": "THE POWER OF EDIT",
                "tools.edit.desc": "25% chance to STOP TIME on dash."
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
