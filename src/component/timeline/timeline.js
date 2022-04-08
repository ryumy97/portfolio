import { Mainline } from './mainline.js';
import { Period } from './period.js';
import { getOlderTime } from '../../helper/time.js';
import { colors } from '../../helper/colors.js';
import { Moment } from './moment.js';

const data = [
    {
        type: 'period',
        timeStart: {year: 2016, month: 1},
        timeFinish: {year: 2020, month: 1},
        title: 'University of Auckland',
        subtitle: 'Bachelor of Engineering',
        description: 'Specialisation in Computer Systems Engineering.'
    }, {
        type: 'period',
        timeStart: {year: 2018, month: 12},
        timeFinish: {year: 2019, month: 6},
        title: 'Perpetual Guardian',
        subtitle: 'Junior Analyst Programmer',
        description: `
            React.js C# .NET Framwork Selenium C#.
        `
    }, {
        type: 'period',
        timeStart: {year: 2021, month: 3},
        timeFinish: null,
        title: 'Infosys',
        subtitle: 'Associate',
        description: `
            Worked as a contractor in Spark NZ.
            Node.js - Backend For Frontend mobile.
        `
    }, {
        type: 'moment',
        time: {year: 2022, month: 1},
        title: 'Kiwi',
        subtitle: 'https://kiwi,ryumy.com/',
        description: `
            Mini project holding an 2D interactive experience of using an entity called kiwi. A simple interactive environment without any external dependencies of external libraries.
        `,
        url: 'https://kiwi,ryumy.com/'
    }, {
        type: 'moment',
        time: {year: 2021, month: 3},
        title: 'Aim High Charitable Trust',
        subtitle: 'https://www.aimhightrust.co.nz',
        description: `
            This website was build to provide a visually acceptable website that can be managed by non-developers.

            Wordpress CMS based website for a charitable trust.

            HTML, CSS + Bootstrap, Javascript and php.
        `,
        url: 'https://www.aimhightrust.co.nz'
    }
]

export class Timeline {
    constructor(container) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        container.append(this.canvas);
        this.canvas.style.cursor = 'default';

        {
            this.monthSize = 15;
            this.startDate = data.reduce(getOlderTime, {year: 9999, month: 99});
            this.endDate = {year: new Date().getFullYear(), month: new Date().getMonth() + 1};

            this.scrolledAmount = 0;
            this.scrollableSize = 0;

            this.progress = 0;
            this.state = 'init';
        }

        {
            this.clicked = false;
            this.peak = false;
            this.vx = 0;
        }

        {
            this.selected = false;
        }

