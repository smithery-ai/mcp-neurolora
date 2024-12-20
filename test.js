import { installBaseServersTool } from './build/tools/base-servers-installer/index.js';

async function test() {
  try {
    console.log('Testing install_base_servers tool...');
    console.log('Tool configuration:', installBaseServersTool);

    const configPath = process.argv[2] || 'test_config.json';
    console.log('Using config path:', configPath);

    const result = await installBaseServersTool.handler({
      configPath,
    });

    console.log('Tool result:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
