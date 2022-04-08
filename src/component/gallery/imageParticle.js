export class ImageParticle {
    constructor(imageData, x, y, width, height, index, initX, initY) {
        this.imageData = imageData;
        this.targetX = x;
        this.targetY = y;
        this.width = width;
        this.height = height;
        this.delay = Math.random() * 0.8;
        this.index = index;
        console.log(this.delay)

        this.x = initX;
        this.y = initY;
    }

    moveLeft(stageHeight) {
        this.targetX = 0 - this.width * 2;
    }

    moveRight(stageWidth, stageHeight) {
        this.targetX = stageWidth + this.width;
    }

    update(progress) {
        if (progress > this.delay) {
            this.x += (this.targetX - this.x) * 0.05;
            this.y += (this.targetY - this.y) * 0.05;
        }
    }

    collide(mouse) {
        const dx = mouse.x - (this.x + this.width / 2);
        const dy = mouse.y - (this.y + this.height / 2);

        if (
            dy < this.height * 2
            && dy > this.height * -2
            && dx < this.width / 2
            && dx > this.width / 2 * -1
            ) {
            this.x -= dx * 0.02;
            this.y -= dy * 0.02;
        }
    }

    drawShadow(ctx) {
        ctx.beginPath()
        ctx.fillStyle = '#ffffffff';
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);

        ctx.shadowColor = 'rgba(0, 0, 0, .1)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 20;
        ctx.shadowOffsetY = 20;
        ctx.fill();
    }
        
    draw(ctx) {
        ctx.putImageData(this.imageData, this.x * 2, this.y * 2);
    }
}