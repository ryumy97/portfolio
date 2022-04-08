export class Text {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    setText(str, density, stageWidth, stageHeight) {
        this.canvas.width = stageWidth;
        this.canvas.height = stageHeight;

        const fontWidth = 100;
        const fontSize = 100;
        const fontName = 'Hind';

        this.ctx.clearRect(0, 0, stageWidth, stageHeight);
        this.ctx.font = `${fontWidth} ${fontSize}px ${fontName}`;
        this.ctx.fillStyle = `rgba(0, 0, 0, 0.3)`;
        this.ctx.textBaseline = 'alphabetic';

        const fontPos = this.ctx.measureText(str);
        this.ctx.fillText(
            str,
            (stageWidth - fontPos.width) / 2,
            fontPos.actualBoundingBoxAscent + fontPos.actualBoundingBoxDescent + ((stageHeight - fontSize) / 2),
            stageWidth
        );

        return this.dotPos(density, stageWidth, stageHeight);
    }

    dotPos(density, stageWidth, stageHeight) {
        const imageData = this.ctx.getImageData(0, 0, stageWidth, stageHeight + 1).data;

        const particles = [];
        let i = 0;
        let width = 0;
        let pixel;
        
        for (let height = 0; height < stageHeight; height += density) {
            ++i;
            const slide = (i % 2) == 0;
            width = 0;
            if (slide == 1) {
                width += 6;
            }

            for (width; width < stageWidth; width += density) {
                pixel = imageData[((width + (height * stageWidth)) * 4) - 1];
                if (pixel != 0 && width > 0 && width < stageWidth && height > 0 && height < stageHeight) {
                    particles.push({
                        x: width,
                        y: height
                    });
                }
            }
        }
        return particles;
    }
}