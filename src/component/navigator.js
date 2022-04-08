import { getLocation, pages } from '../route.js';
import { pascalCase } from '../helper/text.js';
import { getContext } from '../route.js'

export class Navigator {
    constructor(container) {
        this.container = container;
        this.mouse = {
            x: null,
            y: null
        }
        this.bars = pages.map((pageName, i) => {

            const bar = document.createElement('div');
            bar.className = 'navigationBar';

            const barText = document.createElement('div');
            barText.className = 'navigationText';
            barText.innerText = pascalCase(pageName);
            bar.appendChild(barText);

            if (pages.length / 2 > i) {
                barText.classList.add('right');
            }
            else {
                barText.classList.add('left');
            }

            return {barElement: bar, barText};
        })

        this.barContainer = document.createElement('nav');
        this.barContainer.className = 'navigationContainer'
        this.barContainer.append(...this.bars.map(({barElement}) => barElement));

        container.append(this.barContainer);

        this.barContainer.addEventListener('pointermove', this.onMove.bind(this), false);
        this.barContainer.addEventListener('pointerleave', this.onLeave.bind(this), false);
        this.barContainer.addEventListener('click', this.onClick.bind(this), false); 

        const location = getLocation();
        this.currentPageIndex = pages.findIndex((page) => page === location);
        this.currentPageIndex = this.currentPageIndex === -1 ? 0 : this.currentPageIndex

        this.bars.map((bar, i) => {
            if (this.currentPageIndex === i) {
                bar.barElement.style.transform = ''
            }
            else {
                bar.barElement.style.transform = 'translateY(-12px)';
            }
        })


        this.scrollingEventListener = this.scrolling.bind(this);
        getContext().isTitle ? null : window.addEventListener('wheel', this.scrollingEventListener, false);

        this.navigating = false;
    }

    scrolling(e) {
        if (this.wheel < -400) {
            this.wheel = 0;
            window.removeEventListener('wheel', this.scrollingEventListener, false);

            const nextContent = getContext().prevContext;

            setTimeout(() => {
                const event = new CustomEvent('_getNextContent', {
                    detail: {
                        nextContent
                    }
                });
                window.dispatchEvent(event);
            }, 1000)

            this.container.style.transform = 'translate(0, 200%)';
            this.container.style.transition = `transform 1s cubic-bezier(.77,.01,.46,.97)`;

            this.bars.forEach(({barElement, barText}, i) => {
                barText.style.opacity = 0;
                barText.style.transition = 'opacity 0.1s ease';
                barElement.style.transform = `translateY(${-(i * document.body.clientHeight * 0.2).toFixed(0)}px)`;
                barElement.style.transition = `transform 0.4s cubic-bezier(.77,.01,.46,.97)`;
            })

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

    onClick(e) {
        const index = this.bars.findIndex((bar) => {
            const x = this.barContainer.offsetLeft + bar.barElement.offsetLeft - 8;
            const y = this.barContainer.offsetTop + bar.barElement.offsetTop;
            const w = bar.barElement.clientWidth + 16;
            const h = bar.barElement.clientHeight;
            return x < this.mouse.x && x + w > this.mouse.x && y < this.mouse.y && y + h > this.mouse.y
        })

        if (index !== -1 && !this.navigating) {
            const nextContent = pages[index];

            setTimeout(() => {
                const event = new CustomEvent('_getNextContent', {
                    detail: {
                        nextContent
                    }
                });
                window.dispatchEvent(event);
            }, 1000)

            this.container.style.transform = 'translate(0, 200%)';
            this.container.style.transition = `transform 1s cubic-bezier(.77,.01,.46,.97)`;

            this.bars.forEach(({barElement, barText}, i) => {
                barText.style.opacity = 0;
                barText.style.transition = 'opacity 0.1s ease';
                barElement.style.transform = `translateY(${-(i * document.body.clientHeight * 0.2).toFixed(0)}px)`;
                barElement.style.transition = `transform 0.4s cubic-bezier(.77,.01,.46,.97)`;
            })

            this.navigating = true;
        }
    }

    onMove(e) {
        if (!this.navigating) {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
    
            this.barContainer.style.transform = `scale(1.1) translateY(4px)`;
    
            const index = this.bars.findIndex((bar) => {
                const x = this.barContainer.offsetLeft + bar.barElement.offsetLeft - 8;
                const y = this.barContainer.offsetTop + bar.barElement.offsetTop;
                const w = bar.barElement.clientWidth + 16;
                const h = bar.barElement.clientHeight;
                return x < this.mouse.x && x + w > this.mouse.x && y < this.mouse.y && y + h > this.mouse.y
            })
    
            if (index === -1) {
                this.bars.forEach((bar, i) => {
                    if (this.currentPageIndex === i) {
                        bar.barElement.style.transform = ''
                        bar.barElement.classList.remove('selected')
                    }
                    else {
                        bar.barElement.style.transform = 'translateY(-8px)';
                        bar.barElement.classList.remove('selected')
                    }
                })
    
                this.barContainer.style.cursor = 'default';
            }
            else {
                this.bars.map((bar, i) => {
                    if (index === i) {
                        bar.barElement.style.transform = 'translateY(8px)';
                        bar.barElement.classList.add('selected')
                    }
                    else if (this.currentPageIndex === i) {
                        bar.barElement.style.transform = 'translateY(-8px)'
                        bar.barElement.classList.remove('selected')
                    }
                    else {
                        bar.barElement.style.transform = 'translateY(-16px)';
                        bar.barElement.classList.remove('selected')
                    }
                })
    
                this.barContainer.style.cursor = 'pointer';
            }
        }
    }

    onLeave(e) {
        if (!this.navigating) { 
            this.barContainer.style.transform = '';
            
            this.bars.map((bar, i) => {
                if (this.currentPageIndex === i) {
                    bar.barElement.style.transform = ''
                }
                else {
                    bar.barElement.style.transform = 'translateY(-8px)';
                }
                bar.barElement.classList.remove('selected')
            })
        }
    }
}