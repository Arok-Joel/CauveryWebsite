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
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

const registerFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(50, { message: 'Name cannot exceed 50 characters' })
    .regex(/^[a-zA-Z\s]*$/, { message: 'Name can only contain letters and spaces' }),

  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .min(5, { message: 'Email must be at least 5 characters long' })
    .max(50, { message: 'Email cannot exceed 50 characters' })
    .toLowerCase(),

  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(50, { message: 'Password cannot exceed 50 characters' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),

  phoneNumber: z
    .string()
    .min(10, { message: 'Phone number must be at least 10 digits' })
    .max(15, { message: 'Phone number cannot exceed 15 digits' })
    .regex(/^\+?[0-9]+$/, { message: 'Please enter a valid phone number' }),

  address: z
    .string()
    .min(5, { message: 'Address must be at least 5 characters long' })
    .max(200, { message: 'Address cannot exceed 200 characters' })
    .optional()
    .or(z.literal('')),

  pincode: z
    .string()
    .regex(/^[0-9]{6}$/, { message: 'Please enter a valid 6-digit pincode' })
    .optional()
    .or(z.literal('')),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export function RegisterForm() {
  console.log('Component rendering');

  useEffect(() => {
    console.log('Register form component mounted');
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phoneNumber: '',
      address: '',
      pincode: '',
    },
    mode: 'onChange',
  });

  const handleSubmit = async () => {
    const formData = form.getValues();
    const validation = await form.trigger();
    console.log('Form validation:', validation);
    console.log('Form errors:', form.formState.errors);

    if (!validation) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      toast.success('Registration successful!');
      router.push('/auth/login');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe"
                  {...field}
                  className={`h-12 ${form.formState.errors.name ? 'border-red-500' : ''}`}
                />
              </FormControl>
              <FormMessage className="text-sm text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  {...field}
                  className={`h-12 ${form.formState.errors.email ? 'border-red-500' : ''}`}
                />
              </FormControl>
              <FormMessage className="text-sm text-red-500" />
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
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...field}
                    onChange={e => {
                      field.onChange(e);
                      form.trigger('password');
                    }}
                    className={`h-12 pr-10 ${form.formState.errors.password ? 'border-red-500 focus:border-red-500 ring-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-sm text-red-500" />
              <p className="text-xs text-gray-500 mt-1">
                Password must contain at least 8 characters, including uppercase, lowercase, number,
                and special character.
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-500">+91</span>
                  <Input
                    type="tel"
                    placeholder="98765 43210"
                    {...field}
                    value={field.value.startsWith('+91') ? field.value.slice(3) : field.value}
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, '');
                      field.onChange('+91' + value);
                    }}
                    className={`h-12 pl-12 ${form.formState.errors.phoneNumber ? 'border-red-500' : ''}`}
                    maxLength={10}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-sm text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your address"
                  {...field}
                  className={`h-12 ${form.formState.errors.address ? 'border-red-500' : ''}`}
                />
              </FormControl>
              <FormMessage className="text-sm text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pincode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pincode (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="560001"
                  {...field}
                  className={`h-12 ${form.formState.errors.pincode ? 'border-red-500' : ''}`}
                  maxLength={6}
                />
              </FormControl>
              <FormMessage className="text-sm text-red-500" />
            </FormItem>
          )}
        />

        <Button
          type="button"
          className="w-full h-12 bg-[#3C5A3E] hover:bg-[#2A4C2C] text-white"
          disabled={isLoading || !form.formState.isValid}
          onClick={e => {
            e.preventDefault();
            console.log('Button clicked');
            handleSubmit();
          }}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </Button>
      </div>
    </Form>
  );
}
