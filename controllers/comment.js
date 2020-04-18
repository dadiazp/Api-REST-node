"use strict";

var Topic = require("../models/topic");
var validator = require("validator");

var controller = {
	add: function(req, res) {
		//Recoger el id del topic de la url
		var topicId = req.params.topicId;

		//Find por id del topic
		Topic.findById(topicId).exec((err, topic) => {
			if (err) {
				return res.status(500).send({
					status: "Error",
					message: "Error en la peticion",
				});
			}

			if (!topic) {
				return res.status(404).send({
					status: "Error",
					message: "No existe el topic",
				});
			}

			//Comprobar objeto de usuario y validar datos
			if (req.body.content) {
				//Validar datos
				try {
					var validate_content = !validator.isEmpty(req.body.content);
				} catch (err) {
					return res.status(200).send({
						message: "No has comentado nada",
					});
				}

				if (validate_content) {
					var comment = {
						user: req.user.sub,
						content: req.body.content,
					};

					//En la propiedad de comments del objeto resultante hacer push
					topic.comments.push(comment);

					//Guardar el topic completo
					topic.save((err) => {
						if (err) {
							return res.status(500).send({
								status: "Error",
								message: "Error al guardar el comentario",
							});
						}

						//De esta manera se actualiza el topic para que se vea el comentario de inmediato en el front
						Topic.findById(topic._id)
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
					});
				} else {
					return res.status(200).send({
						message: "No se ha validado correctamente",
					});
				}
			}
		});
	},

	update: function(req, res) {
		//Conseguir el id del comentario que nos llega por url
		var commentId = req.params.commentId;

		//Recoger datos y validar
		var params = req.body;

		try {
			var validate_content = !validator.isEmpty(params.content);
		} catch (err) {
			return res.status(200).send({
				message: "No has comentado nada",
			});
		}

		if (validate_content) {
			//Find and update de subdocumento
			Topic.findOneAndUpdate(
				{ "comments._id": commentId },
				{
					$set: {
						"comments.$.content": params.content, //De esta forma actualizo subdocumentos
					},
				},
				{ new: true },
				(err, topicUpdated) => {
					if (err) {
						return res.status(500).send({
							status: "Error",
							message: "Error en la petición",
						});
					}

					if (!topicUpdated) {
						return res.status(404).send({
							status: "Error",
							message: "No existe el topic",
						});
					}

					//Devolver los datos
					return res.status(200).send({
						status: "Success",
						topic: topicUpdated,
					});
				}
			);
		}
	},

	delete: function(req, res) {
		//Sacar el id del topic y del comentario a borrar que llega por url
		var topicId = req.params.topicId;
		var commentId = req.params.commentId;

		//Buscar el topic
		Topic.findById(topicId, (err, topic) => {
			if (err) {
				return res.status(500).send({
					status: "Error",
					message: "Error en la petición",
				});
			}

			if (!topic) {
				return res.status(404).send({
					status: "Error",
					message: "No existe el topic",
				});
			}

			//Seleccionar el subdocumento(comentario)
			var comment = topic.comments.id(commentId); //Busco en topic el comentario con id commentId

			//Borrar el comentario
			if (comment) {
				comment.remove();

				//Guardar el topic
				topic.save((err) => {
					if (err) {
						return res.status(500).send({
							status: "Error",
							message: "Error en la petición",
						});
					}
					Topic.findById(topic._id)
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
				});
			} else {
				return res.status(404).send({
					status: "Error",
					message: "No existe el comentario",
				});
			}
		});
	},
};

module.exports = controller;
