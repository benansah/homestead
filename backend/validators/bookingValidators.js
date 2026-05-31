import { z } from 'zod';

export const bookingSchema = z.object({
  room_id: z.number({ required_error: 'room_id is required' }).int().positive(),
  group_booking_id: z.number().int().positive().optional(),
});

export const groupBookingSchema = z.object({
  room_id:     z.number({ required_error: 'room_id is required' }).int().positive(),
  max_members: z.number().int().min(2).max(8).default(2),
});
