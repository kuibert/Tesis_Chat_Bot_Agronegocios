export class BaseError extends Error {
  public status: number;
  public code: string;
  public errors?: Record<string, string[]>;

  constructor(
    message: string,
    status = 500,
    code = "INTERNAL_ERROR",
    errors?: Record<string, string[]>,
  ) {
    super(message);

    this.status = status;
    this.code = code;
    this.errors = errors;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}
