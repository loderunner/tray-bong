import fs from 'node:fs';
import path from 'node:path';

const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB

type LogLevel = 'ERROR' | 'INFO' | 'DEBUG';
const MIN_LOG_LEVEL: LogLevel =
  process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO'; // Only show INFO and ERROR, not DEBUG

let logFilePath: string | null = null;
let logStream: fs.WriteStream | NodeJS.WriteStream | null = null;
const logBuffer: string[] = [];

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  ERROR: 0,
  INFO: 1,
  DEBUG: 2,
};

/**
 * Detects the execution context/world.
 *
 * @returns The world context: 'Main', 'Renderer', or 'ContextBridge'
 */
export function whatWorld(): 'Renderer' | 'Main' | 'ContextBridge' {
  if (typeof window === 'undefined') {
    return 'Main';
  }

  if (typeof Buffer === 'undefined') {
    return 'Renderer';
  }

  return 'ContextBridge';
}

/**
 * Converts a Date to an ISO string in local timezone.
 *
 * @param date - The date to convert
 * @returns ISO string with local timezone offset
 */
function toLocalISOString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const offsetMs = offset * 60 * 1000;
  const localTime = new Date(date.getTime() - offsetMs);

  // Get ISO string and replace 'Z' with timezone offset
  const isoString = localTime.toISOString();
  const timezoneOffset = -offset; // Flip sign
  const hours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(
    2,
    '0',
  );
  const minutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
  const sign = timezoneOffset >= 0 ? '+' : '-';

  return isoString.slice(0, -1) + sign + hours + ':' + minutes;
}

/**
 * Formats a log message with timestamp, level, world, and module context.
 *
 * @param level - The log level (ERROR, INFO, DEBUG)
 * @param world - The world context (Main, Renderer, ContextBridge)
 * @param module - The module name
 * @param message - The log message
 * @returns Formatted log line
 */
function formatLogLine(
  level: string,
  world: string,
  module: string,
  message: string,
): string {
  const timestamp = toLocalISOString(new Date());
  return `${timestamp} [${level}][${world}][${module}] ${message}\n`;
}

/**
 * Rotates the log file if it exceeds the maximum size.
 * Only rotates on startup, not during a session.
 */
async function rotateLogIfNeeded(): Promise<void> {
  if (logFilePath === null) {
    return;
  }

  try {
    const stats = await fs.promises.stat(logFilePath);
    if (stats.size > MAX_LOG_SIZE) {
      const rotatedPath = `${logFilePath}.1`;
      await fs.promises.rename(logFilePath, rotatedPath);
    }
  } catch (error) {
    // File doesn't exist yet, which is fine
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Writes a log message to the file.
 * If the log stream is not yet initialized, buffers the message.
 * Filters out messages below the minimum log level.
 *
 * @param level - The log level
 * @param world - The world context (Main, Renderer, ContextBridge)
 * @param module - The module name
 * @param message - The log message
 */
export function writeLog(
  level: LogLevel,
  world: string,
  module: string,
  message: string,
): void {
  const levelPriority = LOG_LEVEL_PRIORITY[level];
  const minPriority = LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL];

  if (levelPriority > minPriority) {
    return; // Skip logs below minimum level
  }

  const logLine = formatLogLine(level, world, module, message);

  if (logStream === null) {
    logBuffer.push(logLine);
    return;
  }

  logStream.write(logLine);
}

/**
 * Initializes the logger.
 * Must be called before any logging functions.
 * Flushes any buffered log messages when the stream becomes available.
 */
export async function init(): Promise<void> {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    logStream = process.stdout;
  } else {
    const { app } = await import('electron');
    const logsDir = app.getPath('logs');
    logFilePath = path.join(logsDir, 'app.log');

    await rotateLogIfNeeded();

    logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  }

  // Flush buffered log messages
  for (const bufferedLine of logBuffer) {
    logStream.write(bufferedLine);
  }
  logBuffer.length = 0;
}

export type Logger = {
  error: (message: string) => void;
  info: (message: string) => void;
  debug: (message: string) => void;
};
