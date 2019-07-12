import { Neovim, WorkspaceConfiguration, OutputChannel } from 'coc.nvim'
import { FloatWindow } from './float-window'

export class Clock {
  private status: boolean
  private floatWin: FloatWindow
  constructor(
    private nvim: Neovim,
    config: WorkspaceConfiguration,
    output: OutputChannel
  ) {
    const enable = config.get<boolean>('enable', false)
    const top = config.get<number>('top', 1)
    const right = config.get<number>('right', 1)
    const winblend = config.get<number>('winblend', 100)

    if (output) {
      output.appendLine([
        'config:',
        `enable: ${enable}`,
        `top: ${top}`,
        `right: ${right}`,
        `winblend: ${winblend}`
      ].join('\n'))
    }

    this.status = enable

    this.floatWin = new FloatWindow(
      this.nvim,
      top,
      right,
      Math.max(Math.min(100, winblend), 0),
      output
    )

    if (enable) {
      this.enable()
    }
  }

  public async enable() {
    this.status = true
    await this.floatWin.show()
  }

  public async disable() {
    this.status = false
    await this.floatWin.hide()
  }

  public async tmpDisable() {
    if (this.status) {
      await this.floatWin.hide()
    }
  }

  public async resume() {
    if (this.status) {
      await this.floatWin.show()
    }
  }

  public async redraw() {
    if (this.status) {
      await this.floatWin.redraw()
    }
  }

  public async dispose() {
    await this.floatWin.dispose()
  }
}
