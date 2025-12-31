export enum Role {
  ADMIN = 'admin',
  VENDEDOR = 'vendedor',
  CLIENTE = 'cliente',
}

export interface RegisterRequest {
  email: string;
  password: string;
  role?: Role;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    email: string;
    role: Role;
  };
}