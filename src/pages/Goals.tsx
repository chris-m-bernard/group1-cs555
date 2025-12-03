// src/pages/Goals.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Textarea,
  useColorModeValue,
  useToast,
  Text,
  SimpleGrid,
  Spinner,
} from "@chakra-ui/react";
import AppLayout from "../layouts/AppLayout";
import { useAuth } from "../lib/auth-context";
import {
  getUserGoals,
  saveUserGoals,
  deleteUserGoals,
  type UserGoals,
  type GoalType,
} from "../lib/goals";

type GoalFormState = {
  goalType: GoalType;
  dailyCalories: string;
  dailyProtein: string;
  dailyCarbs: string;
  dailyFat: string;
  notes: string;
};

// Presets for each overall goal
const GOAL_PRESETS: Record<GoalType, Omit<GoalFormState, "goalType">> = {
  maintain: {
    dailyCalories: "2200",
    dailyProtein: "140",
    dailyCarbs: "220",
    dailyFat: "70",
    notes:
      "I want to maintain weight while staying fueled for workouts and keeping energy stable throughout the day.",
  },
  lose: {
    dailyCalories: "1900",
    dailyProtein: "150",
    dailyCarbs: "170",
    dailyFat: "60",
    notes:
      "I want to lose weight gradually while keeping strength and energy for training.",
  },
  gain: {
    dailyCalories: "2600",
    dailyProtein: "160",
    dailyCarbs: "260",
    dailyFat: "80",
    notes:
      "I want to gain muscle and strength while staying relatively lean and energized.",
  },
};

const makeDefaultForm = (goalType: GoalType): GoalFormState => ({
  goalType,
  ...GOAL_PRESETS[goalType],
});

const Goals: React.FC = () => {
  const cardBg = useColorModeValue("white", "gray.800");
  const softBg = useColorModeValue("gray.50", "gray.900");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const subtleText = useColorModeValue("gray.500", "gray.400");

  const toast = useToast();
  const { user } = useAuth();

  const [form, setForm] = useState<GoalFormState>(makeDefaultForm("maintain"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const updateField = <K extends keyof GoalFormState>(
    key: K,
    value: GoalFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // When the user changes the overall goal, load that preset
  const handleGoalTypeChange = (val: string) => {
    const newType = val as GoalType;
    const preset = GOAL_PRESETS[newType];

    setForm({
      goalType: newType,
      dailyCalories: preset.dailyCalories,
      dailyProtein: preset.dailyProtein,
      dailyCarbs: preset.dailyCarbs,
      dailyFat: preset.dailyFat,
      notes: preset.notes,
    });
  };

  // Load existing goals for this user
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const goals = await getUserGoals(user.uid);
        if (goals) {
          setForm({
            goalType: goals.goalType,
            dailyCalories: goals.dailyCalories.toString(),
            dailyProtein: goals.dailyProtein.toString(),
            dailyCarbs: goals.dailyCarbs.toString(),
            dailyFat: goals.dailyFat.toString(),
            notes: goals.notes ?? "",
          });
        } else {
          // If no saved goals, start with maintain defaults
          setForm(makeDefaultForm("maintain"));
        }
      } catch (err) {
        console.error(err);
        toast({
          title: "Failed to load goals",
          description: "There was an issue fetching your goals.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const goals: UserGoals = {
        goalType: form.goalType,
        dailyCalories: Number(form.dailyCalories || 0),
        dailyProtein: Number(form.dailyProtein || 0),
        dailyCarbs: Number(form.dailyCarbs || 0),
        dailyFat: Number(form.dailyFat || 0),
        notes: form.notes,
      };

      await saveUserGoals(user.uid, goals);

      toast({
        title: "Goals updated",
        description: "Your nutrition targets have been saved.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to save goals",
        description: "Please try again.",
        status: "error",
        duration: 2500,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    // Reset based on the currently selected goalType
    setForm(makeDefaultForm(form.goalType));
    toast({
      title: "Reset goals to default",
      description: `Goals reset to the default values for "${form.goalType}"`,
      status: "success",
      duration: 2500,
      isClosable: true,
    });
  };

  if (loading) {
    return (
      <AppLayout title="Adjust goals" subtitle="">
        <Flex justify="center" align="center" minH="200px">
          <Spinner />
        </Flex>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Adjust goals"
      subtitle="Tune your calorie and macro targets so NutrifyAI can give you smarter recommendations."
    >
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg={cardBg}
        rounded="2xl"
        p={6}
        boxShadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
        maxW="3xl"
      >
        {/* Goal type */}
        <FormControl mb={6}>
          <FormLabel fontSize="sm">Overall goal</FormLabel>
          <RadioGroup value={form.goalType} onChange={handleGoalTypeChange}>
            <Stack direction={{ base: "column", sm: "row" }} spacing={4}>
              <Radio value="maintain">Maintain weight</Radio>
              <Radio value="lose">Lose weight</Radio>
              <Radio value="gain">Gain muscle / mass</Radio>
            </Stack>
          </RadioGroup>
          <Text fontSize="xs" color={subtleText} mt={1}>
            This can later drive AI suggestions and automatic target tuning.
          </Text>
        </FormControl>

        {/* Daily targets */}
        <Box
          bg={softBg}
          rounded="2xl"
          p={4}
          borderWidth="1px"
          borderColor={borderColor}
          mb={6}
        >
          <Text fontSize="sm" fontWeight="semibold" mb={3}>
            Daily targets
          </Text>

          <FormControl mb={4}>
            <FormLabel fontSize="xs">Calories (kcal per day)</FormLabel>
            <Input
              type="number"
              min={0}
              value={form.dailyCalories}
              onChange={(e) => updateField("dailyCalories", e.target.value)}
              bg={useColorModeValue("white", "gray.900")}
            />
          </FormControl>

          <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4}>
            <FormControl>
              <FormLabel fontSize="xs">Protein (g per day)</FormLabel>
              <Input
                type="number"
                min={0}
                value={form.dailyProtein}
                onChange={(e) => updateField("dailyProtein", e.target.value)}
                bg={useColorModeValue("white", "gray.900")}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs">Carbs (g per day)</FormLabel>
              <Input
                type="number"
                min={0}
                value={form.dailyCarbs}
                onChange={(e) => updateField("dailyCarbs", e.target.value)}
                bg={useColorModeValue("white", "gray.900")}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs">Fat (g per day)</FormLabel>
              <Input
                type="number"
                min={0}
                value={form.dailyFat}
                onChange={(e) => updateField("dailyFat", e.target.value)}
                bg={useColorModeValue("white", "gray.900")}
              />
            </FormControl>
          </SimpleGrid>
        </Box>

        {/* Notes */}
        <FormControl mb={6}>
          <FormLabel fontSize="sm">Notes</FormLabel>
          <Textarea
            rows={4}
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            bg={useColorModeValue("white", "gray.900")}
            placeholder="e.g., I train 3–4x/week, want to avoid big afternoon crashes, and prefer higher protein."
          />
          <Text fontSize="xs" color={subtleText} mt={1}>
            Later this can be used to personalize suggestions (meal ideas, macro
            tweaks, timing, etc.).
          </Text>
        </FormControl>

        {/* Actions */}
        <Flex justify="space-between" gap={3}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetDefaults}
            isDisabled={saving}
          >
            Reset to defaults
          </Button>

          <Flex gap={3}>
            <Button
              type="submit"
              colorScheme="teal"
              size="md"
              isLoading={saving}
            >
              Save goals
            </Button>
          </Flex>
        </Flex>
      </Box>
    </AppLayout>
  );
};

export default Goals;
