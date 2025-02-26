import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#FAF9F6]">
      <div className="w-full max-w-lg mx-4">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
            <p className="text-gray-600">Enter your credentials to access your account</p>
          </div>

          <LoginForm />

          <p className="text-center mt-6 text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-[#3C5A3E] hover:underline font-medium">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
