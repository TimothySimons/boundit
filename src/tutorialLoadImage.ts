const url = 'assets/smoke.jpg'

// Image is a built-in JavaScript class.
const img = new Image();

// Sets the src property of the img object.
// Image loading begins when the src attribute of the Image object is set or changed.
img.src = url;

// img.onload is an event handler that is called when the image has finished loading.
img.onload = function() {
    const canvas = document.getElementById('glcanvas') as HTMLCanvasElement;
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Failed to get 2D context');
        return;
    }

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    console.log(imageData);
};

img.onerror = function() {
    console.error('Error loading image:', url);
};