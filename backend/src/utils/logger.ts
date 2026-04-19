type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private serviceName = 'village-api';
  private env = process.env.NODE_ENV || 'development';

  private log(level: LogLevel, message: string, context?: LogContext) {
    const entry = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      env: this.env,
      level,
      message,
      ...context,
    };

    const output = JSON.stringify(entry);

    if (level === 'ERROR') {
      process.stderr.write(output + '\n');
    } else if (level === 'WARN') {
      process.stdout.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  }

  info(message: string, context?: LogContext) {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('WARN', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('ERROR', message, context);
  }
}

export const logger = new Logger();
