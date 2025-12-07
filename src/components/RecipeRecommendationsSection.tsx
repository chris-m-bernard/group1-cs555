// src/components/RecipeRecommendationsSection.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  SimpleGrid,
  Text,
  useColorModeValue,
  useToast,
  Tag,
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
} from "@chakra-ui/react";

import type { Meal } from "../lib/meal";
import {
  generateMealRecommendationsFromMeals,
  type PastMealForAI,
  type AIRecipe,
} from "../lib/meal-ai";
import {
  listRecipeRecommendationsForCurrentUser,
  replaceRecipeRecommendationsForCurrentUser,
  saveRecipeToFavoritesForCurrentUser,
  type Recipe,
} from "../lib/recipe";

type Props = {
  recentMeals: Meal[];
};

export const RecipeRecommendationsSection: React.FC<Props> = ({
  recentMeals,
}) => {
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.800");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Load stored recommendations once
  useEffect(() => {
    (async () => {
      try {
        const stored = await listRecipeRecommendationsForCurrentUser();
        setRecipes(stored);
      } catch (err) {
        console.error("Failed to load stored recipe recommendations:", err);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  const handleGenerate = async () => {
    if (recentMeals.length === 0) {
      toast({
        status: "info",
        title: "No meals yet",
        description:
          "Log a few meals first so we can generate personalized recipes for you.",
      });
      return;
    }

    setLoading(true);
    try {
      const pastMeals: PastMealForAI[] = recentMeals.map((m) => ({
        title: m.title,
        calories: m.calories ?? null,
        protein: m.protein ?? null,
        carbs: m.carbs ?? null,
        fat: m.fat ?? null,
        tags: [], // extend later when you add tags to meals
      }));

      // 1) Call AI service
      const aiRecipes: AIRecipe[] = await generateMealRecommendationsFromMeals(
        pastMeals
      );

      // 2) Persist in Firestore (replace existing recommendations)
      const stored = await replaceRecipeRecommendationsForCurrentUser(
        aiRecipes
      );

      // 3) Update local UI
      setRecipes(stored);

      toast({
        status: "success",
        title: "New recipes generated",
        description: "Here are some ideas based on your recent meals.",
      });
    } catch (err) {
      console.error("Failed to generate recommendations:", err);
      toast({
        status: "error",
        title: "Error",
        description: "Could not generate recipes. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    onOpen();
  };

  const closeRecipe = () => {
    setSelectedRecipe(null);
    onClose();
  };

  const handleSaveRecipe = async () => {
    if (!selectedRecipe) return;
    try {
      await saveRecipeToFavoritesForCurrentUser({
        title: selectedRecipe.title,
        description: selectedRecipe.description,
        ingredients: selectedRecipe.ingredients,
        steps: selectedRecipe.steps,
        estimated_calories: selectedRecipe.estimated_calories,
        tags: selectedRecipe.tags,
        source: selectedRecipe.source ?? "ai",
      });

      toast({
        status: "success",
        title: "Recipe saved",
        description: "You can find this in your saved recipes later.",
      });
    } catch (err) {
      console.error("Failed to save recipe:", err);
      toast({
        status: "error",
        title: "Error",
        description: "Could not save this recipe.",
      });
    }
  };

  return (
    <Box mb={4}>
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontSize="lg" fontWeight="semibold">
          Recommended for you
        </Text>
        <Button
          size="sm"
          colorScheme="purple"
          onClick={handleGenerate}
          isLoading={loading}
          loadingText="Generating..."
        >
          Generate new recipes
        </Button>
      </Flex>

      {/* Loading existing recs on mount */}
      {initialLoading ? (
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
            Loading your recipe recommendations...
          </Text>
        </Flex>
      ) : loading && recipes.length === 0 ? (
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
            Generating personalized recipes...
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
            No recommendations yet. Click &quot;Generate new recipes&quot; to
            get ideas based on your recent meals.
          </Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
          {recipes.map((rec) => (
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
                bg={useColorModeValue("purple.50", "purple.900")}
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
                {rec.tags && rec.tags.length > 0 && (
                  <HStack spacing={2} flexWrap="wrap">
                    {rec.tags.slice(0, 3).map((tag) => (
                      <Tag
                        key={tag}
                        size="sm"
                        variant="subtle"
                        colorScheme="purple"
                      >
                        {tag}
                      </Tag>
                    ))}
                  </HStack>
                )}
                {rec.estimated_calories && (
                  <Text fontSize="xs" color="gray.600" mt={2}>
                    ~{rec.estimated_calories} kcal
                  </Text>
                )}
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {/* Recipe details modal */}
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
                      <Tag key={tag} colorScheme="purple" variant="subtle">
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
              <Button mr={3} colorScheme="teal" onClick={handleSaveRecipe}>
                Save recipe
              </Button>
            )}
            <Button onClick={closeRecipe}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default RecipeRecommendationsSection;
