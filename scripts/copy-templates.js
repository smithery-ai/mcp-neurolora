import fs from 'fs/promises';
import path from 'path';

async function copyTemplates() {
  try {
    // Create build/templates directory
    await fs.mkdir('build/templates', { recursive: true });

    // Copy template file
    await fs.copyFile(
      'src/templates/neuroloraignore.template',
      'build/templates/neuroloraignore.template'
    );

    console.log('✅ Templates copied successfully');
  } catch (error) {
    console.error('Error copying templates:', error);
    process.exit(1);
  }
}

copyTemplates();
