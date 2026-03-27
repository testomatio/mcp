export class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = details.status;
    this.url = details.url;
    this.payload = details.payload;
  }
}

export class NotImplementedToolError extends Error {
  constructor(toolName) {
    super(`Tool "${toolName}" is not implemented yet`);
    this.name = 'NotImplementedToolError';
    this.toolName = toolName;
  }
}
