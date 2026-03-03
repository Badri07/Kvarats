// error.interceptor.ts
import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorService } from '../service/Global-Error-Handling/Error.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
 const errorService = inject(ErrorService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('Error interceptor caught error:', {
        url: req.url,
        status: error.status,
        method: req.method,
        error: error.message
      });

      // Handle client-side or network errors
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorService.showError(`Client error: ${error.error.message}`, req.url, 0);
      } else {
        // Server-side error
        const errorMsg = getErrorMessage(error);
        
        // Show modal for user-facing errors (4xx clients errors)
        // PASS THE STATUS CODE HERE ↓
        if (error.status >= 400 && error.status < 500 && !shouldIgnoreError(req)) {
          errorService.showError(errorMsg, req.url, error.status);
        }
        
        // You can add additional handling for specific status codes
        switch (error.status) {
          case 0:
            console.error('Network error - possibly CORS or server down');
            break;
          case 403:
            console.error('Forbidden - insufficient permissions');
            // Make sure to pass status for 403 errors too ↓
            if (!shouldIgnoreError(req)) {
              errorService.showError(errorMsg, req.url, error.status);
            }
            break;
          case 429:
            console.error('Too many requests - rate limiting');
            break;
          case 500:
            console.error('Internal server error');
            break;
          case 502:
          case 503:
          case 504:
            console.error('Server unavailable');
            break;
        }
      }

      // Re-throw the error for other interceptors or component-level handling
      return throwError(() => error);
    })
  );
};

// Helper function to extract meaningful error messages
function getErrorMessage(error: HttpErrorResponse): string {
  // Try to get message from error response body
  if (error.error?.message) {
    return error.error.message;
  }
  
  if (typeof error.error === 'string') {
    return error.error;
  }

  // Default messages based on status code
  switch (error.status) {
    case 0:
      return 'Network error - Please check your internet connection';
    case 400:
      return 'Bad request - Please check your input';
    case 401:
      return 'Unauthorized - Please login again';
    case 403:
      return 'Forbidden - You don\'t have permission to access this resource';
    case 404:
      return 'Resource not found';
    case 409:
      return 'Conflict - This resource already exists';
    case 422:
      return 'Validation error - Please check your data';
    case 429:
      return 'Too many requests - Please try again later';
    case 500:
      return 'Internal server error - Please try again later';
    case 502:
      return 'Bad gateway - Service temporarily unavailable';
    case 503:
      return 'Service unavailable - Please try again later';
    case 504:
      return 'Gateway timeout - Please try again later';
    default:
      return `An unexpected error occurred (${error.status})`;
  }
}

// Helper function to ignore certain errors that shouldn't show modal
function shouldIgnoreError(req: any): boolean {
  const ignorePatterns = [
    // Add URLs or patterns that should not trigger error modal
    '/api/health-check',
    '/api/silent-refresh',
    // Login errors are typically handled in login component
    '/login',
    '/auth/login'
  ];

  return ignorePatterns.some(pattern => req.url.includes(pattern));
}