const EventEmitter = require('events').EventEmitter;
const keycode = require('keycode');
const iohook = require('iohook');
const activeWin = require('active-win');

module.exports = class InputEmitter extends EventEmitter {

    constructor (controls) {
        super();

        this._keyMap = {};
        Object.keys(controls).forEach(button => {
            this._keyMap[controls[button]] = button;
        });

        const initialWin = activeWin.sync();

        const focusGuard = handler => {
            return function () {
                if (activeWin.sync().id !== initialWin.id) return;
                return handler.apply(this, arguments);
            };
        };

        const sendKeyEvent = focusGuard(event => {
            const key = keycode.names[event.rawcode];
            if (event.ctrlKey && key === 'c') {
                this.emit('shutdown');
            } else {
                this.emit(event.type, this._keyMap[key]);
            }
        });

        // Ctrl+C is already handled above, so we want to prevent SIGINT.
        process.on('SIGINT', () => {});

        iohook.on('keydown', sendKeyEvent);
        iohook.on('keyup', sendKeyEvent);

        iohook.start();
    }
}
