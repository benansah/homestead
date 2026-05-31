export interface User {
  id: number;
  fullname: string;
  email: string;
  phone: string;
  university: string | null;
  role: 'student' | 'landlord' | 'admin';
  created_at: string;
}

export interface Hostel {
  id: number;
  landlord_id: number;
  hostel_name: string;
  hostel_address: string;
  university: string;
  description: string | null;
  latitude: number;
  longitude: number;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  is_verified: boolean;
  track: 'A' | 'B';
  created_at: string;
  // aggregated fields from queries
  min_price?: number;
  max_price?: number;
  avg_rating?: number;
  total_rooms?: number;
  available_rooms?: number;
  total_reviews?: number;
  distance_km?: number;
  images?: string[];
  landlord_name?: string;
  landlord_phone?: string;
}

export interface Room {
  id: number;
  hostel_id: number;
  room_type: string;
  price: number;
  gender_policy: 'Male' | 'Female' | 'Both';
  quantity: number;
  is_available: boolean;
  images?: string[];
}

export interface Booking {
  id: number;
  student_id: number;
  room_id: number;
  booking_type: 'Viewing' | 'Reservation';
  booking_status: 'pending' | 'confirmed' | 'contact_released' | 'cancelled' | 'completed' | 'no_show';
  payment_ref: string | null;
  viewing_fee: number;
  booked_at: string;
  // joined fields
  room_type?: string;
  price?: number;
  hostel_name?: string;
  hostel_address?: string;
  landlord_phone?: string;
  landlord_name?: string;
}

export interface Review {
  id: number;
  student_id: number;
  hostel_id: number;
  rating: number;
  comment: string | null;
  image_url: string | null;
  created_at: string;
  student_name?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  not_message: string;
  not_type: 'booking' | 'availability' | 'payment' | 'review' | 'referral' | 'system' | 'roommate';
  is_read: boolean;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (formData: RegisterFormData) => Promise<void>;
  googleLogin: (credential: string, role?: string) => Promise<void>;
  logout: () => void;
}

export interface RoommateProfile {
  id: number;
  user_id: number;
  gender: 'Male' | 'Female' | 'Other';
  sleep_schedule: 'early_bird' | 'night_owl' | 'flexible';
  study_habits: 'quiet' | 'noise_ok' | 'flexible';
  cleanliness: 'very_tidy' | 'moderate' | 'relaxed';
  guests: 'frequent' | 'occasional' | 'never';
  gender_preference: 'same' | 'any';
  bio: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoommateMatch {
  user_id: number;
  fullname: string;
  university: string | null;
  gender: 'Male' | 'Female' | 'Other';
  sleep_schedule: string;
  study_habits: string;
  cleanliness: string;
  guests: string;
  gender_preference: string;
  bio: string | null;
  compatibility_score: number;
}

export interface RoommateRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  hostel_id: number | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  // joined fields — present on incoming requests
  sender_name?: string;
  sender_phone?: string;
  sender_university?: string;
  // joined fields — present on outgoing requests
  receiver_name?: string;
  receiver_phone?: string;
  receiver_university?: string;
  // shared joined fields
  gender?: string;
  sleep_schedule?: string;
  study_habits?: string;
  cleanliness?: string;
  guests?: string;
  bio?: string | null;
  hostel_name?: string | null;
}

export interface GroupBooking {
  id: number;
  room_id: number;
  lead_student_id: number;
  max_members: number;
  status: 'open' | 'full' | 'cancelled';
  created_at: string;
  // joined fields
  room_type?: string;
  price?: number;
  hostel_name?: string;
  hostel_address?: string;
  my_status?: string;
  my_booking_id?: number;
  member_count?: number;
  paid_count?: number;
  members?: {
    booking_id: number;
    booking_status: string;
    fullname: string;
    university: string | null;
    phone: string | null;
  }[];
}

export interface RegisterFormData {
  fullname: string;
  email: string;
  password: string;
  phone: string;
  university?: string;
  role?: string;
}