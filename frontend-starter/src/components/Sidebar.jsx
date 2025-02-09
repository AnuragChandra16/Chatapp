import {
  Box,
  VStack,
  Text,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Flex,
  Icon,
  Badge,
  Tooltip,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FiLogOut, FiPlus, FiUsers } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Sidebar = ({setSelectedGroup}) => {
  console.log("setSelectedGroup:", setSelectedGroup);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const[groups,setGroups]=useState([]);//list of all groups
  
  const[userGroups,setUserGroups]=useState([]);// list of all groups the current user part of
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const toast = useToast();
  const [isAdmin,setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const [groupStatus, setGroupStatus] = useState(0); // 1 if joined, 0 if left
  const [maxi, setMaxi] = useState(() => {
    return parseInt(localStorage.getItem("maxi")) || 0;
  });
  

//real
  // useEffect(() => {
    
  //   checkAdminStatus();
  //   fetchGroups();
  // }, []);
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedMaxi = localStorage.getItem("maxi");
      setMaxi(updatedMaxi ? parseInt(updatedMaxi) : 0);
    };
  
    // Listen for changes in localStorage
    window.addEventListener("storage", handleStorageChange);
  
    // Call necessary functions
    checkAdminStatus();
    fetchGroups();
  
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
  
  //Check if login user is an admin
  const checkAdminStatus = () => {
    const userInfo = JSON.parse(localStorage.getItem("user") || {});
    //!update admin status
    setIsAdmin(userInfo.user?.isAdmin || false);
    console.log(userInfo.user?.isAdmin);
  };

 //fetch all groups
 const fetchGroups = async () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem("user") || {});
    const token = userInfo.user?.token;
    console.log(token);
    const { data } = await axios.get('https://chatapp-n1dh.onrender.com/api/groups', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setGroups(data);
    //get user groups
    const userGroupIds = data
      ?.filter((group) => {
        console.log(group);
        return group?.members?.some(
          (member) => member?._id === userInfo.user?._id
        );
      })
      .map((group) => group?._id);
    setUserGroups(userGroupIds);
  } catch (error) {
    console.log(error);
  }
};


  // Sample groups data
  //Create  groups
  const handleCreateGroup = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("user") || {});
      const token = userInfo.user?.token;
      await axios.post(
        "https://chatapp-n1dh.onrender.com/api/groups",
        {
          name: newGroupName,
          description: newGroupDescription,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast({
        title: "Group Created",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
      fetchGroups();
      setNewGroupName("");
      setNewGroupDescription("");
    } catch (error) {
      toast({
        title: "Error Creating Group",
        status: "error",
        duration: 3000,
        isClosable: true,
        description: error?.response?.data?.message || "An error occurred",
      });
    }
  };
  //logout
  const handleLogout = () => {
    localStorage.removeItem("user");
  // localStorage.setItem("maxi", "0"); 
  // setMaxi(0);
    navigate("/login");
  };
  //join group
  // const handleJoinGroup = async (groupId) => {
  //   try {
  //     const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
  //     const token = userInfo.user?.token;
  
  //     const res = await axios.post(
  //       `https://chatapp-n1dh.onrender.com/api/groups/${groupId}/join`,
  //       {},
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );
  
  //     console.log("API Response:", res);
  
  //     // Wait for groups to update
  //     await fetchGroups();
  
  //     console.log("Groups after fetch:", groups);
  //     groups.forEach((g) => console.log("Group ID:", g?._id));
  
  //     const selectedGroup = groups.find((g) => g?._id === groupId);
  //     console.log("Selected Group:", selectedGroup);
  
  //     if (setSelectedGroup) {
  //       setSelectedGroup(selectedGroup);
  //     } else {
  //       console.error("setSelectedGroup is undefined");
  //     }
  
  //     toast({
  //       title: "Joined group successfully",
  //       status: "success",
  //       duration: 3000,
  //       isClosable: true,
  //     });
  //   } catch (error) {
  //     console.error("Error Joining Group:", error);
  
  //     toast({
  //       title: "Error Joining Group",
  //       status: "error",
  //       duration: 3000,
  //       isClosable: true,
  //       description: error?.response?.data?.message || "An error occurred",
  //     });
  //   }
  // };
  const handleJoinGroup = async (groupId) => {
    try {
      if (!isAdmin && maxi === 1) {
        toast({
          title: "You can only join your first group. You cannot join another.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
  
      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
      const token = userInfo.user?.token;
  
      const { data } = await axios.post(
        `https://chatapp-n1dh.onrender.com/api/groups/${groupId}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      console.log("API Response:", data);
  
      setUserGroups((prev) => [...prev, groupId]);
  
      if (setSelectedGroup && data.group) {
        setSelectedGroup(data.group);
      } else {
        console.error("setSelectedGroup is undefined or group data missing");
      }
  
      // ✅ Normal users get restricted
      if (!isAdmin) {
        setMaxi(1);
        localStorage.setItem("maxi", "1");
      }
  
      toast({
        title: "Joined group successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error Joining Group:", error);
  
      toast({
        title: "Error Joining Group",
        status: "error",
        duration: 3000,
        isClosable: true,
        description: error?.response?.data?.message || "An error occurred",
      });
    }
  };
  
  
  
  const handleLogin = async (userData) => {
    localStorage.setItem("user", JSON.stringify(userData)); 
    localStorage.removeItem("maxi"); // Reset maxi for new user
    setMaxi(0); 
    fetchGroups(); // Fetch groups after login
  };
  
   //leave group
  //  const handleLeaveGroup = async (groupId) => {
  //   try {
  //     const userInfo = JSON.parse(localStorage.getItem("user") || {});
  //     const token = userInfo.user?.token;
  //     await axios.post(
  //       `https://chatapp-n1dh.onrender.com/api/groups/${groupId}/leave`,
  //       {},
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );
  //     await fetchGroups();
  //     setSelectedGroup(null);
  //     toast({
  //       title: "Left group successfully",
  //       status: "success",
  //       duration: 3000,
  //       isClosable: true,
  //     });
  //   } catch (error) {
  //     toast({
  //       title: "Error Joining Group",
  //       status: "error",
  //       duration: 3000,
  //       isClosable: true,
  //       description: error?.response?.data?.message || "An error occurred",
  //     });
  //   }
  // };
  
  const handleLeaveGroup = async (groupId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
      const token = userInfo.user?.token;
  
      await axios.post(
        `https://chatapp-n1dh.onrender.com/api/groups/${groupId}/leave`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setUserGroups((prev) => prev.filter((id) => id !== groupId));
  
      toast({
        title: "Left group successfully",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
  
      // ✅ Normal users still cannot join another group
      if (!isAdmin) {
        localStorage.setItem("maxi", "1");
      }
    } catch (error) {
      console.error("Error Leaving Group:", error);
  
      toast({
        title: "Error Leaving Group",
        status: "error",
        duration: 3000,
        isClosable: true,
        description: error?.response?.data?.message || "An error occurred",
      });
    }
  };
  
  

  return (
    <Box
      h="100%"
      bg="white"
      borderRight="1px"
      borderColor="gray.200"
      width="300px"
      display="flex"
      flexDirection="column"
    >
      <Flex
        p={4}
        borderBottom="1px solid"
        borderColor="gray.200"
        bg="white"
        position="sticky"
        top={0}
        zIndex={1}
        backdropFilter="blur(8px)"
        align="center"
        justify="space-between"
      >
        <Flex align="center">
          <Icon as={FiUsers} fontSize="24px" color="blue.500" mr={2} />
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            Groups
          </Text>
        </Flex>
        {isAdmin && (
          <Tooltip label="Create New Group" placement="right">
            <Button
              size="sm"
              colorScheme="blue"
              variant="ghost"
              onClick={onOpen}
              borderRadius="full"
            >
              <Icon as={FiPlus} fontSize="20px" />
            </Button>
          </Tooltip>
        )}
      </Flex>

      <Box flex="1" overflowY="auto" p={4} mb={16}>
        <VStack spacing={3} align="stretch">
          {groups.map((group) => (
            <Box
              key={group._id}
              p={4}
              cursor="pointer"
              borderRadius="lg"
              bg={userGroups.includes(group?._id) ? "blue.50" : "gray.50"}
              borderWidth="1px"
              borderColor={userGroups.includes(group?._id) ? "blue.200" : "gray.200"}
              transition="all 0.2s"
              _hover={{
                transform: "translateY(-2px)",
                shadow: "md",
                borderColor: "blue.300",
              }}
            >
              <Flex justify="space-between" align="center">
                <Box onClick={
                  () => userGroups.includes(group?._id) && setSelectedGroup(group)
                } flex="1">
                  <Flex align="center" mb={2}>
                    <Text fontWeight="bold" color="gray.800">
                      {group.name}
                    </Text>
                    {userGroups.includes(group?._id) && (
                      <Badge ml={2} colorScheme="blue" variant="subtle">
                        Joined
                      </Badge>
                    )}
                  </Flex>
                  <Text fontSize="sm" color="gray.600" noOfLines={2}>
                    {group.description}
                  </Text>
                </Box>
                <Button
  size="sm"
  colorScheme={userGroups.includes(group?._id) ? "red" : "blue"}
  variant={userGroups.includes(group?._id) ? "ghost" : "solid"}
  ml={3}
  onClick={() => {
    userGroups.includes(group?._id)
      ? handleLeaveGroup(group?._id)
      : handleJoinGroup(group?._id);
  }}
  isDisabled={!isAdmin && maxi === 1 && !userGroups.includes(group?._id)}
  _hover={{
    transform: userGroups.includes(group?._id) ? "scale(1.05)" : "none",
    bg: userGroups.includes(group?._id) ? "red.50" : "blue.600",
  }}
  transition="all 0.2s"
>
  {userGroups.includes(group?._id) ? (
    <Text fontSize="sm" fontWeight="medium">Leave</Text>
  ) : (
    "Join"
  )}
</Button>




              </Flex>
            </Box>
          ))}
        </VStack>
      </Box>

      <Box
        p={4}
        borderTop="1px solid"
        borderColor="gray.200"
        bg="gray.50"
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        width="100%"
      >
        <Button
          onClick={handleLogout}
          variant="ghost"
          colorScheme="red"
          leftIcon={<Icon as={FiLogOut} />}
          _hover={{
            bg: "red.50",
            transform: "translateY(-2px)",
            shadow: "md",
          }}
          transition="all 0.2s"
        >
          Logout
        </Button>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader>Create New Group</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Group Name</FormLabel>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                focusBorderColor="blue.400"
              />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>Description</FormLabel>
              <Input
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Enter group description"
                focusBorderColor="blue.400"
              />
            </FormControl>

            <Button
              colorScheme="blue"
              mr={3}
              mt={4}
              width="full"
              onClick={handleCreateGroup}
            >
              Create Group
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Sidebar;