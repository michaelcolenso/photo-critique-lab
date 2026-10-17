declare global {
  namespace App {
    interface Platform {
      env: {
        OPENAI_API_KEY?: string;
        OPENAI_MODEL?: string;
        VALIDATION_EVENTS?: {
          writeDataPoint(point: { indexes: string[]; blobs: string[]; doubles: number[] }): void;
        };
      };
      context: { waitUntil(promise: Promise<unknown>): void };
    }
  }
}
export {};
