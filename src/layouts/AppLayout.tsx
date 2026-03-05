// src/layouts/AppLayout.tsx
import React from "react";
import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { routes } from "../routes";

type AppLayoutProps = {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

const navItems = [
  { label: "Overview", to: "/dashboard" }, // or "/" if that's your dashboard
  { label: "My Meals", to: "/meals" },
  { label: "Analytics", to: "/analytics" },
  { label: "Goals", to: "/goals" },
  { label: "Saved Recipies", to: "/savedRecipes" },
  { label: "Settings", to: "/settings" },
];

export const AppLayout: React.FC<AppLayoutProps> = ({
  title,
  subtitle,
  action,
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = auth.currentUser;
  const bgMain = useColorModeValue("gray.100", "gray.950");
  const sidebarBg = useColorModeValue("#020617", "gray.900");
  const sidebarActive = useColorModeValue("whiteAlpha.200", "whiteAlpha.200");

  const handleLogout = async () => {
    try {
      await signOut(auth); // actually log out of Firebase
      navigate(routes.auth); // send them to the auth page
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <Flex className="h-screen" bg={bgMain}>
      {/* Sidebar */}
      <Box
        as="aside"
        position="fixed"
        top={0}
        left={0}
        height="100vh"
        width="280px"
        bg={sidebarBg}
        color="white"
        px={6}
        py={6}
        boxShadow="lg"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {/* Logo */}
        <HStack spacing={3} mb={8}>
          <Box
            className="flex items-center justify-center"
            bg="teal.500"
            rounded="xl"
            w={10}
            h={10}
          >
            <Text textAlign="center" fontWeight="bold" fontSize="xl">
              🥗
            </Text>
          </Box>
          <Box>
            <Text fontWeight="bold" fontSize="lg">
              CS555 Food Tracker
            </Text>
            <Text fontSize="xs" color="gray.300">
              AI Food Tracker
            </Text>
          </Box>
        </HStack>

        {/* Account */}
        <Text fontSize="xs" textTransform="uppercase" color="gray.500" mb={2}>
          Account
        </Text>
        <HStack mb={6}>
          <Avatar name="Username" size="sm" bg="teal.500" />
          <VStack spacing={0} align="flex-start">
            <Text fontWeight="semibold" fontSize="sm">
              {user?.displayName}
            </Text>
            <Text fontSize="xs" color="gray.400">
              {user?.email}
            </Text>
          </VStack>
        </HStack>

        {/* Nav items */}
        <VStack align="stretch" spacing={1} flex={1}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Button
                key={item.to}
                color="white"
                as={RouterLink}
                to={item.to}
                justifyContent="flex-start"
                variant="ghost"
                bg={isActive ? sidebarActive : "transparent"}
                _hover={{ bg: "whiteAlpha.300" }}
              >
                {item.label}
              </Button>
            );
          })}
        </VStack>

        {/* Logout */}
        <Button
          mt={8}
          variant="ghost"
          justifyContent="flex-start"
          size="lg"
          color="white"
          _hover={{ bg: "whiteAlpha.200", color: "white" }}
          onClick={handleLogout}
        >
          Log out
        </Button>
      </Box>

      {/* Main area */}
      <Flex
        as="main"
        ml="280px" // offset for fixed sidebar
        flex="1"
        height="100vh"
        overflowY="auto"
        px={10}
        py={8}
        direction="column"
      >
        {(title || action) && (
          <Flex justify="space-between" align="center" mb={6}>
            <Box>
              {title && (
                <Text fontSize="3xl" fontWeight="bold">
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text color="gray.500" fontSize="sm" maxW="lg">
                  {subtitle}
                </Text>
              )}
            </Box>
            {action}
          </Flex>
        )}

        <Box className="space-y-8">{children}</Box>
      </Flex>
    </Flex>
  );
};

export default AppLayout;
