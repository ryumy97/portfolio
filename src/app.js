
import { Container } from './component/container.js';
import { Visual } from './component/visual.js'
import { setLocation, getContext } from './route.js';


class App {
    constructor() {
        this.context = getContext();
        this.setWebgl();

        WebFont.load({
            google: {
              families: ['Hind:700']
            },
            fontactive: () => {
                this.visual = new Visual();

                window.addEventListener('resize', this.resize.bind(this), false);
                this.resize();

                requestAnimationFrame(this.animate.bind(this));
            }
        });

        this.now = Date.now();
        this.then = Date.now();

        this.progress = 0;
        this.progressEnd = false;

        window.addEventListener('_getNextContent', this.getNextContent.bind(this), false);
        window.addEventListener("hashchange", this.navigate.bind(this), false)
          
    }

    setWebgl() {
        this.renderer = new PIXI.Renderer({
            width: document.body.clientWidth,
            height: 400,
            antialias: false,
            backgroundAlpha: 0,
            resolution: (window.devicePixelRatio > 1) ? 2 : 1,
            autoDensity: true,
            powerPreference: 'high-performance',
            backgroundColor: 0xffffff
        });
        
        this.container = new Container(this.context);
        document.body.appendChild(this.container.getElement());

        this.container.getElement().appendChild(this.renderer.view);
        this.renderer.view.className = 'pixi'
        this.renderer.view.addEventListener('animationend', this.animationEnd.bind(this), false)

        this.stage = new PIXI.Container();

        this.blurFilter = new PIXI.filters.BlurFilter()
        this.blurFilter.blur = 2;
        this.blurFilter.autoFit = true;

        const fragSource = `
            precision mediump float;

            varying vec2 vTextureCoord;

            uniform sampler2D uSampler;
            uniform float threshold;

            void main(void) {
                vec4 color = texture2D(uSampler, vTextureCoord);
                if (color.a > threshold) {
                    gl_FragColor = vec4(color.r, color.g, color.b, color.a + 0.2);
                }
                else {
                    gl_FragColor = vec4(vec3(0.0), 0.0);
                }
            }
        `

        const uniformsData = {
            threshold: 0.5,
        }

        this.thresholdFilter = new PIXI.Filter(null, fragSource, uniformsData);

        this.stage.filters = [this.blurFilter, this.thresholdFilter];
        this.stage.filterArea = this.renderer.screen
    }

    resize() {
        this.stageWidth = this.container.getElement().clientWidth;
        this.stageHeight = 400

        this.renderer.resize(this.stageWidth, this.stageHeight);

        this.visual.show(this.context.title, this.stageWidth, this.stageHeight, this.stage);
        this.container.resize(this.container.getElement().clientWidth, this.container.getElement().clientHeight);

        this.visual.setMouseOffset({
            x: this.renderer.view.offsetLeft,
            y: this.renderer.view.offsetTop
        }, {
            x: this.renderer.view.style.width.replace(/px/, '') / this.renderer.view.clientWidth,
            y: this.renderer.view.style.height.replace(/px/, '') / this.renderer.view.clientHeight
        });
    }

    animate(t) {
        this.now = Date.now();
        const elapsed = this.then ? this.now - this.then : 1000 / 60;
        const interval = 1000 / 60

        const ratio = elapsed / interval;

        requestAnimationFrame(this.animate.bind(this));

        this.visual.animate(ratio);

        this.renderer.render(this.stage);
        
        this.blurFilter.blur = 8 - 6 * this.progress
        this.thresholdFilter.uniforms.threshold = (1 - 0.5 * this.progress)
        
        if (this.progress < 1) {
            this.progress += 0.01;
        }
        else if (!this.progressEnd) {
            this.progressEnd = true;

            this.container.onProgressEnd();            
        }

        this.container.draw(ratio, this.progress);

        this.then = Date.now();
    }

    animationEnd(e) {
        this.visual.setMouseOffset({
            x: e.target.offsetLeft,
            y: e.target.offsetTop
        }, {
            x: this.renderer.view.style.width.replace(/px/, '') / e.target.clientWidth,
            y: this.renderer.view.style.height.replace(/px/, '') / e.target.clientHeight
        });
    }

    getNextContent(e) {
        setLocation(`/#/${e.detail.nextContent}`);
        this.navigate(e)
    }

    navigate(e) {
        console.log(e)
        this.context = getContext();

        this.visual.removeParticles(this.stage);

        this.thresholdFilter.uniforms.threshold = 1;

        this.container.getElement().remove();
        this.container = new Container(this.context);

        this.container.getElement().appendChild(this.renderer.view);
        
        document.body.appendChild(this.container.getElement());
        this.container.resize(this.container.getElement().clientWidth, this.container.getElement().clientHeight);
        
        this.progress = 0;
        this.progressEnd = false;

        this.visual.show(this.context.title, this.stageWidth, this.stageHeight, this.stage);

        this.visual.setMouseOffset({
            x: this.renderer.view.offsetLeft,
            y: this.renderer.view.offsetTop
        }, {
            x: 1,
            y: 1
        });
    }
}

window.onload = () => {
    new App();
}