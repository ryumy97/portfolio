import { ClipedCharacter, ClippedParagraph, ClippedImage, ClippedWord, ClippedVideo } from '../../components/cliped.js'
import { getBreak } from '../../components/break.js';

export class KiwiPage1 {
    constructor() {
        this.title1 = new ClipedCharacter('h1', 'Kiwi', '');
        this.title2 = new ClipedCharacter('h2', '- 2D physical environment implementation', '');

        this.page = document.createElement('div');
        this.page.className = 'aboutPage'

        this.content = document.createElement('div');
        this.content.className = 'aboutPageContent';

        this.content.append(
            this.title1.getElement(),
            getBreak('small'),
            this.title2.getElement()
        )

        this.page.append(
            this.content
        )
    }

    getBreak(className) {
        const breakDOM = document.createElement('div');
        breakDOM.className = `break ${className}`;

        return breakDOM;
    }

    add(delay) {
        this.title1.add(0 + delay);
        this.title2.add(0.25 + delay);
    }

    remove(delay) {
        this.title1.remove(0 + delay);
        this.title2.remove(0.25 + delay);
    }

    getElement() {
        return this.page
    }
}

export class KiwiPage2 {
    constructor() {
        this.image1 = new ClippedVideo('/assets/kiwi/kiwi.mp4', 'bottom', '');

        this.page = document.createElement('div');
        this.page.className = 'aboutPage'
        this.page.style.flexWrap = 'nowrap'

        this.content = document.createElement('div');
        this.content.className = 'aboutPageContent images';
        
        this.content.append(
            this.image1.getElement(),
        )

        this.page.append(
            this.content
        )
    }

    add(delay) {
        this.image1.add(0);
    }

    remove(delay) {
        this.image1.remove(0);
    }

    getElement() {
        return this.page
    }
}

export class KiwiPage3 {
    constructor() {
        this.paragraph1 = new ClippedParagraph('p', 'This project is the first personal interaction project that I tried to implement.');
        this.paragraph2 = new ClippedParagraph('p', 'It displays a kiwi that expressed in a single form of a circle which user can grab and move around in a physical environment.');
        this.paragraph3 = new ClippedParagraph('p', "The pattern drawn the kiwi is generated randomly each and every time it is been loaded.");
        this.paragraph4 = new ClippedParagraph('p', "I wanted to experiment the capablity of HTML5 Canvas and thought it would be good to build a web-app from scratch");
        this.paragraph5 = new ClippedParagraph('p', ' - from setting up the DNS and deploying, to implementing canvas interactions.');

        this.page = document.createElement('div');
        this.page.className = 'aboutPage'

        this.content = document.createElement('div');
        this.content.className = 'aboutPageContent';
        this.content.style.maxWidth = '600px'

        this.content.append(
            ...this.paragraph1.getElementList(),
            ...this.paragraph2.getElementList(),
            getBreak('small'),
            ...this.paragraph3.getElementList(),
            getBreak('small'),
            ...this.paragraph4.getElementList(),
            ...this.paragraph5.getElementList(),
        )

        this.page.append(
            this.content
        )
    }
    add(delay) {
        this.paragraph1.add(0, 0);
        this.paragraph2.add(0, 0);
        this.paragraph3.add(0, 0);
        this.paragraph4.add(0, 0);
        this.paragraph5.add(0, 0);
    }

    remove(delay) {
        this.paragraph1.remove(0, 0.01);
        this.paragraph2.remove(0.1, 0.01);
        this.paragraph3.remove(0.2, 0.01);
        this.paragraph4.remove(0.3, 0.01);
        this.paragraph5.remove(0.4, 0.01);
    }

    getElement() {
        return this.page
    }
}

export class KiwiPage4 {
    constructor() {
        this.image1 = new ClippedImage('/assets/kiwi/kiwi_bird.png', 'bottom', 'image-block');
        this.image1.container.style.width = '42%';
        this.image2 = new ClippedImage('/assets/kiwi/kiwi_fruit.png', 'bottom', 'image-block');
        this.image2.container.style.width = '58%';

        this.page = document.createElement('div');
        this.page.className = 'aboutPage'
        this.page.style.flexWrap = 'nowrap'

        this.content = document.createElement('div');
        this.content.className = 'aboutPageContent images';
        
        this.content.append(
            this.image1.getElement(),
            this.image2.getElement()
        )

        this.page.append(
            this.content
        )
    }

    getBreak(className) {
        const breakDOM = document.createElement('div');
        breakDOM.className = `break ${className}`;

        return breakDOM;
    }

    add(delay) {
        this.image1.add(0);
        this.image2.add(0);
    }

    remove(delay) {
        this.image1.remove(0);
        this.image2.remove(0.25);
    }

    getElement() {
        return this.page
    }
}