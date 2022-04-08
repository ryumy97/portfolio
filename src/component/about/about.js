import { linkButtonContainer } from '../linkButtons/linkButtonsContainer.js';

export class About {
    constructor(container) {
        this.links = new linkButtonContainer(container);

        this.aboutMe = document.createElement('div');
        this.aboutMe.className = 'about'
        this.aboutMe.innerHTML = `
            <h1>
                My name is <span class="orange">In Ha </span><span class="orange">Ryu</span><br>
                and I Develop.
            </h1>
        `;

        container.append(this.aboutMe);

        window.addEventListener('mousedown', () => {
            window.getSelection()?.removeAllRanges();
        })
    }

    resize(stageWidth, stageHeight) {
        this.links.resize(stageWidth, stageHeight);
    }

    draw(ratio, progress) {
        this.links.draw(ratio, progress);
    }
}