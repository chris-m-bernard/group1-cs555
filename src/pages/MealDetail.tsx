import React from "react";
import {
  Box,
  Flex,
  Text,
  SimpleGrid,
  useColorModeValue,
  Tag,
  Button,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";

import AppLayout from "../layouts/AppLayout";
import { MealInput } from "../lib/meal";

const MealDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const cardBg = useColorModeValue("white", "gray.800");
  const softBg = useColorModeValue("gray.50", "gray.900");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  const meal = meals.find((m) => m.id.toString() === id);

  if (!meal) {
    return (
      <AppLayout title="Meal not found">
        <Box bg={cardBg} rounded="2xl" p={6} boxShadow="sm">
          <Text fontSize="sm" color="gray.500" mb={4}>
            We couldn't find that meal. It may have been deleted or the link is
            invalid.
          </Text>
          <Button size="sm" onClick={() => navigate("/meals")}>
            Back to My Meals
          </Button>
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={meal.name}
      subtitle={`${meal.date} • ${meal.time} • ${meal.calories} kcal`}
    >
      <Box
        bg={cardBg}
        rounded="2xl"
        overflow="hidden"
        boxShadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
      >
        {/* Image */}
        <Box h="56" w="full" overflow="hidden">
          <img
            src={meal.imageUrl}
            alt={meal.name}
            className="h-full w-full object-cover"
          />
        </Box>

        <Box p={6}>
          {/* Top row */}
          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            mb={4}
            gap={3}
          >
            <Box>
              <Text fontSize="sm" color="gray.500" mb={1}>
                {meal.date} at {meal.time}
              </Text>
              <Text fontSize="lg" fontWeight="semibold">
                {meal.name}
              </Text>
            </Box>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/meals")}
            >
              Back to My Meals
            </Button>
          </Flex>

          {/* Nutrition summary */}
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
            <Box bg={softBg} rounded="xl" p={3}>
              <Text fontSize="xs" color="gray.500">
                Calories
              </Text>
              <Text fontWeight="bold">{meal.calories} kcal</Text>
            </Box>
            <Box bg={softBg} rounded="xl" p={3}>
              <Text fontSize="xs" color="gray.500">
                Protein
              </Text>
              <Text fontWeight="bold">{meal.protein} g</Text>
            </Box>
            <Box bg={softBg} rounded="xl" p={3}>
              <Text fontSize="xs" color="gray.500">
                Carbs
              </Text>
              <Text fontWeight="bold">{meal.carbs} g</Text>
            </Box>
            <Box bg={softBg} rounded="xl" p={3}>
              <Text fontSize="xs" color="gray.500">
                Fat
              </Text>
              <Text fontWeight="bold">{meal.fat} g</Text>
            </Box>
          </SimpleGrid>

          {/* Description / notes */}
          <Box mb={4}>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              Description
            </Text>
            <Text fontSize="sm" color="gray.600">
              {meal.description}
            </Text>
          </Box>

          {/* Placeholder for future sections (ingredients, AI notes, etc.) */}
          <Box mt={6}>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              AI notes (coming soon)
            </Text>
            <Text fontSize="xs" color="gray.500">
              Here you could show AI-generated insights like: "High protein and
              moderate carbs — great for post-workout recovery."
            </Text>
          </Box>
        </Box>
      </Box>
    </AppLayout>
  );
};

export default MealDetail;
