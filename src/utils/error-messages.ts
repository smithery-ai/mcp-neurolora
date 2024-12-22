/**
 * Safe error messages that don't expose sensitive information
 */
export const ErrorMessages = {
  // Connection errors
  CONNECTION_NOT_INITIALIZED: 'Connection manager is not initialized. Please try again.',
  CONNECTION_NOT_ESTABLISHED: 'Server connection is not established. Please wait and try again.',

  // Path errors
  INVALID_PATH: 'The provided path is not valid. Please use an absolute path.',
  PATH_NOT_ALLOWED: 'Access to the specified path is not allowed for security reasons.',
  PATH_NOT_FOUND: 'The specified path does not exist.',
  PERMISSION_DENIED: 'Permission denied. Please check your access rights.',

  // File operation errors
  NO_FILES_FOUND: 'No files found matching the specified criteria.',
  FILE_READ_ERROR:
    'Unable to read file. Please verify the file exists and you have permission to access it.',
  FILE_WRITE_ERROR:
    'Unable to write file. Please verify you have permission to write to this location.',

  // General errors
  UNEXPECTED_ERROR:
    'An unexpected error occurred. Please try again or contact support if the issue persists.',
  INVALID_ARGUMENTS:
    'Invalid arguments provided. Please check the documentation for correct usage.',

  // Helper function to get safe error message
  getSafeMessage(code: string, fallback = 'An error occurred'): string {
    return (ErrorMessages as any)[code] || fallback;
  },
} as const;

/**
 * Get a safe error message that doesn't expose sensitive information
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Map known error types to safe messages
    if (error.message.includes('ENOENT')) {
      return ErrorMessages.PATH_NOT_FOUND;
    }
    if (error.message.includes('EACCES')) {
      return ErrorMessages.PERMISSION_DENIED;
    }
    if (error.message.includes('not allowed')) {
      return ErrorMessages.PATH_NOT_ALLOWED;
    }
    // Add more mappings as needed
  }

  // Default to generic message for unknown errors
  return ErrorMessages.UNEXPECTED_ERROR;
}
