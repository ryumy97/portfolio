import { ImageParticle } from "./imageParticle.js";

const data = [
    {
        title: 'Kiwi',
        url: 'kiwi.ryumy.com',
        images: [
            {
                url: 'assets/kiwi_bird.png',
                width: '30vh',
                height: 'auto'
            }, {
                url: 'assets/kiwi_fruit.png',
                width: '40vh',
                height: 'auto'
            }
        ]
    },
    {
        title: 'Aim High Charitable Trust',
        url: 'aimhightrust.co.nz',
        images: [
            {
                url: 'assets/aimhigh.png',
                width: '40vh',
                height: 'auto'
            },
        ]
    },
]

export class Gallery {
    constructor(container) {
        const carousel = document.createElement('div');
        carousel.className = 'carousel'
        
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.imageMapperCamvas = document.createElement('canvas');
        this.imageMapperCtx = this.imageMapperCamvas.getContext('2d');

        this.currentIndex = 0;

        this.images = [];
        this.pages = [];
        this.texts = [];
        this.images.push(...data.flatMap((_, i) => {
            const images = _.images.map(({url, width, height}) => {
                const img = new Image();
                img.style.width = width;
                img.style.height = height;
                img.src = url;

                img.onload = () => {
                    this.particle = this.getImageParticle();
                    this.state = 'init';
                }

                return img;
            })

            const galleryPage = document.createElement('div');
            galleryPage.className = `page${i === this.currentIndex ? '' : ' none'}`;

            const imageContainer = document.createElement('div');
            imageContainer.className = `imageContainer`
            imageContainer.data_index = i;
            imageContainer.append(...images);
            
            const textContainer = document.createElement('div');
            textContainer.className = 'textContainer opening';
            textContainer.innerHTML = `
            <h1>
                ${_.title}
            </h1>
            ${
                _.url ? `
                <p>
                    <a href="https://${_.url}" target="_blank">${_.url}</a>
                </p>`
                : ''
            }
            `
            
            this.texts.push(textContainer);

            galleryPage.append(imageContainer, textContainer);
            this.pages.push(galleryPage);
            carousel.append(galleryPage);

            return images;
        }))
        
        this.leftButton = document.createElement('div');
        this.leftButton.className = 'button left no_content opening';

        const leftButtonIconTop = document.createElement('div');
        leftButtonIconTop.className = 'icontop';
        this.leftButton.append(leftButtonIconTop);

        const leftButtonIconBottom = document.createElement('div');
        leftButtonIconBottom.className = 'iconbottom';
        this.leftButton.append(leftButtonIconBottom);

        this.rightButton = document.createElement('div');
        this.rightButton.className = 'button right opening';

        const rightButtonIconTop = document.createElement('div');
        rightButtonIconTop.className = 'icontop';
        this.rightButton.append(rightButtonIconTop);

        const rightButtonIconBottom = document.createElement('div');
        rightButtonIconBottom.className = 'iconbottom';
        this.rightButton.append(rightButtonIconBottom);

        this.nextEventListener = this.next.bind(this);
        this.prevEventListener = this.prev.bind(this);

        this.leftButton.addEventListener('click', this.prevEventListener, false);
        this.rightButton.addEventListener('click', this.nextEventListener, false);

        carousel.append(this.leftButton, this.rightButton);
        carousel.append(this.canvas);
        container.append(carousel);

        this.particle = null;
        this.state = 'init';
        this.progress = 0;
        this.shouldCollide = true;
        this.divideBy = 40;

        this.mouse = {
            x: -9999,
            y: -9999
        }

        window.addEventListener('_animationStop', this.stopCollide.bind(this), false);
        window.addEventListener('_animationContinue', this.continueCollide.bind(this), false);
        window.addEventListener('pointermove', this.mouseTracker.bind(this), false);
        window.addEventListener('_carousel_move_finish', this.finish.bind(this), false);
    }

    resize(stageWidth, stageHeight) {
        this.stageWidth = stageWidth;
        this.stageHeight = stageHeight;

        this.canvas.width = stageWidth * 2;
        this.canvas.height = stageHeight * 2;

        this.imageMapperCamvas.width = stageWidth * 2;
        this.imageMapperCamvas.height = stageHeight * 2;
        this.imageMapperCtx.scale(2,2);

        this.ctx.scale(2, 2);

        this.particle = this.resizeImageParticle()
    }

    next(e) {
        if (this.state !== 'moving') {
            this.currentIndex++;
            console.log(e);

            this.rightButton.id = 'clicked';

            if (this.currentIndex === this.pages.length - 1) {
                this.rightButton.classList.add('no_content');
                this.rightButton.removeEventListener('click', this.nextEventListener, false);
            }
            
            if (this.leftButton.classList.contains('no_content')) {
                this.leftButton.classList.remove('no_content');
                this.leftButton.addEventListener('click', this.prevEventListener, false);
            }

            this.texts.map((text) => {
                text.classList.add('closingLeft');
            })
            
            this.state = 'moving';
            this.progress = 0;
            this.particle.map(p => {
                p.moveLeft(this.stageHeight);
            })
    
            setTimeout(() => {
                const event = new CustomEvent('_carousel_move_finish', {
                    detail: {
                        next: true
                    }
                });
                window.dispatchEvent(event);
            }, 1200)
        }
    }

