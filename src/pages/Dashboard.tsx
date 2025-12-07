// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Image,
  Flex,
  HStack,
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
import RecipeRecommendationsSection from "../components/RecipeRecommendationsSection";

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
              <Box key={meal.id} onClick={() => navigate(`/meals/${meal.id}`)}>
                <Flex px={5} py={4} align="center" className="hover:bg-gray-50">
                  <Image
                    src={meal.imageData}
                    alt={meal.title}
                    w={{ base: "100%", md: "150px" }}
                    h={{ base: "100px", md: "100px" }}
                    objectFit="scale-down"
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
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/meals/${meal.id}`);
                    }}
                  >
                    View details
                  </Button>
                </Flex>
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Recipe recommendations (AI + Firestore) */}
      <RecipeRecommendationsSection recentMeals={recentMeals} />
    </AppLayout>
  );
};

export default Dashboard;
