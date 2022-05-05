import { ClipedCharacter } from "./cliped.js";

export class Number {
    constructor(length) {
        this.length = length;

        this.total = new ClipedCharacter('p', length, 'total', 'top');
        this.slash = new ClipedCharacter('p', '/', '', 'top');

        this.indices = [];
        for (let i = 1; i <= length; i++) {
            this.indices.push(i);
        }

        this.indicesDOM = document.createElement('div');
        this.indicesDOM.className = 'indexContainer'

        this.indicesInnerDOM = document.createElement('div');
        this.indicesInnerDOM.className = 'indices';
        this.indicesInnerDOM.innerHTML = `
                ${
                    this.indices.map((_, index) => {
                        const res = index === this.indices.length - 1
                            ? `<p>${_}</p>`
                            : `
                                <p>${_}</p>
                                <div class='indexSpace'></div>
                            `
                        
                        return res;
                    })
                    .reduce((acc, cur) => {
                        acc += cur;
                        return acc;
                    }, '')
                }    
        `;
        
        this.indicesDOM.append(this.indicesInnerDOM);

        this.numberContainer = document.createElement('div');
        this.numberContainer.className = 'numberContainer';

        this.numberContainer.append(
            this.indicesDOM, 
            this.slash.getElement(), 
            this.total.getElement()
            )

        this.currentIndex = -100;

        this.isAvailable = false;
    }

    appendTo(container) {
        container.append(this.numberContainer);
        setTimeout(() => {
            this.show()

            this.isAvailable = true;
        }, 50);
    }

    show() {
        this.currentIndex = -1;
        this.total.add(0);
        this.slash.add(0.25);
    }

    hide() {
        this.slash.remove(0, 'top')
        this.total.remove(0.25, 'top');
    }
}