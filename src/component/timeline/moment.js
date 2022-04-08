import { drawVerticalLine, drawDescription, drawTitle } from '../../helper/canvas.js'

const pageWidth = 400;
const pageHeight = 350;

export class Moment {
    constructor(canvas, data, monthSize, startDate) {
        this.canvas = canvas;

        this.data = data;
        this.monthSize = monthSize;
        this.startDate = startDate;
        this.scrolledAmount = 0;
        this.actualScrolling = 0;
        this.textOpacity = 0;

        this.transition = 0.01 + Math.random() * 0.03;
        this.length = 20;

        this.isSelected = false;
        this.isInside = false;
        this.hasMoved = false;

        canvas.addEventListener('pointerdown', this.onClick.bind(this), false);
        canvas.addEventListener('pointermove', this.onMove.bind(this), false);
        canvas.addEventListener('pointerup', this.onUp.bind(this), false);
    }

    onClick(e) {
        this.savedMouseX = e.clientX;
        this.savedMouseY = e.clientY;

        if (this.progress < 1) {
            this.isInside = false;
            return;
        }

        const x1 = this.view + this.xBase - 4;
        const x2 = this.view + this.xBase + 4;

        const y1 = this.yBase;
        const y2 = this.yBase + 20;

        const mouseX = e.clientX;
        const mouseY = e.clientY - this.canvas.offsetTop;

        if (mouseX >= x1 && mouseX <= x2 && mouseY >= y1 && mouseY <= y2) {
            this.isInside = true;
            this.clicking = true;
            this.hasMoved = false;
        }
    }

    onMove(e) {
        if (
            this.savedMouseX === null &&
            this.savedMouseY === null
        ) {
            this.hasMoved = true;
        }
        else if (this.savedMouseX + 4 < e.clientX || this.savedMouseX - 4 > e.clientX
            || this.savedMouseY + 4 < e.clientY || this.savedMouseY - 4 > e.clientY) {
            this.hasMoved = true;
        }

        if (this.progress < 1) {
            this.isInside = false;
            return;
        }

        const x1 = this.view + this.xBase - 4;
        const x2 = this.view + this.xBase + 4;

        const y1 = this.yBase;
        const y2 = this.yBase + 20;

        const mouseX = e.clientX;
        const mouseY = e.clientY - this.canvas.offsetTop;

        if (mouseX >= x1 && mouseX <= x2 && mouseY >= y1 && mouseY <= y2) {
            this.isInside = true;
        }
        else {
            this.isInside = false;
        }
    }

    onUp(e) {
        this.savedMouseX = null;
        this.savedMouseY = null;

        if (this.progress < 1) {
            this.isInside = false;
            return;
        }

        if (!this.hasMoved && this.isInside) {
            if (!this.isSelected) {
                this.isSelected = true;
                console.log('selected')
                const event = new CustomEvent('_selectTime');
    
                this.canvas.dispatchEvent(event);
            }
            else {
                console.log('unselected')
                const event = new CustomEvent('_unselectTime');
    
                this.canvas.dispatchEvent(event);
            }
        }

        this.clicking = false;
    }

    updateUnselect(stageWidth, stageHeight, progress) {
        this.progress = progress;

        this.view += (0 - this.view) * 0.05;
        this.xBase += (-10 - this.xBase) * 0.05;

        this.textOpacity += (0 - this.textOpacity) * 0.05;
    }

    updateSelected(stageWidth, stageHeight, progress) {
        this.progress = progress;
        
        const dotX = (stageWidth / 2 - pageWidth / 2)
        const dotY = (stageHeight / 2 - pageHeight / 2) < 0
            ? 10
            : (stageHeight / 2 - pageHeight / 2);

        if (this.isSelected) {
            if (progress < 0.5) {
                return
            }

            this.view += (0 - this.view) * 0.03;
            this.xBase += (dotX - this.xBase) * 0.03;
            this.yBase += (dotY - this.yBase) * 0.03;
            this.length += (8 - this.length) * 0.03;
            this.textOpacity += (0 - this.textOpacity) * 0.05;
            return;
        }
        else {
            this.view += (0 - this.view) * 0.05;
            this.xBase += (-10 - this.xBase) * 0.05;
            this.length += (8 - this.length) * 0.05;
            this.textOpacity += (0 - this.textOpacity) * 0.05;

            return;
        }
    }

    drawDescription(ctx, stageWidth, stageHeight, progress) {
        if (this.isSelected) {
            if (progress < 2.1) {
                return;
            }
            this.descriptionTop = this.yBase - 4;
            this.descriptionLeft = this.xBase + 24;

            let currently = (progress - 2);
            currently < 0
                ? currently = 0
            : currently > 1
                ? currently = 1
                : currently;

            drawDescription(ctx, this.data, stageWidth, stageHeight, this.descriptionTop, this.descriptionLeft, currently, pageWidth);
        }
    }

    drawFadeoutDescription(ctx, stageWidth, stageHeight, progress) {
        if (this.isSelected) {

            let currently = (1 - progress * 1.1);
            currently < 0
                ? currently = 0
            : currently > 1
                ? currently = 1
                : currently;

            drawDescription(ctx, this.data, stageWidth, stageHeight, this.descriptionTop, this.descriptionLeft, currently, pageWidth);
        }
    }

    update(scrolledAmount, xPrepend, middle, progress) {
        this.isSelected = false;
        this.scrolledAmount = scrolledAmount;
        this.progress = progress - 1;

        if (this.progress < 2) {
            this.actualScrolling = (this.monthSize * ((this.data.time.year - this.startDate.year) * 12 + this.data.time.month - this.startDate.month) * 1.1);
        }
        else {
            this.actualScrolling = (this.scrolledAmount - this.actualScrolling) * this.transition + this.actualScrolling;

            this.textOpacity += (0.3 - this.textOpacity) * 0.05;
        }

        this.view = xPrepend - this.actualScrolling;
        this.xBase = this.monthSize * ((this.data.time.year - this.startDate.year) * 12 + this.data.time.month - this.startDate.month);

        this.yBase = middle + this.data.level * 36 - 10;

        this.length += (20 - this.length) * 0.05;
    }

    drawShadow(ctx) {
        const color = this.isInside && (!this.clicking || (this.clicking && !this.hasMoved))
            ? this.data.lightColor
            : this.data.color;

        drawTitle(ctx, this.data.title, this.view, this.xBase - 4, this.yBase + this.length + 14, this.textOpacity);
        drawVerticalLine(ctx, this.view, this.xBase, this.yBase, this.yBase + this.length, color, true);
    }

    draw(ctx) {
        const color = this.isInside && (!this.clicking || (this.clicking && !this.hasMoved))
            ? this.data.lightColor
            : this.data.color;

        drawTitle(ctx, this.data.title, this.view, this.xBase - 4, this.yBase + this.length + 14, this.textOpacity);
        drawVerticalLine(ctx, this.view, this.xBase, this.yBase, this.yBase + this.length, color, false);
    }
}
