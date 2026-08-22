
import { AttendXLogo } from "@/components/brand/logo";

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;

  let errorMessage: string | null = null;
  if (error === "oauth_denied") {
    errorMessage = "Google sign-in was cancelled or denied.";
  } else if (error === "invalid_state") {
    errorMessage = "Session expired or invalid security state. Please try again.";
  } else if (error === "forbidden" || error === "unauthorized") {
    errorMessage = "Access restricted. You do not have permission to view that resource.";
  } else if (error === "auth_failed") {
    errorMessage = "Authentication failed. Please check your network and try again.";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <AttendXLogo
              variant="stacked"
              showTagline
              markSize="w-16 h-16"
              textSize="text-2xl"
              taglineSize="text-[9px]"
            />
          </div>
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            JSPM University Pune • School of E&amp;CS
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <span className="font-semibold">Notice:</span> {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          <p className="text-xs text-slate-500 text-center leading-relaxed">
            AttendX is an authorized academic attendance and timetable system. Sign in with your registered Google Account to continue.
          </p>

          <a
            href="/api/auth/google"
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-slate-300 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            Continue with Google
          </a>
        </div>

        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Secure, encrypted authentication • No password required
          </p>
        </div>
      </div>
    </div>
  );
}
