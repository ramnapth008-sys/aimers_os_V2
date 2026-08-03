export interface StudentOnboardingProfile {
  id: string;
  examTarget: string | null;
  targetYear: number | null;
  dateOfBirth: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;

  organization: {
    id: string;
    name: string;
    slug: string;
    type: string;
  };
}

export interface StudentOnboardingStatus {
  completed: boolean;
  profile: StudentOnboardingProfile | null;
}

export interface StudentOnboardingInput {
  examTarget: string;
  targetYear: number;
  dateOfBirth?: string;
}

export interface StudentOnboardingResult {
  success: boolean;
  message: string;

  organization: {
    id: string;
    name: string;
    slug: string;
    type: string;
  };

  profile: StudentOnboardingProfile;

  membership: {
    role: string;
    status: string;
    joinedAt: string | null;
  };
}

export type ApiFetch = <T>(
  path: string,
  init?: RequestInit,
) => Promise<T>;
