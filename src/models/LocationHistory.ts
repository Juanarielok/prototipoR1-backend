import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface LocationHistoryAttributes {
  id: string;
  choferId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  jornadaId: string | null;
  timestamp: Date;
  createdAt?: Date;
}

interface LocationHistoryCreationAttributes
  extends Optional<LocationHistoryAttributes, "id" | "speed" | "heading" | "jornadaId"> {}

export default class LocationHistory
  extends Model<LocationHistoryAttributes, LocationHistoryCreationAttributes>
  implements LocationHistoryAttributes
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
}

LocationHistory.init(
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
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
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
    tableName: "location_history",
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ["timestamp"] },
      { fields: ["choferId", "timestamp"] },
    ],
  }
);
