import { ClipedCharacter } from '../../components/cliped.js'
import { Line } from '../../components/line.js';

export class AboutPage3 {
    constructor() {
        this.title1 = new ClipedCharacter('h2', 'Contact', '');
        this.line = new Line();

        this.content1 = new ClipedCharacter('p', 'If you wish to contact me,', '');
        this.content2 = new ClipedCharacter('a', 'inha.ryu.97@gmail.com', 'pointer_opacity');
        this.content2.char.href = 'mailto: inha.ryu.97@gmail.com';

        this.content3 = new ClipedCharacter('p', 'Checkout followings:', '');

        this.content4 = new ClipedCharacter('a', '<img src="/assets/instagram.png" class="icon"></img>', 'pointer_opacity');
        this.content4.char.href = 'https://www.instagram.com/ryumy97/';
        this.content4.char.target = '_blank';
        
        this.content5 = new ClipedCharacter('a', '<img src="/assets/github.png" class="icon"></img>', 'pointer_opacity');
        this.content5.char.href = 'https://github.com/ryumy97';
        this.content5.char.target = '_blank';

        this.content6 = new ClipedCharacter('a', '<img src="/assets/linkedIn.png" class="icon"></img>', 'pointer_opacity');
        this.content6.char.href = 'https://www.linkedin.com/in/in-ha-ryu-775398147/';
        this.content6.char.target = '_blank';

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
            this.getBreak('small'),

            this.content3.getElement(),
            this.getBreak('small'),
            this.content4.getElement(),
            this.content5.getElement(),
            this.content6.getElement(),
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
    }

    remove() {
        this.title1.remove(0);
        this.line.remove(0.25);
        this.content1.remove(0);
        this.content2.remove(0.25);
        this.content3.remove(0);
        this.content4.remove(0.25);
        this.content5.remove(0.5);
        this.content6.remove(0.75);
    }

    getElement() {
        return this.page
    }
}