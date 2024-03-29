"use strict";

var mongoose = require("mongoose");
var mongoosePaginate = require("mongoose-paginate-v2");

var Schema = mongoose.Schema;

//Modelo dde comments
var CommentSchema = Schema({
	content: String,
	date: { type: Date, default: Date.now },
	user: { type: Schema.ObjectId, ref: "User" }
});

var Comment = mongoose.model("Comment", CommentSchema);

//Modelo de topic
var TopicSchema = Schema({
	title: String,
	content: String,
	code: String,
	lang: String,
	date: { type: Date, default: Date.now },
	user: { type: Schema.ObjectId, ref: "User" },
	comments: [CommentSchema]
});

//Cargar paginacion
TopicSchema.plugin(mongoosePaginate); //Asi cargo el plugin de paginacion a moongose

module.exports = mongoose.model("Topic", TopicSchema);
