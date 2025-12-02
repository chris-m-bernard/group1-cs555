import {
  Box,
  Heading,
  Text,
  Image,
  Badge,
  VStack,
  HStack,
  Skeleton,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import type { Meal } from "../lib/meal";
import type { MouseEvent } from "react";

interface MealCardProps {
  meal: Meal;
  onOpen: (mealId: string) => void;
  onDelete: (mealId: string) => void;
}

export default function MealCard({ meal, onOpen, onDelete }: MealCardProps) {
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");

  const handleCardClick = () => {
    onOpen(meal.id);
  };

  const handleDeleteClick = (e: MouseEvent) => {
    e.stopPropagation(); // important: don't trigger card click / navigation
    onDelete(meal.id);
  };

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={cardBorder}
      borderRadius="xl"
      overflow="hidden"
      boxShadow="md"
      _hover={{ boxShadow: "xl", transform: "translateY(-2px)" }}
      transition="all 0.15s ease-out"
      cursor="pointer"
      onClick={handleCardClick}
    >
      {meal.imageData ? (
        <Image
          src={meal.imageData}
          alt={meal.title}
          w="100%"
          h="180px"
          objectFit="cover"
        />
      ) : (
        <Skeleton h="180px" />
      )}

      <VStack align="start" spacing={2} p={4}>
        <Heading size="md" noOfLines={1}>
          {meal.title}
        </Heading>

        <HStack spacing={2} flexWrap="wrap">
          {meal.calories != null && (
            <Badge borderRadius="full" px={2} py={1}>
              {Math.round(meal.calories)} kcal
            </Badge>
          )}
          {meal.protein != null && (
            <Badge borderRadius="full" px={2} py={1}>
              {meal.protein}g protein
            </Badge>
          )}
          {meal.carbs != null && (
            <Badge borderRadius="full" px={2} py={1}>
              {meal.carbs}g carbs
            </Badge>
          )}
          {meal.fat != null && (
            <Badge borderRadius="full" px={2} py={1}>
              {meal.fat}g fat
            </Badge>
          )}
        </HStack>

        {meal.createdAt && (
          <Text fontSize="xs" color="gray.400">
            Logged{" "}
            {(() => {
              try {
                const date =
                  // Firestore Timestamp has toDate()
                  (meal.createdAt as any).toDate?.() ??
                  new Date(meal.createdAt);
                return date.toLocaleString();
              } catch {
                return "";
              }
            })()}
          </Text>
        )}

        <Button
          size="sm"
          colorScheme="red"
          alignSelf="flex-end"
          onClick={handleDeleteClick}
        >
          Delete
        </Button>
      </VStack>
    </Box>
  );
}
