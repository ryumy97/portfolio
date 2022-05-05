import { Article, ArticleMock, Block } from "../components/article.js";
import { ArticleDetail } from "../components/articleDetail.js";
import { ClipedCharacter } from "../components/cliped.js";
import { Number } from '../components/number.js';
import { About } from "./about.js";

export class Content {
    constructor(container, detail) {
        this.container = container;

        this.overlayContainer = document.createElement('div');
        this.overlayContainer.id = 'overlayContainer';
        this.overlayContainer.className = 'overlayContainer';

        this.container.append(this.overlayContainer);
        
        this.workContainer = document.createElement('div');
        this.workContainer.className = 'work';

        this.work = new ClipedCharacter('p', 'Work', 'work', 'top');
        this.workContainer.append(this.work.getElement());

        this.aboutContainer = document.createElement('div');
        this.aboutContainer.className = 'about clickableContainer';

        this.about = new ClipedCharacter('p', 'About', 'about clickable', 'top');
        this.aboutContainer.append(this.about.getElement());

        this.stripWrap = detail.stripWrap;
        this.strip = detail.strip;

        this.image = new Image();
        this.image.src = '/assets/typography/typography05.png';
        this.image.style.opacity = 0;

        this.image.opacity = 0;

        this.imageContainer = detail.imageContainer;
        this.imageContainer.style.transitionDelay = '0s';  
        
        this.imageContainer.append(this.image);

        this.content = detail.content;

        this.strip.remove();

        this.aboutPage = null;

        container.append(
            this.workContainer,
            this.aboutContainer
            )

        const event = new CustomEvent('_addClickable', {
            detail: {
                element: this.aboutContainer,
                id: 'about'
            }
        })
        dispatchEvent(event)

        this.initEventHandlers();

        setTimeout(() => {
            this.work.add(0);
            this.about.add(0.25);

            document.body.style.transitionDelay = '1s';
            document.body.style.color = '#000000';
            document.body.style.backgroundColor = '#f2f2f2';

            const event = new CustomEvent('_initPointer', {
                detail: {
                    mouseColorR: 0,
                    mouseColorG: 0,
                    mouseColorB: 0,
                    arrowColorR: 0,
                    arrowColorG: 0,
                    arrowColorB: 0,
                    arrowUp: true,
                    arrowDown: true,
                    arrowLeft: false,
                    arrowRight: false
                }
            });
            window.dispatchEvent(event);  

            document.body.addEventListener('transitionend', this.loadingFinishEventListener, false);
            window.addEventListener('_mouse_reverted', this.mouseReverted.bind(this), false);
        }, 10)

        window.addEventListener('_mouse_init', this.onMouseInit.bind(this), false);

        this.state = 'loading';
        this.selectedIndex = 0;
        this.currentIndex = 0;
    }

    initEventHandlers() {
        this.onDownEventHandler = this.onDown.bind(this);
        this.onUpEventHandler = this.onUp.bind(this);
        this.onMoveEventHandler = this.onMove.bind(this);

        this.loadingFinishEventListener = this.loadingFinish.bind(this)
        this.contentLoadingFinishEventListner = this.contentLoadingFinish.bind(this);

        this.toAboutEventHandler = this.toAbout.bind(this);
        this.toContentEventHandler = this.toContent.bind(this);
        this.toWorkEventHandler = this.toWork.bind(this);
    }

    onMouseInit(e) {
        window.addEventListener('mousedown', this.onDownEventHandler,false);
        window.addEventListener('mouseup', this.onUpEventHandler,false);
        window.addEventListener('mousemove', this.onMoveEventHandler, false);

        if (this.state === 'about') {
            this.workContainer.addEventListener('pointerdown', this.toWorkEventHandler, false);
        }
        else if (this.state === 'article') {
            this.workContainer.addEventListener('pointerdown', this.toWorkEventHandler, false);
        }
        else {
            this.aboutContainer.addEventListener('pointerdown', this.toAboutEventHandler, false);
        }
    }

