import { ClipedCharacter } from '../../components/cliped.js'

export class AboutPage1 {
    constructor() {
        this.title1 = new ClipedCharacter('h1', 'Hi,&nbsp', '');
        this.title2 = new ClipedCharacter('h1', 'my name is In Ha Ryu', '');
        this.title3 = new ClipedCharacter('h1', 'and I develop.', '');

        this.break = document.createElement('div');
        this.break.className = 'break'

        this.page = document.createElement('div');
        this.page.className = 'aboutPage'

        this.content = document.createElement('div');
        this.content.className = 'aboutPageContent';

        this.content.append(
            this.title1.getElement(),
            this.break,
            this.title2.getElement(),
            this.break,
            this.title3.getElement()
        )

        this.page.append(
            this.content
        )
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