        {
            this.mainline = new Mainline(this.monthSize, this.startDate, this.endDate);
            this.periods = data
                .filter(({type}) => type === 'period')
                .sort((a, b) => {
                    return a.timeStart.year * 100 + a.timeStart.month - b.timeStart.year * 100 + b.timeStart.month;
                })
                .reduce((acc, cur, index, array) => {
                    const colorNumber = index % 4;
                    let color = '';
                    let lightColor = '';
                    if (colorNumber === 0) {
                        color = colors.lightpink;
                        lightColor = colors.lighterPink;
                    }
                    else if (colorNumber === 1) {
                        color = colors.green;
                        lightColor = colors.lightGreen;
                    }
                    else if (colorNumber === 2) {
                        color = colors.red;
                        lightColor = colors.lightRed;
                    }
                    else if (colorNumber === 3) {
                        color = colors.blue;
                        lightColor = colors.lightBlue
                    }
                    
                    const level = acc.reduce((level, current) => {
                        const timeMin = current.timeStart.year * 100 + current.timeStart.month;
                        const timeMax = current.timeFinish
                            ? current.timeFinish.year * 100 + current.timeFinish.month
                            : this.endDate.year * 100 + this.endDate.month;

                        const currentTimeMin = cur.timeStart.year * 100 + cur.timeStart.month;
                        const currentTimeMax = cur.timeFinish
                            ? cur.timeFinish.year * 100 + cur.timeFinish.month
                            : this.endDate.year * 100 + this.endDate.month;

                        if (currentTimeMin <= timeMax && timeMin <= currentTimeMax) {
                            return level + 1;
                        }     

                        return level;
                    }, 1)

                    return [...acc, { ...cur, color, level, lightColor }];
                }, [])
                .map((d, i)=> {
                    return new Period(this.canvas, d, this.monthSize, this.startDate, this.endDate);
                })

            this.moments = data
                .filter(({type}) => type === 'moment')
                .sort((a, b) => {
                    return a.time.year * 100 + a.time.month - b.time.year * 100 + b.time.month;
                })
                .reduce((acc, cur, index, array) => {
                    const colorNumber = index % 4;
                    let color = '';
                    let lightColor = '';
                    if (colorNumber === 0) {
                        color = colors.red;
                        lightColor = colors.lightRed;
                    }
                    else if (colorNumber === 1) {
                        color = colors.blue;
                        lightColor = colors.lightBlue;
                    }
                    else if (colorNumber === 2) {
                        color = colors.lightpink;
                        lightColor = colors.lighterPink;
                    }
                    else if (colorNumber === 3) {
                        color = colors.green;
                        lightColor = colors.lightGreen;
                    }

                    const level = acc.reduce((level, current) => {
                        const timeMin = current.time.month === 1
                            ? (current.time.year - 1) * 100 + 12
                            : current.time.year * 100 + current.time.month - 1;
                        const timeMax = current.time.month === 12
                            ? (current.time.year + 1) * 100 + 1
                            : current.time.year * 100 + current.time.month + 1;
                            
                        const currentTimeMin = cur.time.month === 1
                            ? (cur.time.year - 1) * 100 + 12
                            : cur.time.year * 100 + cur.time.month - 1;
                        const currentTimeMax = cur.time.month === 12
                            ? (cur.time.year + 1) * 100 + 1
                            : cur.time.year * 100 + cur.time.month + 1;
                        
                            
                        if (currentTimeMin <= timeMax && timeMin <= currentTimeMax) {
                            return level + 1;
                        }

                        return level;
                    }, 1);

                    return [...acc, { ...cur, color, level, lightColor }];
                }, [])
                .map((d, i) => {
                    return new Moment(this.canvas, d, this.monthSize, this.startDate);
                })
        }

        this.scrollingEventListener = this.scrolling.bind(this);
        window.addEventListener('wheel', this.scrollingEventListener, false);
        this.canvas.addEventListener('pointerdown', this.onClick.bind(this), false);
        window.addEventListener('pointermove', this.onMove.bind(this), false);
        window.addEventListener('pointerup', this.onMouseUp.bind(this), false);
        
        window.addEventListener('pointermove', this.cursorEventListner.bind(this), false);

