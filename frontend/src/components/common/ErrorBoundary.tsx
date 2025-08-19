// components/common/ErrorBoundary.tsx
import React from "react";
import { isRouteErrorResponse, useRouteError, Link, useNavigate, useLocation } from "react-router-dom";

// type ErrorBoundaryProps = {
//   fallback?: React.ReactNode;
//   children?: React.ReactNode;
// };

// Class-based boundary for render errors
export class ErrorBoundary extends React.Component<
  { fallback?: React.ReactNode; children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    // Log to monitoring service if needed
    // e.g., Sentry.captureException(error)
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-6 text-center">
            <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
            <p className="text-sm text-gray-600 mt-2">
              An unexpected error occurred while rendering this page.
            </p>
            <div className="mt-4 flex gap-3 justify-center">
              <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-orange-600 text-white">
                Reload
              </button>
              <Link to="/" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">
                Go Home
              </Link>
            </div>
            <details className="mt-4 text-left text-xs text-gray-500 whitespace-pre-wrap">
              {String(this.state.error)}
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Route-level error UI for loaders/actions and route errors
export function RouteErrorElement() {
  const err = useRouteError();
  const navigate = useNavigate();
  const location = useLocation();

  let title = "Something went wrong";
  let message = "An unexpected error occurred.";
  let code: number | undefined;

  if (isRouteErrorResponse(err)) {
    code = err.status;
    title = `${err.status} ${err.statusText}`;
    message = (err.data as any)?.message ?? message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-gray-200 rounded-xl p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-600 mt-2">{message}</p>
        {code && <p className="text-xs text-gray-500 mt-1">Error code: {code}</p>}
        <div className="mt-4 flex gap-3 justify-center">
          <button onClick={() => navigate(0)} className="px-4 py-2 rounded-lg bg-orange-600 text-white">
            Try Again
          </button>
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg border border-gray-300">
            Go Back
          </button>
          <Link to="/" className="px-4 py-2 rounded-lg border border-gray-300">
            Home
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4 break-all">
          Path: {location.pathname}
        </p>
      </div>
    </div>
  );
}
