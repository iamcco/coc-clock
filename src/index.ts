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
  let output = trace !== 'off' ? workspace.createOutputChannel('clock') : undefined

  const clock = new Clock(
    workspace.nvim,
    config
  )

  subscriptions.push(
    commands.registerCommand('ClockEnable', () => {
      clock.enable()
    })
  )

  subscriptions.push(
    commands.registerCommand('ClockDisable', () => {
      clock.disable()
    })
  )

  subscriptions.push(
    workspace.registerAutocmd({
      event: 'TabLeave',
      request: true,
      callback: () => {
        clock.tmpDisable()
      }
    })
  )

  subscriptions.push(
    workspace.registerAutocmd({
      event: 'TabEnter ',
      request: true,
      callback: () => {
        clock.enable()
      }
    })
  )
}
