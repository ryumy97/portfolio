import { Pointer } from './components/pointer.js';
import { Intro } from './pages/intro.js'
import { Content } from './pages/content.js'
import { ImageFilter } from './components/imageFilter.js';

class App {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'container';
        this.container.id = 'container';

        this.intro = new Intro(this.container);
        this.pointer = new Pointer();

        this.imageFilter = new ImageFilter()

        document.body.append(this.container);
        document.body.append(this.pointer.canvas);
        this.container.append(this.imageFilter.getElement());

        this.progress = 0;

        this.resize();

        window.addEventListener('resize', this.resize.bind(this), false);
        requestAnimationFrame(this.draw.bind(this));

        window.addEventListener('_nav_content', this.navContent.bind(this), false);
    }

    resize() {
        this.sw = document.body.clientWidth;
        this.sh = document.body.clientHeight;

        this.pointer.resize(
            this.sw,
            this.sh
        );
    }

    draw(t) {
        this.now = Date.now();

        const elapsed = this.then ? this.now - this.then : 0;
        if (elapsed > 50) {
            this.then = this.now;

            requestAnimationFrame(this.draw.bind(this));

            return;
        }

        this.pointer.draw(elapsed);
        this.intro && this.intro.draw(elapsed);
        this.content && this.content.draw(elapsed);
        this.imageFilter.draw(elapsed);
        
        this.then = this.now;

        requestAnimationFrame(this.draw.bind(this));
    }

    navContent(e) {
        this.intro = null;
        this.content = new Content(this.container, e.detail);
    }
}

window.onload = () => {
    new App();
}