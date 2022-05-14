import { ClipedCharacter } from '../components/cliped.js'
import { AboutPage1 } from './aboutPages/page1.js';
import { AboutPage2 } from './aboutPages/page2.js';
import { AboutPage3 } from './aboutPages/page3.js';

export class About {
    constructor(length) {
        this.length = length;

        this.container = document.createElement('div');
        this.container.className = 'aboutPageContainer container';

        this.page1 = new AboutPage1();
        this.page2 = new AboutPage2();
        this.page3 = new AboutPage3();

        this.container.append(
            this.page1.getElement(),
            this.page2.getElement(),
            this.page3.getElement()
        )

        this.runner = document.createElement('div');
        this.runner.className = 'runner';
        this.runner.style.width = '0';
        
        this.runnerLine = document.createElement('div');
        this.runnerLine.className = 'runnerLine';
        this.runnerLine.style.width = '0';

        this.runner.append(this.runnerLine)

        this.currentIndex = 0;
        this.selectedIndex = 0;

        this.pressed = false;
        this.savedX = 0;
    }

    onDown(e) {
        this.pressed = true;
        this.savedX = e.clientX;
    }

    onUp(e) {
        this.pressed = false;

        this.selectedIndex = Math.round(this.selectedIndex);
    }

    onMove(e) {
        if (this.pressed) {
            this.selectedIndex += (this.savedX - e.clientX) / this.runner.clientWidth;
            if (this.selectedIndex < 0) {
                this.selectedIndex = 0;
            }
            else if (this.selectedIndex > this.length - 1) {
                this.selectedIndex = this.length - 1
            }
            this.savedX = e.clientX;
        }
    }

    onTouchStart(e) {
        this.pressed = true;
        this.savedX = e.touches[0].clientX;
    }

    onTouchMove(e) {
        if (this.pressed) {
            this.selectedIndex += (this.savedX - e.touches[0].clientX) / this.runner.clientWidth;
            if (this.selectedIndex < 0) {
                this.selectedIndex = 0;
            }
            else if (this.selectedIndex > this.length - 1) {
                this.selectedIndex = this.length - 1
            }
            this.savedX = e.touches[0].clientX;
        }
    }

    onTouchEnd(e) {
        this.pressed = false;

        this.selectedIndex = Math.round(this.selectedIndex);
    }

    add() {
        this.page1.add(0);
        this.page2.add();
        this.page3.add();
        this.runner.style.width = '100%';
        this.runnerLine.style.width = `${100/this.length}%`;

    }

    remove() {
        this.page1.remove();
        this.page2.remove();
        this.page3.remove();
        this.runner.style.width = '0';
        this.runnerLine.style.width = '0';
    }

    removeDOM() {
        this.container.remove();
        this.runner.remove();
    }

    appendTo(container) {
        container.append(this.container, this.runner)
    }

    draw(elapsed) {
        this.currentIndex += (this.selectedIndex - this.currentIndex) * 0.01 * elapsed;

        this.runnerLine.style.transform = `translate3d(${this.currentIndex * 100}%, 0, 0)`;

        this.page1.getElement().style.transform = `translate3d(${-this.currentIndex * 100}vw, 0, 0)`;
        this.page2.getElement().style.transform = `translate3d(${-this.currentIndex * 100 + 100}vw, 0, 0)`;
        this.page3.getElement().style.transform = `translate3d(${-this.currentIndex * 100 + 200}vw, 0, 0)`;
    }
}