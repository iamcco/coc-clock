import { Neovim, WorkspaceConfiguration } from 'coc.nvim'
import { FloatWindow } from './float-window'

export class Clock {
  private status: boolean
  private floatWin: FloatWindow
  constructor(
    private nvim: Neovim,
    private config: WorkspaceConfiguration
  ) {
    const enable = config.get<boolean>('enable', false)
    const top = config.get<number>('top', 1)
    const right = config.get<number>('right', 1)
    const winblend = config.get<number>('winblend', 100)

    this.status = enable

    this.floatWin = new FloatWindow(
      this.nvim,
      top,
      right,
      Math.max(Math.min(100, winblend), 0)
    )

    if (enable) {
      this.enable()
    }
  }

  public enable() {
    this.status = true
    this.floatWin.show()
  }

  public disable() {
    this.status = false
    this.floatWin.hide()
  }

  public tmpDisable() {
    if (this.status) {
      this.floatWin.hide()
    }
  }

  public resume() {
    if (this.status) {
      this.floatWin.show()
    }
  }

  public dispose() {
    this.floatWin.dispose()
  }
}
