// const socketIo = (io) => {
//     //Store connected users with their room information using socket.id as their key
//     const connectedUsers = new Map();
//     //Handle new socket connections
//     io.on("connection", (socket) => {
//       //Get user from authentication
//       const user = socket.handshake.auth.user;
//       console.log("User connected", user?.username);
//       //!START: Join room Handler
//       socket.on("join room", (groupId) => {
//         //Add socket to the specified room
//         socket.join(groupId);
//         //Store user and room info in connectedUsers map
//         connectedUsers.set(socket.id, { user, room: groupId });
//         //Get list of all users currently in the room
//         const usersInRoom = Array.from(connectedUsers.values())
//           .filter((u) => u.room === groupId)
//           .map((u) => u.user);
//         // Emit updated users list to all clients in the room
//         io.in(groupId).emit("users in room", usersInRoom);
//         // Broadcast join notification to all other users in the room
//         socket.to(groupId).emit("notification", {
//           type: "USER_JOINED",
//           message: `${user?.username} has joined`,
//           user: user,
//         });
//       });
//       //!END:Join room Handler
  
//       //!START: Leave room Handler
//       //Triggered when user manually leaves a room
//       socket.on("leave room", (groupId) => {
//         console.log(`${user?.username} leaving room:`, groupId);
//         //Remove socket from the room
//         socket.leave(groupId);
//         if (connectedUsers.has(socket.id)) {
//           //Remove user from connected users and notify others
//           connectedUsers.delete(socket.id);
//           socket.to(groupId).emit("user left", user?._id);
//         }
//       });
//       //!END:Leave room Handler
  
//       //!START: New Message Handler
//       //Triggered when user sends a new message
//       socket.on("new message", (message) => {
//         // Broadcast message to all other users in the room
//         socket.to(message.groupId).emit("message received", message);//socket.to means to  send all other people except sender
//       });
//       //!END:New Message Handler
  
//       //!START: Disconnect Handler
//       //Triggered when user closes the connection
//       socket.on("disconnect", () => {
//         console.log(`${user?.username} disconnected`);
//         if (connectedUsers.has(socket.id)) {
//           // Get user's room info before removing
//           const userData = connectedUsers.get(socket.id);
//           //Notify others in the room about user's departure
//           socket.to(userData.room).emit("user left", user?._id);
//           //Remove user from connected users
//           connectedUsers.delete(socket.id);
//         }
//       });
//       //!END:Disconnect Handler
  
//       //!START: Typing Indicator
//       //Triggered when user starts typing
//       socket.on("typing", ({ groupId, username }) => {
//         //Broadcast typing status to other users in the room
//         socket.to(groupId).emit("user typing", { username });
//       });
  
//       socket.on("stop typing", ({ groupId }) => {
//         //Broadcast stop typing status to other users in the room
//         socket.to(groupId).emit("user stop typing", { username: user?.username });
//       });
//       //!END:Typing Indicator
//     });
//   };
  
//   module.exports = socketIo;

const socketIo = (io) => {
  const connectedUsers = new Map(); // Track users & rooms
  const pendingRequests = new Map(); // Store pending join requests

  io.on("connection", (socket) => {
    const user = socket.handshake.auth.user;
    console.log("User connected:", user?.username);

    //! 🟢 User Requests to Join a Room
    socket.on("join request", (data) => {
      const { groupId, adminId } = data;

      // Store the request
      pendingRequests.set(user._id, groupId);

      // Notify the admin about the request
      io.to(adminId).emit("new join request", {
        userId: user._id,
        username: user.username,
        groupId,
      });
    });

    //! 🟢 Admin Approves the Request
    socket.on("approve request", (data) => {
      const { userId, groupId } = data;

      if (pendingRequests.get(userId) === groupId) {
        pendingRequests.delete(userId); // Remove request from pending list

        // Notify the user that they are approved
        io.to(userId).emit("join approved", { groupId });
      }
    });

    //! 🔴 Admin Rejects the Request
    socket.on("reject request", (data) => {
      const { userId, groupId } = data;

      if (pendingRequests.get(userId) === groupId) {
        pendingRequests.delete(userId);

        // Notify the user that they were rejected
        io.to(userId).emit("join rejected", { message: "Your request was denied" });
      }
    });

    //! 🟢 User Joins the Room After Approval
    socket.on("join room", (groupId) => {
      // Check if the user was approved
      if (!pendingRequests.has(user._id)) {
        socket.join(groupId);
        connectedUsers.set(socket.id, { user, room: groupId });

        const usersInRoom = Array.from(connectedUsers.values())
          .filter((u) => u.room === groupId)
          .map((u) => u.user);

        io.in(groupId).emit("users in room", usersInRoom);

        socket.to(groupId).emit("notification", {
          type: "USER_JOINED",
          message: `${user?.username} has joined`,
          user: user,
        });
      } else {
        socket.emit("error", { message: "You need admin approval to join." });
      }
    });

    //! 🔴 User Leaves the Room
    socket.on("leave room", (groupId) => {
      console.log(`${user?.username} leaving room:`, groupId);
      socket.leave(groupId);
      connectedUsers.delete(socket.id);
      socket.to(groupId).emit("user left", user?._id);
    });

    //! 🟢 Handle New Messages
    socket.on("new message", (message) => {
      socket.to(message.groupId).emit("message received", message);
    });

    //! 🔴 Handle User Disconnect
    socket.on("disconnect", () => {
      console.log(`${user?.username} disconnected`);
      if (connectedUsers.has(socket.id)) {
        const userData = connectedUsers.get(socket.id);
        socket.to(userData.room).emit("user left", user?._id);
        connectedUsers.delete(socket.id);
      }
    });

    //! 🟢 Typing Indicator
    socket.on("typing", ({ groupId, username }) => {
      socket.to(groupId).emit("user typing", { username });
    });

    socket.on("stop typing", ({ groupId }) => {
      socket.to(groupId).emit("user stop typing", { username: user?.username });
    });
  });
};

