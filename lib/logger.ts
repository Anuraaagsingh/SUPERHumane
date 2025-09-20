export class Logger {
  private static instance: Logger
  private isDevelopment = process.env.NODE_ENV === 'development'

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    if (data) {
      return `${prefix} ${message}\n${JSON.stringify(data, null, 2)}`
    }
    
    return `${prefix} ${message}`
  }

  info(message: string, data?: any): void {
    const formattedMessage = this.formatMessage('info', message, data)
    console.log(formattedMessage)
    
    if (this.isDevelopment) {
      // In development, also log to browser console
      console.info(message, data)
    }
  }

  error(message: string, error?: any): void {
    const formattedMessage = this.formatMessage('error', message, error)
    console.error(formattedMessage)
    
    if (this.isDevelopment) {
      console.error(message, error)
    }
  }

  warn(message: string, data?: any): void {
    const formattedMessage = this.formatMessage('warn', message, data)
    console.warn(formattedMessage)
    
    if (this.isDevelopment) {
      console.warn(message, data)
    }
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('debug', message, data)
      console.log(formattedMessage)
    }
  }
}

export const logger = Logger.getInstance()
