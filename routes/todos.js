const express = require("express");
const router = express.Router();

const todo = require("../controllers/todo.controller");

// Create a new Todo
router.post("/", todo.create);

// Retrieve all todo list
router.get("/", todo.findAll);

// Retrieve a single Todo with id
router.get("/recycle-bin", todo.findRecycleBin);

// Update a Todo with id
router.put("/:id", todo.update);

// Delete a Todo with id
router.delete("/:id", todo.delete);

// Create a new Todo
router.delete("/", todo.deleteAll);

// Retrieve soft-deleted items
router.get("/:id", todo.findOne);

router.get("/recycle-bin/:id", todo.findDeletedOne);

// Restore soft-deleted item
router.post("/:id/restore", todo.restore);

module.exports = router;
