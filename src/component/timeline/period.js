import { drawHorizontalLine, drawDescription, drawTitle } from '../../helper/canvas.js'

const pageWidth = 400;
const pageHeight = 350;

export class Period {
    constructor(canvas, data, monthSize, startDate, endDate) {
        this.canvas = canvas;

        this.data = data;
        this.monthSize = monthSize;
        this.startDate = startDate;
        this.endDate = endDate;
        this.scrolledAmount = 0;
        this.actualScrolling = 0;
        this.textOpacity = 0;

        this.isSelected = false;
        this.isInside = false;
        this.hasMoved = false;

        this.progress = 0;

        canvas.addEventListener('pointerdown', this.onClick.bind(this), false);
        canvas.addEventListener('pointermove', this.onMove.bind(this), false);
        canvas.addEventListener('pointerup', this.onUp.bind(this), false);
    }

    onClick(e) {
        this.savedMouseX = e.clientX;
        this.savedMouseY = e.clientY;

        if (this.progress < 0.5) {
            this.isInside = false;
            return;
        }

        const x1 = this.view + this.xStart;
        const x2 = this.view + this.xEnd;

        const y1 = this.yBase + 6;
        const y2 = this.yBase - 6;

        const mouseX = e.clientX;
        const mouseY = e.clientY - this.canvas.offsetTop;

        if (mouseX >= x1 && mouseX <= x2 && mouseY <= y1 && mouseY >= y2) {
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

        if (this.progress < 0.5) {
            this.isInside = false;
            return;
        }

        const x1 = this.view + this.xStart;
        const x2 = this.view + this.xEnd;

        const y1 = this.yBase + 6;
        const y2 = this.yBase - 6;

        const mouseX = e.clientX;
        const mouseY = e.clientY - this.canvas.offsetTop;

        if (mouseX >= x1 && mouseX <= x2 && mouseY <= y1 && mouseY >= y2) {
            this.isInside = true;
        }
        else {
            this.isInside = false;
        }
    }

    onUp(e) {
        this.savedMouseX = null;
        this.savedMouseY = null;

        if (this.progress < 0.5) {
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
        
        const length = 8;

        this.view += (0 - this.view) * 0.05;
        this.xEnd += (-10 - this.xEnd) * 0.05;
        this.xStart = this.xEnd - length;

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
                return;
            }
            this.view += (0 - this.view) * 0.05;
            this.xStart += (dotX - this.xStart) * 0.05;
            this.xEnd += (dotX + 8 - this.xEnd) * 0.05;
            this.yBase += (dotY - this.yBase) * 0.05;

            this.textOpacity += (0 - this.textOpacity) * 0.05;
        }
        else {
            const start = this.monthSize * ((this.data.timeStart.year - this.startDate.year) * 12 + this.data.timeStart.month - this.startDate.month);

            const end = this.data.timeFinish
                ? this.monthSize * ((this.data.timeFinish.year - this.startDate.year) * 12 + this.data.timeFinish.month - this.startDate.month)
                : this.monthSize * ((this.endDate.year - this.startDate.year) * 12 + this.endDate.month - this.startDate.month);
            
            const length = end - start;

            this.view += (0 - this.view) * 0.05;
            this.xEnd += (-10 - this.xEnd) * 0.05;
            this.xStart = this.xEnd - length;

            this.textOpacity += (0 - this.textOpacity) * 0.05;
        }
    }

    drawDescription(ctx, stageWidth, stageHeight, progress) {
        if (this.isSelected) {
            if (progress < 2.1) {
                return;
            }
            this.descriptionTop = this.yBase - 4;
            this.descriptionLeft = this.xStart + 24;

            let currently = (progress - 2);
            currently < 0
                ? currently = 0
            : currently > 255
                ? currently = 255
                : currently;

            drawDescription(ctx, this.data, stageWidth, stageHeight, this.descriptionTop, this.descriptionLeft, currently, pageWidth);
        }
    }

    drawFadeoutDescription(ctx, stageWidth, stageHeight, progress) {
        if (this.isSelected) {

            let currently = (1 - progress * 1.1);
            currently < 0
                ? currently = 0
            : currently > 255
                ? currently = 255
                : currently;

            drawDescription(ctx, this.data, stageWidth, stageHeight, this.descriptionTop, this.descriptionLeft, currently, pageWidth);
        }
    }

    update(scrolledAmount, xPrepend, middle, progress) {
        this.isSelected = false;
        this.scrolledAmount = scrolledAmount;
        this.progress = progress - 1;

        if (this.progress < 2) {
            const xEnd = this.data.timeFinish
                ? this.monthSize * ((this.data.timeFinish.year - this.startDate.year) * 12 + this.data.timeFinish.month - this.startDate.month)
                : this.monthSize * ((this.endDate.year - this.startDate.year) * 12 + this.endDate.month - this.startDate.month)

            this.actualScrolling = xEnd * 1.1;
        }
        else {
            this.actualScrolling = (this.scrolledAmount - this.actualScrolling) * 0.02 / this.data.level + this.actualScrolling

            this.textOpacity += (0.3 - this.textOpacity) * 0.05;
        }

        this.view = xPrepend - this.actualScrolling;
        this.xStart = this.monthSize * ((this.data.timeStart.year - this.startDate.year) * 12 + this.data.timeStart.month - this.startDate.month);
        this.xEnd = this.data.timeFinish
            ? this.monthSize * ((this.data.timeFinish.year - this.startDate.year) * 12 + this.data.timeFinish.month - this.startDate.month)
            : this.monthSize * ((this.endDate.year - this.startDate.year) * 12 + this.endDate.month - this.startDate.month)

        this.yBase = middle - this.data.level * 12;
    }

    drawShadow(ctx) {
        const color = this.isInside && (!this.clicking || (this.clicking && !this.hasMoved))
            ? this.data.lightColor
            : this.data.color

        drawHorizontalLine(ctx, this.view, this.xStart, this.xEnd, this.yBase, color, true);
        drawTitle(ctx, this.data.title, this.view, this.xStart, this.yBase - 4, this.textOpacity);
    }

    draw(ctx) {
        const color = this.isInside && (!this.clicking || (this.clicking && !this.hasMoved))
            ? this.data.lightColor
            : this.data.color

        drawHorizontalLine(ctx, this.view, this.xStart, this.xEnd, this.yBase, color, false);
        drawTitle(ctx, this.data.title, this.view, this.xStart, this.yBase - 4, this.textOpacity);
    }
}
