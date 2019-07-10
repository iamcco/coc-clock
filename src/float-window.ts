import { Neovim, Window, Buffer as NVIMBuffer } from 'coc.nvim';
import { Subject, Subscription, from, timer } from 'rxjs';
import { concatMap, switchMap, scan, filter, map } from 'rxjs/operators';
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
    private winblend: number
  ) {
    this.subscription = this.source$.pipe(
      concatMap(({ action }) => {
        if (action === 'enable') {
          return from(this.close())
        }
        return timer(0, 1000).pipe(
          concatMap(() => {
            return from(async () => {
              const { nvim } = this
              const now = new Date()
              const hours = align(now.getHours())
              const minutes = align(now.getMinutes())
              const seconds = align(now.getSeconds())
              const lines = fronts[hours[0]]
                .map((item: string[], idx: number) => {
                  const hour = `${item.join('')}${fronts[hours[1]][idx].join('')}`
                  const separator = fronts['separator'][idx].join('')
                  const minute = `${fronts[minutes[0]][idx].join('')}${fronts[minutes[1]][idx].join('')}`
                  const second = `${fronts[seconds[0]][idx].join('')}${fronts[seconds[1]][idx].join('')}`
                  return `${hour}${separator}${minute}${separator}${second}`.trimRight()
                })
              await this.update(lines)
            })
          })
        )
      }),
    ).subscribe(() => {})
  }

  private async getWinConfig (content: string): Promise<any> {
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

  private async createBuffer() {
    if (this.buf) {
      const isValid = await this.buf.valid
      if (isValid) {
        return
      }
    }
    this.buf = await this.nvim.createNewBuffer(false, true)
  }

  private async createWindow(content: string): Promise<boolean> {
    if (this.win) {
      const isValid = await this.win.valid
      if (isValid) {
        return false
      }
    }

    const winConfig = await this.getWinConfig(content)

    const win = await this.nvim.openFloatWindow(
      this.buf!,
      false,
      winConfig
    )
    this.win = win

    this.nvim.pauseNotification()
    await win.setOption('number', false)
    await win.setOption('wrap', false)
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

  private async update (content: string) {

    await this.createBuffer()

    await this.buf!.setLines(content, { start: 0, end: -1 })

    const isNewWin = await this.createWindow(content)

    const { win } = this

    if (!isNewWin) {
      const winConfig = await this.getWinConfig(content)

      this.nvim.call('nvim_win_set_config', [
        win!.id,
        winConfig
      ])
    }
  }

  public show() {
    this.source$.next({
      action: 'enable'
    })
  }

  public hide() {
    this.source$.next({
      action: 'disable'
    })
  }

  public async dispose() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    await this.close()
  }
}
