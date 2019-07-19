const TerminalGameBoy = require('./src/TerminalGameBoy');

if (require.main === module) {
    new TerminalGameBoy(require('./config'), {
        onShutdown: () => process.exit(),
        onLoadError: e => {
            console.err(e);
            process.exit(1);
        }
    }).startGame(process.argv[2]);
} else {
    module.exports = TerminalGameBoy;
}
