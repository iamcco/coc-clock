import { ExtensionContext, workspace, FloatFactory } from 'coc.nvim'

export async function activate(context: ExtensionContext): Promise<void> {
  let { subscriptions } = context
  let config = workspace.getConfiguration('coc-status')
  let enable = config.get<boolean>('enable', true)

  if (!enable) {
    return
  }

  const trace = config.get<'off' | 'message' | 'verbose'>('trace.server', 'off')
  let output = trace !== 'off' ? workspace.createOutputChannel('coc-project') : undefined

  subscriptions.push(
    workspace.registerAutocmd({
      event: 'Reward',
      request: true,
      callback: () => {}
    })
  )
}
