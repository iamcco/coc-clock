import { Neovim, Window, Buffer as NVIMBuffer, OutputChannel } from 'coc.nvim';
import { Subject, Subscription, from, timer, of } from 'rxjs';
import { concatMap, switchMap } from 'rxjs/operators';
import { fronts } from './font'

type Params = {
  action: 'enable' | 'disable'
}

function align(num: string | number): string {
  return `${num}`.replace(/^(\d)$/, '0$1')
}

export class FloatWindow {
  private source$: Subject<Params> = new Subject<Params>()
  private subscription: Subscription
  private buf: NVIMBuffer | undefined
  private win: Window | undefined

  constructor(
    private nvim: Neovim,
    private top: number,
    private right: number,
    private winblend: number,
    private output: OutputChannel
  ) {
    this.subscription = this.source$.pipe(
      switchMap(({ action }) => {
        if (this.output) {
          this.output.appendLine(`action: ${action}`)
        }
        if (action === 'disable') {
          return of(undefined)
        }
        return timer(0, 1000).pipe(
          concatMap(() => {
            return from((async () => {
              const now = new Date()
              const hours = align(now.getHours())
              const minutes = align(now.getMinutes())
              const seconds = align(now.getSeconds())
              const lines: string[] = fronts[hours[0]]
                .map((item: string[], idx: number) => {
                  const hour = `${item.join('')}${fronts[hours[1]][idx].join('')}`
                  const separator = fronts['separator'][idx].join('')
                  const minute = `${fronts[minutes[0]][idx].join('')}${fronts[minutes[1]][idx].join('')}`
                  const second = `${fronts[seconds[0]][idx].join('')}${fronts[seconds[1]][idx].join('')}`
                  return `${hour}${separator}${minute}${separator}${second}`.trimRight()
                })
              if (this.output) {
                this.output.appendLine(
                  lines.join('\n')
                )
              }
              await this.update(lines)
            })())
          })
        )
      }),
    ).subscribe(() => {})
  }

  private async getWinConfig (): Promise<any> {
    const col = await this.nvim.getOption('columns') as number

    return {
      focusable: false,
      relative: 'editor',
      anchor: 'NE',
      height: 5,
      width: 54,
      row: this.top,
      col: col - this.right
    }
  }

  private async updateSize(win: Window) {
    const isValid = await win.valid
    if (!isValid) {
      return
    }

    const winConfig = await this.getWinConfig()

    this.nvim.call('nvim_win_set_config', [
      win!.id,
      winConfig
    ])
  }

  private async createBuffer() {
    if (this.buf) {
      const isValid = await this.buf.valid
      if (isValid) {
        return
      }
    }
    this.buf = await this.nvim.createNewBuffer(false, true)
  }

  private async createWindow(): Promise<boolean> {
    if (this.win) {
      const isValid = await this.win.valid
      if (isValid) {
        return false
      }
    }

    const winConfig = await this.getWinConfig()

    const win = await this.nvim.openFloatWindow(
      this.buf!,
      false,
      {
        ...winConfig,
        width: 1,
        height: 1,
        style: 'minimal'
      }
    )
    this.win = win

    const isUpportWinblend = await this.nvim.call('exists', '+winblend')
    if (isUpportWinblend) {
      await win.setOption('winblend', this.winblend)
    }

    this.nvim.pauseNotification()
    await win.setOption('number', false)
    await win.setOption('relativenumber', false)
    await win.setOption('cursorline', false)
    await win.setOption('cursorcolumn', false)
    await win.setOption('conceallevel', 2)
    await win.setOption('signcolumn', 'no')
    await win.setOption('winhighlight', 'Normal:ClockNormal')
    await this.nvim.resumeNotification()
    return true
  }

  private async close() {
    const { win } = this
    this.win = undefined
    if (win) {
      const isValid = await win.valid
      if (isValid) {
        await win.close(true)
      }
    }
  }

  private async update (content: string[]) {

    await this.createBuffer()

    await this.buf!.setLines(content, { start: 0, end: -1 })

    const isNewWin = await this.createWindow()

    const { win } = this

    if (isNewWin) {
      await this.updateSize(win)
    }
  }

  public show() {
    this.source$.next({
      action: 'enable'
    })
  }

  public async hide() {
    this.source$.next({
      action: 'disable'
    })
    await this.close()
  }

  public async redraw() {
    if (this.win) {
      await this.updateSize(this.win)
    }
  }

  public async dispose() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    await this.close()
  }
}
