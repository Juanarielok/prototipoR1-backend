import sequelize from "../config/database";
import User from "./User";
import Assignment from "./Assignment";

User.hasMany(Assignment, { foreignKey: "choferId", as: "asignacionesChofer" });
User.hasMany(Assignment, { foreignKey: "clienteId", as: "asignacionesCliente" });
Assignment.belongsTo(User, { foreignKey: "clienteId", as: "cliente" });

export { sequelize, User, Assignment };