    draw(elapsed) {
        this.image.opacity += (1 - this.image.opacity) * 0.001 * elapsed;
        this.image.style.opacity = this.image.opacity;

        if (this.state ==='new' || this.state === 'work') {
            this.currentIndex += (this.selectedIndex - this.currentIndex) * 0.01 * elapsed;
            this.articles.forEach(_ => {
                _.stripWrap.style.transform = `translate3d(0, ${-this.currentIndex * 100}%,0)`;
            })
            
            if (this.number.isAvailable) {
                this.number.currentIndex += (this.selectedIndex - this.number.currentIndex) * 0.01 * elapsed;
                this.number.indicesInnerDOM.style.transform = `translate3d(0, ${-this.number.currentIndex * 100}%,0)`;    
            }
        }
        else if (this.state === 'about') {
            this.number.currentIndex += (-1 - this.number.currentIndex) * 0.01 * elapsed;
            this.number.indicesInnerDOM.style.transform = `translate3d(0, ${-this.number.currentIndex * 100}%,0)`;
        
            this.aboutPage && this.aboutPage.draw(elapsed);
        }
        else if (this.state === 'article') {
            this.number.currentIndex += (-1 - this.number.currentIndex) * 0.01 * elapsed;
            this.number.indicesInnerDOM.style.transform = `translate3d(0, ${-this.number.currentIndex * 100}%,0)`;
        
            this.articleDetail && this.articleDetail.draw(elapsed);
        }
    }

    loadingFinish(e) {
        if (e.propertyName === 'background-color') {
            if (this.state === 'about') {
                this.initAbout();
                return;
            }
            else if (this.state === 'work') {
                this.initWork();
                return;
            }


            this.state = 'new';
            
            this.content.style.height = '90%';
            this.stripWrap.style.width = '60%';

            document.body.removeEventListener('transitionend', this.loadingFinishEventListener, false);
            this.content.addEventListener('transitionend', this.contentLoadingFinishEventListner, false);

            this.articles = [
                new ArticleMock(
                    this.stripWrap, 
                    this.imageContainer, 
                    this.image, 
                    'Typography', 
                    1,
                    this.toContentEventHandler
                    ),
                new Block(),
                new Article(
                    '/assets/kiwi_bird.png',
                    'Kiwi', 
                    2, 
                    this.toContentEventHandler
                    ),
                new Block(),
                new Article(
                    '/assets/aimhigh.png',
                    'Aim High',
                    3,
                    this.toContentEventHandler
                    )
            ];

            this.articles.forEach(_ => {
                _.appendTo(this.content);
            })

            this.number = new Number(3);
            this.number.appendTo(this.container);
        }
    }

    initAbout() {
        this.aboutPage.add();
        const initPointerEvent = new CustomEvent('_initPointer', {
            detail: {
                mouseColorR: 255,
                mouseColorG: 255,
                mouseColorB: 255,
                arrowColorR: 255,
                arrowColorG: 255,
                arrowColorB: 255,
                arrowUp: false,
                arrowDown: false,
                arrowLeft: true,
                arrowRight: true
            }

        });
        window.dispatchEvent(initPointerEvent);

        const addClickableEvent = new CustomEvent('_addClickable', {
            detail: {
                id: 'work',
                element: this.work.getElement()
            }
        })
        this.workContainer.classList.add('clickableContainer');
    
        window.dispatchEvent(addClickableEvent);

        this.number.isAvailable = false;

        document.body.removeEventListener('transitionend', this.loadingFinishEventListener, false);
    }

    initWork() {
        this.articles.forEach(_ => {
            _.show(),
            _.showStrip()
        })

        this.articleDetail && this.articleDetail.removeDOM();

        const initPointerEvent = new CustomEvent('_initPointer', {
            detail: {
                mouseColorR: 0,
                mouseColorG: 0,
                mouseColorB: 0,
                arrowColorR: 0,
                arrowColorG: 0,
                arrowColorB: 0,
                arrowUp: true,
                arrowDown: true,
                arrowLeft: false,
                arrowRight: false
            }
        });
        window.dispatchEvent(initPointerEvent);

        const addClickableEvent = new CustomEvent('_addClickable', {
            detail: {
                id: 'about',
                element: this.about.getElement()
            }
        })

        this.aboutContainer.classList.add('clickableContainer');
    
        window.dispatchEvent(addClickableEvent);

        document.body.removeEventListener('transitionend', this.loadingFinishEventListener, false);

        this.aboutPage && this.aboutPage.removeDOM(this.container);
        this.aboutPage = null;

        this.articles.forEach(_ => {
            if (_.isBlock) {
                return
            }

            _.title.wordContainer.classList.add('pointer_opacity');
        })

        this.number.show()
        this.number.isAvailable = true;

        this.about.add(0);
    }

