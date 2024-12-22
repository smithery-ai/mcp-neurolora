# Testing Documentation

## Directory Structure

```
test/
├── __mocks__/           # Mock implementations
│   └── external-services.ts  # Mocks for external services
├── __fixtures__/        # Test data and fixtures
├── unit/               # Unit tests
│   ├── tools/          # Tests for individual tools
│   │   ├── code-collector.test.ts
│   │   └── code-analyzer.test.ts
│   ├── utils/          # Tests for utility functions
│   │   ├── path-validator.test.ts
│   │   └── progress-tracker.test.ts
│   └── validators/     # Tests for validators
├── integration/        # Integration tests
│   ├── tools/          # Tool integration tests
│   └── api/            # API integration tests
├── e2e/                # End-to-end tests
├── helpers/            # Test helper functions
│   └── test-utils.ts   # Common test utilities
└── setup/              # Test setup files
    └── setup.ts        # Jest setup configuration
```

## Основные принципы тестирования

1. **Изоляция тестов**

   - Каждый тест должен быть независимым
   - Использовать моки для внешних зависимостей
   - Очищать состояние между тестами

2. **Структура тестов**

   ```typescript
   describe('Компонент', () => {
     beforeEach(() => {
       // Подготовка
     });

     afterEach(() => {
       // Очистка
     });

     it('должен делать что-то конкретное', () => {
       // Arrange
       const input = setupTest();

       // Act
       const result = functionUnderTest(input);

       // Assert
       expect(result).toBe(expectedValue);
     });
   });
   ```

3. **Моки и заглушки**

   - Использовать `__mocks__` для внешних модулей
   - Сбрасывать состояние моков в `beforeEach`
   - Проверять вызовы моков в тестах

4. **Асинхронное тестирование**
   ```typescript
   it('должен обрабатывать асинхронные операции', async () => {
     const result = await asyncFunction();
     expect(result).toBeDefined();
   });
   ```

## Запуск тестов

```bash
# Запуск всех тестов
npm test

# Запуск конкретного типа тестов
npm run test:unit
npm run test:integration
npm run test:e2e

# Запуск с покрытием
npm run test:coverage

# Режим наблюдения
npm run test:watch
```

## Отчеты и покрытие

- HTML отчеты: `test-report/index.html`
- Отчеты о покрытии: `test-report/coverage/`
- JUnit отчеты: `test-report/junit.xml`

### Требования к покрытию

- Операторы: 80%
- Ветви: 80%
- Функции: 80%
- Строки: 80%

## Утилиты для тестирования

### TestContext

```typescript
import { TestContext } from '../helpers/test-utils';

describe('Test Suite', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = new TestContext();
    await context.setup();
  });

  afterAll(async () => {
    await context.cleanup();
  });
});
```

### Моки внешних сервисов

```typescript
import { mockFs, mockGitHub, mockProgressTracker } from '../__mocks__/external-services';

jest.mock('fs/promises', () => mockFs.promises);
```

## Отладка тестов

1. Запуск в режиме отладки

   ```bash
   node --inspect-brk node_modules/.bin/jest --runInBand
   ```

2. Использование консоли

   ```typescript
   console.log('Debug:', value);
   ```

3. Снапшот-тестирование
   ```typescript
   expect(result).toMatchSnapshot();
   ```

## Лучшие практики

1. **Именование тестов**

   - Понятные и описательные имена
   - Использовать шаблон "должен делать что-то"
   - Группировать связанные тесты

2. **Организация файлов**

   - Один тестовый файл на модуль
   - Соответствие структуре исходного кода
   - Четкая иерархия директорий

3. **Проверки**

   - Проверять граничные случаи
   - Тестировать обработку ошибок
   - Использовать подходящие матчеры

4. **Производительность**
   - Оптимизировать медленные тесты
   - Использовать фильтрацию тестов
   - Мониторить время выполнения

## Поддержка тестов

1. **Регулярный обзор**

   - Проверка покрытия
   - Обновление устаревших тестов
   - Удаление неактуальных тестов

2. **Документация**

   - Поддерживать README в актуальном состоянии
   - Документировать новые паттерны
   - Обновлять примеры

3. **Непрерывная интеграция**
   - Запуск тестов при каждом PR
   - Генерация отчетов
   - Автоматические уведомления

## Специфичные моменты

1. **Тестирование MCP инструментов**

   - Моки для MCP серверов
   - Проверка форматов запросов/ответов
   - Тестирование обработки ошибок

2. **Файловые операции**

   - Использование временных директорий
   - Очистка после тестов
   - Моки для файловой системы

3. **Асинхронные операции**
   - Правильная обработка промисов
   - Тестирование таймаутов
   - Проверка состояний загрузки
