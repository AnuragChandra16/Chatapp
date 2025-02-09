import {
  Box,
  VStack,
  Text,
  Input,
  Button,
  Flex,
  Icon,
  Avatar,
  InputGroup,
  InputRightElement,
  useToast
} from "@chakra-ui/react";
import { FiSend, FiInfo, FiMessageCircle } from "react-icons/fi";
import UsersList from "./UsersList";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const ChatArea = ({ selectedGroup, socket }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const toast = useToast();

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (selectedGroup && socket) {
      fetchMessages();

      socket.emit("join room", selectedGroup._id);

      // Message handlers
      const messageHandler = (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      };

      // User handlers
      const usersInRoomHandler = (users) => {
        setConnectedUsers(users);
      };

      const userJoinedHandler = (user) => {
        setConnectedUsers((prev) => [...prev, user]);
      };

      const userLeftHandler = (userId) => {
        setConnectedUsers((prev) =>
          prev.filter((user) => user._id !== userId)
        );
      };

      // Notification handler
      const notificationHandler = (notification) => {
        toast({
          title: notification?.type === "USER_JOINED" ? "New User" : "Notification",
          description: notification.message,
          status: "info",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      };

      // Typing handlers
      const userTypingHandler = ({ username }) => {
        if (username !== currentUser.user?.username) {
          setTypingUsers((prev) => new Set(prev).add(username));
        }
      };

      const userStopTypingHandler = ({ username }) => {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(username);
          return newSet;
        });
      };

      // Add event listeners
      socket.on("message received", messageHandler);
      socket.on("users in room", usersInRoomHandler);
      socket.on("user joined", userJoinedHandler);
      socket.on("user left", userLeftHandler);
      socket.on("notification", notificationHandler);
      socket.on("user typing", userTypingHandler);
      socket.on("user stop typing", userStopTypingHandler);

      // Cleanup
      return () => {
        socket.emit("leave room", selectedGroup._id);
        socket.off("message received", messageHandler);
        socket.off("users in room", usersInRoomHandler);
        socket.off("user joined", userJoinedHandler);
        socket.off("user left", userLeftHandler);
        socket.off("notification", notificationHandler);
        socket.off("user typing", userTypingHandler);
        socket.off("user stop typing", userStopTypingHandler);
        
        // Clear typing states
        setIsTyping(false);
        setTypingUsers(new Set());
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [selectedGroup, socket, toast, currentUser.user?.username]);

  const fetchMessages = async () => {
    const token = currentUser.user?.token;
    try {
      const { data } = await axios.get(
        `https://chatapp-n1dh.onrender.com/api/messages/${selectedGroup._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = currentUser.user?.token;
      const { data } = await axios.post(
        "https://chatapp-n1dh.onrender.com/api/messages",
        {
          content: newMessage,
          groupId: selectedGroup._id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Emit message and stop typing
      socket.emit("new message", {
        ...data,
        groupId: selectedGroup._id,
      });

      socket.emit("stop typing", {
        groupId: selectedGroup._id,
        username: currentUser.user.username,
      });

      // Clear states
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
      setIsTyping(false);
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(currentUser.user.username);
        return newSet;
      });

    } catch (error) {
      toast({
        title: "Error sending message",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping && selectedGroup) {
      setIsTyping(true);
      socket.emit("typing", {
        groupId: selectedGroup._id,
        username: currentUser.user.username,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (selectedGroup) {
        socket.emit("stop typing", {
          groupId: selectedGroup._id,
          username: currentUser.user.username,
        });
      }
      setIsTyping(false);
    }, 2000);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
//check permission 
const joinGroup = async (groupId) => {
  try {
    const token = currentUser.user?.token;

    const { data: permission } = await axios.get(
      `https://chatapp-n1dh.onrender.com/api/groups/${groupId}/check-permission`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (permission.canJoin) {
      socket.emit("join room", groupId);
    } else {
      if (permission.status === 'pending') {
        toast({
          title: "Join Request Pending",
          description: "Your request to join this group is awaiting admin approval",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      } else {
        const { data } = await axios.post(
          `https://chatapp-n1dh.onrender.com/api/groups/${groupId}/join-request`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        toast({
          title: "Join Request Sent",
          description: "Request sent to group admin for approval",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  } catch (error) {
    toast({
      title: "Error",
      description: error.response?.data?.message || "Failed to join group",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  }
};

  const renderTypingIndicator = () => {
    const typingUsersArray = Array.from(typingUsers);
    if (typingUsersArray.length === 0) return null;

    return typingUsersArray.map((username) => {
      if (username === currentUser.user?.username) return null;
      
      return (
        <Box key={username} alignSelf="flex-start" maxW="70%">
          <Flex align="center" bg="gray.50" p={2} borderRadius="lg" gap={2}>
            <Avatar size="xs" name={username} />
            <Flex align="center" gap={1}>
              <Text fontSize="sm" color="gray.500" fontStyle="italic">
                {username} is typing
              </Text>
              <Flex gap={1}>
                {[1, 2, 3].map((dot) => (
                  <Box
                    key={dot}
                    w="3px"
                    h="3px"
                    borderRadius="full"
                    bg="gray.500"
                  />
                ))}
              </Flex>
            </Flex>
          </Flex>
        </Box>
      );
    });
  };

  // Rest of your render code remains the same
  return (
    <Flex h="100%" position="relative">
      <Box
        flex="1"
        display="flex"
        flexDirection="column"
        bg="gray.50"
        maxW={`calc(100% - 260px)`}
      >
        {selectedGroup ? (
          <>
            <Flex
              px={6}
              py={4}
              bg="white"
              borderBottom="1px solid"
              borderColor="gray.200"
              align="center"
              boxShadow="sm"
            >
              <Icon as={FiMessageCircle} fontSize="24px" color="blue.500" mr={3} />
              <Box flex="1">
                <Text fontSize="lg" fontWeight="bold" color="gray.800">
                  {selectedGroup.name}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {selectedGroup.description}
                </Text>
              </Box>
              <Icon
                as={FiInfo}
                fontSize="20px"
                color="gray.400"
                cursor="pointer"
                _hover={{ color: "blue.500" }}
              />
            </Flex>

            <VStack
              flex="1"
              overflowY="auto"
              spacing={4}
              align="stretch"
              px={6}
              py={4}
              position="relative"
              sx={{
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  width: "10px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "gray.200",
                  borderRadius: "24px",
                },
              }}
            >
              {messages.map((message) => (
                <Box
                  key={message._id}
                  alignSelf={
                    message.sender._id === currentUser.user?._id
                      ? "flex-end"
                      : "flex-start"
                  }
                  maxW="70%"
                >
                  <Flex direction="column" gap={1}>
                    <Flex
                      align="center"
                      mb={1}
                      justifyContent={
                        message.sender._id === currentUser.user?._id
                          ? "flex-end"
                          : "flex-start"
                      }
                      gap={2}
                    >
                      {message.sender._id === currentUser.user?._id ? (
                        <>
                          <Avatar size="xs" name={message.sender.username} />
                          <Text fontSize="xs" color="gray.500">
                            You • {formatTime(message.createdAt)}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text fontSize="xs" color="gray.500">
                            {message.sender.username} • {formatTime(message.createdAt)}
                          </Text>
                          <Avatar size="xs" name={message.sender.username} />
                        </>
                      )}
                    </Flex>

                    <Box
                      bg={
                        message.sender._id === currentUser.user?._id
                          ? "blue.500"
                          : "white"
                      }
                      color={
                        message.sender._id === currentUser.user?._id
                          ? "white"
                          : "gray.800"
                      }
                      p={3}
                      borderRadius="lg"
                      boxShadow="sm"
                    >
                      <Text>{message.content}</Text>
                    </Box>
                  </Flex>
                </Box>
              ))}
              {renderTypingIndicator()}
              <div ref={messagesEndRef} />
            </VStack>

            <Box
              p={4}
              bg="white"
              borderTop="1px solid"
              borderColor="gray.200"
              position="relative"
              zIndex="1"
            >
              <InputGroup size="lg">
                <Input
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type your message..."
                  pr="4.5rem"
                  bg="gray.50"
                  border="none"
                  _focus={{
                    boxShadow: "none",
                    bg: "gray.100",
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    colorScheme="blue"
                    borderRadius="full"
                    _hover={{
                      transform: "translateY(-1px)",
                    }}
                    transition="all 0.2s"
                    onClick={sendMessage}
                  >
                    <Icon as={FiSend} />
                  </Button>
                </InputRightElement>
              </InputGroup>
            </Box>
          </>
        ) : (
          <Flex
            h="100%"
            direction="column"
            align="center"
            justify="center"
            p={8}
            textAlign="center"
          >
            <Icon as={FiMessageCircle} fontSize="64px" color="gray.300" mb={4} />
            <Text fontSize="xl" fontWeight="medium" color="gray.500" mb={2}>
              Welcome to the Chat
            </Text>
            <Text color="gray.500" mb={2}>
              Select a group from the sidebar to start chatting
            </Text>
          </Flex>
        )}
      </Box>

      <Box
        width="260px"
        position="sticky"
        right={0}
        top={0}
        height="100%"
        flexShrink={0}
      >
        {selectedGroup && <UsersList users={connectedUsers} />}
      </Box>
    </Flex>
  );
};

export default ChatArea;




// import {
//   Box,
//   VStack,
//   Text,
//   Input,
//   Button,
//   Flex,
//   Icon,
//   Avatar,
//   InputGroup,
//   InputRightElement,
//   useToast,
//   Popover,
//   PopoverTrigger,
//   PopoverContent,
//   PopoverHeader,
//   PopoverBody,
//   Badge,
//   IconButton
// } from "@chakra-ui/react";
// import { FiSend, FiInfo, FiMessageCircle, FiBell } from "react-icons/fi";
// import UsersList from "./UsersList";
// import { useState, useEffect, useRef, useCallback } from "react";
// import axios from "axios";

// const ChatArea = ({ selectedGroup, socket }) => {
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [connectedUsers, setConnectedUsers] = useState([]);
//   const [isTyping, setIsTyping] = useState(false);
//   const [typingUsers, setTypingUsers] = useState(new Set());
//   const [pendingRequests, setPendingRequests] = useState([]);
//   const [hasNewRequests, setHasNewRequests] = useState(false);
  
//   const messagesEndRef = useRef(null);
//   const typingTimeoutRef = useRef(null);
//   const toast = useToast();

//   const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
//   const isAdmin = selectedGroup?.groupAdmin === currentUser.user?._id;

//   const joinGroup = useCallback(async (groupId) => {
//     try {
//       const token = currentUser.user?.token;

//       const { data: permission } = await axios.get(
//         `https://chatapp-n1dh.onrender.com/api/groups/${groupId}/check-permission`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       if (permission.canJoin) {
//         socket.emit("join room", groupId);
//       } else {
//         if (permission.status === 'pending') {
//           toast({
//             title: "Join Request Pending",
//             description: "Your request to join this group is awaiting admin approval",
//             status: "info",
//             duration: 5000,
//             isClosable: true,
//           });
//         } else {
//           await axios.post(
//             `https://chatapp-n1dh.onrender.com/api/groups/${groupId}/join-request`,
//             {},
//             {
//               headers: { Authorization: `Bearer ${token}` },
//             }
//           );

//           toast({
//             title: "Join Request Sent",
//             description: "Request sent to group admin for approval",
//             status: "success",
//             duration: 3000,
//             isClosable: true,
//           });
//         }
//       }
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: error.response?.data?.message || "Failed to join group",
//         status: "error",
//         duration: 3000,
//         isClosable: true,
//       });
//     }
//   }, [currentUser.user?.token, socket, toast]);

//   const fetchMessages = async () => {
//     const token = currentUser.user?.token;
//     try {
//       const { data } = await axios.get(
//         `https://chatapp-n1dh.onrender.com/api/messages/${selectedGroup._id}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       setMessages(data);
//     } catch (error) {
//       console.error("Error fetching messages:", error);
//     }
//   };

//   useEffect(() => {
//     if (selectedGroup && socket) {
//       joinGroup(selectedGroup._id);
//       fetchMessages();

//       const messageHandler = (newMessage) => {
//         setMessages((prev) => [...prev, newMessage]);
//       };

//       const usersInRoomHandler = (users) => {
//         setConnectedUsers(users);
//       };

//       const userJoinedHandler = (user) => {
//         setConnectedUsers((prev) => [...prev, user]);
//       };

//       const userLeftHandler = (userId) => {
//         setConnectedUsers((prev) =>
//           prev.filter((user) => user._id !== userId)
//         );
//       };

//       const notificationHandler = (notification) => {
//         toast({
//           title: notification?.type === "USER_JOINED" ? "New User" : "Notification",
//           description: notification.message,
//           status: "info",
//           duration: 3000,
//           isClosable: true,
//           position: "top-right",
//         });
//       };

//       const joinRequestHandler = (request) => {
//         if (isAdmin && request.groupId === selectedGroup._id) {
//           setPendingRequests(prev => [...prev, request]);
//           setHasNewRequests(true);
//           toast({
//             title: "New Join Request",
//             description: `${request.username} wants to join the group`,
//             status: "info",
//             duration: 5000,
//             isClosable: true,
//           });
//         }
//       };

//       const userTypingHandler = ({ username }) => {
//         if (username !== currentUser.user?.username) {
//           setTypingUsers((prev) => new Set(prev).add(username));
//         }
//       };

//       const userStopTypingHandler = ({ username }) => {
//         setTypingUsers((prev) => {
//           const newSet = new Set(prev);
//           newSet.delete(username);
//           return newSet;
//         });
//       };

//       socket.on("message received", messageHandler);
//       socket.on("users in room", usersInRoomHandler);
//       socket.on("user joined", userJoinedHandler);
//       socket.on("user left", userLeftHandler);
//       socket.on("notification", notificationHandler);
//       socket.on("user typing", userTypingHandler);
//       socket.on("user stop typing", userStopTypingHandler);
//       socket.on("new join request", joinRequestHandler);

//       return () => {
//         socket.emit("leave room", selectedGroup._id);
//         socket.off("message received", messageHandler);
//         socket.off("users in room", usersInRoomHandler);
//         socket.off("user joined", userJoinedHandler);
//         socket.off("user left", userLeftHandler);
//         socket.off("notification", notificationHandler);
//         socket.off("user typing", userTypingHandler);
//         socket.off("user stop typing", userStopTypingHandler);
//         socket.off("new join request", joinRequestHandler);
        
//         setIsTyping(false);
//         setTypingUsers(new Set());
//         if (typingTimeoutRef.current) {
//           clearTimeout(typingTimeoutRef.current);
//         }
//       };
//     }
//   }, [selectedGroup, socket, toast, currentUser.user?.username, isAdmin, joinGroup]);

//   const handleJoinRequest = async (userId, approved) => {
//     try {
//       const token = currentUser.user?.token;
      
//       if (approved) {
//         socket.emit("approve request", { userId, groupId: selectedGroup._id });
//       } else {
//         socket.emit("reject request", { userId, groupId: selectedGroup._id });
//       }

//       setPendingRequests(prev => prev.filter(req => req.userId !== userId));
//       if (pendingRequests.length === 1) {
//         setHasNewRequests(false);
//       }

//       await axios.post(
//         `https://chatapp-n1dh.onrender.com/api/groups/${selectedGroup._id}/handle-request`,
//         {
//           userId,
//           approved
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//     } catch (error) {
//       toast({
//         title: "Error",
//         description: error.response?.data?.message || "Failed to handle request",
//         status: "error",
//         duration: 3000,
//         isClosable: true,
//       });
//     }
//   };

//   const sendMessage = async () => {
//     if (!newMessage.trim()) return;

//     try {
//       const token = currentUser.user?.token;
//       const { data } = await axios.post(
//         "https://chatapp-n1dh.onrender.com/api/messages",
//         {
//           content: newMessage,
//           groupId: selectedGroup._id,
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       socket.emit("new message", {
//         ...data,
//         groupId: selectedGroup._id,
//       });

//       socket.emit("stop typing", {
//         groupId: selectedGroup._id,
//         username: currentUser.user.username,
//       });

//       setMessages((prev) => [...prev, data]);
//       setNewMessage("");
//       setIsTyping(false);
//       setTypingUsers((prev) => {
//         const newSet = new Set(prev);
//         newSet.delete(currentUser.user.username);
//         return newSet;
//       });

//     } catch (error) {
//       toast({
//         title: "Error sending message",
//         status: "error",
//         duration: 3000,
//         isClosable: true,
//       });
//     }
//   };

//   const handleTyping = (e) => {
//     setNewMessage(e.target.value);

//     if (!isTyping && selectedGroup) {
//       setIsTyping(true);
//       socket.emit("typing", {
//         groupId: selectedGroup._id,
//         username: currentUser.user.username,
//       });
//     }

//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current);
//     }

//     typingTimeoutRef.current = setTimeout(() => {
//       if (selectedGroup) {
//         socket.emit("stop typing", {
//           groupId: selectedGroup._id,
//           username: currentUser.user.username,
//         });
//       }
//       setIsTyping(false);
//     }, 2000);
//   };

//   const formatTime = (date) => {
//     return new Date(date).toLocaleTimeString("en-US", {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   const renderTypingIndicator = () => {
//     const typingUsersArray = Array.from(typingUsers);
//     if (typingUsersArray.length === 0) return null;

//     return typingUsersArray.map((username) => {
//       if (username === currentUser.user?.username) return null;
      
//       return (
//         <Box key={username} alignSelf="flex-start" maxW="70%">
//           <Flex align="center" bg="gray.50" p={2} borderRadius="lg" gap={2}>
//             <Avatar size="xs" name={username} />
//             <Flex align="center" gap={1}>
//               <Text fontSize="sm" color="gray.500" fontStyle="italic">
//                 {username} is typing
//               </Text>
//               <Flex gap={1}>
//                 {[1, 2, 3].map((dot) => (
//                   <Box
//                     key={dot}
//                     w="3px"
//                     h="3px"
//                     borderRadius="full"
//                     bg="gray.500"
//                   />
//                 ))}
//               </Flex>
//             </Flex>
//           </Flex>
//         </Box>
//       );
//     });
//   };

//   const renderAdminNotifications = () => {
//     if (!isAdmin) return null;

//     return (
//       <Popover 
//         onOpen={() => setHasNewRequests(false)}
//         placement="bottom-end"
//       >
//         <PopoverTrigger>
//           <Box position="relative" mr={4}>
//             <IconButton
//               icon={<FiBell />}
//               variant="ghost"
//               aria-label="Notifications"
//               position="relative"
//             />
//             {hasNewRequests && (
//               <Badge
//                 position="absolute"
//                 top="-1"
//                 right="-1"
//                 colorScheme="red"
//                 borderRadius="full"
//                 boxSize="2"
//                 p="0"
//               />
//             )}
//           </Box>
//         </PopoverTrigger>
//         <PopoverContent width="300px">
//           <PopoverHeader fontWeight="semibold">
//             Join Requests
//           </PopoverHeader>
//           <PopoverBody>
//             {pendingRequests.length === 0 ? (
//               <Text color="gray.500">No pending requests</Text>
//             ) : (
//               <VStack align="stretch" spacing={3}>
//                 {pendingRequests.map((request) => (
//                   <Box 
//                     key={request.userId}
//                     p={3}
//                     borderWidth="1px"
//                     borderRadius="md"
//                   >
//                     <Flex justify="space-between" align="center">
//                       <Flex align="center" gap={2}>
//                         <Avatar size="sm" name={request.username} />
//                         <Text>{request.username}</Text>
//                       </Flex>
//                       <Flex gap={2}>
//                         <Button
//                           size="sm"
//                           colorScheme="green"
//                           onClick={() => handleJoinRequest(request.userId, true)}
//                         >
//                           Accept
//                         </Button>
//                         <Button
//                           size="sm"
//                           colorScheme="red"
//                           onClick={() => handleJoinRequest(request.userId, false)}
//                         >
//                           Reject
//                         </Button>
//                       </Flex>
//                     </Flex>
//                   </Box>
//                 ))}
//               </VStack>
//             )}
//           </PopoverBody>
//         </PopoverContent>
//       </Popover>
//     );
//   };

//   return (
//     <Flex h="100%" position="relative">
//       <Box
//         flex="1"
//         display="flex"
//         flexDirection="column"
//         bg="gray.50"
//         maxW={`calc(100% - 260px)`}
//       >
//         {selectedGroup ? (
//           <>
//             <Flex
//               px={6}
//               py={4}
//               bg="white"
//               borderBottom="1px solid"
//               borderColor="gray.200"
//               align="center"
//               boxShadow="sm"
//             >
//               <Icon as={FiMessageCircle} fontSize="24px" color="blue.500" mr={3} />
//               <Box flex="1">
//                 <Text fontSize="lg" fontWeight="bold" color="gray.800">
//                   {selectedGroup.name}
//                 </Text>
//                 <Text fontSize="sm" color="gray.500">
//                   {selectedGroup.description}
//                 </Text>
//               </Box>
//               {renderAdminNotifications()}
//               <Icon
//                 as={FiInfo}
//                 fontSize="20px"
//                 color="gray.400"
//                 cursor="pointer"
//                 _hover={{ color: "blue.500" }}
//               />
//             </Flex>

//             <VStack
//               flex="1"
//               overflowY="auto"
//               spacing={4}
//               align="stretch"
//               px={6}
//               py={4}
//               position="relative"
//               sx={{
//                 "&::-webkit-scrollbar": {
//                   width: "8px",
//                 },
//                 "&::-webkit-scrollbar-track": {
//                   width: "10px",
//                 },
//                 "&::-webkit-scrollbar-thumb": {
//                   background: "gray.200",
//                   borderRadius: "24px",
//                 },
//               }}
//             >
//               {messages.map((message) => (
//                 <Box
//                   key={message._id}
//                   alignSelf={
//                     message.sender._id === currentUser.user?._id
//                       ? "flex-end"
//                       : "flex-start"
//                   }
//                   maxW="70%"
//                 >
//                   <Flex direction="column" gap={1}>
//                     <Flex
//                       align="center"
//                       mb={1}
//                       justifyContent={
//                         message.sender._id === currentUser.user?._id
//                         ? "flex-end"
//                         : "flex-start"
//                     }
//                     gap={2}
//                   >
//                     {message.sender._id === currentUser.user?._id ? (
//                       <>
//                         <Avatar size="xs" name={message.sender.username} />
//                         <Text fontSize="xs" color="gray.500">
//                           You • {formatTime(message.createdAt)}
//                         </Text>
//                       </>
//                     ) : (
//                       <>
//                         <Text fontSize="xs" color="gray.500">
//                           {message.sender.username} • {formatTime(message.createdAt)}
//                         </Text>
//                         <Avatar size="xs" name={message.sender.username} />
//                       </>
//                     )}
//                   </Flex>

//                   <Box
//                     bg={
//                       message.sender._id === currentUser.user?._id
//                         ? "blue.500"
//                         : "white"
//                     }
//                     color={
//                       message.sender._id === currentUser.user?._id
//                         ? "white"
//                         : "gray.800"
//                     }
//                     p={3}
//                     borderRadius="lg"
//                     boxShadow="sm"
//                   >
//                     <Text>{message.content}</Text>
//                   </Box>
//                 </Flex>
//               </Box>
//             ))}
//             {renderTypingIndicator()}
//             <div ref={messagesEndRef} />
//           </VStack>

//           <Box
//             p={4}
//             bg="white"
//             borderTop="1px solid"
//             borderColor="gray.200"
//             position="relative"
//             zIndex="1"
//           >
//             <InputGroup size="lg">
//               <Input
//                 value={newMessage}
//                 onChange={handleTyping}
//                 placeholder="Type your message..."
//                 pr="4.5rem"
//                 bg="gray.50"
//                 border="none"
//                 _focus={{
//                   boxShadow: "none",
//                   bg: "gray.100",
//                 }}
//                 onKeyPress={(e) => {
//                   if (e.key === "Enter") {
//                     sendMessage();
//                   }
//                 }}
//               />
//               <InputRightElement width="4.5rem">
//                 <Button
//                   h="1.75rem"
//                   size="sm"
//                   colorScheme="blue"
//                   borderRadius="full"
//                   _hover={{
//                     transform: "translateY(-1px)",
//                   }}
//                   transition="all 0.2s"
//                   onClick={sendMessage}
//                 >
//                   <Icon as={FiSend} />
//                 </Button>
//               </InputRightElement>
//             </InputGroup>
//           </Box>
//         </>
//       ) : (
//         <Flex
//           h="100%"
//           direction="column"
//           align="center"
//           justify="center"
//           p={8}
//           textAlign="center"
//         >
//           <Icon as={FiMessageCircle} fontSize="64px" color="gray.300" mb={4} />
//           <Text fontSize="xl" fontWeight="medium" color="gray.500" mb={2}>
//             Welcome to the Chat
//           </Text>
//           <Text color="gray.500" mb={2}>
//             Select a group from the sidebar to start chatting
//           </Text>
//         </Flex>
//       )}
//     </Box>

//     <Box
//       width="260px"
//       position="sticky"
//       right={0}
//       top={0}
//       height="100%"
//       flexShrink={0}
//     >
//       {selectedGroup && <UsersList users={connectedUsers} />}
//     </Box>
//   </Flex>
// );
// };

// export default ChatArea;