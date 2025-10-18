// src/pages/Auth.tsx
import { useEffect, useState, type ReactElement } from "react";
import {
  Button,
  Input,
  Heading,
  VStack,
  HStack,
  Text,
  Link as ChakraLink,
  Box,
} from "@chakra-ui/react";
import { auth } from "../lib/firebase";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

export default function Auth(): ReactElement {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const signUp = async () => {
    setBusy(true); setError(null);
    try { await createUserWithEmailAndPassword(auth, email, pw); }
    catch (e: any) { setError(e?.message ?? "Sign up failed"); }
    finally { setBusy(false); }
  };

  const signIn = async () => {
    setBusy(true); setError(null);
    try { await signInWithEmailAndPassword(auth, email, pw); }
    catch (e: any) { setError(e?.message ?? "Sign in failed"); }
    finally { setBusy(false); }
  };

  const signOutUser = async () => {
    setBusy(true); setError(null);
    try { await signOut(auth); }
    catch (e: any) { setError(e?.message ?? "Sign out failed"); }
    finally { setBusy(false); }
  };

  return (
    <>
      <Heading as="h1" size="lg" mb={4}>
        {user ? "AUTHENTICATED" : "Sign In or Sign Up"}
      </Heading>

      {!user ? (
        <VStack gap="3" align="stretch" maxW="sm">
          <Input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <HStack gap="3">
            <Button size="xl" colorPalette="teal" onClick={signUp} loading={busy}>
              Sign Up
            </Button>
            <Button
              size="xl"
              colorPalette="teal"
              variant="outline"
              onClick={signIn}
              loading={busy}
            >
              Sign In
            </Button>
          </HStack>

          {error && (
            <Text role="alert" color="red.500" fontSize="sm">
              {error}
            </Text>
          )}
        </VStack>
      ) : (
        <VStack gap="4">
          <Text>Welcome {user.email ?? "user"}.</Text>
          <Button size="xl" colorPalette="teal" onClick={signOutUser} loading={busy}>
            Sign Out
          </Button>
        </VStack>
      )}

      <Box mt={8} display="flex" gap="4">
        <ChakraLink href="/Home">Home</ChakraLink>
      </Box>
    </>
  );
}
