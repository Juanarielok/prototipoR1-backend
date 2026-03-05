import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface DriverLocationAttributes {
  id: string;
  choferId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  jornadaId: string | null;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DriverLocationCreationAttributes
  extends Optional<DriverLocationAttributes, "id" | "speed" | "heading" | "jornadaId"> {}

export default class DriverLocation
  extends Model<DriverLocationAttributes, DriverLocationCreationAttributes>
  implements DriverLocationAttributes
{
  public id!: string;
  public choferId!: string;
  public latitude!: number;
  public longitude!: number;
  public speed!: number | null;
  public heading!: number | null;
  public jornadaId!: string | null;
  public timestamp!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DriverLocation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    choferId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      validate: { min: -90, max: 90 },
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      validate: { min: -180, max: 180 },
    },
    speed: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    heading: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    jornadaId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "driver_locations",
    timestamps: true,
  }
);
