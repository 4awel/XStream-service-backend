export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string = "DOMAIN_ERROR",
  ) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class ForbiddenDomainError extends DomainError {} // нет прав
export class NotFoundDomainError extends DomainError {} // не найдено
export class ConflictDomainError extends DomainError {} // состояние не позволяет
