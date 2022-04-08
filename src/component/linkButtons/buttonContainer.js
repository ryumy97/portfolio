import { LinkButton } from './linkButton.js'

export class buttonContainer {
    constructor(container, text, href, imageUrl, imageClass) {
        this.href = href;

        this.buttonContainer = document.createElement('div');
        this.buttonContainer.className = `${imageClass} threeContainer`;

        this.button = new LinkButton(this.buttonContainer, imageUrl);
        this.button.getElement().className = `${imageClass} button`;
        this.button.getElement().style.display = 'inline';

        this.button.getElement().addEventListener('click', this.onclick.bind(this), false);

        this.link = document.createElement('a');
        this.link.innerText = text;
        this.link.href = href;
        this.link.target = '_blank';

        this.buttonContainer.append(this.link);

        container.append(this.buttonContainer);
    }

    onclick() {
        window.open(this.href);
    }

    resize(stageWidth, stageHeight) {
        this.button.resize(stageWidth, stageHeight);
    }

    startAnimation() {
        this.button.getElement().classList.add('start')
    }

    draw(progress) {
        this.button.draw(progress);
    }
}