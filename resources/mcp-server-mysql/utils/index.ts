type LogType = 'info' | 'error'

// @INFO: Enable logging if ENABLE_LOGGING is true
const ENABLE_LOGGING = ["true", "1"].includes(process.env.ENABLE_LOGGING || 'false')

export function log(type: LogType = 'info', ...args: any[]): void {
  if (!ENABLE_LOGGING) return

  switch (type) {
    case 'info':
      console.info(...args)
      break
    case 'error':
      console.error(...args)
      break
    default:
      console.log(...args)
  }
}