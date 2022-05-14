import { ClipedCharacter, ClippedParagraph, ClippedImage, ClippedVideo } from '../../components/cliped.js'
import { getBreak } from '../../components/break.js';

export class AimHighPage1 {
    constructor() {
        this.title1 = new ClipedCharacter('h1', 'Aim High', '');
        this.title2 = new ClipedCharacter('h1', '- Website', '');

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

export class AimHighPage2 {
    constructor() {
        this.title = new ClipedCharacter('h3', 'Aim High Charitable Trust')
        this.paragraph1 = new ClippedParagraph('p', 'Aim High Charitable Trust is a trust that enhances the life of people with disabilities.');
        this.paragraph2 = new ClippedParagraph('p', 'The trust helps to achieve this goal by providing them with necessary experience, education and training to perform everyday life in our community.');        
        this.paragraph3 = new ClippedParagraph('p', 'These part in our world is often forgotten or uncared, and I was glad that I had a skill to support the trust and proceed with this project.');

        this.page = document.createElement('div');
        this.page.className = 'aboutPage'

        this.content = document.createElement('div');
        this.content.className = 'aboutPageContent';
        this.content.style.maxWidth = '600px'

        this.content.append(
            this.title.getElement(),
            getBreak('small'),
            getBreak('small'),
            ...this.paragraph1.getElementList(),
            ...this.paragraph2.getElementList(),
            getBreak('small'),
            ...this.paragraph3.getElementList()
        )

        this.page.append(
            this.content
        )
    }

    add(delay) {
        this.title.add(0);
        this.paragraph1.add(0, 0);
        this.paragraph2.add(0, 0);
        this.paragraph3.add(0, 0);
    }

    remove(delay) {
        this.title.remove(0);
        this.paragraph1.remove(0.1, 0.01);
        this.paragraph2.remove(0.2, 0.01);
        this.paragraph3.remove(0.3, 0.01);
    }

    getElement() {
        return this.page
    }
}

export class AimHighPage3 {
    constructor() {
        this.image1 = new ClippedVideo('/assets/aimhigh/recording.mp4', 'bottom', '');

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

export class AimHighPage4 {
    constructor() {
        this.paragraph1 = new ClippedParagraph('p', 'This project required me to design and build the parts of the projects alone, as this trust is small in size and was new at the time of creation.');
        
        this.paragraph2 = new ClippedParagraph('p', 'The webpage itself was built with Wordpress as it is commonly used, and is easy to be modified by non-develpoers.');
        this.paragraph3 = new ClippedParagraph('p', 'HTML CSS JS + bootstrap with some php server side to modify some behaviours of wordpress are used.');

        this.paragraph4 = new ClippedParagraph('p', 'The design uses common website template with the matching blue theme as their logos and business card that they had.');

        this.page = document.createElement('div');
        this.page.className = 'aboutPage'

        this.content = document.createElement('div');
        this.content.className = 'aboutPageContent';
        this.content.style.maxWidth = '600px'

        this.content.append(
            ...this.paragraph1.getElementList(),
            getBreak('small'),
            ...this.paragraph2.getElementList(),
            ...this.paragraph3.getElementList(),
            getBreak('small'),
            ...this.paragraph4.getElementList(),
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
    }

    remove(delay) {
        this.paragraph1.remove(0.1, 0.01);
        this.paragraph2.remove(0.2, 0.01);
        this.paragraph3.remove(0.3, 0.01);
        this.paragraph4.remove(0.4, 0.01);
    }

    getElement() {
        return this.page
    }
}