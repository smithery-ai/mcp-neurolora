import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import path from 'path';
import { encoding_for_model } from 'tiktoken';
import { CODE_ANALYSIS_PROMPT } from '../../prompts/index.js';
import { clearProgress, showProgress } from '../../utils/progress.js';
import { createAnalysisFile, createCodeCollectionFile } from '../../utils/project-files.js';
import { safeReadFile } from '../../utils/safe-fs.js';
import { handleCollectCode } from '../code-collector/handler.js';
import { AnalyzeCodeOptions, AnalyzeResult, OpenAIError } from './types.js';

const MAX_TOKENS = 190000;

// Точный подсчет токенов с помощью tiktoken
function estimateTokenCount(text: string): number {
  try {
    // Используем тот же энкодер, что и модель o1-preview
    const enc = encoding_for_model('gpt-4');
    const tokens = enc.encode(text);
    enc.free(); // Освобождаем ресурсы
    return tokens.length;
  } catch (error) {
    console.warn('Failed to use tiktoken, falling back to approximate count:', error);
    // Запасной вариант: примерно 4 символа на токен
    return Math.ceil(text.length / 4);
  }
}

// Проверка размера кода
function checkCodeSize(codeContent: string): { isValid: boolean; tokenCount: number } {
  const tokenCount = estimateTokenCount(codeContent);
  return {
    isValid: tokenCount <= MAX_TOKENS,
    tokenCount,
  };
}

// Анализ кода с помощью OpenAI
async function analyzeWithOpenAI(
  openai: OpenAI,
  codeContent: string,
  codePath: string,
  tokenCount: number
): Promise<AnalyzeResult> {
  try {
    if (tokenCount > MAX_TOKENS) {
      throw new OpenAIError(
        `Code is too large: ${tokenCount} tokens (maximum is ${MAX_TOKENS} tokens). ` +
          'Please analyze a smaller codebase or split the analysis into multiple parts.'
      );
    }

    const fullPrompt = CODE_ANALYSIS_PROMPT.replace(
      'Code to analyze:\n---',
      `Code to analyze:\n---\n${codeContent}`
    );
    const messages: ChatCompletionMessageParam[] = [{ role: 'user', content: fullPrompt }];

    // Создаем файлы анализа
    const lastResponseJsonPath = await createAnalysisFile(
      'LAST_RESPONSE_OPENAI_GITHUB_FORMAT.json',
      ''
    );
    console.log('\nAnalyzing code...\n');

    // Показываем прогресс анализа
    const totalSteps = 20; // 20 шагов за 2 минуты
    const startTime = Date.now();
    const progressInterval = setInterval(async () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const step = Math.min(totalSteps, Math.floor((elapsedSeconds / 120) * totalSteps));
      const percentage = Math.round((step / totalSteps) * 100);
      await showProgress(percentage, { width: 20, prefix: '[OpenAI Analysis]' });
    }, 1000);

    try {
      const response = await openai.chat.completions.create(
        {
          model: 'o1-preview',
          messages,
        },
        {
          timeout: 5 * 60 * 1000, // 5 минут
        }
      );
      clearInterval(progressInterval);

      const totalTime = Math.floor((Date.now() - startTime) / 1000);
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new OpenAIError('No response from OpenAI');
      }

      // Сохраняем результат анализа
      let analysisText = `Recommended Fixes and Improvements\n\n`;
      analysisText += content;
      await clearProgress(analysisText);

      // Сохраняем JSON для GitHub issues
      console.log('\nWriting JSON response...');
      // Парсим ответ от OpenAI
      const blocks = content.split('\n---\n\n');
      interface ParsedIssue {
        number: number;
        title: string;
        body: string;
        labels: string[];
      }

      const issues: ParsedIssue[] = blocks
        .filter(block => {
          const lines = block.trim().split('\n');
          return lines[0].match(/^\d+\.\s*\[\s*\]\s*ISSUE\s+[A-Z]+:/i);
        })
        .map(block => {
          const lines = block.trim().split('\n');

          // Парсим первую строку (номер, severity и краткий заголовок)
          const firstLine = lines[0];
          const headerMatch = firstLine.match(/^(\d+)\.\s*\[\s*\]\s*ISSUE\s+([A-Z]+):\s*(.+)$/i);
          if (!headerMatch) return null;
          const [, number, severity, shortTitle] = headerMatch;

          // Находим основные секции
          const titleLine = lines.find(line => line.startsWith('Title:'));
          const labelsLine = lines.find(line => line.startsWith('Labels:'));

          // Извлекаем значения
          const title = titleLine ? titleLine.replace('Title:', '').trim() : shortTitle;
          const labels = labelsLine
            ? labelsLine
                .replace('Labels:', '')
                .trim()
                .split(',')
                .map(l => l.trim())
            : [];

          // Добавляем severity как метку
          labels.unshift(severity.toLowerCase());

          return {
            number: parseInt(number),
            title,
            body: block.trim(),
            labels,
          };
        })
        .filter((issue): issue is ParsedIssue => issue !== null);

      const issuesData = {
        filePath: codePath,
        tokenCount,
        issues,
      };

      // Сохраняем результат анализа в текстовом формате
      await createAnalysisFile('LAST_RESPONSE_OPENAI.txt', analysisText);
      console.log('✅ Analysis response written');

      // Сохраняем данные для GitHub
      await createAnalysisFile(
        'LAST_RESPONSE_OPENAI_GITHUB_FORMAT.json',
        JSON.stringify(issuesData, null, 2)
      );
      console.log('✅ GitHub issues data written');

      // Формируем команду для открытия директории в зависимости от ОС
      const analysisDir = process.cwd();
      let openCommand = '';
      if (process.platform === 'darwin') {
        openCommand = `open "${analysisDir}"`;
      } else if (process.platform === 'win32') {
        openCommand = `explorer "${analysisDir}"`;
      } else {
        openCommand = `xdg-open "${analysisDir}"`;
      }

      // Показываем пути к файлам
      console.log('\nFiles created:');
      console.log('Analysis files:');
      console.log(`- Analysis: ${path.join(analysisDir, 'LAST_RESPONSE_OPENAI.txt')}`);
      console.log(`- GitHub Issues: ${lastResponseJsonPath}`);
      console.log('\nCollected code:');
      console.log(`- Prompt: ${codePath}`);

      // Возвращаем результат в формате AnalyzeResult
      const analysisResult: AnalyzeResult = {
        type: 'analyze',
        mdFilePath: codePath,
        tokenCount,
        issues: issuesData.issues.map(issue => ({
          title: `[#${issue.number}] ${issue.title}`,
          body: `Issue #${issue.number}\n\n${issue.body}`,
          labels: issue.labels,
        })),
        files: {
          analysis: path.join(analysisDir, 'LAST_RESPONSE_OPENAI.txt'),
          json: lastResponseJsonPath,
          prompt: codePath,
          openCommand,
        },
      };

      // Выводим в MCP только если есть issues
      if (issuesData.issues.length > 0) {
        console.log('\nIssues found:');
        issuesData.issues.forEach(issue => {
          console.log(`[#${issue.number}] ${issue.title}`);
        });
      }

      return analysisResult;
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error;
    }
    throw new OpenAIError(`Failed to analyze code: ${(error as Error).message}`);
  }
}

