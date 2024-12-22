import { jest } from '@jest/globals';
import { isPathAllowed, validateAndNormalizePath } from '../../../src/utils/path-validator.js';
import path from 'path';

describe('Path Validator', () => {
  const baseDir = process.cwd();
  const testPaths = {
    allowed: [
      path.join(baseDir, 'src'),
      path.join(baseDir, 'test'),
      path.join(baseDir, 'package.json'),
      path.join(baseDir, '.neurolora'),
      path.join(baseDir, 'tmp'),
    ],
    notAllowed: [
      '/etc/passwd',
      '/usr/local',
      path.join(baseDir, '../private'),
      path.join(baseDir, '..', 'other-project'),
      path.join(baseDir, '../../etc/passwd'),
    ],
  };

  beforeEach(() => {
    // Mock console methods
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isPathAllowed', () => {
    it('should allow paths within project directory', () => {
      testPaths.allowed.forEach(testPath => {
        expect(isPathAllowed(testPath)).toBe(true);
        expect(console.warn).not.toHaveBeenCalled();
      });
    });

    it('should not allow paths outside project directory', () => {
      testPaths.notAllowed.forEach(testPath => {
        expect(isPathAllowed(testPath)).toBe(false);
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('Path traversal attempt detected')
        );
      });
    });

    it('should handle empty or invalid paths', () => {
      const invalidPaths = ['', ' ', null, undefined];
      invalidPaths.forEach(invalidPath => {
        expect(isPathAllowed(invalidPath as any)).toBe(false);
      });
    });

    it('should handle paths with invalid characters', () => {
      const invalidPaths = [
        path.join(baseDir, 'test<file'),
        path.join(baseDir, 'test>file'),
        path.join(baseDir, 'test:file'),
        path.join(baseDir, 'test"file'),
        path.join(baseDir, 'test|file'),
        path.join(baseDir, 'test?file'),
        path.join(baseDir, 'test*file'),
      ];
      invalidPaths.forEach(invalidPath => {
        expect(isPathAllowed(invalidPath)).toBe(false);
      });
    });

    it('should handle paths with URL-like characters', () => {
      const urlPaths = [
        path.join(baseDir, 'file?query=value'),
        path.join(baseDir, 'file#fragment'),
        path.join(baseDir, 'file?'),
        path.join(baseDir, 'file#'),
      ];
      urlPaths.forEach(urlPath => {
        expect(isPathAllowed(urlPath)).toBe(false);
      });
    });

    it('should handle error cases gracefully', () => {
      // Mock path.resolve to throw an error
      const originalResolve = path.resolve;
      (path.resolve as jest.Mock) = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      expect(isPathAllowed('some/path')).toBe(false);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error validating path'));

      // Restore original function
      path.resolve = originalResolve;
    });
  });

  describe('validateAndNormalizePath', () => {
    it('should normalize valid paths', () => {
      const testPath = path.join(baseDir, 'src', '..', 'src', 'utils');
      const normalized = validateAndNormalizePath(testPath);
      expect(normalized).toBe(path.resolve(baseDir, 'src', 'utils'));
    });

    it('should throw error for invalid paths', () => {
      const invalidPaths = [
        '',
        ' ',
        null,
        undefined,
        path.join(baseDir, 'test<file'),
        path.join(baseDir, '../private'),
        '/etc/passwd',
      ];

      invalidPaths.forEach(invalidPath => {
        expect(() => validateAndNormalizePath(invalidPath as any)).toThrow();
      });
    });

    it('should throw error for paths with URL characters', () => {
      const urlPaths = [
        path.join(baseDir, 'file?query=value'),
        path.join(baseDir, 'file#fragment'),
      ];

      urlPaths.forEach(urlPath => {
        expect(() => validateAndNormalizePath(urlPath)).toThrow('Invalid path format');
      });
    });

    it('should throw error for paths outside project directory', () => {
      testPaths.notAllowed.forEach(testPath => {
        expect(() => validateAndNormalizePath(testPath)).toThrow('Access to path');
      });
    });

    it('should handle error cases with appropriate messages', () => {
      // Test invalid path format
      expect(() => validateAndNormalizePath('')).toThrow('Invalid path format');

      // Test security restriction
      expect(() => validateAndNormalizePath('/etc/passwd')).toThrow('Access to path');
    });
  });
});
