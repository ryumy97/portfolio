import { getBezierCurveProgress } from '../lib/progress.js';

export class Pointer {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'pointer'
        this.ctx = this.canvas.getContext('2d');   
        
        this.mouse = {
            savedX: 0,
            savedY: 0,
            x: 0,
            y: 0,
            angle: 0,
            radius: 20,
            initialised: false,
            opacity: 1,
            r: 255,
            g: 255,
            b: 255
        }

        this.arrow = {
            distance: this.mouse.radius * 2,
            opacity: 0,
            r: 255,
            g: 255,
            b: 255,
            up: true,
            down: false,
            left: false,
            right: false
        }

        this.clickable = [];

        window.addEventListener('mousemove', this.onMove.bind(this), false);
        window.addEventListener('mousedown', this.onDown.bind(this), false);
        window.addEventListener('mouseup', this.onUp.bind(this), false);
        
        window.addEventListener('touchstart', this.onTouchStart.bind(this), false);
        window.addEventListener('touchend', this.onTouchEnd.bind(this), false);
        window.addEventListener('touchmove', this.onTouchMove.bind(this), false);

        window.addEventListener('_enterContent', this.enterContent.bind(this), false);
        window.addEventListener('_initPointer', this.initPointer.bind(this), false);
        window.addEventListener('_addClickable', this.addClickable.bind(this), false);
        window.addEventListener('_removeClickable', this.removeClickable.bind(this), false);

