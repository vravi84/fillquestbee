/**
 * Centralized Error Parsing and Translation Utility
 * Handles Firebase Auth codes, Firestore error codes, HTTP status codes,
 * and server API error objects, mapping them into user-friendly messages.
 */

export interface AppError {
  title: string;
  message: string;
  code?: string;
  actionHint?: string;
  actionLabel?: string;
  actionUrl?: string;
  retryable?: boolean;
  variant?: 'error' | 'warning' | 'info';
}

/**
 * Maps Firebase Auth error codes to user-friendly messages and titles
 */
const FIREBASE_AUTH_ERRORS: Record<string, Partial<AppError>> = {
  'auth/email-already-in-use': {
    title: 'Account Already Exists',
    message: 'An account with this email address is already registered.',
    actionHint: 'If this is your account, try signing in instead of registering.',
    actionLabel: 'Log In Now',
    actionUrl: '/teacher/login',
    variant: 'warning',
  },
  'auth/wrong-password': {
    title: 'Incorrect Password',
    message: 'The password you entered is incorrect.',
    actionHint: 'Please check for typos or capslock, and try again.',
    retryable: true,
  },
  'auth/invalid-credential': {
    title: 'Invalid Credentials',
    message: 'The email or password provided is incorrect.',
    actionHint: 'Please double-check your sign-in details and try again.',
    retryable: true,
  },
  'auth/user-not-found': {
    title: 'Account Not Found',
    message: 'No account was found matching this email address.',
    actionHint: 'Verify the email address or register a new teacher account.',
    actionLabel: 'Register Account',
    actionUrl: '/teacher/register',
    variant: 'warning',
  },
  'auth/invalid-email': {
    title: 'Invalid Email Format',
    message: 'The email address provided does not appear to be valid.',
    actionHint: 'Please enter a valid email address (e.g. name@school.edu).',
    retryable: true,
  },
  'auth/weak-password': {
    title: 'Weak Password',
    message: 'The chosen password does not meet security requirements.',
    actionHint: 'Please use at least 6 characters with a combination of letters and numbers.',
    retryable: true,
  },
  'auth/too-many-requests': {
    title: 'Too Many Attempts',
    message: 'Access to this account has been temporarily disabled due to many failed sign-in attempts.',
    actionHint: 'Please wait a few minutes before trying again.',
    variant: 'warning',
  },
  'auth/popup-closed-by-user': {
    title: 'Sign-in Cancelled',
    message: 'The Google authentication pop-up window was closed before completing.',
    actionHint: 'Click "Continue with Google" again to complete sign-in.',
    retryable: true,
    variant: 'info',
  },
  'auth/network-request-failed': {
    title: 'Network Connection Issue',
    message: 'Unable to connect to authentication servers. Please check your internet connection.',
    actionHint: 'Verify your Wi-Fi or cellular data connection and retry.',
    retryable: true,
  },
  'auth/user-disabled': {
    title: 'Account Disabled',
    message: 'This account has been disabled by an administrator.',
    actionHint: 'Please contact support or your school administrator for assistance.',
    variant: 'error',
  },
  'auth/operation-not-allowed': {
    title: 'Sign-in Method Disabled',
    message: 'This authentication method is currently disabled.',
    actionHint: 'Please use standard email/password login or contact support.',
  },
  'auth/requires-recent-login': {
    title: 'Re-authentication Required',
    message: 'This sensitive action requires recent sign-in.',
    actionHint: 'Please log out and log back in to verify your identity.',
    variant: 'warning',
  },
};

/**
 * Maps Firestore error codes to user-friendly messages
 */
const FIRESTORE_ERRORS: Record<string, Partial<AppError>> = {
  'permission-denied': {
    title: 'Access Permission Denied',
    message: 'You do not have permission to view or modify this resource.',
    actionHint: 'Ensure you are signed in with the correct account privileges.',
  },
  'unavailable': {
    title: 'Service Temporarily Unavailable',
    message: 'Database server is currently offline or un-reachable.',
    actionHint: 'Please wait a few moments and refresh the page.',
    retryable: true,
  },
  'unauthenticated': {
    title: 'Authentication Required',
    message: 'Your session has expired or is invalid.',
    actionHint: 'Please sign in again to continue.',
    actionLabel: 'Log In',
    actionUrl: '/teacher/login',
  },
  'not-found': {
    title: 'Resource Not Found',
    message: 'The requested document or record could not be found.',
  },
  'resource-exhausted': {
    title: 'Quota Exceeded',
    message: 'Server usage limits have been temporarily exceeded.',
    actionHint: 'Please try again in a few minutes.',
  },
};

/**
 * Maps HTTP status codes to user-friendly messages
 */
