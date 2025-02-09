// const express = require("express");
// const Group = require("../models/GroupModel");
// const { protect, isAdmin } = require("../middleware/authMiddleware");
// const { trusted } = require("mongoose");
// // const JoinRequest = require('../models/JoinRequest');
// // const User = require('../models/User');
// const groupRouter = express.Router();

// //Create a new group
// groupRouter.post("/",protect,isAdmin,async (req, res) => {
//   try {
//     const { name, description } = req.body;
//     const group = await Group.create({
//       name,
//       description,
//       admin: req.user._id,
//       members: [req.user._id],
//     });
//     const populatedGroup = await Group.findById(group._id)
//       .populate("admin", "username email")
//       .populate("members", "username email");
//     res.status(201).json({ populatedGroup });
//   } catch (error) {
//     console.log(error);

//     res.status(400).json({ message: error.message });
//   }
// });

// //get all groups(list of all groups)
// groupRouter.get("/", protect, async (req, res) => {
//   try {
//     const groups = await Group.find()
//       .populate("admin", "username email")
//       .populate("members", "username email");
//     res.json(groups);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// // //Join group
// groupRouter.post("/:groupId/join", protect, async (req, res) => {
//   try {
//     const group = await Group.findById(req.params.groupId);

//     if (!group) {
//       return res.status(404).json({ message: "Group not found" });
//     }
//     if (group.members.includes(req.user._id)) {
//       return res.status(400).json({
//         message: "Already a member of this group",
//       });
//     }
//     group.members.push(req.user._id);
//     await group.save();
//     res.json({ message: "Successfully joined this group" });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// // //leave a group
// groupRouter.post("/:groupId/leave", protect, async (req, res) => {
//   try {
//     const group = await Group.findById(req.params.groupId);
//     if (!group) {
//       return res.status(404).json({ message: "Group not found" });
//     }
//     if (!group.members.includes(req.user._id)) {
//       return res.status(400).json({ message: "Not a member of this group" });
//     }
//     group.members = group.members.filter((memberId) => {
//       return memberId.toString() !== req.user._id.toString();
//     });
//     await group.save();
//     res.json({ message: "Successfully left the group" });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });
//real (above)

const express = require("express");
const Group = require("../models/GroupModel");
const { protect, isAdmin } = require("../middleware/authMiddleware");
const { trusted } = require("mongoose");

const groupRouter = express.Router();

//Create a new group
groupRouter.post("/", protect, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await Group.create({
      name,
      description,
      admin: req.user._id,
      members: [req.user._id],
    });
    const populatedGroup = await Group.findById(group._id)
      .populate("admin", "username email")
      .populate("members", "username email");
    res.status(201).json({ populatedGroup });
  } catch (error) {
    console.log(error);

    res.status(400).json({ message: error.message });
  }
});

