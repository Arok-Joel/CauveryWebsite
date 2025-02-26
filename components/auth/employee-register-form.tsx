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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const employeeRegisterFormSchema = z.object({
  // User model fields
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  address: z.string().min(1, 'Address is required'),
  pincode: z.string().min(6, 'Please enter a valid pincode'),

  // Employee model fields
  guardianName: z.string().min(2, 'Guardian name must be at least 2 characters'),
  dateOfBirth: z.string().refine(date => {
    const dob = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    return age >= 18 && age <= 65;
  }, 'Employee must be between 18 and 65 years old'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  pancardNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN card number'),
  aadharCardNumber: z
    .string()
    .regex(/^\d{12}$/, 'Please enter a valid 12-digit Aadhar card number'),
  bankName: z.string().min(2, 'Bank name is required'),
  bankBranch: z.string().min(2, 'Bank branch is required'),
  accountNumber: z.string().min(9, 'Please enter a valid account number'),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code'),
});

type EmployeeRegisterFormValues = z.infer<typeof employeeRegisterFormSchema>;

const formSteps = [
  {
    title: 'Account Details',
    description: 'Create your login credentials',
    fields: ['name', 'email', 'password'],
  },
  {
    title: 'Contact Information',
    description: 'Add your contact details',
    fields: ['phone', 'address', 'pincode'],
  },
  {
    title: 'Personal Details',
    description: 'Add your personal information',
    fields: ['guardianName', 'dateOfBirth', 'gender', 'pancardNumber', 'aadharCardNumber'],
  },
  {
    title: 'Bank Details',
    description: 'Add your bank account information',
    fields: ['bankName', 'bankBranch', 'accountNumber', 'ifscCode'],
  },
];

export function EmployeeRegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showError, setShowError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const progressValue = ((currentStep + 1) / formSteps.length) * 100;
    setProgress(progressValue);
  }, [currentStep]);

  const form = useForm<EmployeeRegisterFormValues>({
    resolver: zodResolver(employeeRegisterFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      pincode: '',
      guardianName: '',
      dateOfBirth: '',
      gender: 'MALE',
      pancardNumber: '',
      aadharCardNumber: '',
      bankName: '',
      bankBranch: '',
      accountNumber: '',
      ifscCode: '',
    },
  });

  const {
    trigger,
    formState: { errors },
  } = form;

  const handleNext = async () => {
    const fields = formSteps[currentStep].fields as (keyof EmployeeRegisterFormValues)[];

    // Validate current step fields
    const isValid = await trigger(fields);

    if (!isValid) {
      setShowError(true);
      // Hide error after 5 seconds
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    setCurrentStep(current => Math.min(formSteps.length - 1, current + 1));
    setShowError(false);
  };

  const handlePrevious = () => {
    setCurrentStep(current => Math.max(0, current - 1));
    setShowError(false);
  };

  async function onSubmit(data: EmployeeRegisterFormValues) {
    // Validate all fields before submission
    const isValid = await trigger();
    if (!isValid) {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    try {
      setIsLoading(true);
      // Add default role to the data
      const employeeData = {
        ...data,
        employeeRole: 'FIELD_OFFICER' as const, // Default role
      };

      const response = await fetch('/api/auth/employee/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to register');
      }

      toast.success('Registration successful! Please login.');
      router.push('/auth/employee/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  }

  const currentFields = formSteps[currentStep].fields;

  // Get current step error messages
  const currentStepErrors = currentFields.reduce((acc, field) => {
    const error = errors[field as keyof EmployeeRegisterFormValues];
    if (error) {
      acc.push(error.message as string);
    }
    return acc;
  }, [] as string[]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {showError && currentStepErrors.length > 0 && (
          <Alert variant="destructive" className="bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please fix the following errors:
              <ul className="mt-2 list-disc list-inside">
                {currentStepErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {formSteps.map((step, index) => (
              <div
                key={step.title}
                className={cn(
                  'flex flex-col items-center space-y-2',
                  index <= currentStep ? 'text-[#3C5A3E]' : 'text-gray-400'
                )}
                role="button"
                onClick={() => {
                  // Only allow going back to previous steps
                  if (index < currentStep) {
                    setCurrentStep(index);
                    setShowError(false);
                  }
                }}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                    index <= currentStep
                      ? 'border-[#3C5A3E] bg-[#3C5A3E] text-white'
                      : 'border-gray-300',
                    index < currentStep && 'cursor-pointer hover:bg-[#2A3F2B]'
                  )}
                >
                  {index + 1}
                </div>
                <span className="text-xs font-medium hidden md:block">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#3C5A3E]">
                {formSteps[currentStep].title}
              </h2>
              <p className="text-gray-500 text-sm">{formSteps[currentStep].description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {currentFields.map(fieldName => (
                <FormField
                  key={fieldName}
                  control={form.control}
                  name={fieldName as keyof EmployeeRegisterFormValues}
                  render={({ field }) => (
                    <FormItem className={fieldName === 'employeeRole' ? 'md:col-span-2' : ''}>
                      <FormLabel>{getFieldLabel(fieldName)}</FormLabel>
                      <FormControl>
                        {fieldName === 'gender' ? (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={`Select ${getFieldLabel(fieldName).toLowerCase()}`}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getSelectOptions(fieldName).map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            {...field}
                            type={getInputType(fieldName)}
                            placeholder={getPlaceholder(fieldName)}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isLoading}
          >
            Previous
          </Button>

          {currentStep === formSteps.length - 1 ? (
            <Button
              type="submit"
              className="bg-[#3C5A3E] hover:bg-[#2A3F2B] text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Registering...' : 'Complete Registration'}
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-[#3C5A3E] hover:bg-[#2A3F2B] text-white"
              onClick={handleNext}
              disabled={isLoading}
            >
              Next
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

function getFieldLabel(fieldName: string): string {
  const labels: Record<string, string> = {
    name: 'Full Name',
    email: 'Email',
    password: 'Password',
    phone: 'Phone Number',
    address: 'Address',
    pincode: 'Pincode',
    guardianName: 'Guardian Name',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    pancardNumber: 'PAN Card Number',
    aadharCardNumber: 'Aadhar Card Number',
    bankName: 'Bank Name',
    bankBranch: 'Bank Branch',
    accountNumber: 'Account Number',
    ifscCode: 'IFSC Code',
  };
  return labels[fieldName] || fieldName;
}

function getInputType(fieldName: string): string {
  const types: Record<string, string> = {
    email: 'email',
    password: 'password',
    phone: 'tel',
    dateOfBirth: 'date',
  };
  return types[fieldName] || 'text';
}

function getPlaceholder(fieldName: string): string {
  const placeholders: Record<string, string> = {
    name: 'John Doe',
    email: 'john@example.com',
    password: '********',
    phone: '1234567890',
    address: 'Your current address',
    pincode: '560001',
    guardianName: "Guardian's full name",
    pancardNumber: 'ABCDE1234F',
    aadharCardNumber: '123456789012',
    bankName: 'State Bank of India',
    bankBranch: 'Main Branch',
    accountNumber: '123456789',
    ifscCode: 'SBIN0123456',
  };
  return placeholders[fieldName] || '';
}

function getSelectOptions(fieldName: string) {
  const options: Record<string, { value: string; label: string }[]> = {
    gender: [
      { value: 'MALE', label: 'Male' },
      { value: 'FEMALE', label: 'Female' },
      { value: 'OTHER', label: 'Other' },
    ],
  };
  return options[fieldName] || [];
}
