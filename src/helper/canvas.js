import { months } from './time.js';

export function drawHorizontalLine(ctx, xView, xStart, xEnd, yBase, color, isShadow) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color
    ctx.beginPath();
    ctx.moveTo(xView + xStart, yBase);
    ctx.quadraticCurveTo(
        xView + xStart, yBase + 4,
        xView + xStart + 4, yBase + 4
    );


    ctx.lineTo(xView + xEnd - 4, yBase + 4);
    ctx.quadraticCurveTo(
        xView + xEnd, yBase + 4,
        xView + xEnd, yBase
    )
    
    ctx.quadraticCurveTo(
        xView + xEnd, yBase - 4,
        xView + xEnd - 4, yBase - 4
    )
    ctx.lineTo(xView + xStart + 4, yBase - 4);

    ctx.quadraticCurveTo(
        xView + xStart, yBase - 4,
        xView + xStart, yBase
    )
    

    if (isShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, .1)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 10;
    }
    else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 10;
    }

    ctx.fill();
    ctx.stroke();
}

export function drawVerticalLine(ctx, xView, xBase, yStart, yEnd, color, isShadow) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color
    ctx.beginPath();
    ctx.moveTo(xView + xBase, yStart);
    ctx.quadraticCurveTo(
        xView + xBase + 4, yStart,
        xView + xBase + 4, yStart + 4
    );


    ctx.lineTo(xView + xBase + 4, yEnd - 4);
    ctx.quadraticCurveTo(
        xView + xBase + 4, yEnd,
        xView + xBase, yEnd
    )
    
    ctx.quadraticCurveTo(
        xView + xBase - 4, yEnd,
        xView + xBase - 4, yEnd - 4
    )
    ctx.lineTo(xView + xBase - 4, yStart + 4);

    ctx.quadraticCurveTo(
        xView + xBase - 4, yStart,
        xView + xBase, yStart
    )
    

    if (isShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, .1)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 10;
    }
    else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 10;
    }

    ctx.fill();
    ctx.stroke();
}

export function drawDescription(ctx, data, stageWidth, stageHeight, top, left, progress, pageWidth) {
    let y = top;

    {
        ctx.font = '100 24px Hind';
        
        const headingX = left;
        const headingY = y;

        ctx.textBaseline = 'top';
        ctx.fillStyle = `rgba(0, 0, 0, ${progress})`;
        ctx.fillText(
            data.title, headingX, headingY
        );

        y += 24;
    }


    if (data.subtitle) {
        ctx.font = '100 12px serif';

        const subtitleTextX = left;
        const subtitleTextY = y;

        ctx.fillStyle = `rgba(30, 30, 30, ${progress})`;
        ctx.fillText(data.subtitle, subtitleTextX, subtitleTextY);

        y += 32;
    }

    {
        ctx.font = 'italic 100 12px serif';

        const timeText = data.type === 'period'
            ? `${
                months[data.timeStart.month - 1]
            } ${
                data.timeStart.year
            } - ${
                data.timeFinish
                    ? `${months[data.timeFinish.month - 1]} ${data.timeFinish.year}`
                    : 'Present'
                }`
            : `${months[data.time.month - 1]} ${data.time.year}`;

        const timeTextX = left;
        const timeTextY = y;

        ctx.fillStyle = `rgba(30, 30, 30, ${progress})`;
        ctx.fillText(timeText, timeTextX, timeTextY);

        y += 24;
    }

    {
        ctx.font = '100 14px serif';
        ctx.fillStyle = `rgba(30, 30, 30, ${progress})`;

        const sentences = data.description.split('\n')
        sentences.forEach((sentence) => {
            const descriptionX = left;
            const descriptionY = y;

            let words = sentence.trim().split(/\s+/g);
            let currentLine = 0;
            let i = 1;
    
            while(words.length > 0 && i <= words.length) {
                const str = words.slice(0, i).join(' ');
                const w = ctx.measureText(str).width;
    
                if (w > pageWidth) {
                    if (i == 1) {
                        i = 2;
                    }
                    ctx.fillText(words.slice(0, i - 1).join(' '), descriptionX, descriptionY + currentLine * 16);
                    currentLine++;
                    words = words.splice(i - 1);
                    i = 1;
                } else {
                    i++;
                }
            }
    
            if (i > 0) {
                ctx.fillText(words.join(' '), descriptionX, descriptionY + currentLine * 16);
            }
    
            y += currentLine * 16 + 16;
        })
    }
}

export function dropShadow(ctx, x, y, width, height) {   
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
        x, y - height,
        x + width / 2, y - height
    ) 
    ctx.quadraticCurveTo(
        x + width, y - height,
        x + width, y
    ) 
    ctx.quadraticCurveTo(
        x + width, y + height,
        x + width / 2, y + height
    ) 
    ctx.quadraticCurveTo(
        x, y + height,
        x, y
    )

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.filter = 'blur(10px)';

    ctx.fill();

    ctx.filter = 'none';
}

export function drawTitle(ctx, title, view, x, y, textOpacity) {
    ctx.font = '100 11px serif';

    ctx.textBaseline = 'bottom';
    ctx.fillStyle = `rgba(0, 0, 0, ${textOpacity})`;
    ctx.fillText(
        title, x + view, y
    );
}