// src/pages/SavedRecipes.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  SimpleGrid,
  Text,
  Tag,
  useColorModeValue,
  useToast,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  VStack,
  useDisclosure,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

import AppLayout from "../layouts/AppLayout";
import { routes } from "../routes";
import {
  listSavedRecipesForCurrentUser,
  type Recipe,
  deleteSavedRecipeForCurrentUser,
} from "../lib/recipe";

const SavedRecipesPage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.800");

  const toast = useToast();
  const navigate = useNavigate();

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const saved = await listSavedRecipesForCurrentUser();
      setRecipes(saved);
    } catch (err) {
      console.error("Failed to load saved recipes:", err);
      toast({
        status: "error",
        title: "Error",
        description: "Could not load your saved recipes.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecipes();
  }, []);

  const openRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    onOpen();
  };

  const closeRecipe = () => {
    setSelectedRecipe(null);
    onClose();
  };

  const handleDeleteRecipe = async () => {
    if (!selectedRecipe) return;

    try {
      await deleteSavedRecipeForCurrentUser(selectedRecipe.id);

      // Remove from local state
      setRecipes((prev) => prev.filter((r) => r.id !== selectedRecipe.id));

      toast({
        status: "success",
        title: "Recipe deleted",
        description: "This recipe has been removed from your saved list.",
      });

      closeRecipe();
    } catch (err) {
      console.error("Failed to delete saved recipe:", err);
      toast({
        status: "error",
        title: "Error",
        description: "Could not delete this recipe.",
      });
    }
  };

  // --- Filtered list based on search query ---
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredRecipes =
    normalizedQuery.length === 0
      ? recipes
      : recipes.filter((rec) => {
          const inTitle = rec.title.toLowerCase().includes(normalizedQuery);
          const inDescription =
            rec.description?.toLowerCase().includes(normalizedQuery) ?? false;
          const inTags =
            rec.tags?.some((t) => t.toLowerCase().includes(normalizedQuery)) ??
            false;
          return inTitle || inDescription || inTags;
        });

  return (
    <AppLayout
      title="Saved recipes"
      subtitle="Your favorite AI-generated meals all in one place."
      action={
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(routes.dash)}
        >
          Back to dashboard
        </Button>
      }
    >
      <Box mb={4}>
        <Flex
          justify="space-between"
          align="flex-start"
          mb={3}
          gap={3}
          wrap="wrap"
        >
          <Box flex="1" minW={{ base: "100%", md: "0" }}>
            <Text fontSize="lg" fontWeight="semibold" mb={2}>
              Your saved recipes
            </Text>
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search by title, description, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg={cardBg}
              />
            </InputGroup>
          </Box>

          <Button size="sm" onClick={loadRecipes} isLoading={loading}>
            Refresh
          </Button>
        </Flex>

        {loading ? (
          <Flex
            bg={cardBg}
            rounded="2xl"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
            align="center"
            justify="center"
            py={6}
          >
            <Spinner mr={3} />
            <Text fontSize="sm" color="gray.500">
              Loading saved recipes...
            </Text>
          </Flex>
        ) : recipes.length === 0 ? (
          <Box
            bg={cardBg}
            rounded="2xl"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
            px={5}
            py={4}
          >
            <Text fontSize="sm" color="gray.500">
              You haven&apos;t saved any recipes yet. Generate some on the
              dashboard and tap &quot;Save recipe&quot; to keep them here.
            </Text>
          </Box>
        ) : filteredRecipes.length === 0 ? (
          <Box
            bg={cardBg}
            rounded="2xl"
            boxShadow="sm"
            borderWidth="1px"
            borderColor={borderColor}
            px={5}
            py={4}
          >
            <Text fontSize="sm" color="gray.500">
              No recipes match &quot;{searchQuery}&quot;. Try another search
              term.
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
            {filteredRecipes.map((rec) => (
              <Box
                key={rec.id}
                bg={cardBg}
                rounded="2xl"
                overflow="hidden"
                boxShadow="sm"
                borderWidth="1px"
                borderColor={borderColor}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openRecipe(rec)}
              >
                <Box
                  bg={useColorModeValue("teal.50", "teal.900")}
                  px={4}
                  py={3}
                >
                  <Text fontWeight="semibold" fontSize="sm">
                    {rec.title}
                  </Text>
                </Box>
                <Box p={4}>
                  <Text fontSize="xs" color="gray.500" noOfLines={2} mb={2}>
                    {rec.description}
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {rec.tags &&
                      rec.tags.slice(0, 3).map((tag) => (
                        <Tag
                          key={tag}
                          size="sm"
                          variant="subtle"
                          colorScheme="teal"
                        >
                          {tag}
                        </Tag>
                      ))}
                    {rec.estimated_calories && (
                      <Tag size="sm" colorScheme="orange">
                        ~{rec.estimated_calories} kcal
                      </Tag>
                    )}
                  </HStack>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* Modal for recipe details */}
      <Modal isOpen={isOpen} onClose={closeRecipe} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedRecipe?.title ?? "Recipe"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRecipe && (
              <VStack align="stretch" spacing={4}>
                {selectedRecipe.description && (
                  <Text fontSize="sm" color="gray.600">
                    {selectedRecipe.description}
                  </Text>
                )}

                <HStack spacing={3} flexWrap="wrap">
                  {selectedRecipe.estimated_calories && (
                    <Tag colorScheme="orange">
                      ~{selectedRecipe.estimated_calories} kcal
                    </Tag>
                  )}
                  {selectedRecipe.tags &&
                    selectedRecipe.tags.map((tag) => (
                      <Tag key={tag} colorScheme="teal" variant="subtle">
                        {tag}
                      </Tag>
                    ))}
                </HStack>

                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Ingredients
                  </Text>
                  <VStack align="stretch" spacing={1}>
                    {selectedRecipe.ingredients.map((ing, idx) => (
                      <Text key={idx} fontSize="sm">
                        • {ing}
                      </Text>
                    ))}
                  </VStack>
                </Box>

                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Steps
                  </Text>
                  <VStack align="stretch" spacing={1}>
                    {selectedRecipe.steps.map((step, idx) => (
                      <Text key={idx} fontSize="sm">
                        {idx + 1}. {step}
                      </Text>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            {selectedRecipe && (
              <Button
                colorScheme="red"
                variant="outline"
                mr={3}
                onClick={handleDeleteRecipe}
              >
                Delete
              </Button>
            )}
            <Button onClick={closeRecipe}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AppLayout>
  );
};

export default SavedRecipesPage;
