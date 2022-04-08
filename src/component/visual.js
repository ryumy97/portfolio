import { Text } from "./text.js";
import { Particle } from './particle.js';

export class Visual {
    constructor() {
        this.progress = 0;
        this.isAnimationOn = true;
        this.text = new Text();

        this.texture = PIXI.Texture.from('assets/particle.png');

        this.particles = [];

        this.mouse = {
            x: 0,
            y: 0,
            radius: 20,
            ratioX: 1,
            ratioY: 1,
            offsetX: 0,
            offsetY: 0
        };

        document.addEventListener('pointermove', this.onMove.bind(this), false);
        window.addEventListener('_animationStop', this.stopAnimation.bind(this), false)
        window.addEventListener('_animationContinue', this.continueAnimation.bind(this), false)
    }

    removeParticles(stage) {
        this.particles = [];
        this.pos = []

        if (this.container) {
            stage.removeChild(this.container);
            this.container = null
        }
    }

    show(str, stageWidth, stageHeight, stage) {
        if (this.container) {
            stage.removeChild(this.container);
        }

        this.pos = this.text.setText(str, 1, stageWidth, stageHeight);

        this.container = new PIXI.ParticleContainer(
            this.pos.length,
            {
                vertices: false,
                position: true,
                rotation: false,
                scale: false,
                uvs: false,
                tint: true
            }
        ); 
        stage.addChild(this.container);

        this.particles = [];
        for (let i = 0; i < this.pos.length; i++) {
            const startPos = {
                x: this.particles[i] ? this.particles[i].savedX : this.pos[i].x,
                y: this.particles[i] ? this.particles[i].savedY : this.pos[i].y
            }
            const item = new Particle(this.pos[i], this.texture, startPos);
            this.container.addChild(item.sprite);
            this.particles.push(item)
        }
    }

    animate(ratio) {
        for (let i = 0; i < this.particles.length; i++) {
            const item = this.particles[i];
            const dx = this.mouse.x - item.x;
            const dy = this.mouse.y - item.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = item.radius + this.mouse.radius;

            if (dist < minDist && this.isAnimationOn) {
                const angle = Math.atan2(dy, dx);
                const tx = item.x + Math.cos(angle) * minDist;
                const ty = item.y + Math.sin(angle) * minDist;
                const ax = tx - this.mouse.x;
                const ay = ty - this.mouse.y;
                item.vx -= ax;
                item.vy -= ay;
                item.collide();
            }

            item.draw(ratio);
        }
    }

    stopAnimation() {
        this.isAnimationOn = false;
    }

    continueAnimation() {
        this.isAnimationOn = true;
    }

    onMove(e) {
        this.mouse.x = (e.clientX - this.mouse.offsetX) * this.mouse.ratioX;
        this.mouse.y = (e.clientY - this.mouse.offsetY) * this.mouse.ratioY;
    }

    setMouseOffset(offset, ratio) {
        this.mouse.ratioX = ratio.x;
        this.mouse.ratioY = ratio.y;
        this.mouse.offsetX = offset.x;
        this.mouse.offsetY = offset.y;
    }
}
