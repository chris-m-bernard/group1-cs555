import React from "react";
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
} from "@chakra-ui/react";
import AppLayout from "../layouts/AppLayout";
import { useNavigate } from "react-router-dom";
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

type Goal = {
  id: number;
  label: string;
  target: string;
  current: string;
  progress: number; // 0–100
  status: "on-track" | "behind" | "ahead";
};

const weeklySummary: WeeklySummary = {
  weekLabel: "Nov 10 – Nov 16",
  avgCalories: 2150,
  avgProtein: 120,
  avgCarbs: 210,
  avgFat: 70,
};

const macroBreakdown: MacroBreakdown[] = [
  { label: "Protein", percent: 32 },
  { label: "Carbs", percent: 45 },
  { label: "Fat", percent: 23 },
];

const dailyCalories: DailyCalories[] = [
  { day: "Mon", calories: 2050 },
  { day: "Tue", calories: 2200 },
  { day: "Wed", calories: 2000 },
  { day: "Thu", calories: 2300 },
  { day: "Fri", calories: 2100 },
  { day: "Sat", calories: 2400 },
  { day: "Sun", calories: 1900 },
];

const goals: Goal[] = [
  {
    id: 1,
    label: "Daily calorie target",
    target: "2200 kcal",
    current: "2150 kcal avg",
    progress: 82,
    status: "on-track",
  },
  {
    id: 2,
    label: "Protein intake",
    target: "140 g/day",
    current: "120 g avg",
    progress: 68,
    status: "behind",
  },
  {
    id: 3,
    label: "Fiber / Whole foods",
    target: "5+ servings/day",
    current: "4 servings avg",
    progress: 74,
    status: "on-track",
  },
];

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const cardBg = useColorModeValue("white", "gray.800");
  const softBg = useColorModeValue("gray.50", "gray.900");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const subtleText = useColorModeValue("gray.500", "gray.400");

  const maxCalories = Math.max(...dailyCalories.map((d) => d.calories));

  const getStatusColor = (status: Goal["status"]) => {
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
            {weeklySummary.avgCalories.toLocaleString()} kcal
          </Text>
        </Box>
        <Box bg={cardBg} rounded="2xl" p={4} boxShadow="sm">
          <Text fontSize="xs" color={subtleText}>
            Avg protein
          </Text>
          <Text fontWeight="bold" fontSize="lg">
            {weeklySummary.avgProtein} g
          </Text>
        </Box>
        <Box bg={cardBg} rounded="2xl" p={4} boxShadow="sm">
          <Text fontSize="xs" color={subtleText}>
            Avg carbs / fat
          </Text>
          <Text fontWeight="bold" fontSize="lg">
            {weeklySummary.avgCarbs} g / {weeklySummary.avgFat} g
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
            Percentage of calories from protein, carbs, and fat (this week).
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

        {/* Daily calories “chart” */}
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
            Your logged calories for each day of the week.
          </Text>

          <Flex align="flex-end" gap={3} h="160px">
            {dailyCalories.map((day) => {
              const heightPercent = (day.calories / maxCalories) * 100;
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
                    h="100%"
                    display="flex"
                    alignItems="flex-end"
                  >
                    <Box
                      w="100%"
                      bg="teal.400"
                      height={`${heightPercent || 4}%`}
                    />
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
          <Button size="xs" variant="ghost">
            Edit goals (soon)
          </Button>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          {goals.map((goal) => (
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
      </Box>
    </AppLayout>
  );
};

export default Analytics;
