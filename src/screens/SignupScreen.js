// src/screens/SignupScreen.js
import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { AuthContext } from "../context/AuthContext";
import { Icon } from "react-native-paper";

export default function SignupScreen({ navigation }) {
  const { signup } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert("Validation", "Please enter email and password.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signup(email.trim(), password, name.trim() || undefined);
    } catch (err) {
      let message = "Failed to create account. Please try again.";
      if (err.code === "auth/email-already-in-use") message = "Email already in use.";
      else if (err.code === "auth/invalid-email") message = "Invalid email.";
      else if (err.code === "auth/weak-password") message = "Weak password.";
      Alert.alert("Signup Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon source="account-plus" size={48} color="#6366F1" />
            <Text style={styles.logo}>Create Account</Text>
            <View style={styles.logoAccent} />
          </View>
          <Text style={styles.subtitle}>Start splitting expenses today</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Icon source="account" size={18} color="#6366F1" />
              <Text style={styles.label}>Name (Optional)</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Icon source="email" size={18} color="#6366F1" />
              <Text style={styles.label}>Email</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              value={email}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Icon source="lock" size={18} color="#6366F1" />
              <Text style={styles.label}>Password</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Minimum 6 characters"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              onChangeText={setPassword}
              value={password}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Icon source="lock-check" size={18} color="#6366F1" />
              <Text style={styles.label}>Confirm Password</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              onChangeText={setConfirm}
              value={confirm}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSignup} 
            disabled={loading}
          >
            <Icon source="account-plus" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>{loading ? "Creating..." : "Create Account"}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkContainer}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkBold}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    fontSize: 32,
    fontWeight: "700",
    color: "#6366F1",
    letterSpacing: -0.5,
    marginTop: 12,
  },
  logoAccent: {
    width: 60,
    height: 4,
    backgroundColor: "#A5B4FC",
    borderRadius: 2,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6C757D",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  button: {
    backgroundColor: "#6366F1",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  linkContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    color: "#6C757D",
  },
  linkBold: {
    color: "#6366F1",
    fontWeight: "600",
  },
});