module.exports = socketIo;

// const socketIo = (io) => {
//   // Store connected users with their room information
//   const connectedUsers = new Map();
//   // Store pending join requests
//   const pendingRequests = new Map();

//   io.on("connection", (socket) => {
//     const user = socket.handshake.auth.user;
//     console.log("User connected", user?.username);

//     // Handle join requests
//     socket.on("join request", (data) => {
//       const { groupId, adminId } = data;
      
//       // Store the request
//       pendingRequests.set(user._id, groupId);

//       // Notify admin about the request
//       io.to(adminId).emit("new join request", {
//         userId: user._id,
//         username: user.username,
//         groupId,
//       });
//     });

//     // Handle admin approval
//     socket.on("approve request", (data) => {
//       const { userId, groupId } = data;
      
//       if (pendingRequests.get(userId) === groupId) {
//         pendingRequests.delete(userId);
//         io.to(userId).emit("join approved", { groupId });
//       }
//     });

//     // Handle admin rejection
//     socket.on("reject request", (data) => {
//       const { userId, groupId } = data;
      
//       if (pendingRequests.get(userId) === groupId) {
//         pendingRequests.delete(userId);
//         io.to(userId).emit("join rejected", { 
//           message: "Your request was denied" 
//         });
//       }
//     });

//     // Modified join room handler
//     socket.on("join room", (groupId) => {
//       // Only allow join if user was approved or is admin
//       // You might want to add admin check here
//       if (!pendingRequests.has(user._id)) {
//         socket.join(groupId);
//         connectedUsers.set(socket.id, { user, room: groupId });

//         const usersInRoom = Array.from(connectedUsers.values())
//           .filter((u) => u.room === groupId)
//           .map((u) => u.user);

//         io.in(groupId).emit("users in room", usersInRoom);
        
//         socket.to(groupId).emit("notification", {
//           type: "USER_JOINED",
//           message: `${user?.username} has joined`,
//           user: user,
//         });
//       } else {
//         socket.emit("error", { 
//           message: "You need admin approval to join." 
//         });
//       }
//     });

//     // Leave room handler (unchanged)
//     socket.on("leave room", (groupId) => {
//       console.log(`${user?.username} leaving room:`, groupId);
//       socket.leave(groupId);
//       connectedUsers.delete(socket.id);
//       socket.to(groupId).emit("user left", user?._id);
//     });

//     // New message handler (unchanged)
//     socket.on("new message", (message) => {
//       socket.to(message.groupId).emit("message received", message);
//     });

//     // Disconnect handler (unchanged)
//     socket.on("disconnect", () => {
//       console.log(`${user?.username} disconnected`);
//       if (connectedUsers.has(socket.id)) {
//         const userData = connectedUsers.get(socket.id);
//         socket.to(userData.room).emit("user left", user?._id);
//         connectedUsers.delete(socket.id);
//       }
//     });

//     // Typing handlers (unchanged)
//     socket.on("typing", ({ groupId, username }) => {
//       socket.to(groupId).emit("user typing", { username });
//     });

//     socket.on("stop typing", ({ groupId }) => {
//       socket.to(groupId).emit("user stop typing", { 
//         username: user?.username 
//       });
//     });
//   });
// };

// module.exports = socketIo;