"use strict";

var validator = require("validator");
var fs = require("fs"); //Permite trabajar con el sistema de ficheros
var path = require("path");
var bcrypt = require("bcrypt-nodejs");
var User = require("../models/user");
var jwt = require("../services/jwt");

var controller = {
	probando: function(req, res) {
		// Los parametros son request y response
		return res.status(200).send({
			message: "Soy el metodo probando",
		});
	},

	testeando: function(req, res) {
		return res.status(200).send({
			message: "Soy el metodo testeando",
		});
	},

	save: function(req, res) {
		//Recoger los parametros de la peticion
		var params = req.body; //Con esto recojo los datos

		//Validar los datos
		try {
			var validate_name = !validator.isEmpty(params.name);
			var validate_surname = !validator.isEmpty(params.surname);
			var validate_email = validator.isEmail(params.email) && !validator.isEmpty(params.email);
			var validate_password = !validator.isEmpty(params.password);
		} catch (err) {
			return res.status(200).send({
				message: "Faltan datos por enviar",
			});
		}

		//console.log(validate_name, validate_surname, validate_email, validate_password);

		if (validate_name && validate_surname && validate_email && validate_password) {
			//Crear el objeto de usuario
			var user = new User();

			//Asignar valores al objeto
			user.name = params.name;
			user.surname = params.surname;
			user.email = params.email.toLowerCase();
			user.password = null;
			user.role = "ROLE_USER";
			user.image = null;

			//Comprobar si el usuario ya existe
			User.findOne({ email: user.email }, (err, issetUser) => {
				if (err) {
					return res.status(500).send({
						message: "Error al comprobar duplicidad de usuario",
					});
				}

				if (!issetUser) {
					//Si no existe, cifrar la contraseña y guardarlo
					bcrypt.hash(params.password, null, null, (err, hash) => {
						user.password = hash;

						user.save((err, userStored) => {
							if (err) {
								return res.status(500).send({
									message: "Error al guardar el usuario",
								});
							}

							if (!userStored) {
								if (err) {
									return res.status(400).send({
										message: "El usuario no se ha guardado",
									});
								}
							}

							//Devolver respuesta
							return res.status(200).send({
								status: "Success",
								user: userStored,
							});
						}); //close save
					}); //close bcrypt
				} else {
					return res.status(200).send({
						message: "El usuario ya existe",
					});
				}
			});
		} else {
			return res.status(200).send({
				message: "Error de validación",
			});
		}
	},

	login: function(req, res) {
		//Recoger los parametros de la peticion
		var params = req.body;

		//Validar los datos
		try {
			var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
			var validate_password = !validator.isEmpty(params.password);
		} catch (err) {
			return res.status(200).send({
				message: "Faltan datos por enviar",
			});
		}

		if (!validate_email || !validate_password) {
			return res.status(200).send({
				message: "Los datos son incorrectos, envialos bien",
			});
		}

		//Buscar usuarios que coincidan con el email
		User.findOne({ email: params.email.toLowerCase() }, (err, user) => {
			if (err) {
				return res.status(500).send({
					message: "Error al intentar identificarse",
				});
			}

			if (!user) {
				return res.status(404).send({
					message: "El usuario no existe",
				});
			}

			//Si lo encuentra,
			//Comprobar la contraseña (email y password / bcrypt)
			bcrypt.compare(params.password, user.password, (err, check) => {
				//Si es correcto,
				if (check) {
					//Generar token de JWT y devolverlo
					if (params.gettoken) {
						return res.status(200).send({
							token: jwt.createToken(user),
						});
					} else {
						user.password = undefined;

						return res.status(200).send({
							status: "succes",
							user,
						});
					}
					//Limpiar el objeto
					user.password = undefined;

					//Devolver los datos
					return res.status(200).send({
						status: "succes",
						user,
					});
				} else {
					return res.status(200).send({
						message: "Las credenciales no son correctas",
					});
				}
			});
		});
	},

	update: function(req, res) {
		//Recorre los datos del usuario
		var params = req.body;

		//Validar datos
		try {
			var validate_name = !validator.isEmpty(params.name);
			var validate_surname = !validator.isEmpty(params.surname);
			var validate_email = validator.isEmail(params.email) && !validator.isEmpty(params.email);
		} catch (err) {
			return res.status(200).send({
				message: "Faltan datos por enviar",
			});
		}

		//Eliminar propiedades innecesarias
		delete params.password;

		var userId = req.user.sub;
		var flag;
		//console.log(userId);

		//Comprobar si el email es unico
		if ((flag = req.user.email != params.email)) {
			console.log(flag);
			console.log(req.user.email);
			console.log(params.email);

			User.findOne({ email: params.email.toLowerCase() }, (err, user) => {
				if (err) {
					return res.status(500).send({
						message: "Error al intentar identificarse",
					});
				}

				if (user && user.email == params.email) {
					return res.status(200).send({
						message: "El email no puede ser modificado",
					});
				} else {
					//Buscar y actualizar documento de la base de dato
					User.findOneAndUpdate({ _id: userId }, params, { new: true }, (err, userUpdated) => {
						if (err) {
							return res.status(500).send({
								status: "error",
								message: "Error al actualizar usuario",
							});
						}

						if (!userUpdated) {
							return res.status(200).send({
								status: "error",
								message: "No se ha actualizado el usuario",
							});
						}

						//Devolver una respuesta
						return res.status(200).send({
							status: "success",
							user: userUpdated,
						});
					}); //Condicion, datos a actualizar, opciones, callback
				}
			});
		} else {
			//Buscar y actualizar documento de la base de dato
			console.log(userId);
			User.findOneAndUpdate({ _id: userId }, params, { new: true }, (err, userUpdated) => {
				if (err) {
					return res.status(500).send({
						status: "error",
						message: "Error al actualizar usuario",
					});
				}

				if (!userUpdated) {
					return res.status(200).send({
						status: "error",
						message: "No se ha actualizado el usuario",
					});
				}

				//Devolver una respuesta
				return res.status(200).send({
					status: "success",
					user: userUpdated,
				});
			}); //Condicion, datos a actualizar, opciones, callback
		}
	},

	uploadAvatar: function(req, res) {
		//Configurar el modulo multiparty(middleware) listo en rutas de usuario

		//Recoger el fichero de la peticion
		var file_name = "Avatar no subido...";

		if (!req.files) {
			//req.files es habilitado por el multiparty
			//Devolver respuesta
			return res.status(404).send({
				status: "Error",
				message: file_name,
			});
		}

		//Conseguir el nombre y la extension del archivo subido
		var file_path = req.files.file0.path; //De esta manera consigo el path
		var file_split = file_path.split("\\"); //Segmento el string

		//Advertencia: en linx o mac:
		//var file_split = file_path.split('/');

		//Nombre del archivo
		var file_name = file_split[2];

		//Extension del archivo
		var ext_split = file_name.split(".");
		var file_ext = ext_split[1];

		//Comprobar la extension (solo imagenes), si no es valida borrar fichero subido
		if (file_ext != "png" && file_ext != "jpg" && file_ext != "jpeg" && file_ext != "gif") {
			fs.unlink(file_path, (err) => {
				return res.status(200).send({
					status: "Error",
					message: "La extension del archivo no es valida",
				});
			});
		} else {
			//Sacar el id del usuario identificado
			var userId = req.user.sub;

			//Buscar y actualizar documento de la base de datos
			User.findOneAndUpdate({ _id: userId }, { image: file_name }, { new: true }, (err, userUpdated) => {
				if (err || !userUpdated) {
					//Devolver respuesta
					return res.status(500).send({
						status: "Error",
						message: "Error al subir la imagen",
					});
				}

				//Devolver respuesta
				return res.status(200).send({
					status: "success",
					user: userUpdated,
				});
			});
		}
	},

	avatar: function(req, res) {
		var fileName = req.params.fileName;
		var pathFile = "./uploads/users/" + fileName;

		fs.exists(pathFile, (exists) => {
			if (exists) {
				return res.sendFile(path.resolve(pathFile)); //Devuelvo la imagen usando el path de la misma
			} else {
				return res.status(404).send({
					message: "La imagen no existe",
				});
			}
		});
	},

	getUsers: function(req, res) {
		User.find().exec((err, users) => {
			if (err || !users) {
				return res.status(404).send({
					status: "Error",
					message: "No hay usuarios que mostrar",
				});
			} else {
				return res.status(200).send({
					status: "Success",
					users: users,
				});
			}
		});
	},

	getUser: function(req, res) {
		var userId = req.params.userId;

		User.findById(userId).exec((err, user) => {
			if (err || !user) {
				return res.status(404).send({
					status: "Error",
					message: "No existe el usuario",
				});
			} else {
				return res.status(200).send({
					status: "Success",
					user: user,
				});
			}
		});
	},
};

module.exports = controller; // Exporto el controlador para usarlo desde fuera
