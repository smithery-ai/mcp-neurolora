import { safeWriteFile } from '../../utils/safe-fs.js';
import { validateOptions } from '../../validators/index.js';
import { collectFiles } from '../../utils/fs.js';
import { CodeCollectorOptions } from './types.js';

/**
 * Handle code collection tool execution
 */
export async function handleCollectCode(options: CodeCollectorOptions): Promise<string> {
  // Validate options
  const validatedOptions = await validateOptions(options);

  // Collect files
  const files = await collectFiles(
    validatedOptions.directory,
    validatedOptions.ignorePatterns || []
  );

  if (files.length === 0) {
    return 'No files found matching the criteria';
  }

  // Generate markdown content
  let markdown = `# Code Collection: ${validatedOptions.directory}\n\n`;
  markdown += `Source directory: ${validatedOptions.directory}\n\n`;

  // Table of contents
  markdown += '## Table of Contents\n\n';
  for (const file of files) {
    const anchor = file.relativePath.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    markdown += `- [${file.relativePath}](#${anchor})\n`;
  }

  // File contents
  markdown += '\n## Files\n\n';
  for (const file of files) {
    const anchor = file.relativePath.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    markdown += `### ${file.relativePath} {#${anchor}}\n`;
    markdown += '```' + file.language + '\n';
    markdown += file.content;
    markdown += '\n```\n\n';
  }

  // Write output file using safe file system operations
  await safeWriteFile(validatedOptions.outputPath, markdown);

  return `Successfully collected ${files.length} files. Output saved to: ${validatedOptions.outputPath}`;
}
