/**
 * Dedicated worker for safe regex testing with input validation
 */
import { parentPort } from 'worker_threads';

if (!parentPort) {
  throw new Error('This module must be run as a worker');
}

// Validate regex pattern before testing
function isValidPattern(pattern: string): boolean {
  console.log('Validating pattern:', pattern);

  // Check for common dangerous patterns
  if (pattern.length > 1000) {
    console.log('Pattern too long');
    return false;
  }

  if (/(\*\*|\+\+|\{(\d+,)*\d+\})/g.test(pattern)) {
    console.log('Pattern contains dangerous sequences');
    return false;
  }

  try {
    new RegExp(pattern);
    console.log('Pattern is valid regex');
    return true;
  } catch (error) {
    console.error('Pattern is invalid regex:', error);
    return false;
  }
}

parentPort.on('message', ([pattern, input]: [string, string]) => {
  if (typeof pattern !== 'string' || typeof input !== 'string') {
    parentPort?.postMessage({ error: 'Invalid input types' });
    return;
  }

  if (!isValidPattern(pattern)) {
    parentPort?.postMessage({ error: 'Invalid or unsafe regex pattern' });
    return;
  }

  try {
    console.log('Worker testing pattern:', pattern, 'against input:', input);
    const regex = new RegExp(pattern);
    const result = regex.test(input);
    console.log('Worker test result:', result);
    parentPort?.postMessage({ result });
  } catch (error) {
    console.error('Worker regex error:', error);
    parentPort?.postMessage({ error: 'Regex test failed' });
  }
});
