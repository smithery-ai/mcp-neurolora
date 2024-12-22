import { handleCollectCode } from '../src/tools/code-collector/handler.js';
import { handleAnalyzeCode } from '../src/tools/code-analyzer/handler.js';
import path from 'path';

function logMemory(label) {
  const used = process.memoryUsage();
  console.log(`\nMemory usage ${label}:`);
  for (let key in used) {
    console.log(`${key}: ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`);
  }
}

async function runTests() {
  // Use process.cwd() to get the project root directory
  const baseDir = process.cwd();

  try {
    logMemory('initial');

    // Test 1: Collect single file
    console.log('\n=== Test 1: Collect single file ===');
    await handleCollectCode({
      input: path.join(baseDir, 'src', 'tools', 'code-collector', 'handler.ts'),
      outputPath: baseDir,
    });
    logMemory('after collect single file');

    // Test 2: Collect directory
    console.log('\n=== Test 2: Collect directory ===');
    await handleCollectCode({
      input: path.join(baseDir, 'src', 'tools', 'code-collector'),
      outputPath: baseDir,
    });
    logMemory('after collect directory');

    // Test 3: Collect multiple files
    console.log('\n=== Test 3: Collect multiple files ===');
    await handleCollectCode({
      input: [
        path.join(baseDir, 'src', 'tools', 'code-collector', 'handler.ts'),
        path.join(baseDir, 'src', 'tools', 'code-collector', 'types.ts'),
      ],
      outputPath: baseDir,
    });
    logMemory('after collect multiple files');

    // Test 4: Analyze single file
    console.log('\n=== Test 4: Analyze single file ===');
    await handleAnalyzeCode({
      input: path.join(baseDir, 'src', 'tools', 'code-collector', 'handler.ts'),
      outputPath: baseDir,
    });
    logMemory('after analyze single file');

    // Test 5: Analyze directory
    console.log('\n=== Test 5: Analyze directory ===');
    await handleAnalyzeCode({
      input: path.join(baseDir, 'src', 'tools', 'code-collector'),
      outputPath: baseDir,
    });
    logMemory('after analyze directory');

    // Test 6: Analyze multiple files
    console.log('\n=== Test 6: Analyze multiple files ===');
    await handleAnalyzeCode({
      input: [
        path.join(baseDir, 'src', 'tools', 'code-collector', 'handler.ts'),
        path.join(baseDir, 'src', 'tools', 'code-collector', 'types.ts'),
      ],
      outputPath: baseDir,
    });
    logMemory('after analyze multiple files');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests().catch(console.error);
