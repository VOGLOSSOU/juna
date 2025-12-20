export interface UpdateProfileDTO {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdatePreferencesDTO {
  dietaryRestrictions?: string[];
  favoriteCategories?: string[];
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
}

export interface DeleteAccountDTO {
  password: string;
  reason?: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  profile: {
    avatar: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    preferences: any;
  } | null;
}