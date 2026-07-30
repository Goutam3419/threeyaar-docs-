export function generateOperationId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class Timer {
  private start: number;
  constructor() {
    this.start = Date.now();
  }
  elapsedMs(): number {
    return Date.now() - this.start;
  }
}
