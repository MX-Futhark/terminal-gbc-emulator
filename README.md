# terminal-gbc-emulator

Runs GBC games right within your ANSI-compliant terminal, with an ASCII display supporting a whopping four colors.

Powered by the awesome [jsGBC project](https://ardean.github.io/jsGBC/).

## Usage

Install and setup [node-gyp](https://github.com/nodejs/node-gyp). Clone or download this repository, then run:

```
npm install
node index.js <path-to-.gbc-file>
```

Edit `config.json` to change key mappings.

Press Ctrl+C to stop the game.

## Example

![example animation](https://raw.githubusercontent.com/MX-Futhark/terminal-gbc-emulator/master/examples/example.gif "Pokemon Crystal running in terminal-gbc-emulator")
