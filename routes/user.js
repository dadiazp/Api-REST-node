" use strict";

var express = require("express"); //Cargo express
var UserController = require("../controllers/user"); //Cargo el controlador de usuario

var router = express.Router(); //Cargo el objeto router
var md_auth = require("../middlewares/authenticated");

var multipart = require("connect-multiparty"); //Permite recibir files por post, put
var md_upload = multipart({ uploadDir: "./uploads/users" });

router.get("/probando", UserController.probando);
router.post("/testeando", UserController.testeando);

router.post("/register", UserController.save);
router.post("/login", UserController.login);
router.put("/update", md_auth.authenticated, UserController.update);
router.post("/upload-avatar", [md_auth.authenticated, md_upload], UserController.uploadAvatar); //Aca hay 2 middlewares
router.get("/avatar/:fileName", UserController.avatar);
router.get("/users", UserController.getUsers);
router.get("/user/:userId", UserController.getUser);

module.exports = router; //Exporto el objeto router que lleva todas las configuraciones de las rutas
