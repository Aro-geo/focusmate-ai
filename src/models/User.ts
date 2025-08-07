/**
 * User model interfaces
 */

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  created_at: Date;
}

export interface NewUser {
  username: string;
  email: string;
  password: string;
}
