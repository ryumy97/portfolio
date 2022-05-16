import { AimHighPage1, AimHighPage2, AimHighPage3, AimHighPage4 } from "../pages/articlePages/aimHigh.js";
import { KiwiPage1, KiwiPage2, KiwiPage3, KiwiPage4 } from "../pages/articlePages/kiwi.js";
import { TypographyPage1, TypographyPage2, TypographyPage3, TypographyPage4 } from "../pages/articlePages/typography.js";
import { ClipedCharacter, ClippedArticleDetailTitle } from "./cliped.js";
import { Line } from "./line.js";

export class ArticleDetail {
    constructor(title, index) {
        console.log(title, index);
        this.getContents(index);

        this.container = document.createElement('div');
        this.container.className = 'articleDetailContainer container';

        this.frontLayer = document.createElement('div');
        this.frontLayer.className = 'articleDetailFrontLayer';

        this.titleContainer = document.createElement('div');
        this.titleContainer.className = 'titleContainer';

        this.title = new ClippedArticleDetailTitle(title, '');
        this.title.appendTo(this.titleContainer);

        this.toSiteContainer = document.createElement('div');
        this.toSiteContainer.className = 'toSiteContainer';

        this.toSite = new ClipedCharacter('p', `<a href='${this.link}' target='_blank'>View site</a>`, 'toSite pointer_opacity') 
        this.line = new Line();

        this.toSiteContainer.append(
            this.toSite.getElement(),
            this.line.getElement()
        )

        this.frontLayer.append(
            this.titleContainer, this.toSiteContainer
        );


        this.length = this.content.length;
        this.frontLayer.style.width = `calc(${2} * 100vw)`

        this.container.append(
            ...this.content.map(_ => _.getElement()),
            this.frontLayer,
            );

        this.currentIndex = 0;
        this.selectedIndex = 0;

        this.pressed = false;
        this.savedX = 0;

        this.toSiteContainer.addEventListener('pointerenter', this.toSiteOnHover.bind(this), false);
        this.toSiteContainer.addEventListener('pointerleave', this.toSiteOnUnhover.bind(this), false);
    }

    toSiteOnHover(e) {
        this.line.add(0);
    }

    toSiteOnUnhover(e) {
        this.line.remove(0);
    }

    getContents(index) {
        this.content = [];
        switch(index) {
            case 1:
                this.content = [
                    new TypographyPage1(),
                    new TypographyPage2(),
                    new TypographyPage3(),
                    new TypographyPage4(),
                ]
                this.link = 'http://typography.ryumy.com'
                break;
            case 2:
                this.content = [
                    new KiwiPage1(),
                    new KiwiPage2(),
                    new KiwiPage3(),
                    new KiwiPage4(),
                ]
                this.link = 'https://kiwi.ryumy.com/'
                break;
            case 3:
                this.content = [
                    new AimHighPage1(),
                    new AimHighPage2(),
                    new AimHighPage3(),
                    new AimHighPage4()
                ]
                this.link = 'https://www.aimhightrust.co.nz/'
                break;
            default: 
                console.error('error');
        }
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
            this.selectedIndex += (this.savedX - e.clientX) / this.container.clientWidth;
            if (this.selectedIndex < 0) {
                this.selectedIndex = 0;
            }
            else if (this.selectedIndex > this.length - 1) {
                this.selectedIndex = this.length - 1;
            }
            this.savedX = e.clientX;
        }
    }

    onTouchStart(e) {
        this.pressed = true;
        this.savedX = e.touches[0].clientX;
    }

    onTouchEnd(e) {
        this.pressed = false;
        this.selectedIndex = Math.round(this.selectedIndex);
    }

    onTouchMove(e) {
        if (this.pressed) {
            this.selectedIndex += (this.savedX - e.touches[0].clientX) / this.container.clientWidth;
            if (this.selectedIndex < 0) {
                this.selectedIndex = 0;
            }
            else if (this.selectedIndex > this.length - 1) {
                this.selectedIndex = this.length - 1;
            }
            this.savedX = e.touches[0].clientX;
        }
    }

    add() {
        this.content.forEach(_ => {
            _.add(0.);
        })
        this.title.show()
        this.toSite.add(0.25)
        // this.line.container.style.height = `${this.titleContainer.clientHeight}px`;
        // this.line.add(0.25)
    }

    appendTo(container) {
        container.append(this.container)

        setTimeout(() => {
            this.add();
        }, 50)
    }

    remove() {
        this.content.forEach(_ => {
            _.remove();
        })
        this.title.hide();
        this.toSite.remove(0.25)
    }

    removeDOM() {
        this.container.remove();
    }

    draw(elapsed) {
        this.currentIndex += (this.selectedIndex - this.currentIndex) * 0.01 * elapsed;
        
        this.content.forEach((_, i) => {
            _.getElement().style.transform = `translate3d(${-this.currentIndex * 100 + i * 100}vw, 0, 0)`
        })
        this.frontLayer.style.transform = `translate3d(${(- this.currentIndex / (this.length - 1)) * 50}%, 0, 0)`;
    }
}