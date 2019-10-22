import { ExtensionContext, workspace, commands } from 'coc.nvim'
import { Clock } from './clock'

export async function activate(context: ExtensionContext): Promise<void> {
  let { subscriptions } = context
  let config = workspace.getConfiguration('clock')

  const color = config.get<string>('color', '')

  let cmd = 'highlight default link ClockNormal Normal'

  if (color) {
    cmd = `highlight ClockNormal guifg=${color}`
  }
  workspace.nvim.command(cmd)

  const trace = config.get<'off' | 'message' | 'verbose'>('trace.server', 'off')
  const output = trace !== 'off' ? workspace.createOutputChannel('clock') : undefined

  const clock = new Clock(
    workspace.nvim,
    config,
    output
  )

  subscriptions.push(clock)

  subscriptions.push(
    commands.registerCommand('clock.enable', async () => {
      await clock.enable()
    })
  )

  subscriptions.push(
    commands.registerCommand('clock.disable', async () => {
      await clock.disable()
    })
  )

  subscriptions.push(
    workspace.registerAutocmd({
      event: 'TabLeave',
      request: true,
      callback: async () => {
        await clock.tmpDisable()
      }
    })
  )

  subscriptions.push(
    workspace.registerAutocmd({
      event: 'TabEnter ',
      request: true,
      callback: async () => {
        await clock.resume()
      }
    })
  )

  subscriptions.push(
    workspace.registerAutocmd({
      event: 'VimResized ',
      request: false,
      callback: async () => {
        await clock.redraw()
      }
    })
  )

  subscriptions.push(
    workspace.registerAutocmd({
      event: 'QuitPre ',
      request: true,
      callback: async () => {
        const tab = await workspace.nvim.tabpage
        const wins = await tab.windows
        if (wins && wins.length <= 2) {
          await clock.tmpDisable()
        }
      }
    })
  )
}
