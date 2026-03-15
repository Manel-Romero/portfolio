const CONFIG = {
    typingSpeed: 30,
    typingVariance: 20,
    cmdDelay: 50,
    lineDelay: 100,
    cursorBlinkSpeed: 500,
    initialDelay: 1500
};

const DATA = {
    en: [
        { type: 'cmd', text: 'whoami' },
        { type: 'output', text: 'Manel-Romero\nFullstack Developer [Backend Inclination]' },
        { type: 'cmd', text: 'cat skills.json' },
        { type: 'output', text: '{\n  "dominant": ["Python"],\n  "proficient": ["Java", "TypeScript", "JS", "HTML/CSS"],\n  "infrastructure": ["Docker", "AWS"],\n  "learning": ["C++", "AI/ML"]\n}' },
        { type: 'cmd', text: 'cat about.txt' },
        { type: 'output', text: 'I build creative & innovative solutions.\nI enjoy technical challenges that force me to think.\nSimple code, complex problems.' },
        { type: 'cmd', text: 'ls -la contact/' },
        { type: 'output', html: true, text: 'drwxr-xr-x  manel  staff\n<a href="mailto:manel.romero.alv@gmail.com">Email (manel.romero.alv@gmail.com)</a>\n<a href="https://github.com/Manel-Romero" target="_blank">GitHub (Manel-Romero)</a>\n<a href="https://www.linkedin.com/in/manel-romero-alv/" target="_blank">LinkedIn (Manel-Romero-Alv)</a>' },
        { type: 'cmd', text: 'tail -f /dev/random', glitch: true }
    ],
    es: [
        { type: 'cmd', text: 'whoami' },
        { type: 'output', text: 'Manel-Romero\nDesarrollador Fullstack [Inclinación Backend]' },
        { type: 'cmd', text: 'cat skills.json' },
        { type: 'output', text: '{\n  "domino": ["Python"],\n  "se": ["Java", "TypeScript", "JS", "HTML/CSS"],\n  "infra": ["Docker", "AWS"],\n  "aprendiendo": ["C++", "IA/ML"]\n}' },
        { type: 'cmd', text: 'cat sobre_mi.txt' },
        { type: 'output', text: 'Creo soluciones creativas e innovadoras.\nDisfruto la dificultad técnica y los retos que me hacen pensar.\nCódigo simple, problemas complejos.' },
        { type: 'cmd', text: 'ls -la contacto/' },
        { type: 'output', html: true, text: 'drwxr-xr-x  manel  staff\n<a href="mailto:manel.romero.alv@gmail.com">Email (manel.romero.alv@gmail.com)</a>\n<a href="https://github.com/Manel-Romero" target="_blank">GitHub (Manel-Romero)</a>\n<a href="https://www.linkedin.com/in/manel-romero-alv/" target="_blank">LinkedIn (Manel-Romero-Alv)</a>' },
        { type: 'cmd', text: 'tail -f /dev/random', glitch: true }
    ]
};

class AudioController {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.isMuted = false;
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTypingSound() {
        if (this.isMuted) return;
        this.resume();
        
        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.value = 800 + Math.random() * 200; 
        
        gainNode.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        oscillator.start();
        oscillator.stop(this.ctx.currentTime + 0.05);
    }

    playGlitchSound() {
        if (this.isMuted) return;
        this.resume();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(1000, t + 0.1);
        
        const dist = this.ctx.createWaveShaper();
        dist.curve = this.makeDistortionCurve(400);
        
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(dist);
        dist.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.1);
    }

    playPowerDownSound() {
        if (this.isMuted) return;
        this.resume();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 1);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0, t + 1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 1);
    }

    makeDistortionCurve(amount) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }
}

class TerminalController {
    constructor(containerId, audioController) {
        this.container = document.getElementById(containerId);
        this.audio = audioController;
        this.queue = [];
        this.isTyping = false;
        this.stopSignal = false;
        this.currentLang = 'es';
    }

    clear() {
        this.container.innerHTML = '';
        this.stopSignal = true;
        return new Promise(resolve => setTimeout(() => {
            this.stopSignal = false;
            resolve();
        }, 50));
    }

    async typeText(text, element, speed = CONFIG.typingSpeed) {
        if (this.stopSignal) return;
        
        return new Promise(resolve => {
            let i = 0;
            const typeChar = () => {
                if (this.stopSignal) {
                    resolve();
                    return;
                }

                element.textContent += text.charAt(i);
                this.audio.playTypingSound();
                i++;

                if (i < text.length) {
                    const variance = Math.random() * CONFIG.typingVariance;
                    setTimeout(typeChar, speed + variance);
                } else {
                    resolve();
                }
            };
            typeChar();
        });
    }

