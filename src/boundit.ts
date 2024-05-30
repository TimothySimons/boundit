// TODO: allow multiple rectangles
// TODO: of different colours // config may not make sense in this case // actually wait - they can change the defaultConfig as it is exported
// TODO: have the ability to select rectangles to delete them.
// TODO: have backspace delete the most recent triangle (if mouse is in the canvas).

export interface Box {
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
}


export interface BoxStyle {
    fillStyle: string;
    strokeStyle: string;
    lineWidth: number;
    lineDash: number[];
}


export interface Config {
    currentLabel: string;
    draggingStyle: BoxStyle;
    defaultStyle: BoxStyle;
}


export interface Api {
    getConfig: () => Config;
    setConfig: (newConfig: Config) => void;
    // TODO: implement the above
    // TODO: get image rectangle coordinates
}


// TODO: how do we expose config to the user? through a context object perhaps?
// TODO: maybe move config into BOundItCanvas and remove from the parameter list.
export const defaultConfig = {
    currentLabel: '',
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
    const img = new Image();
    img.src = imgURL;

    let box: Box = {
        label: '',
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

        redraw(canvas, img)

        let mouseStartPos = {x: 0, y: 0}
        let offset = { x: 0, y: 0 };
        let isDragging = false;
        let isDrawing = false;

        canvas.addEventListener('mousedown', (e) => {
            mouseStartPos = getMouseTipPosition(e);
            if (isOverRectangle(mouseStartPos.x, mouseStartPos.y, box)) {
                isDragging = true;
                offset.x = mouseStartPos.x - box.x;
                offset.y = mouseStartPos.y - box.y;
            } else {
                isDrawing = true;
                box.x = mouseStartPos.x;
                box.y = mouseStartPos.y;
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const mousePos = getMouseTipPosition(e);
            if (isDragging) {
                box.x = mousePos.x - offset.x
                box.y = mousePos.y - offset.y
                redraw(canvas, img, box, config.draggingStyle)
            } else if (isDrawing) {
                box.width = getMouseTipPosition(e).x - box.x;
                box.height = getMouseTipPosition(e).y - box.y;
                redraw(canvas, img, box, config.draggingStyle)
        }});

        canvas.addEventListener('mouseup', (e) => {
            const mousePos = getMouseTipPosition(e);
            if (isDragging || isDrawing) {
                if (!(mousePos.x === mouseStartPos.x && mousePos.y === mouseStartPos.y)) {
                    redraw(canvas, img, box, config.defaultStyle)
                }
                isDragging = false;
                isDrawing = false;
            }
        });
    }

    return {
        getContext: () => ctx,
    };
}


function getMouseTipPosition(e: MouseEvent): { x: number, y: number } {
    const offset = -10
    return {
        x: e.clientX + offset,
        y: e.clientY + offset,
    }
}


function redraw(canvas: HTMLCanvasElement, img: HTMLImageElement, rectangle?: Box, style:BoxStyle = defaultConfig.defaultStyle) {
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
        throw new Error('Canvas 2d context is null.');
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    if (rectangle) {
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
}


function isOverRectangle(x: number, y: number, rectangle: Box) {
    return (
      x >= rectangle.x &&
      x <= rectangle.x + rectangle.width &&
      y >= rectangle.y &&
      y <= rectangle.y + rectangle.height
    );
  }