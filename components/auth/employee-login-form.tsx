'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const employeeLoginFormSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required').regex(/^RCF\d{7}$/, {
    message: 'Please enter a valid employee ID (e.g., RCF2025001)',
  }),
  password: z.string().min(1, 'Password is required'),
});

type EmployeeLoginFormValues = z.infer<typeof employeeLoginFormSchema>;

export function EmployeeLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  const form = useForm<EmployeeLoginFormValues>({
    resolver: zodResolver(employeeLoginFormSchema),
    defaultValues: {
      employeeId: '',
      password: '',
    },
  });

  async function onSubmit(data: EmployeeLoginFormValues) {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/employee/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          employeeId: data.employeeId.toUpperCase(),
          password: data.password
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Invalid employee credentials');
      }

      // Update auth context with the employee user data
      setUser(result.user);

      toast.success('Login successful!');
      router.push('/employee/dashboard'); // Redirect to employee dashboard
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid employee credentials');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee ID</FormLabel>
              <FormControl>
                <Input 
                  type="text" 
                  placeholder="RCF2025001" 
                  {...field} 
                  className="bg-white uppercase"
                  autoCapitalize="characters"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full bg-[#3C5A3E] hover:bg-[#2A3F2B] text-white"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </Form>
  );
}
