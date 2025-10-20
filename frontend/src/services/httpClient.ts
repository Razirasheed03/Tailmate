import axios, {type AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL, AUTH_ROUTES } from '@/constants/apiRoutes';
import { toast } from 'sonner'; 

const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000, // 10 sec
});

// Refresh token queue management
let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

// Request interceptorr
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config;

    // Handleing different types of errors
    if (error.response) {
      const { status } = error.response;
      
      switch (status) {
        case 400:
          handleBadRequest(error);
          break;
        case 401:
          return handleUnauthorized(error, original);
        case 403:
          handleForbidden(error);
          break;
        case 404:
          handleNotFound(error);
          break;
        case 422:
          handleValidationError(error);
          break;
        case 429:
          handleRateLimit(error);
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          handleServerError(error);
          break;
        default:
          handleGenericError(error);
      }
    } else if (error.request) {
      // Network error - no response received
      handleNetworkError(error);
    } else {
      // Something else happened
      handleRequestError(error);
    }

    return Promise.reject(error);
  }
);

// Error handling functions
const handleBadRequest = (error: AxiosError) => {
  const message = getErrorMessage(error) || 'Invalid request. Please check your data.';
  toast.error(message);
  console.error('Bad Request (400):', error);
};

const handleUnauthorized = async (error: AxiosError, original: any) => {
  if (!original._retry) {
    original._retry = true;
    if (isRefreshing) {
      await new Promise<void>((resolve) => refreshQueue.push(resolve));
      return httpClient.request(original);
    }

    try {
      isRefreshing = true;

      const refreshResponse = await axios.post(
        AUTH_ROUTES.REFRESH,
        {},
        { withCredentials: true }
      );
      
      const newAccessToken = refreshResponse?.data?.accessToken;
      
      if (newAccessToken) {
        localStorage.setItem('auth_token', newAccessToken);
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Process queued requests
        refreshQueue.forEach((resolve) => resolve());
        refreshQueue = [];
        
        return httpClient.request(original);
      }
    } catch (refreshError) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      toast.error('Session expired. Please login again.');

      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } finally {
      isRefreshing = false;
    }
  }

  return Promise.reject(error);
};

const handleForbidden = (error: AxiosError) => {
  const message = 'You do not have permission to perform this action.';
  toast.error(message);
  console.error('Forbidden (403):', error);
};

const handleNotFound = (error: AxiosError) => {
  const message = 'The requested resource was not found.';
  toast.error(message);
  console.error('Not Found (404):', error);
};

const handleValidationError = (error: AxiosError) => {
  const message = getErrorMessage(error) || 'Validation failed. Please check your input.';
  toast.error(message);
  console.error('Validation Error (422):', error);
};

const handleRateLimit = (error: AxiosError) => {
  const message = 'Too many requests. Please try again later.';
  toast.error(message);
  console.error('Rate Limited (429):', error);
};

const handleServerError = (error: AxiosError) => {
  const message = 'Server error. Please try again later.';
  toast.error(message);
  console.error('Server Error (5xx):', error);
};

const handleNetworkError = (error: AxiosError) => {
  const message = 'Network error. Please check your internet connection.';
  toast.error(message);
  console.error('Network Error:', error);
};

const handleRequestError = (error: AxiosError) => {
  const message = 'Request failed. Please try again.';
  toast.error(message);
  console.error('Request Error:', error);
};

const handleGenericError = (error: AxiosError) => {
  const message = getErrorMessage(error) || 'An unexpected error occurred.';
  toast.error(message);
  console.error('Generic Error:', error);
};

// Helper function to extract error message from response
const getErrorMessage = (error: AxiosError): string | null => {
  if (error.response?.data) {
    const data = error.response.data as any;
    
    // Try different common error message fields
    return (
      data.message ||
      data.error ||
      data.details ||
      data.msg ||
      null
    );
  }
  
  return error.message || null;
};

// Helper function to check if we're in development
const isDevelopment = (): boolean => {
  return import.meta.env.MODE === 'development';
};

// Optional: Add request/response logging in development
if (isDevelopment()) {
  httpClient.interceptors.request.use(
    (config) => {
      return config;
    }
  );

  httpClient.interceptors.response.use(
    (response) => {
      return response;
    }
  );
}

export default httpClient;
