import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface ProductoRemito {
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

interface RemitoAttributes {
  id: string;
  clienteId: string;
  choferId: string;
  fecha: Date;
  productos: ProductoRemito[];
  subtotal: number;
  iva: number;
  total: number;
  notas?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RemitoCreationAttributes extends Optional<RemitoAttributes, "id" | "notas"> {}

export default class Remito extends Model<RemitoAttributes, RemitoCreationAttributes> implements RemitoAttributes {
  public id!: string;
  public clienteId!: string;
  public choferId!: string;
  public fecha!: Date;
  public productos!: ProductoRemito[];
  public subtotal!: number;
  public iva!: number;
  public total!: number;
  public notas!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Remito.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    clienteId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    choferId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    productos: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    iva: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "remitos",
    timestamps: true,
  }
);