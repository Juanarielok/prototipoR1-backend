import sequelize from "../config/database";
import User from "./User";
import Assignment from "./Assignment";
import Remito from "./Remito";
import Jornada from "./Jornada";
import DriverLocation from "./DriverLocation";
import LocationHistory from "./LocationHistory";

// Asociaciones de Assignment
User.hasMany(Assignment, { foreignKey: "choferId", as: "asignacionesChofer" });
User.hasMany(Assignment, { foreignKey: "clienteId", as: "asignacionesCliente" });
Assignment.belongsTo(User, { foreignKey: "clienteId", as: "cliente" });

// Asociaciones de Remito
User.hasMany(Remito, { foreignKey: "clienteId", as: "remitosCliente" });
User.hasMany(Remito, { foreignKey: "choferId", as: "remitosChofer" });
Remito.belongsTo(User, { foreignKey: "clienteId", as: "cliente" });
Remito.belongsTo(User, { foreignKey: "choferId", as: "chofer" });

// Asociaciones de Jornada
User.hasMany(Jornada, { foreignKey: "choferId", as: "jornadas" });
Jornada.belongsTo(User, { foreignKey: "choferId", as: "chofer" });

// Asociaciones de DriverLocation
User.hasOne(DriverLocation, { foreignKey: "choferId", as: "ubicacionActual" });
DriverLocation.belongsTo(User, { foreignKey: "choferId", as: "chofer" });

// Asociaciones de LocationHistory
User.hasMany(LocationHistory, { foreignKey: "choferId", as: "historialUbicaciones" });
LocationHistory.belongsTo(User, { foreignKey: "choferId", as: "chofer" });
Jornada.hasMany(LocationHistory, { foreignKey: "jornadaId", as: "recorrido" });
LocationHistory.belongsTo(Jornada, { foreignKey: "jornadaId", as: "jornada" });

export { sequelize, User, Assignment, Remito, Jornada, DriverLocation, LocationHistory };