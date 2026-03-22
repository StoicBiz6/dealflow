import { useSignUp } from "@clerk/clerk-expo";
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

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError.errors?.[0]?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError.errors?.[0]?.message || "Verification failed");
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
            Create Account
          </Text>
          <Text className="text-slate-400 text-base">
            {pendingVerification
              ? "Enter the code sent to your email"
              : "Get started with Deal Tracker"}
          </Text>
        </View>

        {!pendingVerification ? (
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
            />
            {error ? (
              <Text className="text-red-400 text-sm mb-4">{error}</Text>
            ) : (
              <View className="mb-4" />
            )}
            <Pressable
              onPress={handleSignUp}
              disabled={loading}
              className="bg-blue-600 rounded-xl py-4 items-center mb-6"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Create Account
                </Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              className="bg-slate-800 text-white rounded-xl px-4 py-4 mb-2 text-base text-center tracking-widest"
              placeholder="123456"
              placeholderTextColor="#64748b"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />
            {error ? (
              <Text className="text-red-400 text-sm mb-4">{error}</Text>
            ) : (
              <View className="mb-4" />
            )}
            <Pressable
              onPress={handleVerify}
              disabled={loading}
              className="bg-blue-600 rounded-xl py-4 items-center mb-6"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Verify Email
                </Text>
              )}
            </Pressable>
          </>
        )}

        <View className="flex-row justify-center">
          <Text className="text-slate-400">Already have an account? </Text>
          <Link href="/(auth)/sign-in">
            <Text className="text-blue-400">Sign in</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
