class App {
    constructor() {
        WebFont.load({
            google: {
              families: ['Hind:700']
            }
        });

        this.now = Date.now();
        this.then = Date.now();

        this.progress = 0;
        this.progressEnd = false;

        this.container = document.createElement('div');
        this.container.className = 'container';

        this.playground = new CanvasPlayGround(this.container);

        document.body.append(this.container);

        window.addEventListener('resize', this.resize.bind(this), false);
        this.resize();

        requestAnimationFrame(this.animate.bind(this));
    }

    resize() {
        this.playground.resize(this.container.clientWidth, this.container.clientHeight * 0.6);
    }

    animate(t) {
        this.now = Date.now();
        const elapsed = this.then ? this.now - this.then : 1000 / 60;
        const interval = 1000 / 60

        const ratio = elapsed / interval;

        requestAnimationFrame(this.animate.bind(this));

        this.progress += 0.01;

        this.playground && this.playground.draw && this.playground.draw(ratio, this.progress);

        this.then = Date.now();
    }
}

class CanvasPlayGround {
    constructor(container) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        container.append(this.canvas);
    }

    resize(stageWidth, stageHeight) {
        this.stageWidth = stageWidth;
        this.stageHeight = stageHeight;

        this.canvas.width = stageWidth * 2;
        this.canvas.height = stageHeight * 2;

        this.ctx.scale(2, 2);
    }

    draw(ratio, progress) {
        const x = this.stageWidth / 2;
        const y = this.stageHeight / 2;
        const width = this.stageWidth / 6;
        const height = this.stageWidth / 6;
        const cornerRadius = this.stageWidth / 6 / 6
        this.ctx.beginPath();
        this.ctx.moveTo(x - width / 2 + cornerRadius, y + height / 2);
        this.ctx.lineTo(x + width / 2 - cornerRadius, y + height / 2);

        this.ctx.quadraticCurveTo(
            x + width / 2, y + height / 2,
            x + width / 2, y + height / 2 - cornerRadius
            );

        this.ctx.lineTo(x + width / 2, y - height / 2 + cornerRadius);

        this.ctx.quadraticCurveTo(
            x + width / 2, y - height / 2,
            x + width / 2 - cornerRadius, y - height / 2
        );

        this.ctx.lineTo(x - width / 2 + cornerRadius, y - height / 2);

        this.ctx.quadraticCurveTo(
            x - width / 2, y - height / 2,
            x - width / 2, y - height / 2 + cornerRadius
            );

        this.ctx.lineTo(x - width / 2, y + height / 2 - cornerRadius);

        this.ctx.quadraticCurveTo(
            x - width / 2, y + height / 2,
            x - width / 2 + cornerRadius, y + height / 2
            );

        const gradientPoints = [{
                x: x - width * 0.4,
                y: y - height * 0.5,
                r: 0
            }
        ]

        // const gradient1 = this.ctx.createRadialGradient(
        //     gradientPoints[0].x, gradientPoints[0].y, gradientPoints[0].r,
        //     gradientPoints[1].x, gradientPoints[1].y, gradientPoints[1].r
        // );

        // gradient1.addColorStop(0, '#515BD4');
        // gradient1.addColorStop(1, '#B134AF00');

        // const gradient2 = this.ctx.createRadialGradient(
        //     gradientPoints[2].x, gradientPoints[2].y, gradientPoints[2].r,
        //     gradientPoints[3].x, gradientPoints[3].y, gradientPoints[3].r,
        // );

        // gradient2.addColorStop(0, '#FEDA77');
        // gradient2.addColorStop(1, '#F5852900');

        // const gradient3 = this.ctx.createRadialGradient(
        //     gradientPoints[4].x, gradientPoints[4].y, gradientPoints[4].r,
        //     gradientPoints[5].x, gradientPoints[5].y, gradientPoints[5].r,
        // )

        // gradient3.addColorStop(0, '#DD2A7B');
        // gradient3.addColorStop(1, '#8134AF00')

        // const gradient4 = this.ctx.createRadialGradient(
        //     gradientPoints[6].x, gradientPoints[6].y, gradientPoints[6].r,
        //     gradientPoints[7].x, gradientPoints[7].y, gradientPoints[7].r,
        // )

        // gradient4.addColorStop(0, '#F58529');
        // gradient4.addColorStop(0.5, '#DD2A7B70');
        // gradient4.addColorStop(1, '#DD2A7B00');

        // this.ctx.fillStyle = gradient1;
        // this.ctx.fill();

        // this.ctx.fillStyle = gradient3;
        // this.ctx.fill();

        // this.ctx.fillStyle = gradient4;
        // this.ctx.fill();

        // this.ctx.fillStyle = gradient2;
        // this.ctx.fill();


        this.ctx.stroke();

        gradientPoints.forEach((_) => {
            this.ctx.beginPath();
            this.ctx.arc(_.x, _.y, _.r ? _.r : 1, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'red';
            this.ctx.stroke();
        })
    }
}

window.onload = () => {
    new App();
}