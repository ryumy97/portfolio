import { Knob } from "./knob.js";
import { Navigator } from "./navigator.js";
import { Timeline } from './timeline/index.js';
import { Gallery } from './gallery/gallery.js';
import { About } from "./about/about.js";

export class Container {
    constructor({pageName, isTitle, isLast}) {
        this.pageName = pageName;
        this.container = document.createElement('div');
        this.container.className = `container ${isTitle ? '' : 'move'}`;

        if (!isLast) {
            this.knob = new Knob(this.container, isTitle);
        }
        this.navigator = new Navigator(this.container);

        switch(pageName) {
            case 'experiences':
                this.content = new Timeline(this.container);
                break;
            case 'projects':
                this.content = new Gallery(this.container);
                break;
            case 'contact': 
                this.content = new About(this.container);
                break;
            default:
                break;
        }

    }

    resize(stageWidth, stageHeight) {
        console.log(this.pageName)
        console.log(stageWidth, stageHeight)
        switch(this.pageName) {
            case 'experiences':
                this.content && this.content.resize && this.content.resize(stageWidth, stageHeight * 0.6);
                break;
            case 'projects':        
                this.content && this.content.resize && this.content.resize(stageWidth, stageHeight);
            case 'contact': 
                this.content && this.content.resize && this.content.resize(stageWidth, stageHeight);
            default:
                break;
        }
    }

    draw(ratio, progress) {
        this.content && this.content.draw && this.content.draw(ratio, progress);
    }

    getElement() {
        return this.container;
    }

    onProgressEnd() {
        this.knob && this.knob.onProgressEnd();
    }
}