    contentLoadingFinish(e) {
        
        this.articles.forEach(_ => {
            _.imageContainer.style.opacity = 1;
        })

        this.content.removeEventListener('transitionend', this.contentLoadingFinishEventListner, false);
    }

    onDown(e) {
        if (this.state === 'new' || this.state === 'work') {
            this.pressed = true;
            this.content.style.transitionDuration = '0.5s';
            this.content.style.height = '40%';

            this.articles.forEach(_ => {
                _.onDown();
                _.hide('left');
            })

            this.savedY = e.clientY;
        }
        else if (this.state === 'about') {
            this.aboutPage && this.aboutPage.onDown(e);
        }
        else if (this.state === 'article') {
            this.articleDetail && this.articleDetail.onDown(e);
        }
    }
    
    onMove(e) {
        if (this.state === 'new' || this.state === 'work') {
            if (this.pressed) {
                this.selectedIndex += (this.savedY - e.clientY) / this.content.clientHeight * 2;
                if (this.selectedIndex < 0) {
                    this.selectedIndex = 0;
                }
                else if (this.selectedIndex > this.getTotalLength() - 1) {
                    this.selectedIndex = this.getTotalLength() - 1
                }
                this.savedY = e.clientY;
            }
        }
        else if (this.state === 'about') {
            this.aboutPage && this.aboutPage.onMove(e);
        }
        else if (this.state === 'article') {
            this.articleDetail && this.articleDetail.onMove(e);
        }
    }

    onUp(e) {
        if (this.state === 'new' || this.state === 'work') {
            this.pressed = false;
            this.content.style.transitionDuration = '0.5s';
            this.content.style.height = '90%';

            this.articles.forEach(_ => {
                _.onUp()
            })
            
            let acc = 0;
            let result = 0;
            this.articles.forEach(_ => {
                if (acc <= this.selectedIndex && acc + _.ratio > this.selectedIndex) {
                    if (_.isBlock) {
                        result = acc + _.ratio;
                    }
                    else {
                        result = acc;
                    }
                    
                    acc += _.ratio;
                    return;
                }
                acc += _.ratio;
            })

            this.selectedIndex = result;

            const article = this.getCurrentArticle();
            this.overlayContainer.style.transform = `translateY(${-(article.number - 1) * 100}%)`;
            article.show();
        }
        else if (this.state === 'about') {
            this.aboutPage && this.aboutPage.onUp(e);
        }
        else if (this.state === 'article') {
            this.articleDetail && this.articleDetail.onUp(e);
        }
    }

    getTotalLength() {
        const total = this.articles.reduce((acc, value) => {
            return acc + value.ratio;
        }, 0)

        return total;
    }

    getCurrentArticle() {
        let article = null;
        let acc = 0;
        this.articles.forEach(_ => {
            if (acc <= this.selectedIndex && acc + _.ratio > this.selectedIndex) {
                article = _;
            }

            acc += _.ratio;
        })

        return article;
    }

