"use strict";

var mongoose = require("mongoose");

var Schema = mongoose.Schema; //Me permite crear schemas de mongoose

var UserSchema = Schema({
	name: String,
	surname: String,
	email: String,
	password: String,
	image: String,
	role: String
});

UserSchema.methods.toJSON = function() {
	var obj = this.toObject();
	delete obj.password;

	return obj;
};

module.exports = mongoose.model("User", UserSchema); //Exporta el modulo
//Lo pone en minuscula y en plural
// en la base de datos se guarda como users
