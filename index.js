"use strict";

var mongoose = require("mongoose"); // Carga el modulo de mongoose
var app = require("./app");
var port = process.env.PORT || 3999;

mongoose.set("useFindAndModify", false);
mongoose.Promise = global.Promise;
mongoose
	.connect("mongodb://localhost:27017/api_rest_node", { useNewUrlParser: true })
	.then(() => {
		console.log("la conexion a la base de datos de mongo se ha realizado");

		//Crear el servidor
		app.listen(port, () => {
			console.log("El servidor esta corriendo ");
		});
	})
	.catch((error) => console.log(error));
