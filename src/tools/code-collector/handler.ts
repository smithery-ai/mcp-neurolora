import path from 'path';
import { CODE_ANALYSIS_PROMPT } from '../../prompts/index.js';
import { CodeCollectorOptions } from '../../types/index.js';
import { collectFiles } from '../../utils/fs.js';
import { createCodeCollectionFile } from '../../utils/project-files.js';
import { validateOptions } from '../../validators/index.js';

/**
 * Handle code collection tool execution
 */
export async function handleCollectCode(options: CodeCollectorOptions): Promise<string> {
  // Проверяем, что все входные пути абсолютные
  const inputs = Array.isArray(options.input) ? options.input : [options.input];
  for (const input of inputs) {
    if (!path.isAbsolute(input)) {
      throw new Error(`Input path must be absolute. Got: ${input}`);
    }
  }

  // Проверяем, что выходной путь абсолютный
  if (!path.isAbsolute(options.outputPath)) {
    throw new Error(`Output path must be absolute. Got: ${options.outputPath}`);
  }

  // Формируем имя выходного файла
  const date = new Date().toISOString().split('T')[0];
  const inputName = Array.isArray(options.input)
    ? 'MULTIPLE_FILES'
    : path.basename(options.input).toUpperCase();

  // Используем предоставленный выходной путь
  const outputPath = options.outputPath;

  // Собираем файлы
  const files = await collectFiles(options.input, options.ignorePatterns || []);

  if (files.length === 0) {
    return 'No files found matching the criteria';
  }

  // Generate markdown content
  const title = Array.isArray(options.input) ? 'Selected Files' : path.basename(options.input);

  let markdown = CODE_ANALYSIS_PROMPT;
  markdown += `\n# Code Collection: ${title}\n\n`;
  markdown += `Source: ${
    Array.isArray(options.input) ? options.input.join(', ') : options.input
  }\n\n`;

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

  // Write output file
  const input = Array.isArray(options.input) ? options.input[0] : options.input;
  await createCodeCollectionFile(input, markdown);

  return `Successfully collected ${files.length} files. Output saved to: ${outputPath}`;
}
