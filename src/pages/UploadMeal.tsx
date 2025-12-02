import React, { useState, useEffect } from "react";
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
} from "@chakra-ui/react";
import AppLayout from "../layouts/AppLayout";

const UploadMeal: React.FC = () => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const softBg = useColorModeValue("gray.50", "gray.900");
  const subtleText = useColorModeValue("gray.500", "gray.400");

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // basic check – you can add size/type checks here
    setFile(selected);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !file) {
      toast({
        title: "Missing info",
        description: "Please add a title and an image for your meal.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    // TODO: hook to your backend / Firebase storage + Firestore
    console.log("Uploading meal:", {
      title,
      fileName: file.name,
      file,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Meal uploaded",
        description:
          "This is a mock upload for now. Wire it up to your backend next.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      // reset form
      setTitle("");
      setFile(null);
    }, 800);
  };

  return (
    <AppLayout
      title="Upload new meal"
      subtitle="Add a photo and a title so MacroVision can analyze it and log the nutrition for you."
    >
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg={cardBg}
        rounded="2xl"
        p={6}
        boxShadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
        maxW="2xl"
      >
        {/* Meal title */}
        <FormControl mb={5}>
          <FormLabel fontSize="sm">Meal title</FormLabel>
          <Input
            placeholder="e.g., Grilled chicken salad with quinoa"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            bg={useColorModeValue("gray.50", "gray.900")}
          />
        </FormControl>

        {/* Image upload */}
        <FormControl mb={5}>
          <FormLabel fontSize="sm">Meal photo</FormLabel>

          <Box
            bg={softBg}
            borderWidth="1px"
            borderColor={borderColor}
            rounded="2xl"
            p={4}
          >
            <Flex
              direction={{ base: "column", md: "row" }}
              align="center"
              gap={4}
            >
              <Box flex="1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  bg={useColorModeValue("white", "gray.900")}
                  padding="2"
                />
                <Text fontSize="xs" color={subtleText} mt={1}>
                  Choose a clear photo of your meal. Later this can go through
                  your AI nutrition model.
                </Text>
              </Box>

              {/* Preview */}
              <Box
                w={{ base: "100%", md: "180px" }}
                h="120px"
                bg={useColorModeValue("gray.100", "gray.900")}
                rounded="lg"
                overflow="hidden"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Meal preview"
                    className="h-full w-full object-cover"
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
          </Box>
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
    </AppLayout>
  );
};

export default UploadMeal;