    async runSequence(lang) {
        await this.clear();
        this.currentLang = lang;
        this.isTyping = true;
        
        const initialCursor = document.createElement('div');
        initialCursor.className = 'input-line';
        initialCursor.innerHTML = '<span class="prompt">root@manel:~$</span><span class="cursor"></span>';
        this.container.appendChild(initialCursor);

        await new Promise(r => setTimeout(r, CONFIG.initialDelay));
        
        if (this.stopSignal) return;
        initialCursor.remove();

        const sequence = DATA[lang];
        
        for (let item of sequence) {
            if (this.stopSignal) break;

            const line = document.createElement('div');
            if (item.glitch) line.classList.add('glitch');
            this.container.appendChild(line);

            if (item.type === 'cmd') {
                const prompt = document.createElement('span');
                prompt.className = 'prompt';
                prompt.textContent = 'root@manel:~$ ';
                line.appendChild(prompt);
                
                const cmdText = document.createElement('span');
                line.appendChild(cmdText);
                
                const cursor = document.createElement('span');
                cursor.className = 'cursor';
                line.appendChild(cursor);

                cursor.style.display = 'inline-block';

                await this.typeText(item.text, cmdText, CONFIG.cmdDelay);
                
                cursor.remove();
                await new Promise(r => setTimeout(r, 300));
            } else {
                if (item.html) {
                    line.innerHTML = item.text; 
                } else {
                    line.textContent = item.text;
                }
                window.scrollTo(0, document.body.scrollHeight);
                await new Promise(r => setTimeout(r, CONFIG.lineDelay));
            }
        }

        if (!this.stopSignal) {
            this.addInputLine();
        }
        this.isTyping = false;
    }

    addInputLine() {
        const finalLine = document.createElement('div');
        finalLine.className = 'input-line';
        finalLine.innerHTML = '<span class="prompt">root@manel:~$</span><span class="cursor"></span>';
        this.container.appendChild(finalLine);
        window.scrollTo(0, document.body.scrollHeight);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const introOverlay = document.getElementById('intro-overlay');
    const video = document.getElementById('intro-video');
    const glitchLayer = document.getElementById('video-glitch-layer');
    const terminalDiv = document.getElementById('terminal');
    const langBtn = document.getElementById('langToggle');
    
    const audio = new AudioController();
    const terminal = new TerminalController('terminal', audio);

    let isVideoEnding = false;

    const triggerRandomGlitch = () => {
        if (video.ended) return;
        
        if (!video.paused) {
            if (Math.random() > 0.4) {
                glitchLayer.classList.add('active');
                setTimeout(() => glitchLayer.classList.remove('active'), 150);
            }
        }
        
        setTimeout(triggerRandomGlitch, Math.random() * 1500 + 300);
    };

    const handleVideoEnd = () => {
        if (!glitchLayer.classList.contains('final')) {
            glitchLayer.classList.add('final');
            audio.playGlitchSound();
            introOverlay.style.opacity = 0;
        }

        introOverlay.style.display = 'none';
        
        terminalDiv.classList.remove('hidden');
        langBtn.classList.remove('hidden');

        setTimeout(() => {
            introOverlay.remove();
            glitchLayer.classList.remove('final');
            glitchLayer.style.display = 'none';
            terminal.runSequence('es');
        }, 200);
    };

    video.addEventListener('timeupdate', () => {
        const timeLeft = video.duration - video.currentTime;
        
        if (timeLeft < 2 && !isVideoEnding && !video.paused) {
            isVideoEnding = true;
            audio.playPowerDownSound();
            
            const fadeInterval = setInterval(() => {
                if (video.volume > 0.05) {
                    video.volume -= 0.05;
                } else {
                    video.volume = 0;
                    clearInterval(fadeInterval);
                }
            }, 100);
        }

        if (timeLeft < 0.6) {
             video.style.opacity = 0;
        }

        if (timeLeft < 0.2 && !glitchLayer.classList.contains('final')) {
             glitchLayer.classList.add('final');
             audio.playGlitchSound();
             introOverlay.style.opacity = 0; 
        }
    });

    video.addEventListener('ended', handleVideoEnd);

    const initSystem = () => {
        audio.resume();
        
        video.muted = false;
        video.volume = 1.0;
        
        video.play().then(() => {
            triggerRandomGlitch();
            setTimeout(() => triggerRandomGlitch(), 2000); 
        }).catch(err => {
            showClickToStart();
        });
    };

    const showClickToStart = () => {
        const startOverlay = document.createElement('div');
        Object.assign(startOverlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'black', color: 'white', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: '99999',
            cursor: 'pointer', fontFamily: 'monospace'
        });
        startOverlay.innerHTML = '> CLICK_TO_INITIALIZE_SYSTEM <span class="cursor"></span>';
        document.body.appendChild(startOverlay);
        
        startOverlay.addEventListener('click', () => {
            startOverlay.remove();
            initSystem();
        });
    };

    window.addEventListener('load', () => {
        initSystem();
    });

    langBtn.addEventListener('click', () => {
        const newLang = terminal.currentLang === 'en' ? 'es' : 'en';
        terminal.runSequence(newLang);
    });
});