const HTTP_STATUS_ERRORS: Record<number, Partial<AppError>> = {
  400: {
    title: 'Invalid Request',
    message: 'The request contains invalid data or parameters.',
    actionHint: 'Please review your input fields and try again.',
  },
  401: {
    title: 'Authentication Required',
    message: 'You must be signed in to perform this action.',
    actionLabel: 'Log In',
    actionUrl: '/teacher/login',
  },
  403: {
    title: 'Access Restricted',
    message: 'Your account does not have permission for this request.',
    actionHint: 'Teacher approval or administrator privileges may be required.',
  },
  404: {
    title: 'Page or Endpoint Not Found',
    message: 'The requested page or server endpoint does not exist.',
  },
  409: {
    title: 'Conflict Error',
    message: 'This item or record already exists.',
  },
  429: {
    title: 'Rate Limit Exceeded',
    message: 'Too many requests sent in a short period.',
    actionHint: 'Please wait a moment before sending another request.',
    retryable: true,
  },
  500: {
    title: 'Server Error',
    message: 'An unexpected internal server error occurred.',
    actionHint: 'Our system has logged this issue. Please try again shortly.',
    retryable: true,
  },
  502: {
    title: 'Bad Gateway',
    message: 'Server received an invalid response from upstream services.',
    retryable: true,
  },
  503: {
    title: 'Service Unavailable',
    message: 'The server is temporarily undergoing maintenance.',
    actionHint: 'Please try again in a few minutes.',
    retryable: true,
  },
};

/**
 * Main parser function to convert any thrown error/exception into a clean AppError
 */
export function parseServerError(error: unknown): AppError {
  if (!error) {
    return {
      title: 'Unknown Error',
      message: 'An unexpected error occurred. Please try again.',
      variant: 'error',
    };
  }

  // If already parsed AppError shape
  if (typeof error === 'object' && error !== null && 'title' in error && 'message' in error) {
    return error as AppError;
  }

  let code: string | undefined = undefined;
  let rawMessage = '';

  if (typeof error === 'string') {
    rawMessage = error;
  } else if (error instanceof Error) {
    rawMessage = error.message;
    if ('code' in error && typeof (error as any).code === 'string') {
      code = (error as any).code;
    }
  } else if (typeof error === 'object' && error !== null) {
    if ('code' in error && typeof (error as any).code === 'string') {
      code = (error as any).code;
    }
    if ('error' in error && typeof (error as any).error === 'string') {
      rawMessage = (error as any).error;
    } else if ('message' in error && typeof (error as any).message === 'string') {
      rawMessage = (error as any).message;
    }
  }

  // Extract Firebase code embedded inside string like "Firebase: Error (auth/email-already-in-use)."
  if (!code && rawMessage.includes('auth/')) {
    const match = rawMessage.match(/auth\/[a-z0-9-]+/i);
    if (match) code = match[0];
  }

  // Match against Firebase Auth mapped errors
  if (code && FIREBASE_AUTH_ERRORS[code]) {
    const mapped = FIREBASE_AUTH_ERRORS[code];
    return {
      title: mapped.title || 'Authentication Error',
      message: mapped.message || rawMessage,
      code,
      actionHint: mapped.actionHint,
      actionLabel: mapped.actionLabel,
      actionUrl: mapped.actionUrl,
      retryable: mapped.retryable ?? false,
      variant: mapped.variant || 'error',
    };
  }

  // Match against Firestore mapped errors
  if (code && FIRESTORE_ERRORS[code]) {
    const mapped = FIRESTORE_ERRORS[code];
    return {
      title: mapped.title || 'Database Error',
      message: mapped.message || rawMessage,
      code,
      actionHint: mapped.actionHint,
      actionLabel: mapped.actionLabel,
      actionUrl: mapped.actionUrl,
      retryable: mapped.retryable ?? false,
      variant: mapped.variant || 'error',
    };
  }

  // Handle access denied specific messages
  if (rawMessage.toLowerCase().includes('access denied')) {
    return {
      title: 'Access Privileges Denied',
      message: rawMessage,
      actionHint: 'Please sign in with an authorized account or contact an administrator.',
      actionLabel: 'Go to Admin Login',
      actionUrl: '/admin/login',
      variant: 'error',
    };
  }

  // Clean raw Firebase boilerplate strings from error message if any remains
  let cleanedMessage = rawMessage
    .replace(/^Firebase:\s*/i, '')
    .replace(/Error\s*\([^)]+\):?\s*/i, '')
    .trim();

  if (!cleanedMessage) {
    cleanedMessage = 'An unexpected server error occurred. Please try again.';
  }

  return {
    title: 'Notice',
    message: cleanedMessage,
    code,
    retryable: true,
    variant: 'error',
  };
}

/**
 * Helper to parse Response errors from fetch calls
 */
export async function parseFetchError(response: Response): Promise<AppError> {
  const status = response.status;
  const mappedStatus = HTTP_STATUS_ERRORS[status];

  let serverBody: any = null;
  try {
    serverBody = await response.json();
  } catch {
    // Body is not JSON
  }

  const rawMessage = serverBody?.error || serverBody?.message || response.statusText;

  if (serverBody) {
    const parsed = parseServerError(serverBody);
    if (parsed.message !== 'An unexpected error occurred. Please try again.') {
      return {
        ...parsed,
        title: mappedStatus?.title || parsed.title,
      };
    }
  }

  return {
    title: mappedStatus?.title || `Error ${status}`,
    message: rawMessage || mappedStatus?.message || `Request failed with status code ${status}.`,
    code: `HTTP_${status}`,
    actionHint: mappedStatus?.actionHint,
    actionLabel: mappedStatus?.actionLabel,
    actionUrl: mappedStatus?.actionUrl,
    retryable: mappedStatus?.retryable ?? (status >= 500),
    variant: status >= 500 ? 'error' : 'warning',
  };
}
