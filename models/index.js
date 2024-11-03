const dbConfig = require("../config/db.config.js");

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const Todo = require("./todo.model.js")(mongoose);
const TodoHistory = require("./todoHistory.model.js")(mongoose);

const db = {
  mongoose: mongoose,
  url: dbConfig.url,
  todos: Todo,
  todoHistory: TodoHistory,
};
module.exports = db;
