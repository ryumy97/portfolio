import { LinkButton } from '../src/component/linkButtons/linkButton.js'

class App {
    constructor() {
        WebFont.load({
            google: {
              families: ['Hind:700']
            }
        });

        this.now = Date.now();
        this.then = Date.now();

        this.progress = 0;
        this.progressEnd = false;

        this.container = document.createElement('div');
        this.container.className = 'container';

        this.button = new LinkButton(this.container, 'assets/instagram.png');

        document.body.append(this.container);

        window.addEventListener('resize', this.resize.bind(this), false);
        this.resize();

        requestAnimationFrame(this.animate.bind(this));
    }

    resize() {
        this.button.resize(this.container.clientWidth, this.container.clientHeight);
    }

    animate(t) {
        this.now = Date.now();
        const elapsed = this.then ? this.now - this.then : 1000 / 60;
        const interval = 1000 / 60

        const ratio = elapsed / interval;

        requestAnimationFrame(this.animate.bind(this));

        this.progress += 0.01;

        this.button && this.button.draw && this.button.draw(ratio, this.progress);

        this.then = Date.now();
    }
}

window.onload = () => {
    new App();
}