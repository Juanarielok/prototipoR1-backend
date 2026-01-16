import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface JornadaAttributes {
  id: string;
  choferId: string;
  checkIn: Date;
  checkOut?: Date | null;
  ubicacionCheckIn?: string | null;
  ubicacionCheckOut?: string | null;
  notas?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface JornadaCreationAttributes extends Optional<JornadaAttributes, "id" | "checkOut" | "ubicacionCheckIn" | "ubicacionCheckOut" | "notas"> {}

export default class Jornada extends Model<JornadaAttributes, JornadaCreationAttributes> implements JornadaAttributes {
  public id!: string;
  public choferId!: string;
  public checkIn!: Date;
  public checkOut!: Date | null;
  public ubicacionCheckIn!: string | null;
  public ubicacionCheckOut!: string | null;
  public notas!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Calcular duración en minutos
  get duracion(): number | null {
    if (!this.checkOut) return null;
    const diff = new Date(this.checkOut).getTime() - new Date(this.checkIn).getTime();
    return Math.round(diff / 60000); // Convertir a minutos
  }
}

Jornada.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    choferId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    checkIn: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    checkOut: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ubicacionCheckIn: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ubicacionCheckOut: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "jornadas",
    timestamps: true,
  }
);