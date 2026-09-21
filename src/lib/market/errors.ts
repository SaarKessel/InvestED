// ---------------------------------------------------------------------------
// InvestED — Market Data Errors (Phase 4)
//
// Error taxonomy for the provider router. The class of the error decides
// whether falling back to another provider is safe:
//
// - Availability errors (network failure, timeout, 5xx, rate limit) mean
//   the provider could not serve the request. Falling back to another
//   provider is safe and expected.
// - Business/data errors (symbol not found, malformed payload) mean the
//   provider answered and the answer itself is the problem. Falling back
//   would hide bugs or data-quality issues, so these propagate.
// ---------------------------------------------------------------------------

export class MarketDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Network failure, timeout, or 5xx from the provider. Fallback-safe. */
export class ProviderUnavailableError extends MarketDataError {}

/** Provider rate limit (HTTP 429 or an explicit rate-limit payload). Fallback-safe. */
export class ProviderRateLimitError extends ProviderUnavailableError {}

/** The provider answered but has no such symbol. NOT fallback-safe. */
export class SymbolNotFoundError extends MarketDataError {}

/** The provider answered with a malformed/unexpected payload. NOT fallback-safe. */
export class ProviderResponseError extends MarketDataError {}

export interface ProviderFailure {
  providerId: string;
  error: string;
}

/** Every configured provider failed with an availability-class error. */
export class AllProvidersUnavailableError extends ProviderUnavailableError {
  readonly failures: ProviderFailure[];

  constructor(failures: ProviderFailure[]) {
    super(
      `All market data providers are unavailable: ${failures
        .map((failure) => `${failure.providerId} (${failure.error})`)
        .join(", ")}`
    );
    this.failures = failures;
  }
}

export function isAvailabilityError(error: unknown): boolean {
  return error instanceof ProviderUnavailableError;
}
