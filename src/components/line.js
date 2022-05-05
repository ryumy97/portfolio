export class Line {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'lineContainer';

        this.line = document.createElement('div');
        this.line.className = 'line';
        
        this.container.append(this.line);
    }

    getElement() {
        return this.container;
    }

    add(delay) {
        this.line.style.transitionDelay =`${delay}s`
        this.line.classList.add('adding');
        this.line.classList.remove('remove');
    }

    remove(delay) {
        this.line.style.transitionDelay =`${delay}s`
        this.line.classList.add('remove');
        this.line.classList.remove('adding');
    }
}