async function getCodeContent(codePath: string): Promise<{ content: string; mdPath: string }> {
  try {
    // Если это уже markdown файл, используем его напрямую
    if (codePath.endsWith('.md')) {
      const content = await safeReadFile(codePath);
      return { content, mdPath: codePath };
    }

    // Иначе запускаем code_collector с сохранением в корень проекта
    const outputPath = await createCodeCollectionFile(codePath, '');
    const result = await handleCollectCode({
      input: codePath,
      outputPath,
    });

    // Получаем путь к созданному файлу из результата
    const match = result.match(/Output saved to: (.+)$/);
    if (!match) {
      throw new Error('Failed to get output file path from collect_code result');
    }

    const fullCodePath = match[1];
    const content = await safeReadFile(fullCodePath);
    return { content, mdPath: fullCodePath };
  } catch (error) {
    throw new Error(`Failed to read code: ${(error as Error).message}`);
  }
}

export async function handleAnalyzeCode(options: AnalyzeCodeOptions): Promise<AnalyzeResult> {
  try {
    // Проверяем, что путь абсолютный
    if (!path.isAbsolute(options.codePath)) {
      throw new Error(`Code path must be absolute. Got: ${options.codePath}`);
    }

    const { content: codeContent, mdPath } = await getCodeContent(options.codePath);
    const { tokenCount } = checkCodeSize(codeContent);

    // Проверяем наличие OpenAI API ключа в настройках
    if (!process.env.OPENAI_API_KEY) {
      throw new OpenAIError(
        'OpenAI API key is not found in MCP settings. Analysis cannot be performed.'
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const analysis = await analyzeWithOpenAI(openai, codeContent, mdPath, tokenCount);

    return analysis;
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error;
    }
    throw new Error(`Failed to process code: ${(error as Error).message}`);
  }
}
