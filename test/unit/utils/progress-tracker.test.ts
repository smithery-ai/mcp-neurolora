import { jest } from '@jest/globals';
import { ProgressTracker } from '../../../src/utils/progress-tracker.js';
// Mock chalk module
jest.mock('chalk', () => ({
  default: Object.assign(
    (str: string) => str,
    {
      green: (str: string) => str,
      yellow: (str: string) => str,
      red: (str: string) => str
    }
  )
}));

// Mock progress module
jest.mock('../../../src/utils/progress.js', () => ({
  __esModule: true,
  showProgress: jest.fn(),
  clearProgress: jest.fn()
}));

const { showProgress, clearProgress } = await import('../../../src/utils/progress.js');

describe('Progress Tracker', () => {
  let tracker: ProgressTracker;

  beforeEach(() => {
    jest.useFakeTimers();
    (showProgress as jest.Mock).mockClear();
    (clearProgress as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Progress Tracking', () => {
    it('should initialize with total steps', () => {
      tracker = new ProgressTracker(100);
      expect(tracker).toBeDefined();
    });

    it('should start progress tracking', () => {
      tracker = new ProgressTracker(100);
      tracker.start();

      // Проверяем, что таймер установлен
      expect(setInterval).toHaveBeenCalledTimes(1);
      expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 1000);
    });

    it('should update progress over time', async () => {
      tracker = new ProgressTracker(100);
      tracker.start();

      // Продвигаем время на 10 секунд
      jest.advanceTimersByTime(10000);

      // Проверяем, что showProgress был вызван с правильными параметрами
      expect(showProgress).toHaveBeenCalled();
      const lastCall = (showProgress as jest.Mock).mock.calls.slice(-1)[0];
      expect(lastCall[1]).toEqual(
        expect.objectContaining({
          width: 20,
          prefix: '[Progress]',
        })
      );
    });

    it('should stop progress tracking', async () => {
      tracker = new ProgressTracker(100);
      tracker.start();
      await tracker.stop();

      // Проверяем, что clearProgress был вызван
      expect(clearProgress).toHaveBeenCalled();

      // Проверяем, что таймер был очищен
      jest.advanceTimersByTime(1000);
      expect(showProgress).not.toHaveBeenCalled();
    });
  });
  describe('Options Handling', () => {
    it('should respect custom width option', async () => {
      tracker = new ProgressTracker(100, { width: 40 });
      tracker.start();

      jest.advanceTimersByTime(1000);

      expect(showProgress).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({ width: 40 })
      );
    });

    it('should respect custom prefix option', async () => {
      tracker = new ProgressTracker(100, { prefix: '[Custom]' });
      tracker.start();

      jest.advanceTimersByTime(1000);

      expect(showProgress).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({ prefix: '[Custom]' })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero total steps', () => {
      tracker = new ProgressTracker(0);
      tracker.start();

      jest.advanceTimersByTime(1000);

      expect(showProgress).toHaveBeenCalledWith(expect.any(Number), expect.any(Object));
    });

    it('should not start multiple intervals', () => {
      tracker = new ProgressTracker(100);
      tracker.start();
      tracker.start(); // Второй вызов start()

      expect(setInterval).toHaveBeenCalledTimes(1);
    });

    it('should handle stop without start', async () => {
      tracker = new ProgressTracker(100);
      await tracker.stop();

      expect(clearProgress).toHaveBeenCalled();
    });

    it('should handle custom stop message', async () => {
      const message = 'Custom stop message';
      tracker = new ProgressTracker(100);
      tracker.start();
      await tracker.stop(message);

      expect(clearProgress).toHaveBeenCalledWith(message);
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate progress based on elapsed time', () => {
      tracker = new ProgressTracker(100);
      tracker.start();

      // Продвигаем время на 60 секунд (половина от 120 секунд)
      jest.advanceTimersByTime(60000);

      // Проверяем последний вызов showProgress
      const lastCall = (showProgress as jest.Mock).mock.calls.slice(-1)[0];
      expect(lastCall[0]).toBe(50); // Ожидаем 50% прогресса
    });

    it('should not exceed 100% progress', () => {
      tracker = new ProgressTracker(100);
      tracker.start();

      // Продвигаем время намного вперед
      jest.advanceTimersByTime(300000);

      // Проверяем последний вызов showProgress
      const lastCall = (showProgress as jest.Mock).mock.calls.slice(-1)[0];
      expect(lastCall[0]).toBeLessThanOrEqual(100);
    });
  });

  describe('Cleanup', () => {
    it('should clean up interval on stop', async () => {
      tracker = new ProgressTracker(100);
      tracker.start();
      await tracker.stop();

      jest.advanceTimersByTime(1000);
      expect(showProgress).not.toHaveBeenCalled();
    });

    it('should handle multiple stops', async () => {
      tracker = new ProgressTracker(100);
      tracker.start();
      await tracker.stop();
      await tracker.stop(); // Второй вызов stop()

      expect(clearProgress).toHaveBeenCalledTimes(2);
    });
  });
});
