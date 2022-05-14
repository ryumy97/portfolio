import { ClipedCharacter } from '../components/cliped.js';
import { Line } from '../components/line.js';

export class Intro {
    constructor(container) {
        this.intro = document.createElement('div');
        this.intro.className = 'intro';

        this.title1 = new ClipedCharacter('h3', 'Hi,&nbsp', '');
        this.title2 = new ClipedCharacter('h3', 'my name is In Ha Ryu', '');
        this.title3 = new ClipedCharacter('h3', 'and I develop.', '');

        this.break = document.createElement('div');
        this.break.className = 'break'

        this.line = new Line();

        this.click = new ClipedCharacter('p', 'Drag to unlock', 'clickAndDrag attachable');
 
        this.content = document.createElement('div');
        this.content.className = 'content';

        this.barWrap = document.createElement('div');
        this.barWrap.className = 'strip-wrap';

        this.imageContainer = document.createElement('div');
        this.imageContainer.className = 'imageContainer';

        // this.image = new Image();
        // this.image.src = '/assets/kiwi_bird.png';

        this.bar = document.createElement('div');
        this.bar.className = 'strip';
        this.bar.addEventListener('animationend', this.stripEnd.bind(this), false);

        this.barProgress = document.createElement('div');
        this.bar.append(this.barProgress);

        this.barWrap.append(this.bar, this.imageContainer);
        this.content.append(this.barWrap);

        this.mouseY = 0;
        this.mouseSavedY = 0;
        this.mouseSavedY2 = 0;
        this.mouseEnabled = false;

        this.barProgressY = 100;
        this.barProgressSavedY = 90;
        this.barProgress.style.transform = `translateY(${this.barProgressY}%)`

        this.intro.append(
            this.title1.getElement(),
            this.title2.getElement(),
            this.break,
            this.title3.getElement(),
            this.line.getElement(),
            this.click.getElement()
            );
        container.append(this.intro, this.content);
        
        window.addEventListener('mousemove', this.onMove.bind(this), false);
        window.addEventListener('mousedown', this.onDown.bind(this), false);
        window.addEventListener('mouseup', this.onUp.bind(this), false);

        window.addEventListener('touchmove', this.onTouchMove.bind(this), false);
        window.addEventListener('touchstart', this.onTouchStart.bind(this), false);
        window.addEventListener('touchend', this.onTouchEnd.bind(this), false);

        window.addEventListener('_mouse_init', this.enableMouse.bind(this), false);

        this.state = 'loading';
    }

    stripEnd() {
        this.state = 'stripAnimation';
    }

    enableMouse() {
        this.mouseEnabled = true;
    }

    onMove(e) {
        if (this.pressed) {
            this.mouseSavedY = e.clientY;
        }
    }

    onDown(e) {
        if (!this.mouseEnabled) {
            return
        }

        this.pressed = true;

        this.mouseY = e.clientY;
        this.mouseSavedY = e.clientY;
        this.mouseSavedY2 = e.clientY;
    }

    onUp(e) {
        this.pressed = false;

        this.mouseSavedY = e.clientY;
        this.mouseSavedY2 = e.clientY;
        this.barProgressSavedY = this.barProgressY;
    }

    onTouchMove(e) {
        if (this.pressed) {
            this.mouseSavedY = e.touches[0].clientY;
        }
    }

    onTouchStart(e) {
        if (!this.mouseEnabled) {
            return
        }

        this.pressed = true;

        this.mouseY = e.touches[0].clientY;
        this.mouseSavedY = e.touches[0].clientY;
        this.mouseSavedY2 = e.touches[0].clientY;
    }

    onTouchEnd(e) {
        this.pressed = false;
        this.barProgressSavedY = this.barProgressY;
    }

    update(elapsed) {
        if (this.state === 'loading') {
            this.title1.add(0);
            this.title2.add(0.25);
            this.title3.add(0.5);
            this.line.add(1);
            this.click.add(1.5);
        }
        else if (this.state === 'stripAnimation') {
            this.barProgressY += (this.barProgressSavedY - this.barProgressY) * 0.005 * elapsed;
            if (this.barProgressY * 0.999 < this.barProgressSavedY) {
                this.state = 'intro';
            }
        }
        else if (this.state === 'intro') {
            if (this.pressed) {
                this.mouseY += (this.mouseSavedY - this.mouseY) * 0.01 * elapsed;
    
                const delta = this.mouseSavedY2 - this.mouseY;
                const target = delta / this.bar.clientHeight * 100;
        
                this.barProgressY = this.barProgressSavedY - target;
    
                if (this.barProgressY > 90) {
                    this.barProgressY = 90;
                }
                else if (this.barProgressY < 0) {
                    this.barProgressY = 0;
                    this.state = 'enter';

                    this.title1.remove(0);
                    this.title2.remove(0.25);
                    this.title3.remove(0.5)
                    this.line.remove(0);
                    this.click.remove(0.75);

                    this.imageContainer.style.transitionDelay =`1s`;
                    this.imageContainer.classList.add('adding');

                    this.endIntroEventListner = this.endIntro.bind(this);
                    this.imageContainer.addEventListener('transitionend', this.endIntroEventListner, false);

                    const event = new CustomEvent('_enterContent', )
                    window.dispatchEvent(event);
                }
            }
        }

    }

    endIntro() {
        const event = new CustomEvent('_nav_content', {
            detail: {
                stripWrap: this.barWrap,
                strip: this.bar,
                imageContainer: this.imageContainer,
                content: this.content
            }
        })

        this.intro.remove();

        window.dispatchEvent(event);

        this.imageContainer.removeEventListener('transitionend', this.endIntroEventListner, false);

    }

    draw(elapsed) {
        this.update(elapsed);
        this.barProgress.style.transform = `translateY(${this.barProgressY}%)`
    }
}