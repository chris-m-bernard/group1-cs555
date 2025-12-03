import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Spinner,
  Center,
  useToast,
  Button,
  Flex,
  Input,
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
import AppLayout from "../layouts/AppLayout";
import { deleteMeal } from "../lib/meal";

import type { Meal } from "../lib/meal";
import MealCard from "../components/MealCard";
import { routes } from "../routes";

export default function Meals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState(""); // name search
  const [searchDate, setSearchDate] = useState(""); // YYYY-MM-DD

  const navigate = useNavigate();
  const toast = useToast();

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
            imageData: data.imageData,
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

  const handleDeleteMeal = async (mealId: string) => {
    try {
      await deleteMeal(mealId);
      setMeals((prev) => prev.filter((m) => m.id !== mealId));
      toast({
        title: "Meal deleted",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
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

  // helper to turn createdAt into "YYYY-MM-DD"
  // helper to turn createdAt into local "YYYY-MM-DD"
  const createdAtToDateString = (createdAt: any): string => {
    try {
      const d =
        createdAt && typeof createdAt.toDate === "function"
          ? (createdAt.toDate() as Date)
          : new Date(createdAt);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0"); // 0-based month
      const day = String(d.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`; // local date string
    } catch {
      return "";
    }
  };

  // filter by name + date
  const filteredMeals = useMemo(() => {
    return meals.filter((meal) => {
      const matchesName = searchTerm
        ? meal.title.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const mealDateStr = meal.createdAt
        ? createdAtToDateString(meal.createdAt)
        : "";

      const matchesDate = searchDate ? mealDateStr === searchDate : true;

      return matchesName && matchesDate;
    });
  }, [meals, searchTerm, searchDate]);

  if (loading) {
    return (
      <AppLayout
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
        <Center minH="60vh">
          <VStack spacing={4}>
            <Spinner />
            <Text>Loading your meals...</Text>
          </VStack>
        </Center>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Center minH="60vh">
          <Text color="red.400">{error}</Text>
        </Center>
      </AppLayout>
    );
  }

  if (!meals.length) {
    return (
      <AppLayout
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
        <Center minH="60vh">
          <VStack spacing={2}>
            <Heading size="md">No meals yet</Heading>
            <Text color="gray.400">Start by adding your first meal.</Text>
          </VStack>
        </Center>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Box p={6}>
        <Flex flexDir="row" align="center" justify="space-between" mb={4}>
          <Heading mb={4}>My Meals</Heading>
          <Button
            onClick={() => navigate(routes.mealNew)}
            className="rounded-xl px-5"
            colorScheme="teal"
            size="md"
            right={0}
          >
            Upload new meal
          </Button>
        </Flex>

        {/* Search bar row */}
        <Flex
          gap={4}
          flexDir={{ base: "column", md: "row" }}
          mb={4}
          align={{ base: "stretch", md: "center" }}
        >
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxW={{ base: "100%", md: "300px" }}
          />

          <Input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            maxW={{ base: "100%", md: "200px" }}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setSearchDate("");
            }}
          >
            Clear filters
          </Button>
        </Flex>

        <Text mb={6} color="gray.500">
          Tap a meal card to view full nutrition details.
        </Text>

        {!filteredMeals.length ? (
          <Text color="gray.400">
            No meals match your current search. Try adjusting the name or date
            filters.
          </Text>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={5}>
            {filteredMeals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onOpen={handleCardClick}
                onDelete={handleDeleteMeal}
              />
            ))}
          </SimpleGrid>
        )}
      </Box>
    </AppLayout>
  );
}
