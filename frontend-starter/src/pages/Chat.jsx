import { Box, Flex } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import io from "socket.io-client";

const ENDPOINT = "http://localhost:5000";

const Chat = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      console.error("No user found in localStorage");
      return;
    }

    const userInfo = JSON.parse(storedUser);
    const newSocket = io(ENDPOINT, {
      auth: { user: userInfo?.user }, // Ensure user exists
    });

    setSocket(newSocket);
    
    newSocket.on("connect", () => {
      console.log("Connected to Socket.io:", newSocket.id);
    });

    return () => {
      console.log("Disconnecting socket...");
      newSocket.disconnect();
    };
  }, []); // Run only on mount

  return (
    <Flex h="100vh">
      <Box w="300px" borderRight="1px solid" borderColor="gray.200">
        <Sidebar setSelectedGroup={setSelectedGroup} />
      </Box>
      <Box flex="1">
        {socket ? <ChatArea selectedGroup={selectedGroup} socket={socket} /> : <p>Loading...</p>}
      </Box>
    </Flex>
  );
};

export default Chat;
