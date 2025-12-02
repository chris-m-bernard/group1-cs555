import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";

import AppLayout from "../layouts/AppLayout";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";

const Settings: React.FC = () => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("Loading...");
  const [loading, setLoading] = useState(false);

  // Load current user info
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setName(user.displayName ?? "");
        setEmail(user.email ?? "");
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;

    setLoading(true);

    try {
      // Update Firebase display name
      await updateProfile(auth.currentUser, {
        displayName: name,
      });

      toast({
        title: "Profile updated",
        description: "Your name has been updated successfully.",
        status: "success",
        duration: 2500,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Update failed",
        description: "Unable to update your profile.",
        status: "error",
        duration: 2500,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      title="Profile Settings"
      subtitle="Update your basic account information."
    >
      <Box
        bg={cardBg}
        rounded="2xl"
        p={6}
        boxShadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
        maxW="lg"
      >
        {/* Name */}
        <FormControl mb={4}>
          <FormLabel fontSize="sm">Display name</FormLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            bg={useColorModeValue("gray.50", "gray.900")}
          />
        </FormControl>

        {/* Email (read only) */}
        <FormControl mb={6}>
          <FormLabel fontSize="sm">Email</FormLabel>
          <Input
            value={email}
            isDisabled
            bg={useColorModeValue("gray.100", "gray.900")}
          />
          <Text fontSize="xs" color="gray.500" mt={1}>
            Email is tied to your login and cannot be changed here.
          </Text>
        </FormControl>

        {/* Save */}
        <Button
          colorScheme="teal"
          size="md"
          onClick={handleSave}
          isLoading={loading}
        >
          Save changes
        </Button>
      </Box>
    </AppLayout>
  );
};

export default Settings;
