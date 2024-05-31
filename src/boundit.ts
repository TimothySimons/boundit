interface Box {
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
}


interface CanvasBox extends Box {
    state: BoxState;
}


enum BoxState {
    Idle,
    Creating,
    Moving,
}


interface Style {
    fillStyle: string;
    strokeStyle: string;
    lineWidth: number;
    lineDash: number[];
}


export interface Api {
    getLabel: () => string;
    setLabel: (label: string) => void;
    getStyle: (state: BoxState) => Style;
    setStyle: (state: BoxState, style: Style) => void;
    getBoxes: () => Box[]
}


export function BoundItCanvas(canvas: HTMLCanvasElement, imgURL: string): Api {
    const boxStyles: Record<BoxState, Style> = {
        [BoxState.Idle]: {
            fillStyle: 'rgba(255, 0, 0, 0.05)',
            strokeStyle: 'red',
            lineWidth: 3,
            lineDash: [],
        },
        [BoxState.Creating]: {
            fillStyle: 'rgba(255, 255, 255, 0)',
            strokeStyle: 'white',
            lineWidth: 2,
            lineDash: [10, 5],
        },
        [BoxState.Moving]: {
            fillStyle: 'rgba(255, 255, 255, 0)',
            strokeStyle: 'white',
            lineWidth: 2,
            lineDash: [],
        },
      };

    let currentLabel: string = '';
    let selectedBox: CanvasBox | null = null;
    let boxes: CanvasBox[] = [];

    const img = new Image();
    img.src = imgURL;
    img.onload = function() {

        const imgAspectRatio = img.naturalWidth / img.naturalHeight;
        const canvasAspectRatio = canvas.width / canvas.height;
        if (Math.abs(imgAspectRatio - canvasAspectRatio) > 0.01) {
            throw new Error(`Canvas size is not proportional to the image size: (${canvas.width}, ${canvas.height}) (${img.naturalWidth}, ${img.naturalHeight})`);
        }

        const ctx = canvas.getContext('2d');
        if (ctx === null) {
            throw new Error('Canvas 2d context is null.');
        }

        ctx.drawImage(img, 0, 0);

        let mouseStartPos = {x: 0, y: 0}
        let offset = {x: 0, y: 0}

        canvas.addEventListener('mousedown', (e) => {
            mouseStartPos = getMousePos(e);
            selectedBox = getBoxAtPos(mouseStartPos.x, mouseStartPos.y, boxes);
            if (selectedBox === null) {
                selectedBox = {
                    label: currentLabel,
                    x: mouseStartPos.x,
                    y: mouseStartPos.y,
                    width: 0,
                    height: 0,
                    state: BoxState.Creating
                }
            } else {
                offset.x = mouseStartPos.x - selectedBox.x;
                offset.y = mouseStartPos.y - selectedBox.y;
                selectedBox.state = BoxState.Moving
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const mousePos = getMousePos(e);
            if (selectedBox === null) {
                return;
            } else if (selectedBox.state === BoxState.Creating) {
                selectedBox.width = mousePos.x - selectedBox.x;
                selectedBox.height = mousePos.y - selectedBox.y;
                redraw(ctx, img, [selectedBox, ...boxes], boxStyles)
            } else if (selectedBox.state === BoxState.Moving) {
                console.log(mousePos.x, mousePos.y)
                selectedBox.x = mousePos.x - offset.x
                selectedBox.y = mousePos.y - offset.y
                redraw(ctx, img, boxes, boxStyles)
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            const mouseEndPos = getMousePos(e);
            if (selectedBox === null) {
                return;
            } else if (mouseEndPos.x === mouseStartPos.x && mouseEndPos.y === mouseStartPos.y) {
                selectedBox.state = BoxState.Idle
                return;
            } else if (selectedBox.state === BoxState.Creating) {
                selectedBox.state = BoxState.Idle
                normalize(selectedBox)
                boxes.push(selectedBox)
                redraw(ctx, img, boxes, boxStyles)
            } else if (selectedBox.state === BoxState.Moving) {
                selectedBox.state = BoxState.Idle
                redraw(ctx, img, boxes, boxStyles)
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
              boxes.pop();
              redraw(ctx, img, boxes, boxStyles)
            }
        });
    }

    return {
        getLabel() { return currentLabel; },
        setLabel(label: string) { currentLabel = label; },
        getStyle(state: BoxState) { return boxStyles[state]; },
        setStyle(state: BoxState, style: Style) { boxStyles[state] = style; },
        getBoxes() { return boxes.map((box) => canvasBoxToImageBox(box, img, canvas)); }
    }
}


function getMousePos(e: MouseEvent): { x: number, y: number } {
    const offset = -10
    return {
        x: e.clientX + offset,
        y: e.clientY + offset,
    }
}


function getBoxAtPos(x: number, y: number, boxes: CanvasBox[]): CanvasBox | null {
    for (let i = boxes.length - 1; i >= 0; i--) {
      const box = boxes[i];
      if (
        x >= box.x &&
        x <= box.x + box.width &&
        y >= box.y &&
        y <= box.y + box.height
      ) {
        return box;
      }
    }
    return null;
  }


function redraw(ctx: CanvasRenderingContext2D, img: HTMLImageElement, boxes: CanvasBox[], boxStyles: Record<BoxState, Style>) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0);
    for (const box of boxes) {
        const style = boxStyles[box.state]
        // save
        ctx.save();
        // style
        ctx.strokeStyle = style.strokeStyle;
        ctx.lineWidth = style.lineWidth;
        ctx.setLineDash(style.lineDash);
        ctx.fillStyle = style.fillStyle;
        // draw
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        ctx.fillRect(box.x, box.y, box.width, box.height);
        // restore
        ctx.restore();
    }
}


function normalize(box: CanvasBox): void {
    const newWidth = Math.abs(box.width);
    const newHeight = Math.abs(box.height);
    box.x = box.width < 0 ? box.x + box.width : box.x;
    box.y = box.height < 0 ? box.y + box.height : box.y;
    box.width = newWidth;
    box.height = newHeight;
}


function canvasBoxToImageBox(box: CanvasBox, img: HTMLImageElement, canvas: HTMLCanvasElement): Box {
  const scaleFactorX = img.naturalWidth / canvas.width;
  const scaleFactorY = img.naturalHeight / canvas.height;
  return {
    label: box.label,
    x: box.x * scaleFactorX,
    y: box.y * scaleFactorY,
    width: box.width * scaleFactorX,
    height: box.height * scaleFactorY,
  };
}
