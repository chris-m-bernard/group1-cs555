import React, { useState } from "react";
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
} from "@chakra-ui/react";
import AppLayout from "../layouts/AppLayout";

type GoalFormState = {
  goalType: "maintain" | "lose" | "gain";
  dailyCalories: string;
  dailyProtein: string;
  dailyCarbs: string;
  dailyFat: string;
  notes: string;
};

const Goals: React.FC = () => {
  const cardBg = useColorModeValue("white", "gray.800");
  const softBg = useColorModeValue("gray.50", "gray.900");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const subtleText = useColorModeValue("gray.500", "gray.400");

  const toast = useToast();

  // Mock initial values – swap with real user data later
  const [form, setForm] = useState<GoalFormState>({
    goalType: "maintain",
    dailyCalories: "2200",
    dailyProtein: "140",
    dailyCarbs: "220",
    dailyFat: "70",
    notes:
      "I want to maintain weight while staying fueled for workouts and keeping energy stable throughout the day.",
  });

  const updateField = <K extends keyof GoalFormState>(
    key: K,
    value: GoalFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: send to backend / Firestore later
    console.log("Saving goals:", form);

    toast({
      title: "Goals updated",
      description: "Your nutrition targets have been saved (mock for now).",
      status: "success",
      duration: 2500,
      isClosable: true,
    });
  };

  return (
    <AppLayout
      title="Adjust goals"
      subtitle="Tune your calorie and macro targets so MacroVision can give you smarter recommendations."
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
          <RadioGroup
            value={form.goalType}
            onChange={(val) =>
              updateField("goalType", val as GoalFormState["goalType"])
            }
          >
            <Stack direction={{ base: "column", sm: "row" }} spacing={4}>
              <Radio value="maintain">Maintain weight</Radio>
              <Radio value="lose">Lose weight</Radio>
              <Radio value="gain">Gain muscle / mass</Radio>
            </Stack>
          </RadioGroup>
          <Text fontSize="xs" color={subtleText} mt={1}>
            This doesn’t change anything yet, but later it can drive AI
            suggestions and automatic target tuning.
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

          <Text fontSize="xs" color={subtleText} mt={2}>
            Tip: A common starting point is ~0.7–1.0g protein per lb of body
            weight, with carbs and fats adjusted based on training and energy
            levels.
          </Text>
        </Box>

        {/* Notes for AI / future use */}
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
        <Flex justify="flex-end" gap={3}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setForm({
                goalType: "maintain",
                dailyCalories: "2200",
                dailyProtein: "140",
                dailyCarbs: "220",
                dailyFat: "70",
                notes:
                  "I want to maintain weight while staying fueled for workouts and keeping energy stable throughout the day.",
              })
            }
          >
            Reset to defaults
          </Button>
          <Button type="submit" colorScheme="teal" size="md">
            Save goals
          </Button>
        </Flex>
      </Box>
    </AppLayout>
  );
};

export default Goals;
