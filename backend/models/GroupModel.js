const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
//real
//schema
// const groupSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     description: {
//       type: String,
//       required: true,
//     },
//     members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     admin: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// const Group = mongoose.model("Group", groupSchema);
// module.exports = Group;


//const mongoose = require("mongoose");

// // Schema
// const groupSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     description: {
//       type: String,
//       required: true,
//     },
//     members: [{
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User"
//     }],
//     admin: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// const Group = mongoose.model("Group", groupSchema);
// module.exports = Group;


const groupSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  allowedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }], // Groups user can join
  joinedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }] // Groups user has joined
});
const group = mongoose.model("group", groupSchema);
module.exports = group;
