import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  InputGroup,
  SimpleGrid,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

import AppLayout, { UploadMealButton } from "../layouts/AppLayout";

type Meal = {
  id: number;
  name: string;
  date: string; // ISO string "YYYY-MM-DD"
};

type Recommendation = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
};

const mockMeals: Meal[] = [
  { id: 1, name: "Grilled Chicken Salad", date: "2025-11-15" },
  { id: 2, name: "Veggie Omelette", date: "2025-11-16" },
  { id: 3, name: "Pasta with Marinara", date: "2025-11-16" },
];

const mockRecommendations: Recommendation[] = [
  {
    id: 1,
    name: "Mediterranean Quinoa Bowl",
    description: "Click to view recipe and nutrition.",
    imageUrl:
      "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
  },
  {
    id: 2,
    name: "Berry Yogurt Parfait",
    description: "High protein, low sugar breakfast.",
    imageUrl:
      "https://images.pexels.com/photos/3731477/pexels-photo-3731477.jpeg",
  },
  {
    id: 3,
    name: "Tofu Stir-Fry",
    description: "Balanced plant-based dinner.",
    imageUrl:
      "https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg",
  },
  {
    id: 4,
    name: "Tofu Str-fry (Alt)",
    description: "Another tasty option.",
    imageUrl:
      "https://images.pexels.com/photos/6287528/pexels-photo-6287528.jpeg",
  },
];

export const Dashboard: React.FC = () => {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");

  const cardBg = useColorModeValue("white", "gray.800");

  const filteredMeals = useMemo(() => {
    return mockMeals.filter((meal) => {
      const matchesSearch = meal.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesDate = date ? meal.date === date : true;
      return matchesSearch && matchesDate;
    });
  }, [search, date]);

  return (
    <AppLayout
      title="Welcome back, User"
      subtitle="Upload your meals and let the AI handle the nutrition breakdown."
      action={<UploadMealButton />}
    >
      {/* Filters */}
      <Box bg={cardBg} rounded="2xl" p={5} boxShadow="sm" className="mb-8">
        <Flex gap={6} className="flex-col md:flex-row">
          {/* Search */}
          <Box flex="1">
            <Text mb={1} fontSize="sm" fontWeight="medium">
              Search meals
            </Text>
            <InputGroup>
              <Input
                placeholder="e.g., chicken salad, pasta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                bg={useColorModeValue("gray.50", "gray.800")}
              />
            </InputGroup>
          </Box>

          {/* Date filter */}
          <Box flex="1">
            <Text mb={1} fontSize="sm" fontWeight="medium">
              Filter by date
            </Text>
            <InputGroup>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                bg={useColorModeValue("gray.50", "gray.800")}
              />
            </InputGroup>
            {date && (
              <Button mt={1} fontSize="xs" onClick={() => setDate("")}>
                Clear date
              </Button>
            )}
          </Box>
        </Flex>
      </Box>

      {/* Recent meals */}
      <Box mb={8}>
        <HStack justify="space-between" mb={3}>
          <HStack>
            <Text fontSize="lg" fontWeight="semibold">
              Recent meals
            </Text>
          </HStack>
          <Button size="sm">View all</Button>
        </HStack>

        <Box
          bg={cardBg}
          rounded="2xl"
          boxShadow="sm"
          borderWidth="1px"
          borderColor={useColorModeValue("gray.100", "gray.800")}
        >
          {filteredMeals.map((meal) => (
            <Box key={meal.id}>
              <Flex px={5} py={4} align="center" className="hover:bg-gray-50">
                <Box flex="1">
                  <Text fontWeight="medium" fontSize="sm">
                    {meal.name}
                  </Text>
                </Box>
                <Text fontSize="xs" color="gray.500" className="mr-4">
                  {meal.date}
                </Text>
                <Button size="sm" variant="outline" rounded="full">
                  View details
                </Button>
              </Flex>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Recommendations */}
      <Box mb={4}>
        <Text fontSize="lg" fontWeight="semibold" mb={3}>
          Recommended for you
        </Text>

        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }}>
          {mockRecommendations.map((rec) => (
            <Box
              key={rec.id}
              bg={cardBg}
              rounded="2xl"
              overflow="hidden"
              boxShadow="sm"
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <Box className="h-32 w-full overflow-hidden">
                <img
                  src={rec.imageUrl}
                  alt={rec.name}
                  className="h-full w-full object-cover"
                />
              </Box>
              <Box p={4}>
                <Text fontWeight="semibold" fontSize="sm" mb={1}>
                  {rec.name}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {rec.description}
                </Text>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </AppLayout>
  );
};

export default Dashboard;
