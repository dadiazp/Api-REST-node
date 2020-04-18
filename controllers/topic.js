"uses strict";

var validator = require("validator");
var Topic = require("../models/topic");

var controller = {
	test: function(req, res) {
		return res.status(200).send({
			message: "Funciona el controlador topics",
		});
	},

	save: function(req, res) {
		//Recoger parametros por post
		var params = req.body;

		//Validar datos
		try {
			var validate_title = !validator.isEmpty(params.title);
			var validate_content = !validator.isEmpty(params.content);
			var validate_lang = !validator.isEmpty(params.lang);
		} catch (err) {
			return res.status(200).send({
				message: "Faltan datos por enviar",
			});
		}

		if (validate_content && validate_title && validate_lang) {
			//Crear objeto a guardar
			var topic = new Topic();

			//Asignar los valores
			topic.title = params.title;
			topic.content = params.content;
			topic.code = params.code;
			topic.lang = params.lang;
			topic.user = req.user.sub;

			//Guardar el topic
			topic.save((err, topicStored) => {
				if (err || !topicStored) {
					return res.status(404).send({
						status: "Error",
						message: "El tema no se ha guardado",
					});
				}

				//Devolver la respuesta
				return res.status(200).send({
					status: "Success",
					topic: topicStored,
				});
			});
		} else {
			return res.status(200).send({
				message: "Los datos no son validos",
			});
		}
	},

	getTopics: function(req, res) {
		//Cargar la libreria de paginacion en la clase (Se hizo en el modelo de topics)

		//Recoger la pagina actual
		if (!req.params.page || req.params.page == null || req.params.page == undefined || req.params.page == 0 || req.params.page == "0") {
			var page = 1;
		} else {
			var page = parseInt(req.params.page); //Parseo a un numero entero
		}

		//Indicar las opciones de paginacion
		var options = {
			sort: { date: -1 }, //-1 --> De mas nuevo a mas viejo;   1--> De mas viejo a mas nuevo
			populate: "user", //Sirve para ingresar en los topics el objeto de usuario que creo cada topic
			limit: 5, //Topics por pagina
			page: page,
		};

		//Find paginado
		Topic.paginate({}, options, (err, topics) => {
			if (err) {
				return res.status(500).send({
					message: "Error al hacer la consulta",
					status: "Error",
				});
			}

			if (!topics) {
				return res.status(404).send({
					message: "No hay topics",
					status: "Error",
				});
			}

			//Devolver el resultado
			return res.status(200).send({
				status: "success",
				topics: topics.docs, // Metodos de mongoose paginate
				totalDocs: topics.totalDocs,
				totalPages: topics.totalPages,
			});
		});
	},

	getTopicsByUser: function(req, res) {
		//Conseguir el Id del usuario
		var userId = req.params.user;

		//Find con una condicion de usuario
		Topic.find({
			user: userId,
		})
			.sort([["date", "descending"]])
			.exec((err, topics) => {
				if (err) {
					//Devolver resultado
					return res.status(500).send({
						status: "Error",
						message: "Error en la peticion",
					});
				}

				if (!topics) {
					return res.status(404).send({
						status: "Error",
						message: "No hay temas para mostrar",
					});
				}

				//Devolver resultado
				return res.status(200).send({
					status: "success",
					topics,
				});
			});
	},

	getTopic: function(req, res) {
		//Sacar el id del topic que se nos envia por url
		var topicID = req.params.id;

		//Find del id del topic
		Topic.findById(topicID)
			.populate("user")
			.populate("comments.user")
			.exec((err, topic) => {
				if (err) {
					return res.status(500).send({
						message: "Error en la peticion",
						status: "Error",
					});
				}

				if (!topic) {
					return res.status(404).send({
						message: "No existe el topic",
						status: "Error",
					});
				}

				return res.status(200).send({
					status: "success",
					topic,
				});
			});
	},

	update: function(req, res) {
		//Recoger el id del topic a actualizar
		var topicId = req.params.id;

		//Recoger los datos que llegan desde post
		var params = req.body;

		//Validar datos
		try {
			var validate_title = !validator.isEmpty(params.title);
			var validate_content = !validator.isEmpty(params.content);
			var validate_lang = !validator.isEmpty(params.lang);
		} catch (err) {
			return res.status(200).send({
				message: "Faltan datos por enviar",
			});
		}

		if (validate_title && validate_content && validate_lang) {
			//Montar un objeto JSON con los datos modificables
			var update = {
				title: params.title,
				content: params.content,
				code: params.code,
				lang: params.lang,
			};

			//Find and update del topic por id y por id de usuario
			Topic.findOneAndUpdate({ _id: topicId, user: req.user.sub }, update, { new: true }, (err, topicUpdate) => {
				if (err) {
					return res.status(500).send({
						status: "Error",
						message: "Error en la peticion",
					});
				}

				if (!topicUpdate) {
					return res.status(404).send({
						status: "Error",
						message: "El topic no se ha actualizado",
					});
				}

				return res.status(200).send({
					status: "success",
					topicUpdate,
				});
			});
		} else {
			return res.status(200).send({
				message: "La validacion de datos no es correcta",
			});
		}
	},

	delete: function(req, res) {
		//Sacar el id del topic de la url
		var topicId = req.params.id;

		//Hacer un find and delete por topic id y por user id
		Topic.findOneAndDelete({ _id: topicId }, { user: req.user.sub }, (err, topicRemoved) => {
			if (err) {
				return res.status(500).send({
					status: "Error",
					message: "Error en la peticion",
				});
			}

			if (!topicRemoved) {
				return res.status(404).send({
					status: "Error",
					message: "El topic no se ha elimnado",
				});
			}

			return res.status(200).send({
				status: "success",
				topic: topicRemoved,
			});
		});
	},

	search: function(req, res) {
		//Sacar string a buscar de la url
		var searchString = req.params.search;

		//Find or
		Topic.find({
			$or: [
				{ title: { $regex: searchString, $options: "i" } },
				{ content: { $regex: searchString, $options: "i" } },
				{ lang: { $regex: searchString, $options: "i" } },
				{ code: { $regex: searchString, $options: "i" } },
			],
		})
			.populate("user")
			.sort([["date", "descending"]])
			.exec((err, topics) => {
				if (err) {
					return res.status(500).send({
						status: "Error",
						message: "Error en la petición",
					});
				}

				if (!topics) {
					return res.status(404).send({
						status: "Error",
						message: "No hay temas disponibles",
					});
				}

				//Devolver el resultado
				return res.status(200).send({
					status: "Success",
					topics,
				});
			});
	},
};

module.exports = controller;
