// src/pages/MealDetail.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  Image,
  VStack,
  HStack,
  Badge,
  Button,
  Spinner,
  Center,
  useToast,
  Skeleton,
} from "@chakra-ui/react";
import { doc, getDoc } from "firebase/firestore";
import AppLayout from "../layouts/AppLayout";
import { auth, db } from "../lib/firebase";
import { deleteMeal, type Meal } from "../lib/meal";

export default function MealDetail() {
  const { mealId } = useParams<{ mealId: string }>();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const fetchMeal = async () => {
      const user = auth.currentUser;
      if (!user) {
        setError("You must be logged in to view this meal.");
        setLoading(false);
        return;
      }

      if (!mealId) {
        setError("No meal ID provided.");
        setLoading(false);
        return;
      }

      try {
        const mealRef = doc(db, "users", user.uid, "meals", mealId);
        const snap = await getDoc(mealRef);

        if (!snap.exists()) {
          setError("Meal not found.");
          setLoading(false);
          return;
        }

        const data = snap.data();
        setMeal({
          id: snap.id,
          title: data.title ?? "Untitled meal",
          imageData: data.imageData,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          createdAt: data.createdAt,
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching meal:", err);
        setError("Failed to load meal.");
        setLoading(false);
      }
    };

    fetchMeal();
  }, [mealId]);

  const handleDelete = async () => {
    if (!mealId) return;

    const confirm = window.confirm(
      "Are you sure you want to delete this meal? This action cannot be undone."
    );
    if (!confirm) return;

    try {
      await deleteMeal(mealId);
      toast({
        title: "Meal deleted",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
      navigate("/meals");
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error deleting meal",
        description: err.message || "Something went wrong.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <AppLayout title="Meal details" subtitle="">
        <Center minH="60vh">
          <VStack spacing={4}>
            <Spinner />
            <Text>Loading meal...</Text>
          </VStack>
        </Center>
      </AppLayout>
    );
  }

  if (error || !meal) {
    return (
      <AppLayout title="Meal details" subtitle="">
        <Center minH="60vh">
          <Text color="red.400">{error ?? "Meal not found."}</Text>
        </Center>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={meal.title}
      subtitle="Full nutrition breakdown for this meal."
    >
      <Box p={6} maxW="800px" mx="auto">
        <VStack align="stretch" spacing={6}>
          {meal.imageData ? (
            <Image
              src={meal.imageData}
              alt={meal.title}
              w="100%"
              maxH="320px"
              objectFit="cover"
              borderRadius="xl"
            />
          ) : (
            <Skeleton h="320px" borderRadius="xl" />
          )}

          <HStack justify="space-between" align="center">
            <Heading size="lg">{meal.title}</Heading>

            {/* 🔴 DELETE BUTTON */}
            <Button
              colorScheme="red"
              variant="solid"
              size="sm"
              onClick={handleDelete}
            >
              Delete Meal
            </Button>
          </HStack>

          <HStack spacing={3} flexWrap="wrap">
            {meal.calories != null && (
              <Badge borderRadius="full" px={3} py={1}>
                {Math.round(meal.calories)} kcal
              </Badge>
            )}
            {meal.protein != null && (
              <Badge borderRadius="full" px={3} py={1}>
                {meal.protein}g protein
              </Badge>
            )}
            {meal.carbs != null && (
              <Badge borderRadius="full" px={3} py={1}>
                {meal.carbs}g carbs
              </Badge>
            )}
            {meal.fat != null && (
              <Badge borderRadius="full" px={3} py={1}>
                {meal.fat}g fat
              </Badge>
            )}
          </HStack>

          {meal.createdAt && (
            <Text fontSize="sm" color="gray.400">
              Logged{" "}
              {(() => {
                try {
                  const date =
                    (meal.createdAt as any).toDate?.() ??
                    new Date(meal.createdAt);
                  return date.toLocaleString();
                } catch {
                  return "";
                }
              })()}
            </Text>
          )}

          {/* You can drop in more detailed nutrition sections here if you have them */}
        </VStack>
      </Box>
    </AppLayout>
  );
}
