import { Box, Flex } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import io from "socket.io-client";

const ENDPOINT = "https://chatapp-n1dh.onrender.com";

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
      transports: ["websocket", "polling"],
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
      <Box flex="1" >
        {socket ? <ChatArea selectedGroup={selectedGroup} socket={socket} /> : <p>Loading...</p>}
      </Box>
    </Flex>
  );
};

export default Chat;



//fake
// import { Box, Flex, useMediaQuery } from "@chakra-ui/react";
// import { useState, useEffect } from "react";
// import Sidebar from "../components/Sidebar";
// import ChatArea from "../components/ChatArea";
// import io from "socket.io-client";

// const ENDPOINT = "https://chatapp-n1dh.onrender.com";

// const Chat = () => {
//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [socket, setSocket] = useState(null);
//   const [isSidebarVisible, setIsSidebarVisible] = useState(true);
//   const [isMobile] = useMediaQuery("(max-width: 768px)");

//   useEffect(() => {
//     const storedUser = localStorage.getItem("user");
//     if (!storedUser) {
//       console.error("No user found in localStorage");
//       return;
//     }

//     const userInfo = JSON.parse(storedUser);
//     const newSocket = io(ENDPOINT, {
//       auth: { user: userInfo?.user },
//       transports: ["websocket", "polling"],
//     });

//     setSocket(newSocket);
    
//     newSocket.on("connect", () => {
//       console.log("Connected to Socket.io:", newSocket.id);
//     });

//     // Set initial sidebar visibility based on screen size
//     setIsSidebarVisible(!isMobile);

//     return () => {
//       console.log("Disconnecting socket...");
//       newSocket.disconnect();
//     };
//   }, [isMobile]);

//   // Handle group selection
//   const handleGroupSelect = (group) => {
//     setSelectedGroup(group);
//     if (isMobile) {
//       setIsSidebarVisible(false);
//     }
//   };

//   return (
//     <Flex h="100vh" overflow="hidden" position="relative">
//       {/* Sidebar */}
//       <Box 
//         position={{ base: "absolute", md: "relative" }}
//         display={{ base: isSidebarVisible ? "block" : "none", md: "block" }}
//         w={{ base: "100%", md: "300px" }}
//         h="100vh"
//         borderRight="1px solid"
//         borderColor="gray.200"
//         bg="white"
//         zIndex="2"
//       >
//         <Sidebar setSelectedGroup={handleGroupSelect} />
//       </Box>

//       {/* Chat Area */}
//       <Box 
//         flex="1"
//         w={{ base: "100%", md: "calc(100% - 300px)" }}
//         h="100vh"
//         display={{ base: isSidebarVisible ? "none" : "block", md: "block" }}
//         minW={{ base: "320px", md: "auto" }}
//         overflow="hidden"
//       >
//         {socket ? (
//           <ChatArea 
//             selectedGroup={selectedGroup} 
//             socket={socket}
//             onShowSidebar={() => setIsSidebarVisible(true)}
//           />
//         ) : (
//           <Flex justify="center" align="center" h="100%">
//             <p>Loading...</p>
//           </Flex>
//         )}
//       </Box>
//     </Flex>
//   );
// };

// export default Chat;