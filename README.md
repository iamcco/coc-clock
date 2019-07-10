# Big Clock for Neovim

coc extensions of [clock.nvim](https://github.com/iamcco/clock.nvim)

## Install

``` vim
:CocInstall coc-clock
```

## Options

config:

``` jsonc
"clock.enable": {
  "type": "boolean",
  "default": true,
  "description": "Enable clock"
},
"clock.color": {
  "type": "string",
  "default": "",
  "description": "clock color, default is Normal highlight group"
},
"clock.winblend": {
  "type": "number",
  "default": "100",
  "description": "config opacity of floating window background 0-100 from fully opaque to transparent, default is 100"
},
"clock.top": {
  "type": "number",
  "default": "1",
  "description": "position distance to top"
},
"clock.right": {
  "type": "number",
  "default": "1",
  "description": "position distance to right"
},
"clock.trace.server": {
  "type": "string",
  "default": "off",
  "enum": [
    "off",
    "messages",
    "verbose"
  ],
  "description": "Trace level of coc-clock"
}
```

### Buy Me A Coffee ☕️

![btc](https://img.shields.io/keybase/btc/iamcco.svg?style=popout-square)

![image](https://user-images.githubusercontent.com/5492542/42771079-962216b0-8958-11e8-81c0-520363ce1059.png)
