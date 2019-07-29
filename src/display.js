const FourColorsASCIICanvas = require('four-color-ascii-canvas');

const WIDTH = 160;
const HEIGHT = 144;

const palette = process.argv[2];
const canvas = new FourColorsASCIICanvas(WIDTH, HEIGHT, palette && { palette });

process.on('message', m => {
    canvas.paint(m.value.data);
});
