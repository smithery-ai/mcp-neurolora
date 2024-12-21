import { createAnalysisFile } from './project-files.js';

/**
 * Show progress bar in a single line
 */
export async function showProgress(
  percentage: number,
  options = { width: 20, prefix: 'Processing' }
): Promise<void> {
  const filled = Math.floor((options.width * percentage) / 100);
  const empty = options.width - filled;
  const bar = `[${'='.repeat(filled)}>${'.'.repeat(empty)}]`;

  // Move cursor up and clear line
  process.stdout.write('\x1b[1A\x1b[2K');
  process.stdout.write(`${options.prefix}... ${bar} ${percentage}% complete\n`);

  // Update file without newlines to keep single line
  await createAnalysisFile(
    'LAST_RESPONSE_OPENAI.txt',
    `${options.prefix}... ${bar} ${percentage}% complete`,
    { append: false }
  );
}

/**
 * Clear progress and show final content
 */
export async function clearProgress(content: string): Promise<void> {
  // Clear progress line
  process.stdout.write('\x1b[1A\x1b[2K');

  // Write final content
  await createAnalysisFile('LAST_RESPONSE_OPENAI.txt', content, { append: false });
  console.log('Analysis completed. Recommended fixes and improvements:\n');
}
