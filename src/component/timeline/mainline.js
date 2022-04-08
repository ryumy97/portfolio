import { colors } from '../../helper/colors.js';

export class Mainline {
    constructor(monthSize, startDate, endDate) {
        this.monthSize = monthSize;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    updateSelected(xPrepend, scrolledAmount, middle, progress) {
        this.progress = 2 - progress;
    }

    update(xPrepend, scrolledAmount, middle, progress) {
        this.progress = progress - 1;
        this.middle = middle;
        this.scrolledAmount = scrolledAmount;
        this.xPrepend = xPrepend;

        this.viewX = this.xPrepend - this.scrolledAmount;
        this.xStart = 0;
        this.xEnd = this.monthSize * ((this.endDate.year - this.startDate.year) * 12 + this.endDate.month - this.startDate.month);
    }

    draw(ctx) {
        let index = 0;
        for(let i = this.viewX; i <= this.xEnd - this.xStart + this.viewX; i += this.monthSize) {
            const isYear = index % 12 === 0;

            let currently = this.progress * 60 - index - 60;
            if (currently < 0) {
                break;
            }
            else if (isYear ? currently > 12 : currently > 8) {
                isYear ? currently = 12 : currently = 8;
            }

            ctx.beginPath();
            ctx.strokeStyle = colors.blue;
            if (isYear) {
                ctx.moveTo(i, this.middle - 6);
                ctx.lineTo(i, this.middle + currently - 6);
            }
            else {
                ctx.moveTo(i, this.middle - 4);
                ctx.lineTo(i, this.middle + currently - 4);
            }
            ctx.stroke();

            index++
        }

        const fontWidth = 100;
        const fontSize = 12;
        const fontName = 'serif';

        ctx.font = `${fontWidth} ${fontSize}px ${fontName}`;
        ctx.textBaseline = 'top';

        index = 0;
        for (let i = this.startDate.year; i <= this.endDate.year; i++) {

            let currently = (this.progress * 60 - index * 12) / 35;
            ctx.fillStyle = `rgba(17, 51, 92, ${currently})`;

            ctx.fillText(
                i,
                this.viewX - 2 + this.monthSize * (i - this.startDate.year) * 12,
                this.middle + 10
            );

            index++;
        }
    }
}