export interface ErrorHandler {
  onError: (error: Error) => void;
  handleError?: (error: Error) => void;
  connect: (options?: { timeout?: number }) => Promise<void>;
  disconnect: () => Promise<void>;
}
