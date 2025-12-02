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
  FormControl,
  FormLabel,
  Input,
  Textarea,
} from "@chakra-ui/react";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import AppLayout from "../layouts/AppLayout";
import { auth, db } from "../lib/firebase";
import { deleteMeal, updateMeal, type Meal } from "../lib/meal";

export default function MealDetail() {
  const { mealId } = useParams<{ mealId: string }>();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    title: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    description: "",
    date: "YYYY-MM-DD",
  });

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
        const loadedMeal: Meal = {
          id: snap.id,
          title: data.title ?? "Untitled meal",
          imageData: data.imageData,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          description: data.description,
          createdAt: data.createdAt,
        };

        setMeal(loadedMeal);

        // initialize edit form from meal
        setForm({
          title: loadedMeal.title ?? "",
          calories:
            loadedMeal.calories !== undefined
              ? String(loadedMeal.calories)
              : "",
          protein:
            loadedMeal.protein !== undefined ? String(loadedMeal.protein) : "",
          carbs: loadedMeal.carbs !== undefined ? String(loadedMeal.carbs) : "",
          fat: loadedMeal.fat !== undefined ? String(loadedMeal.fat) : "",
          description: loadedMeal.description ?? "",
          date:
            loadedMeal.createdAt &&
            typeof loadedMeal.createdAt.toDate === "function"
              ? loadedMeal.createdAt.toDate().toISOString().slice(0, 10) // <-- KEEP previous date
              : new Date().toISOString().slice(0, 10),
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

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this meal? This action cannot be undone."
    );
    if (!confirmDelete) return;

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!mealId) return;

    try {
      await updateMeal(mealId, {
        title: form.title,
        calories: form.calories ? Number(form.calories) : undefined,
        protein: form.protein ? Number(form.protein) : undefined,
        carbs: form.carbs ? Number(form.carbs) : undefined,
        fat: form.fat ? Number(form.fat) : undefined,
        description: form.description,
        createdAt: Timestamp.fromDate(new Date(form.date)),
      });

      // update local state so UI reflects changes
      setMeal((prev) =>
        prev
          ? {
              ...prev,
              title: form.title,
              calories: form.calories ? Number(form.calories) : undefined,
              protein: form.protein ? Number(form.protein) : undefined,
              carbs: form.carbs ? Number(form.carbs) : undefined,
              fat: form.fat ? Number(form.fat) : undefined,
              description: form.description,
            }
          : prev
      );

      toast({
        title: "Meal updated",
        status: "success",
        duration: 2500,
        isClosable: true,
      });

      setEditing(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error updating meal",
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
            <Heading size="lg">{editing ? "Edit meal" : meal.title}</Heading>

            <HStack spacing={2}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing((e) => !e)}
              >
                {editing ? "Cancel" : "Edit"}
              </Button>
              <Button
                colorScheme="red"
                variant="solid"
                size="sm"
                onClick={handleDelete}
              >
                Delete Meal
              </Button>
            </HStack>
          </HStack>

          {!editing && (
            <>
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

              {meal.description && (
                <Text mt={2} whiteSpace="pre-wrap">
                  {meal.description}
                </Text>
              )}
            </>
          )}

          {editing && (
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel>Title</FormLabel>
                <Input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                />
              </FormControl>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Calories</FormLabel>
                  <Input
                    name="calories"
                    type="number"
                    value={form.calories}
                    onChange={handleChange}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Protein (g)</FormLabel>
                  <Input
                    name="protein"
                    type="number"
                    value={form.protein}
                    onChange={handleChange}
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Carbs (g)</FormLabel>
                  <Input
                    name="carbs"
                    type="number"
                    value={form.carbs}
                    onChange={handleChange}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Fat (g)</FormLabel>
                  <Input
                    name="fat"
                    type="number"
                    value={form.fat}
                    onChange={handleChange}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Date</FormLabel>
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                />
              </FormControl>

              <HStack justify="flex-end">
                <Button onClick={handleSave} colorScheme="blue">
                  Save Changes
                </Button>
              </HStack>
            </VStack>
          )}

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
        </VStack>
      </Box>
    </AppLayout>
  );
}
