import { buttonContainer } from './buttonContainer.js';

export class linkButtonContainer {
    constructor(container) {
        this.container = container;

        this.buttonContainer = document.createElement('div');
        this.buttonContainer.className = 'threeButtonContainer'

        this.insta = new buttonContainer(this.buttonContainer, '@ryumy97', 'https://www.instagram.com/ryumy97/', 'assets/instagram.png', 'insta');
        this.github = new buttonContainer(this.buttonContainer, 'github:ryumy97', 'https://github.com/ryumy97', 'assets/github.png', 'github')
        this.email = new buttonContainer(this.buttonContainer, 'inha.ryu.97@gmail.com', 'mailto:inha.ryu.97@gmail.com', 'assets/email.png', 'email');

        this.container.append(this.buttonContainer);

        this.state = 'init';
        this.progress = 0;
    }

    resize(stageWidth, stageHeight) {
        this.insta.resize(40 + stageWidth / 100, 40 + stageWidth / 100);
        this.email.resize(40 + stageWidth / 100, 40 + stageWidth / 100);
        this.github.resize(40 + stageWidth / 100, 40 + stageWidth / 100)
    }

    draw(ratio, progress) {
        if (progress >= 1) {
            this.now = new Date();
            const sec = this.then ? this.now - this.then : 0;
            this.progress += sec / 1000;
            if (this.state === 'init') {
                this.insta.startAnimation();
                this.github.startAnimation();
                this.email.startAnimation();
                this.state = 'running';
            }

            if (this.progress < 1) {
                this.insta.draw(0);
                this.github.draw(0);
                this.email.draw(0);
            }
            else {
                this.insta.draw(this.progress - 1);
                this.github.draw(this.progress - 1.25);
                this.email.draw(this.progress - 1.5);
            }

            this.then = this.now;
        }
    }
}