import { logger } from './logger.js';

/**
 * Show progress bar
 */
export async function showProgress(
  percentage: number,
  options = { width: 20, prefix: 'Processing', silent: true }
): Promise<void> {
  const filled = Math.floor((options.width * percentage) / 100);
  const empty = options.width - filled;
  const bar = `[${'='.repeat(filled)}>${'.'.repeat(empty)}]`;
  const message = `${options.prefix}... ${bar} ${percentage}% complete`;

  // Записываем в лог
  logger.debug(message, { component: 'Progress', percentage });

  // Выводим в консоль только если не silent
  if (!options.silent) {
    process.stdout.write('\x1b[1A\x1b[2K'); // Move cursor up and clear line
    process.stdout.write(message + '\n');
  }
}

/**
 * Clear progress and show final content
 */
export async function clearProgress(content: string, silent: boolean = true): Promise<void> {
  // Записываем в лог
  logger.info(content, { component: 'Progress', status: 'completed' });

  // Выводим в консоль только если не silent
  if (!silent) {
    process.stdout.write('\x1b[1A\x1b[2K'); // Clear progress line
    console.log(content);
  }
}
