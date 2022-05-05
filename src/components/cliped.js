export class ClipedCharacter {
    constructor(element, content, className, direction) {
        this.container = document.createElement('div');
        this.container.className = `charContainer ${className}`;

        this.char = document.createElement(element);
        this.char.innerHTML = content;
        this.char.className = 'cliping';

        this.container.append(this.char);

        switch(direction) {
            case 'left':
                this.char.style.transform = 'translate3d(-100%, 0, 0)';
                break;
            case 'right':
                this.char.style.transform = 'translate3d(100%, 0, 0)';
                break;
            case 'top':
                this.char.style.transform = 'translate3d(0, -100%, 0)';
                break;
            case 'bottom':
            default: 
                this.char.style.transform = 'translate3d(0, 100%, 0)';
                return
        }
    }

    getElement() {
        return this.container;
    }

    add(delay, duration) {
        this.char.style.transitionDuration = `${duration}s`;
        this.char.style.transitionDelay =`${delay}s`;
        this.char.style.transform = 'translate3d(0, 0, 0)';
    }

    remove(delay, direction, duration) {
        this.char.style.transitionDuration = `${duration}s`;
        this.char.style.transitionDelay =`${delay}s`
        switch(direction) {
            case 'left':
                this.char.style.transform = 'translate3d(-100%, 0, 0)';
                break;
            case 'right':
                this.char.style.transform = 'translate3d(100%, 0, 0)';
                break;
            case 'bottom':
                this.char.style.transform = 'translate3d(0, 100%, 0)';
                break;
            case 'top':
            default:
                this.char.style.transform = 'translate3d(0, -100%, 0)';
                break;
        }
    }
}

export class ClippedWord {
    constructor(title, className, onClick) {
        const array = [];
        for(let i = 0; i < title.length; i++) {
            array.push(title.at(i));
        }

        this.title = array.map(_ => {
            return new ClipedCharacter('h1', _, '', 'left')
        })

        this.wordContainer = document.createElement('div');
        this.wordContainer.className = `wordContainer ${className}`;
        this.wordContainer.append(...this.title.map(_ => _.getElement()));

        this.titleContainer = document.createElement('div'); 
        this.titleContainer.className = 'titleContainer';
        this.titleContainer.append(this.wordContainer);

        this.titleStroke = array.map(_ => {
            return new ClipedCharacter('h1', _, '', 'left')
        })

        this.wordStrokeContainer = document.createElement('div');
        this.wordStrokeContainer.className = 'wordContainer stroke';
        this.wordStrokeContainer.append(...this.titleStroke.map(_ => _.getElement()));

        this.titleStrokeContainer = document.createElement('div'); 
        this.titleStrokeContainer.className = 'titleContainer';
        this.titleStrokeContainer.append(this.wordStrokeContainer);

        this.wordContainer.addEventListener('mouseenter', this.mouseEnter.bind(this), false);
        this.wordStrokeContainer.addEventListener('mouseenter', this.mouseEnter.bind(this), false);
        this.wordContainer.addEventListener('mouseleave', this.mouseLeave.bind(this), false);
        this.wordStrokeContainer.addEventListener('mouseleave', this.mouseLeave.bind(this), false);

        this.onClickHandler = onClick;
        this.wordContainer.addEventListener('pointerdown', this.onClickHandler, false);
        this.wordStrokeContainer.addEventListener('pointerdown', this.onClickHandler, false);
    }

    mouseEnter() {
        this.wordContainer.classList.add('hover');
        this.wordStrokeContainer.classList.add('hover');
    }

    mouseLeave() {
        this.wordContainer.classList.remove('hover');
        this.wordStrokeContainer.classList.remove('hover');
    }

    appendTo(container) {
        container.append(this.titleContainer, this.titleStrokeContainer);
    }

    show() {
        this.title.forEach(_ => {
            _.add(0, 1)
        });
        this.titleStroke.forEach(_ => {
            _.add(0, 1)
        });
    }

    hide() {
        this.title.forEach(_ => _.remove(0, 'left', 0.5));
        this.titleStroke.forEach(_ => _.remove(0, 'left', 0.5));
    }

    addEventHandler() {
        this.wordContainer.addEventListener('pointerdown', this.onClickHandler, false);
        this.wordStrokeContainer.addEventListener('pointerdown', this.onClickHandler, false);
    }

    removeEventHandler() {
        this.wordContainer.removeEventListener('pointerdown', this.onClickHandler, false);
        this.wordStrokeContainer.removeEventListener('pointerdown', this.onClickHandler, false);
    }
}

export class ClippedArticleDetailTitle {
    constructor(title, className) {
        const array = [];
        for(let i = 0; i < title.length; i++) {
            array.push(title.at(i));
        }

        this.title = array.map(_ => {
            return new ClipedCharacter('h1', _, '', 'left')
        })

        this.wordContainer = document.createElement('div');
        this.wordContainer.className = `wordContainer stroke ${className}`;
        this.wordContainer.append(...this.title.map(_ => _.getElement()));
    }

    appendTo(container) {
        container.append(this.wordContainer)
    }

    show(){
        this.title.forEach(_ => {
            _.add(0, 1)
        });
    }

    hide() {
        this.title.forEach(_ => _.remove(0, 'left', 0.5));
    }
}

export class ClippedParagraph {
    constructor(element, text) {
        this.words = text.split(' ').map(_ => {
            return new ClipedCharacter(element, `${_}&nbsp`, '')
        });
    }

    getElementList() {
        return this.words.map(_ => _.getElement())
    }

    add(delay, interval) {
        this.words.forEach((_, i) => {
            _.add(i * interval + delay)
        })
    }

    remove(delay, interval) {
        this.words.forEach((_, i) => {
            _.remove(i * interval + delay)
        })
    }
}

export class ClippedImage{
    constructor(src, direction, className) {
        this.image = new Image();
        this.image.src = src;

        this.imageContainer = document.createElement('div');
        this.imageContainer.className = `clippingImageContainer`;

        this.container = document.createElement('div');
        this.container.className = `${className}`;

        this.imageContainer.append(this.image);

        this.container.append(this.imageContainer);

        switch(direction) {
            case 'left':
                this.imageContainer.style.transform = 'translate3d(-100%, 0, 0)';
                break;
            case 'right':
                this.imageContainer.style.transform = 'translate3d(100%, 0, 0)';
                break;
            case 'top':
                this.imageContainer.style.transform = 'translate3d(0, -100%, 0)';
                break;
            case 'bottom':
            default: 
                this.imageContainer.style.transform = 'translate3d(0, 100%, 0)';
                return
        }
    }

    getElement() {
        return this.container;
    }

    add(delay, duration) {
        this.imageContainer.style.transitionDuration = `${duration}s`;
        this.imageContainer.style.transitionDelay =`${delay}s`;
        this.imageContainer.style.transform = 'translate3d(0, 0, 0)';
    }

    remove(delay, direction, duration) {
        this.imageContainer.style.transitionDuration = `${duration}s`;
        this.imageContainer.style.transitionDelay =`${delay}s`
        switch(direction) {
            case 'left':
                this.imageContainer.style.transform = 'translate3d(-200%, 0, 0)';
                break;
            case 'right':
                this.imageContainer.style.transform = 'translate3d(200%, 0, 0)';
                break;
            case 'bottom':
                this.imageContainer.style.transform = 'translate3d(0, 200%, 0)';
                break;
            case 'top':
            default:
                this.imageContainer.style.transform = 'translate3d(0, -200%, 0)';
                break;
        }
    }
}