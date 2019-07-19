const { GameBoy, LocalStorage } = require('jsGBC/dist/jsgbc-core');
const Canvas = require('canvas');
const fs = require('fs');
const cp = require('child_process');
const { AudioContext } = require('web-audio-api');
const Speaker = require('speaker');
const InputEmitter = require('./InputEmitter');

// NOTE: state load/save only works in a browser context, which we emulate here
global.window = global;
window.localStorage = new (require('node-localstorage').LocalStorage)('.');
window.btoa = require('btoa');
window.atob = require('atob');

module.exports = class TerminalGameBoy extends GameBoy {

    /**
     * Creates a gameboy emulator in the terminal.
     * @param {object} config - See config.json
     * @param {object} options
     * @param {function} options.onShutdown
     * @param {function} options.onLoadError
     */
    constructor (config, options) {
        const canvas = new Canvas();
        const audioContext = new AudioContext();

        audioContext.outStream = new Speaker({
            channels: audioContext.format.numberOfChannels,
            bitDepth: audioContext.format.bitDepth,
            sampleRate: audioContext.sampleRate
        });

        super({
            audio: { context: audioContext },
            lcd: {
                canvas,
                offscreenCanvas: new Canvas()
            },
            isSoundEnabled: config.soundEnabled
        });

        this._config = config;
        this._options = options;
        this._canvas = canvas;

        // Storage not set by jsGBC unless window.document exists
        this.setStorage(new LocalStorage());
    }

    /**
     * Starts a game.
     * @param {string} filename - Path to the .gbc file to open
     */
    startGame (filename) {
        const buffer = fs.readFileSync(filename);
        this.replaceCartridge(buffer);

        try {
            const battery = fs.readFileSync(this.core.cartridge.name.replace(/\0/g, '') + '.sav').buffer;

            this.loadBatteryFileArrayBuffer(battery)
                .then(() => this.loadState)
                .catch(this._options.onLoadError);
        } catch (e) { /* save file does not exit */ }

        this._initRenderer();
        this._initInputHandler();
    }

    _initRenderer () {
        const renderingProcess = cp.fork(`${__dirname}/display.js`, { stdio: 'inherit' });
        const canvasContext = this._canvas.getContext('2d');

        const sendImageData = () => {
            try {
                renderingProcess.send({ value: new Buffer(canvasContext.getImageData(0, 0, 160, 144).data) });
            } catch (e) { /* channel closed */ }
        };

        const putImageData = canvasContext.putImageData;
        let t0 = process.hrtime();
        let cancelTimeout;
        canvasContext.putImageData = function () {
            putImageData.apply(this, arguments);
            cancelTimeout = false;
            // cap at 30 FPS to reduce IO pressure
            const hrtime = process.hrtime(t0);
            if (hrtime[0] === 0 && hrtime[1] < 33333333) {
                // putImageData is not called if the frame does not change,
                // but we still need to draw the latest version if we decide to discard the current call.
                setTimeout(function () {
                    !cancelTimeout && sendImageData();
                }, 33 - (hrtime[1] / 1000000) | 0);
            } else {
                t0 = process.hrtime();
                cancelTimeout = true;
                sendImageData();
            }
        };
    }

    _initInputHandler () {
        const inputEmitter = new InputEmitter(this._config.controls);
        inputEmitter.on('shutdown', () => {
            fs.writeFileSync(
                this.core.cartridge.name.replace(/\0/g, '') + '.sav',
                Buffer.from(this.getBatteryFileArrayBuffer())
            );
            console.log('Save file written');
            this._options.onShutdown();
        });
        inputEmitter.on('keydown', action => this.actionDown(action));
        inputEmitter.on('keyup', action => this.actionUp(action));
    }
}
