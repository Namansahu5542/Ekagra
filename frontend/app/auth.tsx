import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { AppText, BigButton, Card, Screen } from "@/components/UI";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { colors, radii, space, touch, type } from "@/theme";

export default function Auth() {
  const { t } = useTranslation();
  const router = useRouter();
  const { online, setCaregiver } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!online) return setError(t("auth.offline"));
    if (!email.includes("@") || password.length < 4) return setError(t("auth.needBoth"));
    setBusy(true);
    try {
      const res =
        mode === "signup"
          ? await api.caregiverSignup(email.trim(), password)
          : await api.caregiverLogin(email.trim(), password);
      await setCaregiver({ email: email.trim(), userId: res.user_id, token: res.token });
      router.replace("/patient-setup");
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (mode === "signup" && (msg.toLowerCase().includes("exist") || msg.includes("409"))) {
        setMode("signin");
        setError(t("auth.existing"));
      } else if (mode === "signin") {
        setError(t("auth.invalid"));
      } else {
        setError(msg || t("auth.invalid"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen testID="auth-screen">
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Ionicons name="heart-circle" size={56} color={colors.emberOrange} />
        </View>
        <AppText size={type.title} weight="700">{t("appName")}</AppText>
        <AppText size={type.body} color={colors.pewter} style={{ textAlign: "center" }}>{t("auth.subtitle")}</AppText>
      </View>

      <View style={styles.tabs}>
        <Pressable testID="tab-signin" onPress={() => { setMode("signin"); setError(null); }} style={[styles.tab, mode === "signin" && styles.tabOn]}>
          <AppText size={type.action} weight="700" color={mode === "signin" ? colors.pureWhite : colors.inkBlack}>{t("auth.signIn")}</AppText>
        </Pressable>
        <Pressable testID="tab-signup" onPress={() => { setMode("signup"); setError(null); }} style={[styles.tab, mode === "signup" && styles.tabOn]}>
          <AppText size={type.action} weight="700" color={mode === "signup" ? colors.pureWhite : colors.inkBlack}>{t("auth.signUp")}</AppText>
        </Pressable>
      </View>

      <Card>
        <AppText size={type.helper} weight="600" style={{ marginBottom: 6 }}>{t("auth.email")}</AppText>
        <TextInput
          testID="auth-email"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          placeholderTextColor={colors.stone}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <AppText size={type.helper} weight="600" style={{ marginTop: space.md, marginBottom: 6 }}>{t("auth.password")}</AppText>
        <TextInput
          testID="auth-password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••"
          placeholderTextColor={colors.stone}
          secureTextEntry
          style={styles.input}
        />
      </Card>

      {error && <AppText testID="auth-error" size={type.helper} color={mode === "signin" ? colors.danger : colors.burntRust}>{error}</AppText>}

      <BigButton
        testID="auth-submit"
        label={busy ? t("auth.working") : mode === "signup" ? t("auth.signUpBtn") : t("auth.signInBtn")}
        icon={mode === "signup" ? "person-add" : "log-in"}
        loading={busy}
        onPress={submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: space.xs, marginTop: space.lg, marginBottom: space.md },
  logo: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: colors.peachBlush,
    justifyContent: "center", alignItems: "center", marginBottom: space.sm,
  },
  tabs: { flexDirection: "row", gap: space.sm },
  tab: {
    flex: 1, minHeight: touch.primary, borderRadius: radii.button, justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: colors.driftwood, backgroundColor: colors.pureWhite,
  },
  tabOn: { backgroundColor: colors.emberOrange, borderColor: colors.emberOrange },
  input: {
    minHeight: touch.min, borderWidth: 1, borderColor: colors.driftwood, borderRadius: radii.input,
    paddingHorizontal: space.md, fontSize: type.body, color: colors.inkBlack, backgroundColor: colors.pureWhite,
  },
});
