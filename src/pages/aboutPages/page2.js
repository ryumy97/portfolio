import { ClipedCharacter } from '../../components/cliped.js'
import { Line } from '../../components/line.js';

export class AboutPage2 {
    constructor() {
        this.title1 = new ClipedCharacter('h2', 'Experiences', '');
        this.line = new Line();

        this.content1 = new ClipedCharacter('small', 'MAR 2021 - PRESENT', '');
        this.content2 = new ClipedCharacter('p', 'Infosys,&nbsp', '');
        this.content3 = new ClipedCharacter('p', 'Auckland&nbsp', '');
        this.content4 = new ClipedCharacter('p', '- Associate', '');
        
        this.content5 = new ClipedCharacter('small', 'DEC 2018 - JUN 2019', '');
        this.content6 = new ClipedCharacter('p', 'Perpetual Guardian,&nbsp', '');
        this.content7 = new ClipedCharacter('p', 'Auckland&nbsp', '');
        this.content8 = new ClipedCharacter('p', '- Junior Analyst Programmer', '');

        this.page = document.createElement('div');
        this.page.className = 'aboutPage'

        this.content = document.createElement('div');
        this.content.className = 'aboutPageContent';

        this.content.append(
            this.title1.getElement(),
            this.line.getElement(),
            this.getBreak('small'),
            this.getBreak('small'),

            this.content1.getElement(),
            this.getBreak(''),
            this.content2.getElement(),
            this.content3.getElement(),
            this.content4.getElement(),

            this.getBreak('small'),

            this.content5.getElement(),
            this.getBreak(''),
            this.content6.getElement(),
            this.content7.getElement(),
            this.content8.getElement()
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

    add() {
        this.title1.add(0);
        this.line.add(0);
        this.content1.add(0);
        this.content2.add(0);
        this.content3.add(0);
        this.content4.add(0);
        this.content5.add(0);
        this.content6.add(0);
        this.content7.add(0);
        this.content8.add(0);
    }

    remove() {
        this.title1.remove(0);
        this.line.remove(0.25);
        this.content1.remove(0);
        this.content2.remove(0.25);
        this.content3.remove(0.5);
        this.content4.remove(0.75);
        this.content5.remove(0);
        this.content6.remove(0.25);
        this.content7.remove(0.5);
        this.content8.remove(0.75);
    }

    getElement() {
        return this.page
    }
}