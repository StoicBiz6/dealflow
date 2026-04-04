import { useSignIn } from "@clerk/clerk-expo";
import type { EmailCodeFactor } from "@clerk/types";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Step = "credentials" | "otp";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    console.log("[SignIn] handleSignIn called, isLoaded:", isLoaded, "signIn:", !!signIn);
    if (!isLoaded) {
      setError("Authentication not ready. Please wait and try again.");
      return;
    }
    if (!signIn) {
      setError("Sign-in service unavailable. Please restart the app.");
      return;
    }
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      console.log("[SignIn] Attempting sign in for:", email.trim());
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });
      console.log("[SignIn] Result status:", result.status);

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
        return;
      }

      if (
        result.status === "needs_first_factor" ||
        result.status === "needs_client_trust"
      ) {
        // Find the email_code factor
        const emailFactor = result.supportedFirstFactors?.find(
          (f): f is EmailCodeFactor => f.strategy === "email_code"
        );
        if (!emailFactor) {
          setError("Email verification not available for this account.");
          return;
        }
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: emailFactor.emailAddressId,
        });
        setStep("otp");
        return;
      }

      setError(`Unexpected status: ${result.status}. Please try again.`);
    } catch (err: unknown) {
      console.error("[SignIn] Error:", err);
      const clerkError = err as { errors?: { message: string; longMessage?: string }[] };
      const message =
        clerkError.errors?.[0]?.longMessage ||
        clerkError.errors?.[0]?.message ||
        (err instanceof Error ? err.message : "Sign in failed. Check your credentials.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!isLoaded || !signIn) return;
    if (!otpCode.trim()) {
      setError("Please enter the verification code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      console.log("[SignIn] Attempting OTP verification");
      const result = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code: otpCode.trim(),
      });
      console.log("[SignIn] OTP result status:", result.status);
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        setError(`Unexpected status: ${result.status}. Please try again.`);
      }
    } catch (err: unknown) {
      console.error("[SignIn] OTP error:", err);
      const clerkError = err as { errors?: { message: string; longMessage?: string }[] };
      const message =
        clerkError.errors?.[0]?.longMessage ||
        clerkError.errors?.[0]?.message ||
        (err instanceof Error ? err.message : "Verification failed. Check your code.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-900"
    >
      <View
        className="flex-1 justify-center px-6"
        style={{ paddingBottom: insets.bottom }}
      >
        <View className="mb-10">
          <Text className="text-white text-3xl font-bold mb-1">
            Deal Tracker
          </Text>
          <Text className="text-slate-400 text-base">
            {step === "credentials"
              ? "Sign in to your account"
              : "Check your email for a code"}
          </Text>
        </View>

        {step === "credentials" ? (
          <>
            <TextInput
              className="bg-slate-800 text-white rounded-xl px-4 py-4 mb-3 text-base"
              placeholder="Email"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <TextInput
              className="bg-slate-800 text-white rounded-xl px-4 py-4 mb-2 text-base"
              placeholder="Password"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            {error ? (
              <Text className="text-red-400 text-sm mb-4">{error}</Text>
            ) : (
              <View className="mb-4" />
            )}

            <Pressable
              onPress={handleSignIn}
              disabled={loading}
              className="bg-blue-600 rounded-xl py-4 items-center mb-6"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Sign In</Text>
              )}
            </Pressable>

            <View className="flex-row justify-center">
              <Text className="text-slate-400">Don't have an account? </Text>
              <Link href="/(auth)/sign-up">
                <Text className="text-blue-400">Sign up</Text>
              </Link>
            </View>
          </>
        ) : (
          <>
            <Text className="text-slate-400 text-sm mb-4">
              We sent a 6-digit code to {email}. Enter it below to continue.
            </Text>

            <TextInput
              className="bg-slate-800 text-white rounded-xl px-4 py-4 mb-2 text-base tracking-widest text-center"
              placeholder="000000"
              placeholderTextColor="#64748b"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            {error ? (
              <Text className="text-red-400 text-sm mb-4">{error}</Text>
            ) : (
              <View className="mb-4" />
            )}

            <Pressable
              onPress={handleVerifyOtp}
              disabled={loading}
              className="bg-blue-600 rounded-xl py-4 items-center mb-4"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Verify Code</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setStep("credentials");
                setOtpCode("");
                setError("");
              }}
              className="items-center"
            >
              <Text className="text-slate-400 text-sm">Back to sign in</Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
