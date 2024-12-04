const mongoose = require("mongoose");

const ParentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    notificationsEnabled: { type: Boolean, default: true },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }], // List of associated students
});

module.exports = mongoose.model("parent", ParentSchema);
