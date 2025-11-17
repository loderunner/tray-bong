import fs from 'node:fs';
import path from 'node:path';

import { app } from 'electron';

const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB

let logFilePath: string | null = null;
let logStream: fs.WriteStream | NodeJS.WriteStream | null = null;
const logBuffer: string[] = [];

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
  const hours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
  const sign = timezoneOffset >= 0 ? '+' : '-';

  return isoString.slice(0, -1) + sign + hours + ':' + minutes;
}

/**
 * Formats a log message with timestamp, level, and context.
 *
 * @param level - The log level (ERROR, INFO, DEBUG)
 * @param context - The process context (Main, Renderer)
 * @param message - The log message
 * @returns Formatted log line
 */
function formatLogLine(level: string, context: string, message: string): string {
  const timestamp = toLocalISOString(new Date());
  return `${timestamp} [${level}][${context}] ${message}\n`;
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
 *
 * @param level - The log level
 * @param context - The process context
 * @param message - The log message
 */
export function writeLog(
  level: string,
  context: string,
  message: string,
): void {
  const logLine = formatLogLine(level, context, message);

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

/**
 * Logs an error message.
 *
 * @param message - The error message to log
 */
export function error(message: string): void {
  writeLog('ERROR', 'Main', message);
}

/**
 * Logs an info message.
 *
 * @param message - The info message to log
 */
export function info(message: string): void {
  writeLog('INFO', 'Main', message);
}

/**
 * Logs a debug message.
 *
 * @param message - The debug message to log
 */
export function debug(message: string): void {
  writeLog('DEBUG', 'Main', message);
}

