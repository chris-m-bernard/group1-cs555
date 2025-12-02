import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Text,
  useColorModeValue,
  useToast,
  Icon,
  VStack,
} from "@chakra-ui/react";
import { FiUploadCloud, FiCamera } from "react-icons/fi";
import AppLayout from "../layouts/AppLayout";
import { useNavigate } from "react-router-dom";
import { addMealForCurrentUser } from "../lib/meal";

const UploadMeal: React.FC = () => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const softBg = useColorModeValue("gray.50", "gray.900");
  const subtleText = useColorModeValue("gray.500", "gray.400");

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Handle image preview URL lifecycle
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleSelectedFile = (selected: File | null) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setFile(selected);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    handleSelectedFile(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const selected = e.dataTransfer.files?.[0] ?? null;
    handleSelectedFile(selected);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        title: "No image selected",
        description: "Please choose a meal photo to upload.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a title for your meal.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addMealForCurrentUser(file, title.trim());

      toast({
        title: "Meal uploaded",
        description: "Your meal has been added to your log.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      setTitle("");
      setFile(null);

      navigate("/meals");
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error uploading meal",
        description:
          err?.message || "Something went wrong while saving your meal.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="Upload new meal"
      subtitle="Add a photo and a title so MacroVision can analyze it and log the nutrition for you."
    >
      {/* Center the card on the page */}
      <Flex
        minH="calc(100vh - 120px)"
        justify="center"
        align="flex-start"
        pt={{ base: 4, md: 8 }}
      >
        <Box
          as="form"
          onSubmit={handleSubmit}
          bg={cardBg}
          rounded="2xl"
          p={{ base: 5, md: 7 }}
          boxShadow="lg"
          borderWidth="1px"
          borderColor={borderColor}
          maxW="2xl"
          w="100%"
          mx="auto"
        >
          {/* Meal title */}
          <FormControl mb={6}>
            <FormLabel fontSize="sm" fontWeight="medium">
              Meal title
            </FormLabel>
            <Input
              placeholder="e.g., Grilled chicken salad with quinoa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              bg={useColorModeValue("gray.50", "gray.900")}
            />
          </FormControl>

          {/* Image upload area */}
          <FormControl mb={6}>
            <FormLabel fontSize="sm" fontWeight="medium">
              Meal photo
            </FormLabel>

            <Flex
              direction={{ base: "column", md: "row" }}
              gap={5}
              align={{ base: "stretch", md: "flex-start" }}
            >
              {/* Left: drag & drop / buttons */}
              <VStack flex="1" spacing={3} align="stretch">
                <Box
                  bg={softBg}
                  borderWidth="2px"
                  borderStyle="dashed"
                  borderColor={isDragOver ? "teal.400" : borderColor}
                  rounded="2xl"
                  p={4}
                  textAlign="center"
                  transition="all 0.15s ease-out"
                  cursor="pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <VStack spacing={2}>
                    <Icon as={FiUploadCloud} boxSize={7} />
                    <Text fontSize="sm" fontWeight="medium">
                      Drag & drop your meal photo here
                    </Text>
                    <Text fontSize="xs" color={subtleText}>
                      or click to browse from your device
                    </Text>
                  </VStack>
                </Box>

                <Flex gap={3} justify={{ base: "center", md: "flex-start" }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    leftIcon={<FiUploadCloud />}
                  >
                    Choose from gallery
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cameraInputRef.current?.click()}
                    leftIcon={<FiCamera />}
                  >
                    Take photo
                  </Button>
                </Flex>

                <Text fontSize="xs" color={subtleText}>
                  On mobile, “Take photo” will open your camera (if supported).
                </Text>

                {/* Hidden file inputs */}
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  display="none"
                  onChange={handleFileChange}
                />
                {/* Camera-focused input for mobile */}
                <Input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  display="none"
                  onChange={handleFileChange}
                />
              </VStack>

              {/* Right: preview */}
              <Box
                w={{ base: "100%", md: "200px" }}
                h="140px"
                bg={useColorModeValue("gray.100", "gray.900")}
                rounded="xl"
                overflow="hidden"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderWidth="1px"
                borderColor={borderColor}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Meal preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Text fontSize="xs" color={subtleText} textAlign="center">
                    Image preview
                    <br />
                    (no file selected yet)
                  </Text>
                )}
              </Box>
            </Flex>
          </FormControl>

          {/* Actions */}
          <Flex justify="flex-end" gap={3}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setTitle("");
                setFile(null);
              }}
            >
              Clear
            </Button>
            <Button type="submit" colorScheme="teal" isLoading={isSubmitting}>
              Upload meal
            </Button>
          </Flex>
        </Box>
      </Flex>
    </AppLayout>
  );
};

export default UploadMeal;
