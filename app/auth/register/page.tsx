import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#FAF9F6]">
      <div className="w-full max-w-lg mx-4">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Create an account</h1>
            <p className="text-gray-600">Enter your details to register</p>
          </div>

          <RegisterForm />

          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
