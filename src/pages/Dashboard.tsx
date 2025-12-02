import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Image,
  Flex,
  HStack,
  SimpleGrid,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import { routes } from "../routes";
import { auth, db } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
  type DocumentData,
} from "firebase/firestore";
import type { Meal } from "../lib/meal";

type Recommendation = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
};

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
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.800");

  const user = auth.currentUser;
  const greetingName = user?.displayName || user?.email || "there";

  useEffect(() => {
    if (!user) return;

    const mealsRef = collection(db, "users", user.uid, "meals");
    const q = query(mealsRef, orderBy("createdAt", "desc"), limit(3));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Meal[] = snapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          title: data.title ?? "Untitled meal",
          imageData: data.imageData,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          createdAt: data.createdAt,
        };
      });

      setRecentMeals(fetched);
    });

    return () => unsubscribe();
  }, [user]);

  const formatDate = (createdAt: Meal["createdAt"]) => {
    if (!createdAt) return "";
    try {
      const date = (createdAt as any).toDate?.() ?? new Date(createdAt as any);
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <AppLayout
      title={`Welcome back, ${greetingName}`}
      subtitle="Upload your meals and let the AI handle the nutrition breakdown."
      action={
        <Button
          onClick={() => navigate(routes.mealNew)}
          className="rounded-xl px-5"
          colorScheme="teal"
          size="md"
        >
          Upload new meal
        </Button>
      }
    >
      {/* Recent meals */}
      <Box mb={8}>
        <HStack justify="space-between" mb={3}>
          <HStack>
            <Text fontSize="lg" fontWeight="semibold">
              Recent meals
            </Text>
          </HStack>
          <Button size="sm" onClick={() => navigate(routes.meals)}>
            View all
          </Button>
        </HStack>

        <Box
          bg={cardBg}
          rounded="2xl"
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
        >
          {recentMeals.length === 0 ? (
            <Flex px={5} py={4} align="center">
              <Text fontSize="sm" color="gray.500">
                No meals logged yet. Upload your first meal to get started.
              </Text>
            </Flex>
          ) : (
            recentMeals.map((meal) => (
              <Box key={meal.id}>
                <Flex px={5} py={4} align="center" className="hover:bg-gray-50">
                  <Image
                    src={meal.imageData}
                    alt={meal.title}
                    w={{ base: "100%", md: "150px" }}
                    h={{ base: "100px", md: "100px" }}
                    objectFit="cover"
                    borderRadius="xl"
                    marginRight={5}
                  />
                  <Box flex="1">
                    <Text fontWeight="medium" fontSize="sm">
                      {meal.title}
                    </Text>
                  </Box>
                  <Text fontSize="xs" color="gray.500" className="mr-4">
                    {formatDate(meal.createdAt)}
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    rounded="full"
                    onClick={() => navigate(`/meals/${meal.id}`)}
                  >
                    View details
                  </Button>
                </Flex>
              </Box>
            ))
          )}
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
              margin={2}
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
