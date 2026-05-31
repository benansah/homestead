import { z } from 'zod';

export const hostelSchema = z.object({
  hostel_name:    z.string().min(2,   'Hostel name required'),
  hostel_address: z.string().min(5,   'Address required'),
  university:     z.string().min(2,   'University required'),
  description:    z.string().optional(),
  latitude:       z.number().min(-90).max(90),
  longitude:      z.number().min(-180).max(180),
  track:          z.enum(['A', 'B']).default('A'),
});

export const roomSchema = z.object({
  room_type:     z.string().min(2, 'Room type required'),
  price:         z.number().positive('Price must be positive'),
  gender_policy: z.enum(['Male', 'Female', 'Both']),
  quantity:      z.number().int().positive().default(1),
});

export const bookingSchema = z.object({
  room_id: z.number().int().positive('Invalid room'),
});