        this.canvas.addEventListener('_selectTime', this.onSelect.bind(this), false);
        this.canvas.addEventListener('_unselectTime', this.onUnselect.bind(this), false);
    }

    onSelect(e) {
        console.log('selectEventStart');
        this.state = 'selected';
        this.progress = 0;
    }

    onUnselect(e) {
        console.log('unselectEventStart');
        this.state = 'unselected';
        this.progress = 0;
    }

    cursorEventListner(e) {
        const periodHovering = this.periods.some((period) => {
            return period.isInside && !(period.clicking && period.hasMoved);
        })

        const momentHovering = this.moments.some((moment) => {
            return moment.isInside && !(moment.clicking && moment.hasMoved);
        })

        this.canvas.style.cursor = periodHovering || momentHovering
            ? 'pointer' 
            : this.state !== 'selected' && this.state !== 'init' && this.state !== 'unselected'
            ? this.clicked
                ? 'grabbing'
                : 'grab'
            : 'default'
            
    }

    scrolling(e) {
        if (this.state === 'init') {
            return;
        }
        
        const deltaY = e.deltaY < 0 ? -e.deltaY : e.deltaY;
        const deltaX = e.deltaX < 0 ? -e.deltaX : e.deltaX; 

        this.scrolledAmount += deltaY > deltaX ? e.deltaY : e.deltaX;
        this.isScrolling = true;

        if (this.wheelHandle) {
            clearTimeout(this.wheelHandle);
        }
        this.wheelHandle = setTimeout(() => {
            window.addEventListener('wheel', this.scrollingEventListener, false);
            this.isScrolling = false;
        }, 100)
    }

    onClick(e) {
        if (this.state === 'init') {
            return;
        }

        this.clicked = true;
        this.savedX = e.clientX;
        this.savedScroll = this.scrolledAmount;
        this.moveX = 0;
        this.mouseTimestamp = Date.now();
    }

    onMove(e) {
        if (this.clicked) {
            this.scrolledAmount = this.savedScroll + this.savedX - e.clientX;

            const now = Date.now();
            if (now - this.mouseTimestamp < 10) {
                return
            }
            const dt = now - this.mouseTimestamp;
            const dx = this.moveX - e.clientX;
            this.vx = dx/dt * 5;
            this.moveX = e.clientX;
            this.mouseTimestamp = Date.now();
        }
    }

    onMouseUp(e) {
        this.clicked = false;

    }

    resize(stageWidth, stageHeight) {
        this.stageWidth = stageWidth;
        this.stageHeight = stageHeight;

        this.canvas.width = stageWidth * 2;
        this.canvas.height = stageHeight * 2;

        this.ctx.scale(2, 2);

        {
            this.xPrepend = 40;

            this.middle = stageHeight / 2;
            this.scrollableSize =
                this.monthSize * ((this.endDate.year - this.startDate.year) * 12 + this.endDate.month - this.startDate.month)
                + this.xPrepend * 2
                - this.stageWidth;
        }
    }

    draw(ratio, progress) {
        if (progress >= 1) {
            this.now = new Date();
            const sec = this.then ? this.now - this.then : 0;
            this.progress += sec / 1000

            this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);
            this.updateScroll();
    
            if (this.state === 'selected') {
                this.mainline.updateSelected(this.xPrepend, this.scrolledAmount, this.middle, this.progress);
                this.periods.forEach(period => {
                    period.updateSelected(this.stageWidth, this.stageHeight, this.progress)
                    period.drawDescription(this.ctx, this.stageWidth, this.stageHeight, this.progress);
                });
                this.moments.forEach(moment => {
                    moment.updateSelected(this.stageWidth, this.stageHeight, this.progress);
                    moment.drawDescription(this.ctx, this.stageWidth, this.stageHeight, this.progress);
                });
            }
            else if (this.state === 'unselected') {
                this.periods
                    .filter(period => period.isSelected)
                    .forEach(period => {
                        period.updateUnselect(this.stageWidth, this.stageHeight, this.progress);
                        period.drawFadeoutDescription(this.ctx, this.stageWidth, this.stageHeight, this.progress);
                    });
                this.moments
                    .filter(moment => moment.isSelected)
                    .forEach(moment => {
                        moment.updateUnselect(this.stageWidth, this.stageHeight, this.progress);
                        moment.drawFadeoutDescription(this.ctx, this.stageWidth, this.stageHeight, this.progress);
                    });

                if (this.progress > 0.75) {
                    this.state = 'init';
                    this.progress = 0;
                }
            }
            else {
                this.mainline.update(this.xPrepend, this.scrolledAmount, this.middle, this.progress);
                this.periods.forEach(period => period.update(this.scrolledAmount, this.xPrepend, this.middle, this.progress));
                this.moments.forEach(moment => moment.update(this.scrolledAmount, this.xPrepend, this.middle, this.progress));
            }
                
            this.mainline.draw(this.ctx, this.xPrepend, this.scrolledAmount, this.middle);

            this.periods.forEach(period => period.drawShadow(this.ctx));
            this.periods.forEach(period => period.draw(this.ctx));

            this.moments.forEach(moment => moment.drawShadow(this.ctx));
            this.moments.forEach(moment => moment.draw(this.ctx));            

            this.then = this.now;
        }
    }

    updateScroll() {
        if (
            this.scrollableSize < 0
            && (this.state === 'init' || this.state === 'progressing')
        ) {
            this.scrolledAmount = this.scrollableSize / 2;
            this.state = 'progressing';
            return;
        }

        if (this.state === 'init') {
            this.scrolledAmount += (this.scrollableSize - this.scrolledAmount) * 0.04
            if (this.scrolledAmount + 1 >= this.scrollableSize) {
                this.state = 'progressing';
                this.canvas.style.cursor = 'grab'
            }
            return;
        }


        if (!this.clicked) {
            this.vx *= 1 - 0.05;
            this.scrolledAmount += this.vx
        }

        if (!this.clicked && !this.isScrolling) {
            if (this.scrolledAmount < 0) {
                this.scrolledAmount += this.scrolledAmount * -0.1 + 1;
                this.peak = true;
            }
            else if (this.scrolledAmount > this.scrollableSize) {
                this.scrolledAmount += (this.scrollableSize - this.scrolledAmount) * 0.1 - 1;
                this.peak = true;
            }
        }

        if (this.isScrolling) {
            if (this.scrolledAmount < 0) {
                this.scrolledAmount = 0
                this.peak = true;
            }
            else if (this.scrolledAmount > this.scrollableSize) {
                this.scrolledAmount = this.scrollableSize;
                this.peak = true;
            }
        }

        if (!this.isScrolling) {
            this.peak = false;
        }
    }

    drawGuide() {
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(this.xPrepend - this.scrolledAmount, this.middle);
        this.ctx.lineTo(this.monthSize * ((this.endDate.year - this.startDate.year) * 12 + this.endDate.month - this.startDate.month) + this.xPrepend - this.scrolledAmount, this.middle);
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.stroke();

        for (let i = 0; i < this.endDate.year - this.startDate.year + 1; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.monthSize * 12 + this.xPrepend - this.scrolledAmount, this.middle);
            this.ctx.lineTo(i * this.monthSize * 12 + this.xPrepend - this.scrolledAmount, this.middle - 5);
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.stroke();
        }

        for (let i = 0; i < (this.endDate.year - this.startDate.year) * 12 + this.endDate.month - this.startDate.month + 1; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.monthSize + this.xPrepend - this.scrolledAmount, this.middle);
            this.ctx.lineTo(i * this.monthSize + this.xPrepend - this.scrolledAmount, this.middle + 5);
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.stroke();
        }

        data.forEach((d, i) => {
            this.ctx.beginPath();

            if (d.type === 'period') {
                const xStart =
                    this.xPrepend
                    + this.monthSize * ((d.timeStart.year - this.startDate.year) * 12 + d.timeStart.month - this.startDate.month)
                    - this.scrolledAmount;
                const xEnd =
                    d.timeFinish
                        ? this.xPrepend
                            + this.monthSize * ((d.timeFinish.year - this.startDate.year) * 12 + d.timeFinish.month - this.startDate.month)
                            - this.scrolledAmount
                        : this.xPrepend
                            + this.monthSize * ((this.endDate.year - this.startDate.year) * 12 + this.endDate.month - this.startDate.month)
                            - this.scrolledAmount

                this.ctx.moveTo(xStart, this.middle - 6 * i - 10);
                this.ctx.lineTo(xEnd, this.middle - 6 * i - 10);
            }
            else {
                this.ctx.moveTo(this.xPrepend + this.monthSize * (d.time.year - this.startDate.year) * 12 - this.scrolledAmount, this.middle + 8 * i + 5);
                this.ctx.lineTo(this.xPrepend + this.monthSize * (d.time.year - this.startDate.year) * 12 - this.scrolledAmount, this.middle + 10 * i + 5);
            }

            this.ctx.strokeStyle = '#ff0000';
            this.ctx.stroke();
        })

        this.ctx.globalAlpha = 1;
    }

    
}
