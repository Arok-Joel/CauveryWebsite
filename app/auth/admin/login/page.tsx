import { AdminLoginForm } from '@/components/auth/admin-login-form';

export default function AdminLoginPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#FAF9F6]">
      <div className="w-full max-w-lg mx-4">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Admin Login</h1>
            <p className="text-gray-600">Enter your admin credentials to access the dashboard</p>
          </div>

          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
