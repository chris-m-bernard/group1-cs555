// src/pages/Auth.tsx
import { useEffect, useState, type ReactElement } from "react";
import {
  Button,
  Input,
  Heading,
  VStack,
  HStack,
  Text,
  Box,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { auth } from "../lib/firebase";
import hideIcon from "../assets/hide_11238328.png";
import viewIcon from "../assets/view_11450606.png";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User,
} from "firebase/auth";
import { routes } from "../routes.ts";
import { Link } from "react-router-dom";
import { ensureUserDoc } from "../lib/userData";

import { useNavigate } from "react-router-dom";

export default function Auth(): ReactElement {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const signUp = async () => {
    setBusy(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, pw);
    } catch (e: any) {
      setError(e?.message ?? "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  const signIn = async () => {
    setBusy(true);
    setError(null);

    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      // Log the user in
      const cred = await signInWithEmailAndPassword(auth, email, pw);

      // Ensure Firestore user document exists
      await ensureUserDoc();

      // Navigate now that everything is set up
      navigate(routes.dash);
    } catch (e: any) {
      setError(e?.message ?? "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const signOutUser = async () => {
    setBusy(true);
    setError(null);
    try {
      await signOut(auth);
    } catch (e: any) {
      setError(e?.message ?? "Sign out failed");
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email above, then click "Forgot password?"');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setError("Password reset email sent. Check your inbox.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to send reset email");
    } finally {
      setBusy(false);
    }
  };

  const bg = useColorModeValue("gray.100", "gray.950");
  const cardBg = useColorModeValue("white", "gray.800");
  const leftBg = useColorModeValue("#020617", "gray.900");

  return (
    <Box
      minH="100vh"
      bg={bg}
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={0}
      className="auth-page"
    >
      <Flex
        maxW="4xl"
        w="full"
        bg={cardBg}
        borderRadius="2xl"
        boxShadow="2xl"
        overflow="hidden"
      >
        {/* Left brand panel */}
        <Box
          flex={{ base: 0, md: 1 }}
          display={{ base: "none", md: "flex" }}
          flexDirection="column"
          justifyContent="space-between"
          bg={leftBg}
          color="white"
          p={8}
        >
          <Box>
            <HStack spacing={3} mb={6}>
              <Box
                bg="teal.500"
                rounded="xl"
                w={10}
                h={10}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontWeight="bold" fontSize="xl">
                  🥗
                </Text>
              </Box>
              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  MacroVision
                </Text>
                <Text fontSize="xs" color="gray.300">
                  AI Food Tracker
                </Text>
              </Box>
            </HStack>

            <Heading size="md" mb={2}>
              Eat smarter with AI.
            </Heading>
            <Text fontSize="sm" color="gray.300">
              Upload your meals, track macros automatically, and get
              personalized recommendations that match your goals.
            </Text>
          </Box>

          <Text fontSize="xs" color="gray.500" mt={8}>
            © {new Date().getFullYear()} MacroVision
          </Text>
        </Box>

        {/* Right auth form */}
        <Box
          flex={{ base: 1, md: 1 }}
          p={{ base: 6, md: 10 }}
          display="flex"
          flexDirection="column"
          justifyContent="center"
        >
          <Heading as="h1" size="lg" mb={2}>
            {"Welcome back"}
          </Heading>
          <Text mb={8} fontSize="sm" color="gray.500">
            Sign in to access your dashboard and let the AI handle the nutrition
            breakdown.
          </Text>

          <VStack gap="4" align="stretch" maxW="sm">
            <Box>
              <Text mb={1} fontSize="xs" fontWeight="medium" color="gray.600">
                Email
              </Text>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                bg={useColorModeValue("gray.50", "gray.900")}
              />
            </Box>

            <Box>
              <Text mb={1} fontSize="xs" fontWeight="medium" color="gray.600">
                Password
              </Text>
              <HStack gap="2" align="center">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  flex="1"
                  bg={useColorModeValue("gray.50", "gray.900")}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ minWidth: "auto", padding: "8px" }}
                >
                  <img
                    src={showPassword ? viewIcon : hideIcon}
                    alt={showPassword ? "Hide password" : "Show password"}
                    width="16"
                    height="16"
                    style={{
                      display: "block",
                      filter: "brightness(0) invert(1)",
                    }}
                  />
                </Button>
              </HStack>
            </Box>

            <HStack justify="space-between" align="center">
              <HStack gap="2" align="center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRememberMe(e.target.checked)
                  }
                  style={{ accentColor: "#14b8a6" }}
                />
                <label
                  htmlFor="rememberMe"
                  style={{ cursor: "pointer", fontSize: "14px" }}
                >
                  Remember me
                </label>
              </HStack>

              <Button
                size="sm"
                variant="ghost"
                onClick={forgotPassword}
                isLoading={busy}
              >
                Forgot password?
              </Button>
            </HStack>

            <HStack gap="3" pt={2}>
              <Button flex={1} size="md" onClick={signUp} isLoading={busy}>
                Sign up
              </Button>
              <Button
                flex={1}
                size="md"
                variant="outline"
                onClick={signIn}
                isLoading={busy}
              >
                Sign in
              </Button>
            </HStack>

            {error ? (
              <Text role="alert" color="red.500" fontSize="sm">
                {error}
              </Text>
            ) : null}
          </VStack>
        </Box>
      </Flex>
    </Box>
  );
}
