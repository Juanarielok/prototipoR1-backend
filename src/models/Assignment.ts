import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

export default class Assignment extends Model {
  declare id: string;
  declare choferId: string;
  declare clienteId: string;
  declare status: "assigned" | "done";
}

Assignment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    choferId: { type: DataTypes.UUID, allowNull: false },
    clienteId: { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM("assigned", "done"),
      allowNull: false,
      defaultValue: "assigned",
    },
  },
  {
    sequelize,
    tableName: "assignments",
    indexes: [
      { unique: true, fields: ["choferId", "clienteId"] }, // evita duplicados
    ],
  }
);
