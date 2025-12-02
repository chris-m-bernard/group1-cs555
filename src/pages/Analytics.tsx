// src/pages/Analytics.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  SimpleGrid,
  Text,
  useColorModeValue,
  Progress,
  HStack,
  Tag,
  Button,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import AppLayout from "../layouts/AppLayout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { listMealsForCurrentUser, type Meal } from "../lib/meal";
import { getUserGoals, type UserGoals } from "../lib/goals";

type WeeklySummary = {
  weekLabel: string;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
};

type MacroBreakdown = {
  label: string;
  percent: number; // 0–100
};

type DailyCalories = {
  day: string;
  calories: number;
};

type GoalCard = {
  id: string;
  label: string;
  target: string;
  current: string;
  progress: number; // 0–100
  status: "on-track" | "behind" | "ahead";
};

const LAST_N_DAYS = 7;

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const cardBg = useColorModeValue("white", "gray.800");
  const softBg = useColorModeValue("gray.50", "gray.900");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const subtleText = useColorModeValue("gray.500", "gray.400");

  const [meals, setMeals] = useState<Meal[]>([]);
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current 7 days, 1 = previous, etc.

  // Load meals + goals
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [mealsRes, goalsRes] = await Promise.all([
          listMealsForCurrentUser(),
          getUserGoals(user.uid),
        ]);

        setMeals(mealsRes);
        setGoals(goalsRes ?? null);
        console.log("Analytics meals:", mealsRes);
      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user]);

  // Helper: get start & end date for the selected week window
  const getWeekRange = (offset: number) => {
    const today = new Date();

    // end of the selected 7-day window
    const end = new Date(today);
    end.setDate(end.getDate() - offset * LAST_N_DAYS);
    end.setHours(23, 59, 59, 999);

    // start is LAST_N_DAYS - 1 days before end
    const start = new Date(end);
    start.setDate(end.getDate() - (LAST_N_DAYS - 1));
    start.setHours(0, 0, 0, 0);

    return { start, end };
  };

  // Filter meals to last N days for the selected week
  const recentMeals = useMemo(() => {
    if (!meals.length) return [];

    const { start, end } = getWeekRange(weekOffset);

    return meals.filter((m) => {
      if (!m.createdAt) return false;

      const date =
        typeof (m.createdAt as any).toDate === "function"
          ? (m.createdAt as any).toDate()
          : new Date(m.createdAt);

      return date >= start && date <= end;
    });
  }, [meals, weekOffset]);

  // Weekly summary (based on recent meals)
  const weeklySummary: WeeklySummary = useMemo(() => {
    const { start, end } = getWeekRange(weekOffset);

    const weekLabel = `${start.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })} – ${end.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}`;

    if (!recentMeals.length) {
      return {
        weekLabel,
        avgCalories: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFat: 0,
      };
    }

    const total = recentMeals.reduce(
      (acc, m) => {
        acc.calories += m.calories ?? 0;
        acc.protein += m.protein ?? 0;
        acc.carbs += m.carbs ?? 0;
        acc.fat += m.fat ?? 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const count = recentMeals.length;

    return {
      weekLabel,
      avgCalories: total.calories / count,
      avgProtein: total.protein / count,
      avgCarbs: total.carbs / count,
      avgFat: total.fat / count,
    };
  }, [recentMeals, weekOffset]);

  // Macro breakdown based on weekly averages
  const macroBreakdown: MacroBreakdown[] = useMemo(() => {
    const calFromProtein = weeklySummary.avgProtein * 4;
    const calFromCarbs = weeklySummary.avgCarbs * 4;
    const calFromFat = weeklySummary.avgFat * 9;

    const total =
      calFromProtein + calFromCarbs + calFromFat || weeklySummary.avgCalories;

    if (!total || total <= 0) {
      return [
        { label: "Protein", percent: 0 },
        { label: "Carbs", percent: 0 },
        { label: "Fat", percent: 0 },
      ];
    }

    return [
      {
        label: "Protein",
        percent: Math.round((calFromProtein / total) * 100),
      },
      {
        label: "Carbs",
        percent: Math.round((calFromCarbs / total) * 100),
      },
      {
        label: "Fat",
        percent: Math.round((calFromFat / total) * 100),
      },
    ];
  }, [weeklySummary]);

  // Daily calories for the selected week (always 7 entries)
  const dailyCalories: DailyCalories[] = useMemo(() => {
    const { end } = getWeekRange(weekOffset);
    const map: Record<string, number> = {};

    // Initialize each of the 7 days ending at `end` to 0
    for (let i = LAST_N_DAYS - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      map[d.toDateString()] = 0;
    }

    recentMeals.forEach((meal) => {
      if (!meal.createdAt) return;
      const date =
        typeof (meal.createdAt as any).toDate === "function"
          ? (meal.createdAt as any).toDate()
          : new Date(meal.createdAt);

      const key = date.toDateString();
      if (!(key in map)) return;
      map[key] += meal.calories ?? 0;
    });

    const result = Object.entries(map).map(([dateStr, calories]) => {
      const date = new Date(dateStr);
      const dayShort = date.toLocaleDateString(undefined, {
        weekday: "short",
      });
      return { day: dayShort, calories };
    });

    console.log("dailyCalories for chart:", result, "weekOffset:", weekOffset);
    return result;
  }, [recentMeals, weekOffset]);

  const maxCalories =
    dailyCalories.length > 0
      ? Math.max(...dailyCalories.map((d) => d.calories), 1)
      : 1;

  // Build goal cards from goals + weeklySummary
  const goalCards: GoalCard[] = useMemo(() => {
    if (!goals) return [];

    const cards: GoalCard[] = [];

    const makeStatus = (ratio: number): GoalCard["status"] => {
      if (ratio >= 0.95 && ratio <= 1.05) return "on-track";
      if (ratio < 0.95) return "behind";
      return "ahead";
    };

    // Calories
    if (goals.dailyCalories > 0 && weeklySummary.avgCalories > 0) {
      const ratio = weeklySummary.avgCalories / goals.dailyCalories;
      cards.push({
        id: "calories",
        label: "Daily calorie target",
        target: `${goals.dailyCalories.toFixed(0)} kcal`,
        current: `${weeklySummary.avgCalories.toFixed(0)} kcal avg`,
        progress: Math.min(100, Math.round(ratio * 100)),
        status: makeStatus(ratio),
      });
    }

    // Protein
    if (goals.dailyProtein > 0 && weeklySummary.avgProtein > 0) {
      const ratio = weeklySummary.avgProtein / goals.dailyProtein;
      cards.push({
        id: "protein",
        label: "Protein intake",
        target: `${goals.dailyProtein.toFixed(0)} g/day`,
        current: `${weeklySummary.avgProtein.toFixed(0)} g avg`,
        progress: Math.min(100, Math.round(ratio * 100)),
        status: makeStatus(ratio),
      });
    }

    // Carbs
    if (goals.dailyCarbs > 0 && weeklySummary.avgCarbs > 0) {
      const ratio = weeklySummary.avgCarbs / goals.dailyCarbs;
      cards.push({
        id: "carbs",
        label: "Carb intake",
        target: `${goals.dailyCarbs.toFixed(0)} g/day`,
        current: `${weeklySummary.avgCarbs.toFixed(0)} g avg`,
        progress: Math.min(100, Math.round(ratio * 100)),
        status: makeStatus(ratio),
      });
    }

    // Fat
    if (goals.dailyFat > 0 && weeklySummary.avgFat > 0) {
      const ratio = weeklySummary.avgFat / goals.dailyFat;
      cards.push({
        id: "fat",
        label: "Fat intake",
        target: `${goals.dailyFat.toFixed(0)} g/day`,
        current: `${weeklySummary.avgFat.toFixed(0)} g avg`,
        progress: Math.min(100, Math.round(ratio * 100)),
        status: makeStatus(ratio),
      });
    }

    return cards;
  }, [goals, weeklySummary]);

  const getStatusColor = (status: GoalCard["status"]) => {
    switch (status) {
      case "on-track":
        return "green";
      case "behind":
        return "orange";
      case "ahead":
        return "teal";
      default:
        return "gray";
    }
  };

  const handlePrevWeek = () => {
    setWeekOffset((prev) => prev + 1);
  };

  const handleNextWeek = () => {
    setWeekOffset((prev) => Math.max(0, prev - 1));
  };

  if (loading) {
    return (
      <AppLayout title="Analytics" subtitle="">
        <Flex justify="center" align="center" minH="200px">
          <Spinner />
        </Flex>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Analytics"
      subtitle="Track your nutrition trends, see how you’re progressing toward your goals, and keep your diet on target."
      action={
        <Button onClick={() => navigate("/goals")} size="md" variant="outline">
          Adjust goals
        </Button>
      }
    >
      {/* Week navigation */}
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="sm" color={subtleText}>
          Viewing: {weeklySummary.weekLabel}
        </Text>
        <HStack spacing={2}>
          <Button
            size="xs"
            leftIcon={<ChevronLeftIcon />}
            variant="outline"
            onClick={handlePrevWeek}
          >
            Previous week
          </Button>
          <Button
            size="xs"
            rightIcon={<ChevronRightIcon />}
            variant="outline"
            onClick={handleNextWeek}
            isDisabled={weekOffset === 0}
          >
            Next week
          </Button>
        </HStack>
      </Flex>

      {/* Weekly summary cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
        <Box bg={cardBg} rounded="2xl" p={4} boxShadow="sm">
          <Text fontSize="xs" color={subtleText}>
            Week
          </Text>
          <Text fontWeight="bold" fontSize="sm">
            {weeklySummary.weekLabel}
          </Text>
        </Box>
        <Box bg={cardBg} rounded="2xl" p={4} boxShadow="sm">
          <Text fontSize="xs" color={subtleText}>
            Avg calories
          </Text>
          <Text fontWeight="bold" fontSize="lg">
            {weeklySummary.avgCalories
              ? `${Math.round(weeklySummary.avgCalories)} kcal`
              : "—"}
          </Text>
        </Box>
        <Box bg={cardBg} rounded="2xl" p={4} boxShadow="sm">
          <Text fontSize="xs" color={subtleText}>
            Avg protein
          </Text>
          <Text fontWeight="bold" fontSize="lg">
            {weeklySummary.avgProtein
              ? `${Math.round(weeklySummary.avgProtein)} g`
              : "—"}
          </Text>
        </Box>
        <Box bg={cardBg} rounded="2xl" p={4} boxShadow="sm">
          <Text fontSize="xs" color={subtleText}>
            Avg carbs / fat
          </Text>
          <Text fontWeight="bold" fontSize="lg">
            {weeklySummary.avgCarbs || weeklySummary.avgFat
              ? `${Math.round(weeklySummary.avgCarbs)} g / ${Math.round(
                  weeklySummary.avgFat
                )} g`
              : "—"}
          </Text>
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        {/* Macro distribution */}
        <Box
          bg={cardBg}
          rounded="2xl"
          p={5}
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Text fontSize="sm" fontWeight="semibold" mb={1}>
            Macro distribution
          </Text>
          <Text fontSize="xs" color={subtleText} mb={4}>
            Percentage of calories from protein, carbs, and fat (last{" "}
            {LAST_N_DAYS} days in this view).
          </Text>

          <VStack align="stretch" spacing={3}>
            {macroBreakdown.map((macro) => (
              <Box key={macro.label}>
                <Flex justify="space-between" mb={1}>
                  <Text fontSize="xs">{macro.label}</Text>
                  <Text fontSize="xs" color={subtleText}>
                    {macro.percent}%
                  </Text>
                </Flex>
                <Progress
                  value={macro.percent}
                  size="sm"
                  rounded="full"
                  bg={softBg}
                />
              </Box>
            ))}
          </VStack>
        </Box>

        {/* Daily calories chart */}
        <Box
          bg={cardBg}
          rounded="2xl"
          p={5}
          boxShadow="sm"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Text fontSize="sm" fontWeight="semibold" mb={1}>
            Daily calories
          </Text>
          <Text fontSize="xs" color={subtleText} mb={4}>
            Your logged calories for each day (this {LAST_N_DAYS}-day window).
          </Text>

          {!dailyCalories || dailyCalories.length === 0 ? (
            <Text fontSize="xs" color={subtleText}>
              No meals logged in this period yet.
            </Text>
          ) : (
            <>
              <Flex align="flex-end" gap={3} h="160px">
                {dailyCalories.map((day) => {
                  const maxBarHeight = 120; // px inside the 160px area
                  const ratio =
                    maxCalories > 0 ? day.calories / maxCalories : 0;
                  const heightPx = Math.max(ratio * maxBarHeight, 4); // at least 4px

                  return (
                    <VStack
                      key={day.day}
                      spacing={2}
                      flex="1"
                      justify="flex-end"
                      align="center"
                    >
                      <Box
                        w="full"
                        bg={softBg}
                        rounded="xl"
                        position="relative"
                        overflow="hidden"
                        h={`${maxBarHeight}px`}
                        display="flex"
                        alignItems="flex-end"
                      >
                        <Box w="100%" bg="teal.400" h={`${heightPx}px`} />
                      </Box>
                      <Text fontSize="xs" color={subtleText}>
                        {day.day}
                      </Text>
                    </VStack>
                  );
                })}
              </Flex>

              <Text fontSize="xs" color={subtleText} mt={3}>
                Peak day:{" "}
                <Text as="span" fontWeight="semibold">
                  {
                    dailyCalories.reduce((max, d) =>
                      d.calories > max.calories ? d : max
                    ).day
                  }
                </Text>
              </Text>
            </>
          )}
        </Box>
      </SimpleGrid>

      {/* Goals section */}
      <Box
        mt={6}
        bg={cardBg}
        rounded="2xl"
        p={5}
        boxShadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontSize="sm" fontWeight="semibold">
            Goals & progress
          </Text>
          <Button size="xs" variant="ghost" onClick={() => navigate("/goals")}>
            Edit goals
          </Button>
        </Flex>

        {(!goals || !goalCards.length) && (
          <Text fontSize="xs" color={subtleText}>
            Set your daily calorie and macro targets on the Goals page to see
            progress here.
          </Text>
        )}

        {goalCards.length > 0 && (
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            {goalCards.map((goal) => (
              <Box
                key={goal.id}
                bg={softBg}
                rounded="2xl"
                p={4}
                borderWidth="1px"
                borderColor={borderColor}
              >
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">
                    {goal.label}
                  </Text>
                  <Tag
                    size="sm"
                    colorScheme={getStatusColor(goal.status)}
                    variant="subtle"
                  >
                    {goal.status === "on-track"
                      ? "On track"
                      : goal.status === "behind"
                      ? "Needs work"
                      : "Ahead"}
                  </Tag>
                </HStack>

                <Text fontSize="xs" color={subtleText} mb={1}>
                  Target:{" "}
                  <Text as="span" fontWeight="semibold">
                    {goal.target}
                  </Text>
                </Text>
                <Text fontSize="xs" color={subtleText} mb={2}>
                  Current:{" "}
                  <Text as="span" fontWeight="semibold">
                    {goal.current}
                  </Text>
                </Text>

                <Progress
                  value={goal.progress}
                  size="sm"
                  rounded="full"
                  bg="blackAlpha.100"
                  mb={1}
                />
                <Text fontSize="xs" color={subtleText}>
                  {goal.progress}% of target
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>
    </AppLayout>
  );
};

export default Analytics;
