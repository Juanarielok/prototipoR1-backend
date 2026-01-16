export enum Role {
  ADMIN = 'admin',
  CHOFER = 'chofer',
  CLIENTE = 'cliente',
}

export enum ClientStatus {
  DISPONIBLE = 'disponible',
  ASIGNADO = 'asignado',
  VISITADO = 'visitado',
}

export interface RegisterRequest {
  email: string;
  password: string;
  role?: Role;
  nombre: string;
  dni: string;
  cuit: string;
  telefono: string;
  ubicacion: string;
  razonSocial?: string;
  tipoComercio?: string;
  notas?: string;
  foto?: string;
  usuario?: string;
  codigoArea?: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    role: Role;
    nombre: string;
    dni: string;
    cuit: string;
    telefono: string;
    ubicacion: string;
    razonSocial?: string;
    tipoComercio?: string;
    notas?: string;
    foto?: string;
    usuario?: string;
    codigoArea?: string;
    status?: ClientStatus;
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
    nombre: string;
  };
}