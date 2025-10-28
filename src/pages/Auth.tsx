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

export default function Auth(): ReactElement {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    try { 
      // Set persistence based on remember me preference
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, pw); 
    }
    catch (e: any) { setError(e?.message ?? "Sign in failed"); }
    finally { setBusy(false); }
  };

  const signOutUser = async () => {
    setBusy(true); setError(null);
    try { await signOut(auth); }
    catch (e: any) { setError(e?.message ?? "Sign out failed"); }
    finally { setBusy(false); }
  };

  const forgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email above, then click “Forgot password?”");
      return;
    }
    setBusy(true); setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setError("Password reset email sent. Check your inbox.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to send reset email");
    } finally {
      setBusy(false);
    }
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
          <HStack gap="2" align="center">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              flex="1"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPassword(!showPassword)}
              style={{ minWidth: 'auto', padding: '8px' }}
            >
              <img 
              src={showPassword ? viewIcon : hideIcon } 
                alt={showPassword ? "Hide password" : "Show password"}
                width="16" 
                height="16"
                style={{ 
                  display: 'block',
                  filter: 'brightness(0) invert(1)'
                }}
              />
            </Button>
          </HStack>
          <HStack gap="2" align="center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="rememberMe" style={{ cursor: 'pointer', fontSize: '14px' }}>
              Remember me
            </label>
          </HStack>
          <Button size="md" colorPalette="gray" style={{alignSelf:"flex-start"}} onClick={forgotPassword} loading={busy}>
            Forgot Password?
          </Button>
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

          {error ? (
            <Text
              role="alert"
              color="red.500"
              fontSize="sm"
            >
              {error}
            </Text>
           ) : null }
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
