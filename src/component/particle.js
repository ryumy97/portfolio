const FRICTION = 0.88;
const COLOR_SPEED = 0.12;
const MOVE_SPEED = 0.13;

export class Particle {
    constructor(pos, texture, startPos) {
        this.sprite = new PIXI.Sprite(texture);
        this.sprite.scale.set(0.05);

        this.savedX = pos.x;
        this.savedY = pos.y;
        this.x = startPos.x;
        this.y = startPos.y;
        
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 10;

        this.savedRgb = 0x000000;
        this.rgb = 0x0074F6;
    }

    collide() {
        this.rgb = 0x0074F6;
    }

    draw(ratio) {
        this.r = (- getR(this.rgb)) * COLOR_SPEED * ratio;
        this.g = (- getG(this.rgb)) * COLOR_SPEED * ratio;
        this.b = (- getB(this.rgb)) * COLOR_SPEED * ratio;

        this.rgb += getRGBFromHex(this.r,this.g,this.b);

        this.x += (this.savedX - this.x) * MOVE_SPEED * ratio;
        this.y += (this.savedY - this.y) * MOVE_SPEED * ratio;

        this.vx *= FRICTION;
        this.vy *= FRICTION;

        this.x += this.vx;
        this.y += this.vy;

        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.tint = this.rgb;
    }
}

function getR(hex) {
    return hex >> 16 & 0xff
}

function getG(hex) {
    return hex >> 8 & 0xff
}

function getB(hex) {
    return hex & 0xff
}

function getRGBFromHex(r, g, b) {
    const tempR = -r & 0xff
    const tempG = -g & 0xff
    const tempB = -b & 0xff

    return -(tempR << 16 | tempG << 8 | tempB)
}