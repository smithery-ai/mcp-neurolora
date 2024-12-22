import OpenAI from 'openai';
import path from 'path';
import { encoding_for_model } from 'tiktoken';
import { config } from '../../config/index.js';
import { getCodeAnalysisPrompt } from '../../prompts/index.js';
import { logger } from '../../utils/logger.js';
import { ProgressTracker } from '../../utils/progress-tracker.js';
import { createAnalysisFile } from '../../utils/project-files.js';
import { safeReadFile } from '../../utils/safe-fs.js';
import { collectFiles } from '../../utils/fs.js';
import { getIgnorePatterns } from '../../utils/ignore-patterns.js';
import { AnalyzeCodeOptions, AnalyzeResult, OpenAIError } from './types.js';

interface ParsedIssue {
  number: number;
  title: string;
  body: string;
  labels: string[];
}

export async function handleAnalyzeCode(options: AnalyzeCodeOptions): Promise<AnalyzeResult> {
  try {
    // Проверяем, что путь абсолютный
    if (!path.isAbsolute(options.input)) {
      throw new Error(`Code path must be absolute. Got: ${options.input}`);
    }

    console.error('=== Code Analyzer Debug ===');
    console.error('Starting code collection...');

    // Собираем код напрямую
    const ignorePatterns = await getIgnorePatterns(options.outputPath);
    const files = await collectFiles(options.input, ignorePatterns);

    if (files.length === 0) {
      throw new Error('No files found matching the criteria');
    }

    // Создаем markdown файл
    const inputName = path.basename(options.input).toUpperCase();
    const fileName = `PROMPT_ANALYZE_${inputName}.md`;
    const outputPath = path.join(options.outputPath, fileName);

    // Генерируем markdown
    const analysisPrompt = await getCodeAnalysisPrompt();
    let markdown = analysisPrompt + '\n\n';

    // Добавляем PROJECT_SUMMARY.md если есть
    const projectSummaryPath = path.join(path.dirname(options.outputPath), 'PROJECT_SUMMARY.md');
    try {
      const projectSummary = await safeReadFile(projectSummaryPath);
      markdown += `\n# Project Summary\n\n${projectSummary}\n\n---\n`;
    } catch (error) {
      logger.debug('PROJECT_SUMMARY.md not found, skipping...');
    }

    markdown += `\n# Code Collection: ${path.basename(options.input)}\n\n`;
    markdown += `Source: ${options.input}\n\n`;

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

    // Сохраняем markdown
    await createAnalysisFile(fileName, markdown, options.outputPath);

    const codeContent = await safeReadFile(outputPath);

    // Проверяем размер кода
    const enc = encoding_for_model('gpt-4');
    const tokens = enc.encode(codeContent);
    const tokenCount = tokens.length;
    enc.free();

    if (tokenCount > config.openai.maxTokens) {
      throw new OpenAIError(
        `Code is too large: ${tokenCount} tokens (maximum is ${config.openai.maxTokens} tokens). ` +
          'Please analyze a smaller codebase or split the analysis into multiple parts.'
      );
    }

    // Проверяем наличие OpenAI API ключа
    if (!process.env.OPENAI_API_KEY) {
      throw new OpenAIError(
        'OpenAI API key is not found. To fix this:\n\n' +
          '1. Get your API key from https://platform.openai.com/api-keys\n' +
          '2. Add it to MCP settings in one of these files:\n' +
          '   - VSCode: ~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json\n' +
          '   - Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json\n\n' +
          'Add this to the "env" section of the local-mcp-neurolora configuration:\n' +
          '{\n' +
          '  "mcpServers": {\n' +
          '    "local-mcp-neurolora": {\n' +
          '      "env": {\n' +
          '        "OPENAI_API_KEY": "your-api-key-here"\n' +
          '      }\n' +
          '    }\n' +
          '  }\n' +
          '}'
      );
    }

    // Анализируем код
    logger.startAnalysis({ component: 'OpenAI', input: options.input });
    const progress = new ProgressTracker(20, { prefix: '[OpenAI Analysis]' });
    progress.start();

    const fullPrompt = analysisPrompt.replace(
      'Code to analyze:\n---',
      `Code to analyze:\n---\n${codeContent}`
    );

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
    });

    logger.debug('OpenAI client initialized', {
      component: 'OpenAI',
      config: {
        model: config.openai.model,
        timeout: config.openai.requestTimeout,
        baseURL: 'https://api.openai.com/v1',
      },
    });

    let openaiResponse;
    try {
      logger.debug('Sending request to OpenAI API', {
        component: 'OpenAI',
        model: config.openai.model,
        keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10),
      });

      openaiResponse = await openai.chat.completions.create(
        {
          model: config.openai.model,
          messages: [{ role: 'user', content: fullPrompt }],
        },
        {
          timeout: config.openai.requestTimeout,
        }
      );

      logger.debug('OpenAI API response received', { component: 'OpenAI' });

      const content = openaiResponse?.choices[0]?.message?.content;
      if (!content) {
        throw new OpenAIError('No response content received from OpenAI');
      }

      await progress.stop('Analysis completed');
      logger.analysisComplete();
    } catch (error) {
      await progress.stop('Analysis failed');
      logger.analysisFailed(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }

    // Парсим ответ для GitHub issues
    const blocks = openaiResponse.choices[0].message?.content?.split('\n---\n\n') || [];
    const issues = blocks
      .filter((block: string) => {
        const lines = block.trim().split('\n');
        return lines[0].match(/^\d+\.\s*\[\s*\]\s*ISSUE\s+[A-Z]+:/i);
      })
      .map((block: string) => {
        const lines = block.trim().split('\n');
        const firstLine = lines[0];
        const headerMatch = firstLine.match(/^(\d+)\.\s*\[\s*\]\s*ISSUE\s+([A-Z]+):\s*(.+)$/i);
        if (!headerMatch) return null;
        const [, number, severity, shortTitle] = headerMatch;

        const titleLine = lines.find((line: string) => line.startsWith('Title:'));
        const labelsLine = lines.find((line: string) => line.startsWith('Labels:'));

        const title = titleLine ? titleLine.replace('Title:', '').trim() : shortTitle;
        const labels = labelsLine
          ? labelsLine
              .replace('Labels:', '')
              .trim()
              .split(',')
              .map((l: string) => l.trim())
          : [];

        labels.unshift(severity.toLowerCase());

        return {
          number: parseInt(number),
          title,
          body: block.trim(),
          labels,
        };
      })
      .filter((issue: ParsedIssue | null): issue is ParsedIssue => issue !== null);

    // Сохраняем результаты
    const analysisText = `Recommended Fixes and Improvements\n\n${openaiResponse.choices[0].message?.content}`;
    await createAnalysisFile('LAST_RESPONSE_OPENAI.txt', analysisText, options.outputPath);
    logger.info('Analysis response written', { component: 'FileSystem', path: options.outputPath });

    const issuesData = {
      filePath: outputPath,
      tokenCount,
      issues,
    };

    const lastResponseJsonPath = await createAnalysisFile(
      'LAST_RESPONSE_OPENAI_GITHUB_FORMAT.json',
      JSON.stringify(issuesData, null, 2),
      options.outputPath
    );
    logger.info('GitHub issues data written', {
      component: 'FileSystem',
      path: lastResponseJsonPath,
    });

    // Формируем команду для открытия директории
    let openCommand = '';
    if (process.platform === 'darwin') {
      openCommand = `open "${options.outputPath}"`;
    } else if (process.platform === 'win32') {
      openCommand = `explorer "${options.outputPath}"`;
    } else {
      openCommand = `xdg-open "${options.outputPath}"`;
    }

    // Выводим результаты
    logger.info('Files created:', {
      component: 'FileSystem',
      files: {
        analysis: path.join(options.outputPath, 'LAST_RESPONSE_OPENAI.txt'),
        githubIssues: lastResponseJsonPath,
        prompt: outputPath,
      },
    });

    if (issues.length > 0) {
      logger.info(`Found ${issues.length} issues:`, {
        component: 'Analysis',
        issues: issues.map(issue => ({
          number: issue.number,
          title: issue.title,
        })),
      });
    }

    return {
      type: 'analyze',
      mdFilePath: outputPath,
      tokenCount,
      issues: issues.map(issue => ({
        title: `[#${issue.number}] ${issue.title}`,
        body: `Issue #${issue.number}\n\n${issue.body}`,
        labels: issue.labels,
      })),
      files: {
        analysis: path.join(options.outputPath, 'LAST_RESPONSE_OPENAI.txt'),
        json: lastResponseJsonPath,
        prompt: outputPath,
        openCommand,
      },
    };
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error;
    }
    throw new Error(`Failed to process code: ${(error as Error).message}`);
  }
}
