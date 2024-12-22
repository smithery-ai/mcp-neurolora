import { handleCollectCode } from '../build/tools/code-collector/handler.js';

function logMemory(label) {
  const used = process.memoryUsage();
  console.log(`\nMemory usage ${label}:`);
  for (let key in used) {
    console.log(`${key}: ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`);
  }
}

async function runTests() {
  const baseDir = '/Users/fadandr/Custom Projects/Custom MCP/aindreyway-mcp-neurolora';

  try {
    logMemory('initial');

    // Test 1: Collect single file
    console.log('\n=== Test 1: Collect single file ===');
    await handleCollectCode({
      input: `${baseDir}/src/tools/code-collector/handler.ts`,
      outputPath: baseDir,
    });
    logMemory('after collect single file');

    // Test 2: Collect directory
    console.log('\n=== Test 2: Collect directory ===');
    await handleCollectCode({
      input: `${baseDir}/src/tools/code-collector`,
      outputPath: baseDir,
    });
    logMemory('after collect directory');

    // Test 3: Collect multiple files
    console.log('\n=== Test 3: Collect multiple files ===');
    await handleCollectCode({
      input: [
        `${baseDir}/src/tools/code-collector/handler.ts`,
        `${baseDir}/src/tools/code-collector/types.ts`,
      ],
      outputPath: baseDir,
    });
    logMemory('after collect multiple files');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests().catch(console.error);
