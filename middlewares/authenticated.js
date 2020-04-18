"use strict";

var jwt = require("jwt-simple");
var moment = require("moment");
var secret = "clave-para-generar-el-token-9999";

exports.authenticated = function(req, res, next) {
	//Los middlewares tienen 3 parametros. El next permite que el flujo del programa salga y ejecute lo siguiente

	//Comprobar si nos llega la cabecera de autorizacion
	if (!req.headers.authorization) {
		return res.status(403).send({
			message: "La peticion no tiene la cabecera de autorizacion"
		});
	}

	//Limpiar el token y quitar comillas
	var token = req.headers.authorization.replace(/['"]+/g, "");

	try {
		//Decodificar el token
		var payload = jwt.decode(token, secret);

		//Comprobar si el token ha expirado
		if (payload.exp <= moment().unix()) {
			return res.status(404).send({
				message: "El token ha expirado "
			});
		}
	} catch (ex) {
		return res.status(404).send({
			message: "El token no es valido "
		});
	}

	//Adjuntar usuario identificado a la request
	req.user = payload;

	//Pasar a la accion
	next(); //Esto permite que se pase a ejecutar la accion del controlador
};