//get all groups
groupRouter.get("/", protect, async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("admin", "username email")
      .populate("members", "username email");
    res.json(groups);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//Join group
// groupRouter.post("/:groupId/join", protect, async (req, res) => {
//   try {
//     const group = await Group.findById(req.params.groupId);

//     if (!group) {
//       return res.status(404).json({ message: "Group not found" });
//     }
//     if (group.members.includes(req.user._id)) {
//       return res.status(400).json({
//         message: "Already a member of this group",
//       });
//     }
//     group.members.push(req.user._id);
//     await group.save();
//     res.json({ message: "Successfully joined this group" });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });
groupRouter.post("/:groupId/join", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (group.members.includes(req.user._id)) {
      return res.status(400).json({
        message: "Already a member of this group",
      });
    }
    group.members.push(req.user._id);
    await group.save();
    res.json({ message: "Successfully joined this group" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



//leave a group
groupRouter.post("/:groupId/leave", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (!group.members.includes(req.user._id)) {
      return res.status(400).json({ message: "Not a member of this group" });
    }
    group.members = group.members.filter((memberId) => {
      return memberId.toString() !== req.user._id.toString();
    });
    await group.save();
    res.json({ message: "Successfully left the group" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});





// const express = require("express");
// const Group = require("../models/GroupModel");
// const User = require("../models/UserModel");
// const { protect, isAdmin } = require("../middleware/authMiddleware");

// const groupRouter = express.Router();

// /**
//  * ✅ Create a new group (Only Admins)
//  * 🔹 Endpoint: POST /api/groups/
//  */
// groupRouter.post("/", protect, isAdmin, async (req, res) => {
//   try {
//     const { name, description, allowedUsers } = req.body;

//     const group = await Group.create({
//       name,
//       description,
//       admin: req.user._id,
//       members: [req.user._id], // Auto-add admin as the first member
//       allowedUsers, // List of users who can join
//     });

//     const populatedGroup = await Group.findById(group._id)
//       .populate("admin", "username email")
//       .populate("members", "username email");

//     res.status(201).json({ populatedGroup });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// /**
//  * ✅ Get all groups (List all groups)
//  * 🔹 Endpoint: GET /api/groups/
//  */
// groupRouter.get("/", protect, async (req, res) => {
//   try {
//     const groups = await Group.find()
//       .populate("admin", "username email")
//       .populate("members", "username email");

//     res.json(groups);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// /**
//  * ✅ Join a group (Only Allowed Users)
//  * 🔹 Endpoint: POST /api/groups/:groupId/join
//  */
// groupRouter.post("/:groupId/join", protect, async (req, res) => {
//   try {
//     const group = await Group.findById(req.params.groupId);
//     const user = await User.findById(req.user._id);

//     if (!group) return res.status(404).json({ message: "Group not found" });

//     // ✅ Restrict joining only to users in `allowedGroups`
//     if (!user.allowedGroups.includes(group._id)) {
//       return res.status(403).json({ message: "You are not allowed to join this group" });
//     }

//     // ✅ Prevent duplicate joins
//     if (group.members.includes(req.user._id)) {
//       return res.status(400).json({ message: "Already a member of this group" });
//     }

//     group.members.push(req.user._id);
//     await group.save();

//     res.json({ message: "Successfully joined the group" });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// /**
//  * ✅ Leave a group
//  * 🔹 Endpoint: POST /api/groups/:groupId/leave
//  */
// groupRouter.post("/:groupId/leave", protect, async (req, res) => {
//   try {
//     const group = await Group.findById(req.params.groupId);

//     if (!group) return res.status(404).json({ message: "Group not found" });

//     if (!group.members.includes(req.user._id)) {
//       return res.status(400).json({ message: "Not a member of this group" });
//     }

//     // ✅ Remove user from group members
//     group.members = group.members.filter(memberId => !memberId.equals(req.user._id));
//     await group.save();

//     res.json({ message: "Successfully left the group" });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

module.exports = groupRouter;




// groupRouter.get('/:groupId/check-permission', auth, async (req, res) => {
//   try {
//     const group = await Group.findById(req.params.groupId);
//     const userId = req.user._id;

//     if (group.members.includes(userId)) {
//       return res.json({ canJoin: true });
//     }

//     const pendingRequest = await JoinRequest.findOne({
//       group: req.params.groupId,
//       user: userId,
//       status: 'pending'
//     });

//     if (pendingRequest) {
//       return res.json({ canJoin: false, status: 'pending' });
//     }

//     res.json({ canJoin: false, status: 'not_requested' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Send a join request
// groupRouter.post('/:groupId/join-request', auth, async (req, res) => {
//   try {
//     const group = await Group.findById(req.params.groupId);
//     if (!group) {
//       return res.status(404).json({ message: 'Group not found' });
//     }

//     const joinRequest = new JoinRequest({
//       user: req.user._id,
//       group: req.params.groupId,
//       status: 'pending'
//     });

//     await joinRequest.save();

//     res.json({ message: 'Join request sent successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Approve or reject a join request
// groupRouter.put('/:groupId/join-request/:requestId', auth, async (req, res) => {
//   try {
//     const group = await Group.findById(req.params.groupId);
//     if (group.admin.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: 'Not authorized' });
//     }

//     const { status } = req.body;
//     const joinRequest = await JoinRequest.findById(req.params.requestId);
    
//     if (status === 'approved') {
//       await Group.findByIdAndUpdate(req.params.groupId, {
//         $addToSet: { members: joinRequest.user }
//       });
//     }

//     joinRequest.status = status;
//     await joinRequest.save();

//     res.json({ message: `Join request ${status}` });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

//module.exports = groupRouter;



// const express = require("express");
// const Group = require("../models/GroupModel");
// const JoinRequest = require("../models/JoinRequest");
// const { protect, isAdmin } = require("../middleware/authMiddleware");

// const groupRouter = express.Router();

// // ================== CREATE GROUP ==================
// groupRouter.post("/", protect, isAdmin, async (req, res) => {
//   try {
//     const { name, description } = req.body;

//     const group = await Group.create({
//       name,
//       description,
//       admin: req.user._id,
//       members: [req.user._id], // Admin is the first member
//     });

//     const populatedGroup = await Group.findById(group._id)
//       .populate("admin", "username email")
//       .populate("members", "username email");

//     res.status(201).json({ populatedGroup });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// // ================== FETCH ALL GROUPS ==================
// groupRouter.get("/", protect, async (req, res) => {
//   try {
//     const groups = await Group.find()
//       .populate("admin", "username email")
//       .populate("members", "username email");
//     res.json(groups);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// // ================== JOIN GROUP DIRECTLY (No Request) ==================
// groupRouter.post("/:groupId/join", async (req, res) => {
//   const { groupId } = req.params;
//   const userId = req.user.id;  // Assuming authentication middleware

//   // List of groups where joining is disabled
//   const restrictedGroups = ["67a5956abcd", "1234efgh5678"]; // Example group IDs

//   if (restrictedGroups.includes(groupId)) {
//       return res.status(403).json({ message: "Joining this group is disabled." });
//   }

//   try {
//       const group = await Group.findById(groupId);
//       if (!group) {
//           return res.status(404).json({ message: "Group not found" });
//       }

//       // Check if user is already in the group
//       if (group.members.includes(userId)) {
//           return res.status(400).json({ message: "You are already in this group" });
//       }

//       group.members.push(userId);
//       await group.save();

//       res.status(200).json({ message: "Joined group successfully!" });
//   } catch (error) {
//       res.status(500).json({ message: "Server error" });
//   }
// });

// // ================== LEAVE GROUP ==================
// groupRouter.post("/:groupId/leave", protect, async (req, res) => {
//   try {
//     const group = await Group.findById(req.params.groupId);
//     if (!group) return res.status(404).json({ message: "Group not found" });

//     if (!group.members.includes(req.user._id))
//       return res.status(400).json({ message: "Not a member of this group" });

//     group.members = group.members.filter(
//       (memberId) => memberId.toString() !== req.user._id.toString()
//     );
//     await group.save();

//     res.json({ message: "Successfully left the group" });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// // ================== CHECK IF USER CAN JOIN GROUP ==================
// groupRouter.get("/:groupId/check-permission", protect, async (req, res) => {
//   try {
//     const group = await Group.findById(req.params.groupId);
//     const userId = req.user._id;

//     if (group.members.includes(userId)) {
//       return res.json({ canJoin: true });
//     }

//     const pendingRequest = await JoinRequest.findOne({
//       group: req.params.groupId,
//       user: userId,
//       status: "pending",
//     });

//     if (pendingRequest) {
//       return res.json({ canJoin: false, status: "pending" });
//     }

//     res.json({ canJoin: false, status: "not_requested" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // ================== SEND JOIN REQUEST ==================
// groupRouter.post("/:groupId/join-request", protect, async (req, res) => {
//   try {
//     const group = await Group.findById(req.params.groupId);
//     if (!group) return res.status(404).json({ message: "Group not found" });

//     const existingRequest = await JoinRequest.findOne({
//       user: req.user._id,
//       group: req.params.groupId,
//       status: "pending",
//     });

//     if (existingRequest)
//       return res.status(400).json({ message: "Join request already pending" });

//     const joinRequest = new JoinRequest({
//       user: req.user._id,
//       group: req.params.groupId,
//       status: "pending",
//     });

//     await joinRequest.save();

//     res.json({ message: "Join request sent successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // ================== APPROVE OR REJECT JOIN REQUEST ==================
// groupRouter.put("/:groupId/join-request/:requestId", protect, async (req, res) => {
//   try {
//     const group = await Group.findById(req.params.groupId);
//     if (!group) return res.status(404).json({ message: "Group not found" });

//     if (group.admin.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: "Not authorized" });
//     }

//     const { status } = req.body; // "approved" or "rejected"
//     const joinRequest = await JoinRequest.findById(req.params.requestId);
//     if (!joinRequest) return res.status(404).json({ message: "Request not found" });

//     if (status === "approved") {
//       await Group.findByIdAndUpdate(req.params.groupId, {
//         $addToSet: { members: joinRequest.user },
//       });
//     }

//     joinRequest.status = status;
//     await joinRequest.save();

//     res.json({ message: `Join request ${status}` });
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = groupRouter;
