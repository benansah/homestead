import { z } from 'zod';

export const registerSchema = z.object({
  fullname:  z.string().min(2,  'Name must be at least 2 characters'),
  email:     z.string().email( 'Invalid email address'),
  password:  z.string().min(6,  'Password must be at least 6 characters'),
  phone:     z.string().min(10, 'Invalid phone number'),
  university:z.string().optional(),
  role:      z.enum(['student', 'landlord', 'admin']).default('student'),
});

export const loginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});