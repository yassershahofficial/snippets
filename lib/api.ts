// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// Generic Fetcher Function
export async function fetcher<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `HTTP error! status: ${response.status}`,
      status: response.status,
    };

    try {
      const errorData = await response.json();
      if (errorData.error) {
        error.message = errorData.error;
      }
      if (errorData.errors) {
        error.errors = errorData.errors;
      }
    } catch {
      // If response is not JSON, use status text
      error.message = response.statusText || error.message;
    }

    throw error;
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return {} as T;
  }

  return response.json();
}

// Type-safe API Client
export const api = {
  // GET request
  get: <T = unknown>(url: string, options?: RequestInit): Promise<T> => {
    return fetcher<T>(url, {
      ...options,
      method: "GET",
    });
  },

  // POST request
  post: <T = unknown>(
    url: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> => {
    return fetcher<T>(url, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PUT request
  put: <T = unknown>(
    url: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> => {
    return fetcher<T>(url, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PATCH request
  patch: <T = unknown>(
    url: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> => {
    return fetcher<T>(url, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // DELETE request
  delete: <T = unknown>(url: string, options?: RequestInit): Promise<T> => {
    return fetcher<T>(url, {
      ...options,
      method: "DELETE",
    });
  },
};

// Error handling utility
export function handleApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return error as ApiError;
  }

  return {
    message: "An unknown error occurred",
  };
}

// Response wrapper for API routes
export function createApiResponse<T>(
  data?: T,
  error?: string,
  message?: string
): ApiResponse<T> {
  if (error) {
    return { error, message };
  }
  return { data, message };
}
