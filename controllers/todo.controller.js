const db = require("../models");
const request = require("./requests/todo.request");
const Todo = db.todos;
const TodoHistory = db.todoHistory; // Import the new TodoHistory model

// Create new Todo
exports.create = (req, res) => {
  request.validate(req, res);

  const todo = new Todo({
    title: req.body.title,
    status: req.body.status,
  });

  todo
    .save(todo)
    .then((data) => res.send(data))
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Todo.",
      });
    });
};

exports.findAll = (req, res) => {
  Todo.find({ isDeleted: false })
    .then((data) => res.send(data))
    .catch((err) =>
      res
        .status(500)
        .send({ message: err.message || "Error retrieving todos." })
    );
};

exports.findRecycleBin = (req, res) => {
  Todo.find({ isDeleted: true })
    .then((data) => {
      if (!data.length) {
        return res
          .status(404)
          .send({ message: "No items found in recycle bin." });
      }
      res.send(data);
    })
    .catch((err) => {
      res
        .status(500)
        .send({ message: "Error retrieving items from recycle bin." });
    });
};

exports.findDeletedOne = (req, res) => {
  const id = req.params.id;

  Todo.findOne({ _id: id, isDeleted: true }) // Search for the Todo with isDeleted set to true
    .then((data) => {
      if (!data) {
        return res
          .status(404)
          .send({ message: `Todo with id ${id} not found in recycle bin.` });
      }
      res.send(data);
    })
    .catch((err) =>
      res.status(500).send({ message: `Error retrieving Todo with id=${id}` })
    );
};

exports.restore = (req, res) => {
  const id = req.params.id;

  Todo.findById(id)
    .then((data) => {
      if (!data || !data.isDeleted) {
        return res
          .status(404)
          .send({ message: `Todo with id ${id} not found in recycle bin.` });
      }

      data.isDeleted = false;
      data.deletedAt = null; // Clear deletion timestamp
      data
        .save()
        .then(() => res.send({ message: "Todo restored successfully!", data }))
        .catch((err) =>
          res
            .status(500)
            .send({ message: `Error restoring Todo with id=${id}` })
        );
    })
    .catch((err) =>
      res.status(500).send({ message: "Error retrieving Todo with id=" + id })
    );
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  const includeDeleted = req.query.includeDeleted === "true"; // New query parameter to include deleted

  const query = { _id: id };
  if (!includeDeleted) query.isDeleted = false; // Only include non-deleted by default

  Todo.findOne(query)
    .then((data) => {
      if (!data) {
        res.status(404).send({ message: `Not found Todo with id ${id}` });
      } else {
        res.send(data);
      }
    })
    .catch((err) => {
      res.status(500).send({ message: `Error retrieving Todo with id=${id}` });
    });
};

exports.update = (req, res) => {
  request.validate(req, res);

  const id = req.params.id;
  const overrideDeleted = req.query.overrideDeleted === "true"; // Allows updating deleted records

  Todo.findById(id)
    .then(async (data) => {
      if (!data) {
        return res
          .status(404)
          .send({ message: `Todo with id ${id} not found.` });
      }

      if (data.isDeleted && !overrideDeleted) {
        return res.status(403).send({
          message: `Todo with id=${id} is deleted. Pass overrideDeleted=true to modify it.`,
        });
      }

      try {
        // Archive current Todo if not deleted or if override is enabled
        if (!data.isDeleted || overrideDeleted) {
          const archivedTodo = new TodoHistory({
            todoId: data._id,
            data: data.toObject(), // Capture a snapshot of the current Todo
            operation: "modified",
          });
          await archivedTodo.save(); // Save the snapshot in history
        }

        // Update the Todo fields
        Object.assign(data, req.body); // Update fields from req.body
        data.version = (data.version || 0) + 1; // Increment version
        data.isDeleted = false; // Restore if soft-deleted

        // Save the updated Todo
        const updatedTodo = await data.save();
        res.send({ message: "Todo updated successfully!", data: updatedTodo });
      } catch (err) {
        res.status(500).send({
          message: `Error updating Todo with id=${id}: ${err.message}`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({ message: `Error retrieving Todo with id=${id}` })
    );
};

exports.delete = (req, res) => {
  const id = req.params.id;

  Todo.findById(id)
    .then(async (data) => {
      if (!data) {
        return res
          .status(404)
          .send({ message: `Todo with id ${id} not found.` });
      }

      try {
        data.isDeleted = true;
        data.deletedAt = new Date(); // Set deletion timestamp

        // Archive current Todo before soft deletion
        const archivedTodo = new TodoHistory({
          todoId: data._id,
          data: data.toObject(),
          operation: "deleted",
        });
        await archivedTodo.save();

        await data.save();
        res.send({ message: "Todo moved to recycle bin successfully!", data });
      } catch (err) {
        res.status(500).send({
          message: `Error moving Todo with id=${id} to recycle bin: ${err.message}`,
        });
      }
    })
    .catch((err) =>
      res.status(500).send({ message: `Error retrieving Todo with id=${id}` })
    );
};

exports.deleteAll = (req, res) => {
  Todo.deleteMany({})
    .then((data) => {
      res.send({
        message: `${data.deletedCount} Todos have been deleted successfully !`,
      });
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all Todos !",
      });
    });
};
