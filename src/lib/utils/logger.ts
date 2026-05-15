type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
  timestamp: string;
}

function formatLog(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context}] ${entry.message}`;
  if (entry.data !== undefined) {
    return `${base}\n${JSON.stringify(entry.data, null, 2)}`;
  }
  return base;
}

function createLogger(context: string) {
  return {
    info(message: string, data?: unknown) {
      const entry: LogEntry = {
        level: "info",
        context,
        message,
        data,
        timestamp: new Date().toISOString(),
      };
      console.log(formatLog(entry));
    },
    warn(message: string, data?: unknown) {
      const entry: LogEntry = {
        level: "warn",
        context,
        message,
        data,
        timestamp: new Date().toISOString(),
      };
      console.warn(formatLog(entry));
    },
    error(message: string, data?: unknown) {
      const entry: LogEntry = {
        level: "error",
        context,
        message,
        data,
        timestamp: new Date().toISOString(),
      };
      console.error(formatLog(entry));
    },
  };
}

export { createLogger };
