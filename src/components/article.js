import { ClipedCharacter, ClippedWord } from "./cliped.js";

export class Article {
    constructor(url, title, number, onClick) {
        this.str = title;

        this.stripWrap = document.createElement('div');
        this.stripWrap.className = 'strip-wrap';

        this.imageContainer = document.createElement('div');
        this.imageContainer.className = 'imageContainer adding';
        this.imageContainer.style.opacity = 0;

        this.stripWrap.append(this.imageContainer);

        this.image = new Image();
        this.image.src = url;

        this.imageContainer.append(this.image);
        
        this.overlay = document.createElement('div');
        this.overlay.className = 'overlay';

        this.title = new ClippedWord(title, 'pointer_opacity', onClick);
        this.title.appendTo(this.overlay);

        this.ratio = 1;
        this.number = number;
    }

    appendTo(container) {
        container.append(
            this.stripWrap
            );
        
        document.getElementById('overlayContainer').append(this.overlay);
    }

    onDown() {
        this.stripWrap.style.transitionDuration = '0.5s';
        this.stripWrap.style.width = '100%';
    }

    onUp() {
        this.stripWrap.style.transitionDuration = '0.5s';
        this.stripWrap.style.width = '60%';
    }

    show() {
        this.title.show()
    }

    hide() {
        this.title.hide();
    }
    
    showStrip() {
        this.stripWrap.style.transitionDuration = '1s';
        this.stripWrap.style.width = '60%';
        this.title.addEventHandler();
    }

    hideStrip() {
        this.stripWrap.style.transitionDuration = '1s';
        this.stripWrap.style.width = '0%';
        this.title.removeEventHandler();
    }
}

export class ArticleMock {
    constructor(stripWrap, imageContainer, image, title, number, onClick) {
        this.str = title

        this.stripWrap = stripWrap;
        this.imageContainer = imageContainer;
        this.image = image;

        this.mock = true;

        this.overlay = document.createElement('div');
        this.overlay.className = 'overlay';

        this.title = new ClippedWord(title, 'pointer_opacity', onClick);
        this.title.appendTo(this.overlay);

        this.ratio = 1;
        this.number = number;
    }

    appendTo(container) {   
        document.getElementById('overlayContainer').append(this.overlay);
        setTimeout(() => {
            this.title.show()
        }, 50);
    }

    onDown() {
        this.stripWrap.style.transitionDuration = '0.5s';
        this.stripWrap.style.width = '100%';
    }

    onUp() {
        this.stripWrap.style.transitionDuration = '0.5s';
        this.stripWrap.style.width = '60%';
    }

    show() {
        this.title.show();
    }

    hide() {
        this.title.hide(0, 'left');
    }

    showStrip() {
        this.stripWrap.style.transitionDuration = '1s';
        this.stripWrap.style.width = '60%';
        this.title.addEventHandler();
    }

    hideStrip() {
        this.stripWrap.style.transitionDuration = '1s';
        this.stripWrap.style.width = '0%';
        this.title.removeEventHandler();
    }
}

export class Block {
    constructor() {
        this.stripWrap = document.createElement('div');
        this.stripWrap.className = 'strip-wrap';
        this.stripWrap.style.height = '50%';

        this.imageContainer = document.createElement('div');
        this.imageContainer.className = 'imageContainer adding';
        this.imageContainer.style.opacity = 0;

        this.stripWrap.append(this.imageContainer);
        this.ratio = 0.5;
        this.isBlock = true;
    }

    appendTo(container) {
        container.append(this.stripWrap);
    }

    onDown() {
        this.stripWrap.style.transitionDuration = '0.5s';
        this.stripWrap.style.width = '100%';
        this.stripWrap.style.height = '50%';
    }

    onUp() {
        this.stripWrap.style.transitionDuration = '0.5s';
        this.stripWrap.style.width = '60%';
        this.stripWrap.style.height = '50%';
    }

    show() {

    }

    hide() {

    }

    showStrip() {

    }

    hideStrip() {
        this.stripWrap.style.opacity = 0;
    }
}