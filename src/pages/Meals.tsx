// src/pages/MyMeals.tsx
import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Image,
  SimpleGrid,
  Badge,
  VStack,
  HStack,
  Spinner,
  Center,
  useColorModeValue,
  Skeleton,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  type DocumentData,
} from "firebase/firestore";

type Meal = {
  id: string;
  title: string;
  imageUrl?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  createdAt?: any;
};

export default function Meals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setError("You must be logged in to view meals.");
      setLoading(false);
      return;
    }

    const mealsRef = collection(db, "users", user.uid, "meals");
    const q = query(mealsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedMeals: Meal[] = snapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            title: data.title ?? "Untitled meal",
            imageUrl: data.imageUrl,
            calories: data.calories,
            protein: data.protein,
            carbs: data.carbs,
            fat: data.fat,
            createdAt: data.createdAt,
          };
        });

        setMeals(fetchedMeals);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching meals:", err);
        setError("Failed to load meals.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleCardClick = (mealId: string) => {
    navigate(`/meals/${mealId}`);
  };

  if (loading) {
    return (
      <Center minH="60vh">
        <VStack spacing={4}>
          <Spinner />
          <Text>Loading your meals...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center minH="60vh">
        <Text color="red.400">{error}</Text>
      </Center>
    );
  }

  if (!meals.length) {
    return (
      <Center minH="60vh">
        <VStack spacing={2}>
          <Heading size="md">No meals yet</Heading>
          <Text color="gray.400">
            Start by adding your first meal from the logging page.
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={6}>
      <Heading mb={4}>My Meals</Heading>
      <Text mb={6} color="gray.500">
        Tap a meal card to view full nutrition details.
      </Text>

      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={5}>
        {meals.map((meal) => (
          <Box
            key={meal.id}
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            borderRadius="xl"
            overflow="hidden"
            boxShadow="md"
            _hover={{ boxShadow: "xl", transform: "translateY(-2px)" }}
            transition="all 0.15s ease-out"
            cursor="pointer"
            onClick={() => handleCardClick(meal.id)}
          >
            {meal.imageUrl ? (
              <Image
                src={meal.imageUrl}
                alt={meal.title}
                objectFit="cover"
                w="100%"
                h="180px"
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
                        meal.createdAt.toDate?.() ?? new Date(meal.createdAt);
                      return date.toLocaleString();
                    } catch {
                      return "";
                    }
                  })()}
                </Text>
              )}
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