        this.state = 'init';
        this.progress = -1.5;
    }

    removeClickable(e) {
        const matching = this.clickable.find(_ => _.id === e.detail.id);
        matching
            ? matching.enabled = false
            : null;
    }

    addClickable(e) {
        const matching = this.clickable.find(_ => _.id === e.detail.id);
        if (!matching) {
            const item = e.detail.element.getClientRects().item(0);
            const itemX = item.x + item.width / 2;
            const itemY = item.y + item.height / 2;
            const itemRadius = item.width + 10;
    
            this.clickable.push(
                {
                    element: e.detail.element,
                    id: e.detail.id,
                    savedX: itemX,
                    savedY: itemY,
                    radius: itemRadius,
                    transformedX: 0,
                    transformedY: 0,
                    enabled: true
                }
            )

        }
        else {
            matching.enabled = true;
        }
    }
    
    enterContent() {
        console.log('entering');
        this.state = 'revert';
        this.progress = 0;
    }

    initPointer(e) {
        console.log('init');
        this.state = 'init';
        this.progress = 0;

        this.mouse.r = e.detail.mouseColorR;
        this.mouse.g = e.detail.mouseColorG;
        this.mouse.b = e.detail.mouseColorB;

        this.arrow.r = e.detail.arrowColorR;
        this.arrow.g = e.detail.arrowColorG;
        this.arrow.b = e.detail.arrowColorB;

        this.arrow.up = e.detail.arrowUp;
        this.arrow.down = e.detail.arrowDown;
        this.arrow.left = e.detail.arrowLeft;
        this.arrow.right = e.detail.arrowRight;
    }

    onMove(e) {
        this.mouse.savedX = e.clientX;
        this.mouse.savedY = e.clientY;
        this.mouse.trueX = e.clientX;
        this.mouse.trueY = e.clientY;
    }

    onDown(e) {
        this.pressed = true;
    }

    onUp(e) {
        this.pressed = false;
    }

    onTouchStart(e) {
        this.pressed = true;
        this.mouse.savedX = e.touches[0].clientX;
        this.mouse.savedY = e.touches[0].clientY;
        this.mouse.trueX = e.touches[0].clientX;
        this.mouse.trueY = e.touches[0].clientY;
    }

    onTouchEnd(e) {
        this.pressed = false;
    }

    onTouchMove(e) {
        this.mouse.savedX = e.touches[0].clientX;
        this.mouse.savedY = e.touches[0].clientY;
        this.mouse.trueX = e.touches[0].clientX;
        this.mouse.trueY = e.touches[0].clientY;
    }

    resize(sw, sh) {
        this.sw = sw;
        this.sh = sh;

        this.canvas.width = sw * 2;
        this.canvas.height = sh * 2;
    
        this.ctx.scale(2, 2);

        if (!this.mouse.initialised) {
            this.mouse.x = sw / 2;
            this.mouse.y = sh / 2;
            this.mouse.savedX = sw / 2;
            this.mouse.savedY = sh / 2;
        }

        this.clickable.forEach((_ => {
            _.element.style.transform = `translate3d(0px, 0px, 0)`;

            const item = _.element.getClientRects().item(0);
            const itemX = item.x + item.width / 2;
            const itemY = item.y + item.height / 2;
            const itemRadius = item.width + 10;

            _.savedX = itemX,
            _.savedY = itemY,
            _.radius = itemRadius,
            _.transformedX = 0,
            _.transformedY = 0
        }))        
    }

    updateInit(elapsed) {
        if (this.mouse.initialised) {
            this.mouse.x += (this.mouse.savedX - this.mouse.x) * 0.01 * elapsed;
            this.mouse.y += (this.mouse.savedY - this.mouse.y) * 0.01 * elapsed;

            if (this.pressed) {
                this.mouse.radius += (15 - this.mouse.radius) * 0.01 * elapsed;
                this.arrow.distance += (this.mouse.radius * 1.75 - this.arrow.distance) * 0.01 * elapsed;
                this.arrow.opacity += (1 - this.arrow.opacity) * 0.01 * elapsed;                
            }
            else {
                this.mouse.radius += (20 - this.mouse.radius) * 0.01 * elapsed;
                this.arrow.distance += (this.mouse.radius * 2.5 - this.arrow.distance) * 0.01 * elapsed;
                this.arrow.opacity += (0 - this.arrow.opacity) * 0.01 * elapsed;
            }
        }
        else {
            if (this.progress < 0) {
                return
            }
            else if (this.progress >= 1) {
                this.mouse.angle = 1;
                this.mouse.initialised = true;

                const event = new CustomEvent('_mouse_init', {
                    
                })

                this.progress = 1;
                
                window.dispatchEvent(event);
            }
            else {
                this.mouse.angle = (Math.cos(Math.PI * (1 - this.progress) / 2));
            }
        }
    }

    updateRevert(elapsed) {
        this.mouse.x += (this.mouse.savedX - this.mouse.x) * 0.01 * elapsed;
        this.mouse.y += (this.mouse.savedY - this.mouse.y) * 0.01 * elapsed; 

        this.pressed = false;
        
        this.mouse.radius += (20 - this.mouse.radius) * 0.01 * elapsed;
        this.arrow.distance += (this.mouse.radius * 2.5 - this.arrow.distance) * 0.01 * elapsed;
        this.arrow.opacity += (0 - this.arrow.opacity) * 0.01 * elapsed;

        if (this.progress >= 1) {
            this.progress = 1;
            this.mouse.angle = 0;
            if (this.mouse.initialised) {
                const event = new CustomEvent('_mouse_reverted', {

                })
                window.dispatchEvent(event);
            }

            this.mouse.initialised = false;
        }
        else {
            this.mouse.angle = (Math.cos(Math.PI * this.progress / 2));
        }
    }

    updateOpacity(elapsed) {
        let reduceOpacity = false;
        if (!this.pressed) {
            document.querySelectorAll('.pointer_opacity').forEach((_, index) => {
                const item = _.getClientRects().item(0);

                if (
                    this.mouse.x > item.x && this.mouse.x < item.x + item.width
                    && this.mouse.y > item.y && this.mouse.y < item.y + item.height
                ) {
                    reduceOpacity = true;
                }
                
            })
        }

        this.mouse.opacity += ((reduceOpacity ? 0 : 1) - this.mouse.opacity) * 0.01 * elapsed;
    }

    updateClickable(elapsed) {
        if (!this.pressed && this.mouse.initialised) {
            this.clickable.forEach(_ => {
                const dx = this.mouse.trueX - _.savedX;
                const dy = this.mouse.trueY - _.savedY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = _.radius + this.mouse.radius;

                if (dist < minDist && _.enabled) {
                    this.mouse.savedX = _.savedX + dx / 2;
                    this.mouse.savedY = _.savedY + dy / 2;
                    this.mouse.radius += (_.radius - this.mouse.radius) * 0.01 * elapsed;

                    const itemX = dx/2;
                    const itemY = dy/2;

                    _.transformedX += (itemX - _.transformedX) * 0.01 * elapsed;
                    _.transformedY += (itemY - _.transformedY) * 0.01 * elapsed;
                    if (_.transformedX < 1 && _.transformedX > -1) {
                        _.transformedX = 0;
                    }
                    if (_.transformedY < 1 && _.transformedY > -1) {
                        _.transformedY = 0;
                    }

                    _.element.style.transform = `translate3d(${_.transformedX}px, ${_.transformedY}px, 0)`;
                    _.element.style.color = 'inherit';
                }
                else {
                    _.transformedX += (0 - _.transformedX) * 0.01 * elapsed;
                    _.transformedY += (0 - _.transformedY) * 0.01 * elapsed;
                    if (_.transformedX < 1 && _.transformedX > -1) {
                        _.transformedX = 0;
                    }
                    if (_.transformedY < 1 && _.transformedY > -1) {
                        _.transformedY = 0;
                    }

                    _.element.style.transform = `translate3d(${_.transformedX}px, ${_.transformedY}px, 0)`;
                    
                    if (!_.enabled) {
                        _.element.style.color = 'inherit';
                    }
                    else {
                        _.element.style.color = '#aaa';
                    }
                }
            })
        }
    }

    draw(elapsed) {
        this.progress += elapsed / 1000;

        this.updateClickable(elapsed);

        console.log(this.state);
        if (this.state === 'init') {
            this.updateInit(elapsed);
        }
        else if (this.state === 'revert') {
            this.updateRevert(elapsed);
        }

        this.updateOpacity(elapsed);
        
        this.ctx.clearRect(0, 0, this.sw, this.sh);
        this.ctx.beginPath();
        this.ctx.moveTo(this.mouse.x, this.mouse.y - this.mouse.radius)
        this.ctx.arc(this.mouse.x, this.mouse.y, this.mouse.radius, - Math.PI / 2, 2 * Math.PI * this.mouse.angle - 0.5 * Math.PI);
        this.ctx.strokeStyle = `rgba(${this.mouse.r}, ${this.mouse.g}, ${this.mouse.b}, ${this.mouse.opacity})`;
        this.ctx.stroke();
   
        if (this.arrow.up) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.mouse.x, this.mouse.y - this.arrow.distance);
            this.ctx.lineTo(this.mouse.x + 2, this.mouse.y - (this.arrow.distance - 3));
            this.ctx.lineTo(this.mouse.x - 2, this.mouse.y - (this.arrow.distance - 3));
            this.ctx.lineTo(this.mouse.x, this.mouse.y - this.arrow.distance);
            this.ctx.fillStyle = `rgba(${this.arrow.r}, ${this.arrow.g}, ${this.arrow.b}, ${this.arrow.opacity})`;
            this.ctx.fill();
        }
        if (this.arrow.down) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.mouse.x, this.mouse.y + this.arrow.distance);
            this.ctx.lineTo(this.mouse.x - 2, this.mouse.y + (this.arrow.distance - 3));
            this.ctx.lineTo(this.mouse.x + 2, this.mouse.y + (this.arrow.distance - 3));
            this.ctx.lineTo(this.mouse.x, this.mouse.y + this.arrow.distance);
            this.ctx.fillStyle = `rgba(${this.arrow.r}, ${this.arrow.g}, ${this.arrow.b}, ${this.arrow.opacity})`;
            this.ctx.fill();
        }
        if (this.arrow.left) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.mouse.x - this.arrow.distance, this.mouse.y);
            this.ctx.lineTo(this.mouse.x - (this.arrow.distance - 3), this.mouse.y + 2);
            this.ctx.lineTo(this.mouse.x - (this.arrow.distance - 3), this.mouse.y - 2);
            this.ctx.lineTo(this.mouse.x - this.arrow.distance, this.mouse.y);
            this.ctx.fillStyle = `rgba(${this.arrow.r}, ${this.arrow.g}, ${this.arrow.b}, ${this.arrow.opacity})`;
            this.ctx.fill();
        }
        if (this.arrow.right) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.mouse.x + this.arrow.distance, this.mouse.y);
            this.ctx.lineTo(this.mouse.x + (this.arrow.distance - 3), this.mouse.y + 2);
            this.ctx.lineTo(this.mouse.x + (this.arrow.distance - 3), this.mouse.y - 2);
            this.ctx.lineTo(this.mouse.x + this.arrow.distance, this.mouse.y);
            this.ctx.fillStyle = `rgba(${this.arrow.r}, ${this.arrow.g}, ${this.arrow.b}, ${this.arrow.opacity})`;
            this.ctx.fill();
        }
    }
}
