import { IntegrationError, classifyThrownError } from '../errors/IntegrationError';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Called before each retry attempt (attempt starts at 1 for the first retry). */
  onRetry?: (attempt: number, error: IntegrationError) => void;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new IntegrationError('timeout', 'unknown', 'Retry cancelled.'));
      }, { once: true });
    }
  });
}

/**
 * Runs `fn` with exponential backoff on retryable IntegrationErrors.
 * Non-retryable errors (validation, forbidden, unauthorized) fail immediately.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 500, maxDelayMs = 8000, timeoutMs = 15000, signal, onRetry } = options;

  let lastError: IntegrationError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) {
      throw new IntegrationError('timeout', 'unknown', 'Operation was cancelled.');
    }

    try {
      const timeoutSignal = AbortSignal.timeout(timeoutMs);
      const combinedSignal = signal ? anySignal([signal, timeoutSignal]) : timeoutSignal;
      return await runWithSignal(fn, attempt, combinedSignal);
    } catch (err) {
      const code = classifyThrownError(err);
      const integrationError = err instanceof IntegrationError ? err : new IntegrationError(code, 'unknown', (err as Error)?.message);
      lastError = integrationError;

      const isLastAttempt = attempt === maxRetries;
      if (!integrationError.retryable || isLastAttempt) {
        throw integrationError;
      }

      onRetry?.(attempt + 1, integrationError);
      const delay = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
      await sleep(delay, signal);
    }
  }

  // Unreachable, but keeps TypeScript happy.
  throw lastError || new IntegrationError('unknown_error', 'unknown', 'Retry loop exited unexpectedly.');
}

async function runWithSignal<T>(fn: (attempt: number) => Promise<T>, attempt: number, signal: AbortSignal): Promise<T> {
  if (signal.aborted) throw new IntegrationError('timeout', 'unknown', 'Operation timed out.');
  return fn(attempt);
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) { controller.abort(); break; }
    s.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return controller.signal;
}
