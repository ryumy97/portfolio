import { getContext } from "../route.js";

export class Knob {
    constructor(container, isTutorialOn) {
        this.container = container;
        
        this.knobContainer = document.createElement('div');
        this.knobContainer.className = 'knobContainer';

        this.knob = document.createElement('div');
        this.knob.className = 'knob';
        
        this.knobContainer.appendChild(this.knob);
        container.appendChild(this.knobContainer);

        this.wheel = 0;
        this.wheelHandle = null;

        this.clicked = false;
        this.next = false;

        if (isTutorialOn) {
            this.knobCursor = document.createElement('div');
            this.knobCursor.className = 'knobCursor';
            container.appendChild(this.knobCursor);
        }
    }

    onProgressEnd() {
        this.knobContainer.style.cursor = 'grab';

        this.knobContainer.addEventListener('pointerdown', this.onDownKnob.bind(this), false);
        window.addEventListener('pointerdown', this.onDown.bind(this), false);
        window.addEventListener('pointermove', this.onMove.bind(this), false);
        window.addEventListener('pointerup', this.onUp.bind(this), false);
        this.container.addEventListener('transitionend', this.onTransitionEnd.bind(this), false);
        this.knobContainer.addEventListener('animationend', this.onKnobTransactionEnd.bind(this), false);
        
        this.scrollingEventListener = this.scrolling.bind(this);
        window.addEventListener('wheel', this.scrollingEventListener, false);
    }

    scrolling(e) {
        if (this.wheel > 400) {
            this.wheel = 0;
            window.removeEventListener('wheel', this.scrollingEventListener, false);
            
            this.next = true;

            this.container.style.transform = 'translate(0, -100%)';
            this.container.style.transition = `transform 0.5s cubic-bezier(.4,-0.58,.85,0)`;
            
            clearTimeout(this.wheelHandle);
        }

        if (this.wheelHandle) {
            this.wheel += e.deltaY
            clearTimeout(this.wheelHandle);
        }
        this.wheelHandle = setTimeout(() => {
            this.wheel = 0;
        }, 100)
    }
 
    onDownKnob(e) {
        this.container.style.cursor = 'grabbing'
        this.knobContainer.style.cursor = 'grabbing';

        this.clicked = true;

        this.container.style.transition = `none`;

        const event = new CustomEvent('_animationStop');
        window.dispatchEvent(event);
    }

    onDown(e) {
        this.savedX = e.clientX;
        this.savedY = e.clientY;
        this.x = e.clientX;
        this.y = e.clientY;
    }

    onMove(e) {
        this.x = e.clientX;
        this.y = e.clientY;

        const diffY = this.y - this.savedY;

        if (this.clicked) {
            this.container.style.transform = `translate(0, ${diffY}px)`;
        }
    }

    onUp() {
        if (this.clicked) {
            const diffY = this.y - this.savedY;
    
            if (-diffY > this.container.clientHeight / 4 && !this.next) {
                this.next = true;
            }
    
            if (this.next) {
                this.container.style.transform = 'translate(0, -100%)';
                this.container.style.transition = `transform 0.5s cubic-bezier(.4,-0.58,.85,0)`;
            }
            else {
                this.container.style.transform = 'translate(0)';
                this.container.style.transition = `transform 0.5s`;
    
                const event = new CustomEvent('_animationContinue');
                window.dispatchEvent(event);
            }
    
            this.container.style.cursor = 'default';
            this.knobContainer.style.cursor = 'grab';
            this.clicked = false;

        }
    }

    onTransitionEnd() {
        if (!this.clicked) {
            if (this.next) {
                const nextContent = getContext().nextContext;

                setTimeout(() => {
                    const event = new CustomEvent('_getNextContent', {
                        detail: {
                            nextContent
                        }
                    });
                    window.dispatchEvent(event);
                }, 500)

                const continueAnimation = new CustomEvent('_animationContinue');
                window.dispatchEvent(continueAnimation);
            }
        }
    }

    onKnobTransactionEnd() {
        if (this.knobCursor) {
            this.knobCursor.style.animationPlayState = 'running';
        }
    }
}