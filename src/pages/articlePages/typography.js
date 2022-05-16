import { ClipedCharacter, ClippedParagraph, ClippedImage, ClippedVideo } from '../../components/cliped.js'
import { getBreak } from '../../components/break.js';

export class TypographyPage1 {
    constructor() {
        this.title1 = new ClipedCharacter('h1', 'Kinetic', '');
        this.title2 = new ClipedCharacter('h1', 'Typography', '');
        this.title3 = new ClipedCharacter('h1', 'Study.', '');

        this.page = document.createElement('div');
        this.page.className = 'aboutPage'

        this.content = document.createElement('div');
        this.content.className = 'aboutPageContent';

        this.content.append(
            this.title1.getElement(),
            getBreak('small'),
            this.title2.getElement(),
            getBreak('small'),
            this.title3.getElement()
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
        this.title3.add(0.5 + delay);   
    }

    remove(delay) {
        this.title1.remove(0 + delay);
        this.title2.remove(0.25 + delay);
        this.title3.remove(0.5 + delay);
    }

    getElement() {
        return this.page
    }
}
export class TypographyPage2 {
    constructor() {
        this.image1 = new ClippedVideo('typographyRec', 'bottom', '');

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


export class TypographyPage3 {
    constructor() {
        this.image = new ClippedImage('typographyPage2', 'bottom', 'image-half');

        this.title = new ClipedCharacter('h3', 'Kinetic Typography Study')

        this.paragraph1 = new ClippedParagraph('p', 'A small project that holds a collection of interactive experiences of kinetic typography.');
        
        this.paragraph2 = new ClippedParagraph('p', 'The aim of this project is to try out different skills and interactions and potentially visualise the growth of my visual programming skills.');

        this.page = document.createElement('div');
        this.page.className = 'aboutPage'

        this.content = document.createElement('div');
        this.content.className = 'aboutPageContent';
        this.content.style.height = '100%';

        this.paragraphContainer = document.createElement('div');
        this.paragraphContainer.className = 'aboutPageContent'
        this.paragraphContainer.style.width = 'calc(50% - 1rem)';
        this.paragraphContainer.style.margin = 'auto 0 auto 1rem';

        this.paragraphContainer.append(
            this.title.getElement(),
            getBreak('small'),
            ...this.paragraph1.getElementList(),
            getBreak('small'),
            ...this.paragraph2.getElementList()
        )

        this.content.append(
            this.image.getElement(),
            this.paragraphContainer
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
        this.image.add(0);
        this.title.add(0);
        this.paragraph1.add(0, 0);
        this.paragraph2.add(0, 0);
    }

    remove(delay) {
        this.image.remove(0);
        this.title.remove(0);
        this.paragraph1.remove(0.25, 0.01);
        this.paragraph2.remove(0.5, 0.01);
    }

    getElement() {
        return this.page
    }
}

export class TypographyPage4 {
    constructor() {

        this.paragraph1 = new ClippedParagraph('p', 'Each interaction expressed as a poster design that users can select and navigate to initiate the interactions.');
        this.paragraph2 = new ClippedParagraph('p', 'As of those typograohy interactions are unique, each poster uses unique color pallette that suits their inspirations');

        this.image1 = new ClippedImage('typography01', 'bottom', 'image-block');
        this.image2 = new ClippedImage('typography02', 'bottom', 'image-block');
        this.image3 = new ClippedImage('typography03', 'bottom', 'image-block');
        this.image4 = new ClippedImage('typography04', 'bottom', 'image-block');
        this.image5 = new ClippedImage('typography05', 'bottom', 'image-block');
        
        this.page = document.createElement('div');
        this.page.className = 'aboutPage'

        this.content = document.createElement('div');
        this.content.className = 'aboutPageContent images';

        this.imageContainer = document.createElement('div');
        this.imageContainer.className = 'aboutPageContent images';
        this.imageContainer.style.width = '70%';
        
        this.paragraphContainer = document.createElement('div');
        this.paragraphContainer.className = 'aboutPageContent hide_mobile'
        this.paragraphContainer.style.width = 'calc(30% - 1rem)';
        this.paragraphContainer.style.margin = 'auto 0 auto 1rem';

        this.paragraphContainer.append(
            ...this.paragraph1.getElementList(),
            ...this.paragraph2.getElementList()
        )

        this.imageContainer.append(
            this.image1.getElement(),
            this.image2.getElement(),
            this.image3.getElement(),
            this.image4.getElement(),
            this.image5.getElement()
        )

        this.content.append(
            this.paragraphContainer,
            this.imageContainer
        )

        this.page.append(
            this.content
        )
    }

    add(delay) {
        this.image1.add(0);
        this.image2.add(0);
        this.image3.add(0);
        this.image4.add(0);
        this.image5.add(0);

        this.paragraph1.add(0, 0);
        this.paragraph2.add(0, 0);
    }

    remove(delay) {
        this.image1.remove(0);
        this.image2.remove(0.1);
        this.image3.remove(0.2);
        this.image4.remove(0.3);
        this.image5.remove(0.4);

        this.paragraph1.remove(0, 0.01);
        this.paragraph2.remove(0.25, 0.01);
    }

    getElement() {
        return this.page
    }
}
