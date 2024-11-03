const mongoose = require("mongoose");
const { Schema } = mongoose;

const TodoHistorySchema = new Schema({
  todoId: { type: mongoose.Schema.Types.ObjectId, ref: "Todo", required: true },
  data: { type: Object, required: true }, // Store the Todo data
  operation: { type: String, enum: ["modified", "deleted"], required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = (mongoose) => {
  const TodoHistory = mongoose.model(
    "TodoHistory",
    mongoose.Schema(TodoHistorySchema, { timestamps: true })
  );

  return TodoHistory;
};
