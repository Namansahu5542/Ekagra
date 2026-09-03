import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { AppText, BigButton, Card, Header, Screen } from "@/components/UI";
import { LANGUAGES } from "@/i18n/locales";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { colors, radii, space, touch, type } from "@/theme";

const DEFAULT_REMINDERS = [
  { type: "meal", title: "Breakfast", scheduled_time: "08:00" },
  { type: "water", title: "Drink water", scheduled_time: "10:00" },
  { type: "medicine", title: "Morning medicine", scheduled_time: "13:00" },
  { type: "exercise", title: "Short walk", scheduled_time: "17:00" },
  { type: "sleep", title: "Rest", scheduled_time: "21:00" },
];

export default function Setup() {
  const { t } = useTranslation();
  const router = useRouter();
  const { completeSetup, online } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");
  const [pin, setPin] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    email.includes("@") && password.length >= 4 && name.trim().length > 0 && pin.length === 4 && consent;

  async function onFinish() {
    setError(null);
    if (!online) {
      setError("You need an internet connection once to set up this device.");
      return;
    }
    setBusy(true);
    try {
      let token: string;
      try {
        const r = await api.caregiverLogin(email.trim(), password);
        token = r.token;
      } catch {
        const r = await api.caregiverSignup(email.trim(), password);
        token = r.token;
      }
      const profilePayload = {
        name: name.trim(),
        preferred_language: language,
        pin,
        consent_confirmed: true,
        reminder_templates: DEFAULT_REMINDERS,
      };
      const created = await api.createProfile(token, profilePayload);
      const patientId = created.patient_id;
      const verified = await api.verifyPin(patientId, pin);
      const profile = {
        patient_id: patientId,
        name: name.trim(),
        preferred_language: language,
        reminder_templates: DEFAULT_REMINDERS,
      };
      await completeSetup({
        patientId,
        profile,
        token: verified.patient_session_token,
        pin,
      });
      router.replace("/home");
    } catch (e: any) {
      setError(e?.message || "Setup failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen testID="setup-screen">
      <Header title={t("setup.title")} onBack={() => {}} />
      {!online && (
        <Card style={{ backgroundColor: colors.dangerBg, borderColor: colors.danger }}>
          <AppText size={type.helper} color={colors.danger}>
            {t("common.offline")} — internet is needed once to set up.
          </AppText>
        </Card>
      )}

      <Card>
        <AppText size={type.cardTitle} weight="700">{t("setup.step1")}</AppText>
        <AppText size={type.helper} color={colors.warmGray} style={{ marginBottom: space.sm }}>
          {t("setup.haveAccount")}
        </AppText>
        <Field
          label={t("setup.email")}
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          testID="setup-email"
        />
        <Field
          label={t("setup.password")}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••"
          secureTextEntry
          testID="setup-password"
        />
      </Card>

      <Card>
        <AppText size={type.cardTitle} weight="700">{t("setup.step2")}</AppText>
        <Field label={t("setup.name")} value={name} onChangeText={setName} placeholder="—" testID="setup-name" />
        <AppText size={type.helper} weight="600" style={{ marginTop: space.sm }}>{t("setup.language")}</AppText>
        <View style={styles.chips}>
          {LANGUAGES.map((l) => (
            <Pressable
              key={l.code}
              testID={`lang-${l.code}`}
              onPress={() => setLanguage(l.code)}
              style={[styles.chip, language === l.code && styles.chipOn]}
            >
              <AppText size={type.helper} weight="600" color={language === l.code ? colors.pureWhite : colors.inkBlack}>
                {l.label}
              </AppText>
            </Pressable>
          ))}
        </View>
        <AppText size={type.helper} weight="600" style={{ marginTop: space.md }}>{t("setup.pin")}</AppText>
        <TextInput
          testID="setup-pin"
          value={pin}
          onChangeText={(v) => setPin(v.replace(/[^0-9]/g, "").slice(0, 4))}
          placeholder="1234"
          placeholderTextColor={colors.stone}
          keyboardType="number-pad"
          secureTextEntry
          style={[styles.input, { letterSpacing: 8, textAlign: "center", fontSize: type.heading }]}
        />
      </Card>

      <Pressable testID="setup-consent" style={styles.consent} onPress={() => setConsent((c) => !c)}>
        <Ionicons
          name={consent ? "checkbox" : "square-outline"}
          size={30}
          color={consent ? colors.emberOrange : colors.stone}
        />
        <AppText size={type.helper} style={{ flex: 1 }}>{t("setup.consent")}</AppText>
      </Pressable>

      {error && (
        <AppText testID="setup-error" size={type.helper} color={colors.danger}>{error}</AppText>
      )}

      <BigButton
        testID="setup-finish"
        label={busy ? t("setup.working") : t("setup.finish")}
        onPress={onFinish}
        disabled={!canSubmit}
        loading={busy}
        icon="checkmark-circle"
      />
    </Screen>
  );
}

function Field(props: any) {
  const { label, testID, ...rest } = props;
  return (
    <View style={{ marginTop: space.sm }}>
      <AppText size={type.helper} weight="600" style={{ marginBottom: 6 }}>{label}</AppText>
      <TextInput
        testID={testID}
        {...rest}
        placeholderTextColor={colors.stone}
        autoCapitalize="none"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: touch.min,
    borderWidth: 1,
    borderColor: colors.gunmetal,
    borderRadius: radii.input,
    paddingHorizontal: space.md,
    fontSize: type.body,
    color: colors.inkBlack,
    backgroundColor: colors.pureWhite,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.xs, marginTop: 6 },
  chip: {
    minHeight: touch.min,
    justifyContent: "center",
    paddingHorizontal: space.md,
    borderRadius: radii.badge,
    borderWidth: 1,
    borderColor: colors.driftwood,
    backgroundColor: colors.pureWhite,
  },
  chipOn: { backgroundColor: colors.emberOrange, borderColor: colors.emberOrange },
  consent: {
    flexDirection: "row",
    gap: space.sm,
    alignItems: "center",
    padding: space.md,
  },
});