    prev(e) {
        if (this.state !== 'moving') {
            this.currentIndex--;
            console.log(e);

            this.leftButton.id = 'clicked';

            if (this.currentIndex === 0) {
                this.leftButton.classList.add('no_content');
                this.leftButton.removeEventListener('click', this.prevEventListener, false);
            }
            
            if (this.rightButton.classList.contains('no_content')) {
                this.rightButton.classList.remove('no_content');
                this.rightButton.addEventListener('click', this.nextEventListener, false);
            }

            this.texts.map((text) => {
                text.classList.add('closingRight');
            })
            
            this.state = 'moving';
            this.progress = 0;
            this.particle.map(p => {
                p.moveRight(this.stageWidth, this.stageHeight);
            })
    
            setTimeout(() => {
                const event = new CustomEvent('_carousel_move_finish', {
                    detail: {
                        prev: true
                    }
                });
                window.dispatchEvent(event);
            }, 1200)
        }
    }

    finish(e) {
        this.state = 'running'

        this.pages.map((page, i) => {
            page.className = `page${i === this.currentIndex ? '' : ' none'}`
        })

        this.texts.map((d) => {
            d.classList.remove('opening');
            d.classList.remove('closingRight');
            d.classList.remove('closingLeft');
        })

        this.rightButton.classList.remove('opening');
        this.leftButton.classList.remove('opening');
        
        this.particle = this.getImageParticle(e);
        this.progress = 0;

        if (e.detail.next) {
            this.rightButton.id = ''
        }
        else if (e.detail.prev) {
            this.leftButton.id = ''
        }
    }

    resizeImageParticle() {
        if (!this.stageWidth || !this.stageHeight || !this.particle || this.particle.length === 0) {
            return
        }
        console.log(this.particle);


        this.imageMapperCtx.clearRect(0, 0, this.stageWidth, this.stageHeight);
        this.images.flatMap(img => {
            this.imageMapperCtx.drawImage(img, img.offsetLeft, img.offsetTop, img.offsetWidth, img.offsetHeight);
        })
        let index = 0;

        const imageData = this.images.flatMap(img => {
            const sections = [];

            for (let i = 0; i <= img.offsetHeight - 1; i += img.offsetHeight / this.divideBy) {
                    const x = img.offsetLeft;
                    const width = img.offsetWidth;

                    const y = img.offsetTop + i;
                    const height = img.offsetHeight / this.divideBy;

                    const imageData = this.imageMapperCtx.getImageData(x * 2, y * 2, width * 2 + 1, height * 2 + 1);

                    const data = this.particle.find(p => p.index === index);
                    console.log(data);
                    data.imageData = imageData;
                    data.targetX = x;
                    data.targetY = y;
                    data.width = width;
                    data.height = height;

                    index++;

                    sections.push(data);
            }

            return sections;
        })

        return imageData;
    }

    getImageParticle(e) {
        if (!this.stageWidth || !this.stageHeight) {
            return
        }

        this.imageMapperCtx.clearRect(0, 0, this.stageWidth, this.stageHeight);
        this.images.flatMap(img => {
            this.imageMapperCtx.drawImage(img, img.offsetLeft, img.offsetTop, img.offsetWidth, img.offsetHeight);
        })
        let index = 0;

        const imageData = this.images.flatMap(img => {
            const sections = [];

            for (let i = 0; i <= img.offsetHeight - 1; i += img.offsetHeight / this.divideBy) {
                    const x = img.offsetLeft;
                    const width = img.offsetWidth;

                    const y = img.offsetTop + i;
                    const height = img.offsetHeight / this.divideBy;

                    const imageData = this.imageMapperCtx.getImageData(x * 2, y * 2, width * 2 + 1, height * 2 + 1);

                    const initX = !e
                        ? this.stageWidth + width
                        : e.detail.next
                        ? this.stageWidth + width
                        : 0 - width * 2

                    const initY = y

                    const data = new ImageParticle(
                        imageData, 
                        x, 
                        y, 
                        width, 
                        height, 
                        index,
                        initX,
                        initY
                        )

                    index++;

                    sections.push(data);

            }

            return sections;
        })

        return imageData;
    }

    draw(ratio, progress) {
        if (progress >= 1) {
            this.now = new Date();
            const sec = this.then ? this.now - this.then : 0;
            this.progress += sec / 1000

            if (this.state === 'init') {
                if (this.progress > 1.75) {
                    this.state = 'moving'
                    this.progress = 0;
    
                    setTimeout(() => {
                        this.state = 'running';
                    }, 1200)
                    
                }
            }
            else {
                if (!this.particle || this.particle.length === 0) {
                    this.particle = this.getImageParticle();
                    console.log(this.particle);
                }

                this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight)

                this.particle.map(p => {
                    p.update(this.progress);
                    this.shouldCollide && p.collide(this.mouse);
                })

                this.particle.map(p => {
                    p.drawShadow(this.ctx);
                })

                this.particle.map(p => {
                    p.draw(this.ctx);
                })
            }

            this.then = this.now;
        }
    }

    stopCollide() {
        this.shouldCollide = false;
    }

    continueCollide() {
        this.shouldCollide = true;
    }

    mouseTracker(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }
}