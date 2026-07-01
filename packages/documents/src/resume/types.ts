export interface ResumeContact {
  fullName: string;
  title: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: { label: string; url: string }[];
}

export interface ResumeExperience {
  role: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  highlights: string[];
}

export interface ResumeEducation {
  degree: string;
  school: string;
  location?: string;
  startDate: string;
  endDate?: string;
}

export interface ResumeData {
  contact: ResumeContact;
  summary?: string;
  experiences: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  languages: { name: string; level: string }[];
  /** ISO 639-1 code — drives section labels (fr/en supported). */
  locale: "fr" | "en";
}
