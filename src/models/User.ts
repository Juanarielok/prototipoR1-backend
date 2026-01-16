import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { Role, ClientStatus } from '../types/auth';

interface UserAttributes {
  id: string;
  email: string;
  password: string;
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
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'razonSocial' | 'tipoComercio' | 'notas' | 'foto' | 'usuario' | 'codigoArea' | 'status' | 'deletedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public role!: Role;
  public nombre!: string;
  public dni!: string;
  public cuit!: string;
  public telefono!: string;
  public ubicacion!: string;
  public razonSocial!: string;
  public tipoComercio!: string;
  public notas!: string;
  public foto!: string;
  public usuario!: string;
  public codigoArea!: string;
  public status!: ClientStatus;
  public deletedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(Role)),
      allowNull: false,
      defaultValue: Role.CLIENTE,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dni: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    cuit: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ubicacion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    razonSocial: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tipoComercio: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    foto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    usuario: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    codigoArea: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ClientStatus)),
      allowNull: true,
      defaultValue: ClientStatus.DISPONIBLE,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    paranoid: true,
  }
);

export default User;