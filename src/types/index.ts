export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface EmailThread {
  id: string;
  gmail_thread_id: string;
  subject: string | null;
  sender: string | null;
  snippet: string | null;
  date: string | null;
  gmail_link: string;
  category_id: string | null;
  category_name: string | null;
  is_user_corrected: boolean;
  classified_at: string | null;
}

export interface EmailsResponse {
  emails: EmailThread[];
}

export interface CategoryUpdate {
  id?: string | null;
  name: string;
  description: string | null;
}
