export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}


export interface RectangleStyle {
    fillStyle: string;
    strokeStyle: string;
    lineWidth: number;
    lineDash: number[];
}


export interface Config {
    draggingStyle: RectangleStyle;
    defaultStyle: RectangleStyle;
}


export interface Api {
    getContext: () => CanvasRenderingContext2D;
    // TODO: get image rectangle coordinates
}


export const defaultConfig = {
    draggingStyle: {
        fillStyle: 'rgba(255, 255, 255, 0)',
        strokeStyle: 'white',
        lineWidth: 2,
        lineDash: [],
    },
    defaultStyle: {
        fillStyle: 'rgba(255, 0, 0, 0.05)',
        strokeStyle: 'red',
        lineWidth: 3,
        lineDash: [],
    },
};


export function BoundItCanvas(canvas: HTMLCanvasElement, imgURL: string, config: Config = defaultConfig): Api {
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
        throw new Error('Canvas 2d context is null.');
    }

    const img = new Image();
    img.src = imgURL;

    let rectangle: Rectangle = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };


    img.onload = function() {
        const imgAspectRatio = img.naturalWidth / img.naturalHeight;
        const canvasAspectRatio = canvas.width / canvas.height;
        if (Math.abs(imgAspectRatio - canvasAspectRatio) > 0.01) {
            throw new Error(`Canvas size is not proportional to the image size:
            (${canvas.width}, ${canvas.height}) (${img.naturalWidth}, ${img.naturalHeight})`);
        }

        const scaleWidth = canvas.width / img.naturalWidth;
        const scaleHeight = canvas.height / img.naturalHeight;
        ctx.drawImage(img, 0, 0, img.naturalWidth * scaleWidth, img.naturalHeight * scaleHeight);

        let isDrawing = false;
        let offset = -10

        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            rectangle.x = e.clientX + offset;
            rectangle.y = e.clientY + offset;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDrawing) {
                rectangle.width = e.clientX + offset - rectangle.x;
                rectangle.height = e.clientY + offset - rectangle.y;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                drawRectangle(ctx, rectangle, config.draggingStyle)
        }});

        canvas.addEventListener('mouseup', (e) => {
            isDrawing = false;
            if (!(e.clientX + offset === rectangle.x && e.clientY + offset === rectangle.y)) {
                drawRectangle(ctx, rectangle, config.defaultStyle);
            }
        });
    }

    return {
        getContext: () => ctx,
    };
}


function drawRectangle(ctx: CanvasRenderingContext2D, rectangle: Rectangle, style: RectangleStyle) {
    ctx.save();

    // style
    ctx.strokeStyle = style.strokeStyle;
    ctx.lineWidth = style.lineWidth;
    ctx.setLineDash(style.lineDash);
    ctx.fillStyle = style.fillStyle;

    // draw
    ctx.strokeRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    ctx.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);

    ctx.restore();
}