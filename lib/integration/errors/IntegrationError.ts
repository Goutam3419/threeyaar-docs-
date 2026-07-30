export type IntegrationErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'expired_token'
  | 'rate_limit'
  | 'timeout'
  | 'provider_offline'
  | 'network_failure'
  | 'validation_error'
  | 'unknown_error';

const RETRYABLE_CODES: IntegrationErrorCode[] = ['rate_limit', 'timeout', 'provider_offline', 'network_failure'];

export class IntegrationError extends Error {
  code: IntegrationErrorCode;
  provider: string;
  retryable: boolean;
  status: number | null;

  constructor(code: IntegrationErrorCode, provider: string, message?: string, status: number | null = null) {
    super(message || IntegrationError.defaultMessage(code));
    this.name = 'IntegrationError';
    this.code = code;
    this.provider = provider;
    this.status = status;
    this.retryable = RETRYABLE_CODES.includes(code);
  }

  static defaultMessage(code: IntegrationErrorCode): string {
    switch (code) {
      case 'unauthorized': return 'The request was not authorized.';
      case 'forbidden': return 'This operation is not permitted with the current scopes.';
      case 'expired_token': return 'The connection token has expired.';
      case 'rate_limit': return 'The provider is rate-limiting requests.';
      case 'timeout': return 'The request timed out.';
      case 'provider_offline': return 'The provider appears to be unavailable.';
      case 'network_failure': return 'A network error occurred.';
      case 'validation_error': return 'The request was invalid.';
      default: return 'An unknown integration error occurred.';
    }
  }

  toJSON() {
    return { code: this.code, provider: this.provider, message: this.message, retryable: this.retryable, status: this.status };
  }
}

/** Maps an HTTP status code from any provider into our standardized error taxonomy. */
export function classifyHttpStatus(status: number): IntegrationErrorCode {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 429) return 'rate_limit';
  if (status === 408) return 'timeout';
  if (status >= 500) return 'provider_offline';
  if (status >= 400) return 'validation_error';
  return 'unknown_error';
}

/** Maps a caught JS error (network failure, abort, etc.) into our taxonomy. */
export function classifyThrownError(err: unknown): IntegrationErrorCode {
  if (err instanceof IntegrationError) return err.code;
  const message = err instanceof Error ? err.message.toLowerCase() : '';
  if (message.includes('abort') || message.includes('timeout')) return 'timeout';
  if (message.includes('fetch failed') || message.includes('network')) return 'network_failure';
  return 'unknown_error';
}
