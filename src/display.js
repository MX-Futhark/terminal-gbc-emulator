const FourColorsASCIICanvas = require('four-color-ascii-canvas');

const WIDTH = 160;
const HEIGHT = 144;

const canvas = new FourColorsASCIICanvas(WIDTH, HEIGHT);

process.on('message', m => {
    canvas.paint(m.value.data);
});