    toAbout(e) {
        if (!this.articles) {
            return
        }
        this.state = 'about';

        window.removeEventListener('mousedown', this.onDownEventHandler,false);
        window.removeEventListener('mouseup', this.onUpEventHandler,false);
        window.removeEventListener('mousemove', this.onMoveEventHandler, false);
        this.aboutContainer.removeEventListener('pointerdown', this.toAboutEventHandler, false);

        document.querySelectorAll('.pointer_opacity').forEach(_ => {
            _.classList.remove('pointer_opacity');
        })

        const removeClickableEvent = new CustomEvent('_removeClickable', {
            detail: {
                id: 'about'
            }
        })
        window.dispatchEvent(removeClickableEvent);
        this.aboutContainer.classList.remove('clickableContainer');

        this.articles.forEach((_ ,index) => {
            _.hide(),
            _.hideStrip()
        })
        this.number.hide();

        const nextContentEvent = new CustomEvent('_enterContent', {

        });

        window.dispatchEvent(nextContentEvent);
    
        this.aboutPage = new About(3);
        this.aboutPage.appendTo(this.container)

        document.body.addEventListener('transitionend', this.loadingFinishEventListener, false);
        document.body.style.transitionDelay = '1s';
        document.body.style.color = '#ffffff';
        document.body.style.backgroundColor = '#000000';
    }

    toContent(e) {
        console.log(e);
        this.state = 'article';
        
        window.removeEventListener('mousedown', this.onDownEventHandler,false);
        window.removeEventListener('mouseup', this.onUpEventHandler,false);
        window.removeEventListener('mousemove', this.onMoveEventHandler, false);
        this.aboutContainer.removeEventListener('pointerdown', this.toAboutEventHandler, false);

        document.querySelectorAll('.pointer_opacity').forEach(_ => {
            _.classList.remove('pointer_opacity');
        })

        const removeClickableEvent = new CustomEvent('_removeClickable', {
            detail: {
                id: 'about'
            }
        })
        window.dispatchEvent(removeClickableEvent);
        this.aboutContainer.classList.remove('clickableContainer');
        this.about.remove(0);

        this.articles.forEach((_ ,index) => {
            _.hide(),
            _.hideStrip()
        })
        this.number.hide();
        this.number.isAvailable = false;

        const nextContentEvent = new CustomEvent('_enterContent', {

        });

        window.dispatchEvent(nextContentEvent);
    }

    toWork(e) {
        this.state = 'work';

        window.removeEventListener('mousedown', this.onDownEventHandler,false);
        window.removeEventListener('mouseup', this.onUpEventHandler,false);
        window.removeEventListener('mousemove', this.onMoveEventHandler, false);
        this.workContainer.removeEventListener('pointerdown', this.toWorkEventHandler, false);
        
        this.aboutPage && this.aboutPage.remove();
        if (!this.aboutPage) {
            setTimeout(() => {
                this.initWork()
            }, 1500)
        }

        this.articleDetail && this.articleDetail.remove();

        const removeClickableEvent = new CustomEvent('_removeClickable', {
            detail: {
                id: 'work'
            }
        })
        window.dispatchEvent(removeClickableEvent);
        this.workContainer.classList.remove('clickableContainer');

        const nextContentEvent = new CustomEvent('_enterContent', {

        });

        window.dispatchEvent(nextContentEvent);

        document.body.addEventListener('transitionend', this.loadingFinishEventListener, false);
        document.body.style.transitionDelay = '1s';
        document.body.style.color = '#000000';
        document.body.style.backgroundColor = '#f2f2f2';
    }

    mouseReverted() {
        if (this.state === 'article') {
            setTimeout(() => {
                const initPointerEvent = new CustomEvent('_initPointer', {
                    detail: {
                        mouseColorR: 0,
                        mouseColorG: 0,
                        mouseColorB: 0,
                        arrowColorR: 0,
                        arrowColorG: 0,
                        arrowColorB: 0,
                        arrowUp: false,
                        arrowDown: false,
                        arrowLeft: true,
                        arrowRight: true
                    }
                });
                window.dispatchEvent(initPointerEvent);
    
                const addClickableEvent = new CustomEvent('_addClickable', {
                    detail: {
                        id: 'work',
                        element: this.work.getElement()
                    }
                })
                this.workContainer.classList.add('clickableContainer');
            
                window.dispatchEvent(addClickableEvent);
    
                this.number.isAvailable = false;
    
                document.body.removeEventListener('transitionend', this.loadingFinishEventListener, false);

                this.articleDetail = new ArticleDetail(this.getCurrentArticle().str, this.selectedIndex)
                this.articleDetail.appendTo(this.container);

            }, 500)
            return;
        }
    }
}