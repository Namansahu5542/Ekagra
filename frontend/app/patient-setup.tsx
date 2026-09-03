import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { AppText, BigButton, Card, Header, Screen } from "@/components/UI";
import { LANGUAGES } from "@/i18n/locales";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { getPosition } from "@/lib/safety";
import { colors, radii, space, touch, type } from "@/theme";

const DEFAULT_REMINDERS = [
  { type: "meal", title: "Breakfast", scheduled_time: "08:00" },
  { type: "water", title: "Drink water", scheduled_time: "10:00" },
  { type: "medicine", title: "Morning medicine", scheduled_time: "13:00" },
  { type: "exercise", title: "Short walk", scheduled_time: "17:00" },
  { type: "sleep", title: "Rest", scheduled_time: "21:00" },
];

export default function PatientSetup() {
  const { t } = useTranslation();
  const router = useRouter();
  const { caregiver, online, completeSetup, signOut } = useSession();

  const [patients, setPatients] = useState<any[]>([]);
  const [mode, setMode] = useState<"list" | "new" | "pin">("list");
  const [selected, setSelected] = useState<any>(null);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");
  const [pin, setPin] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!caregiver?.token || !online) {
        setMode("new");
        return;
      }
      try {
        const res = await api.listMyPatients(caregiver.token);
        const list = res.patients || [];
        setPatients(list);
        setMode(list.length ? "list" : "new");
      } catch {
        setMode("new");
      }
    })();
  }, [caregiver, online]);

  if (!caregiver) return <Redirect href="/auth" />;

  async function activate(patientId: string, profileData: any, enteredPin: string) {
    const verified = await api.verifyPin(patientId, enteredPin);
    await completeSetup({
      patientId,
      profile: profileData,
      token: verified.patient_session_token,
      pin: enteredPin,
    });
    router.replace("/home");
  }

  async function chooseExisting() {
    setError(null);
    if (pin.length !== 4 || !selected) return;
    setBusy(true);
    try {
      let profile: any = { patient_id: selected.patient_id, name: selected.name, preferred_language: selected.preferred_language };
      try {
        profile = await api.getProfileAsCaregiver(caregiver!.token, selected.patient_id);
      } catch {}
      await activate(selected.patient_id, profile, pin);
    } catch {
      setError(t("patientSetup.wrongPin"));
    } finally {
      setBusy(false);
    }
  }

  async function createNew() {
    setError(null);
    if (!name.trim() || pin.length !== 4 || !consent) return;
    setBusy(true);
    try {
      const point = await getPosition();
      const payload: any = {
        name: name.trim(),
        preferred_language: language,
        pin,
        consent_confirmed: true,
        reminder_templates: DEFAULT_REMINDERS,
      };
      if (point) payload.safe_zone = { lat: point.lat, long: point.long, radius_m: 200 };
      const created = await api.createProfile(caregiver!.token, payload);
      const profile = {
        patient_id: created.patient_id,
        name: name.trim(),
        preferred_language: language,
        reminder_templates: DEFAULT_REMINDERS,
        safe_zone: payload.safe_zone || null,
      };
      await activate(created.patient_id, profile, pin);
    } catch (e: any) {
      setError(e?.message || t("patientSetup.wrongPin"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen testID="patient-setup-screen">
      <Header title={t("patientSetup.title")} onBack={() => signOut()} />
      <AppText size={type.helper} color={colors.pewter}>{t("patientSetup.signedInAs", { email: caregiver.email })}</AppText>

      {mode === "list" && (
        <>
          <AppText size={type.cardTitle} weight="700">{t("patientSetup.existingTitle")}</AppText>
          {patients.map((p) => (
            <Pressable
              key={p.patient_id}
              testID={`patient-${p.patient_id}`}
              onPress={() => { setSelected(p); setPin(""); setMode("pin"); }}
              style={styles.patientRow}
            >
              <View style={styles.avatar}><Ionicons name="person" size={28} color={colors.emberOrange} /></View>
              <AppText size={type.action} weight="700" style={{ flex: 1 }}>{t("patientSetup.continueAs", { name: p.name })}</AppText>
              <Ionicons name="chevron-forward" size={24} color={colors.stone} />
            </Pressable>
          ))}
          <BigButton testID="add-new-patient" label={t("patientSetup.addNew")} icon="person-add" variant="secondary" onPress={() => setMode("new")} />
        </>
      )}

      {mode === "pin" && selected && (
        <Card style={{ gap: space.sm }}>
          <AppText size={type.cardTitle} weight="700">{t("patientSetup.enterPin", { name: selected.name })}</AppText>
          <TextInput
            testID="existing-pin"
            value={pin}
            onChangeText={(v) => setPin(v.replace(/[^0-9]/g, "").slice(0, 4))}
            placeholder="1234"
            placeholderTextColor={colors.stone}
            keyboardType="number-pad"
            secureTextEntry
            style={[styles.input, { letterSpacing: 8, textAlign: "center", fontSize: type.heading }]}
          />
          {error && <AppText testID="setup-error" size={type.helper} color={colors.danger}>{error}</AppText>}
          <BigButton testID="existing-continue" label={t("patientSetup.finish")} icon="lock-open" loading={busy} onPress={chooseExisting} disabled={pin.length !== 4} />
          <BigButton testID="existing-back" label={t("common.back")} variant="secondary" onPress={() => setMode("list")} />
        </Card>
      )}

      {mode === "new" && (
        <>
          <Card>
            <AppText size={type.cardTitle} weight="700">{t("patientSetup.addNew")}</AppText>
            <AppText size={type.helper} weight="600" style={{ marginTop: space.sm, marginBottom: 6 }}>{t("patientSetup.name")}</AppText>
            <TextInput testID="patient-name" value={name} onChangeText={setName} placeholder="—" placeholderTextColor={colors.stone} style={styles.input} />
            <AppText size={type.helper} weight="600" style={{ marginTop: space.md }}>{t("patientSetup.language")}</AppText>
            <View style={styles.chips}>
              {LANGUAGES.map((l) => (
                <Pressable key={l.code} testID={`lang-${l.code}`} onPress={() => setLanguage(l.code)} style={[styles.chip, language === l.code && styles.chipOn]}>
                  <AppText size={type.helper} weight="600" color={language === l.code ? colors.pureWhite : colors.inkBlack}>{l.label}</AppText>
                </Pressable>
              ))}
            </View>
            <AppText size={type.helper} weight="600" style={{ marginTop: space.md }}>{t("patientSetup.pin")}</AppText>
            <TextInput
              testID="patient-pin"
              value={pin}
              onChangeText={(v) => setPin(v.replace(/[^0-9]/g, "").slice(0, 4))}
              placeholder="1234"
              placeholderTextColor={colors.stone}
              keyboardType="number-pad"
              secureTextEntry
              style={[styles.input, { letterSpacing: 8, textAlign: "center", fontSize: type.heading }]}
            />
            <AppText size={type.helper} color={colors.warmGray} style={{ marginTop: space.sm }}>{t("patientSetup.locating")}</AppText>
          </Card>

          <Pressable testID="setup-consent" style={styles.consent} onPress={() => setConsent((c) => !c)}>
            <Ionicons name={consent ? "checkbox" : "square-outline"} size={30} color={consent ? colors.emberOrange : colors.stone} />
            <AppText size={type.helper} style={{ flex: 1 }}>{t("patientSetup.consent")}</AppText>
          </Pressable>

          {error && <AppText testID="setup-error" size={type.helper} color={colors.danger}>{error}</AppText>}
          <BigButton testID="setup-finish" label={busy ? t("patientSetup.working") : t("patientSetup.finish")} icon="checkmark-circle" loading={busy} onPress={createNew} disabled={!name.trim() || pin.length !== 4 || !consent} />
          {patients.length > 0 && (
            <BigButton testID="back-to-list" label={t("common.back")} variant="secondary" onPress={() => setMode("list")} />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  patientRow: {
    flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md,
    backgroundColor: colors.pureWhite, borderRadius: radii.card, borderWidth: 1, borderColor: colors.sand,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.peachBlush, justifyContent: "center", alignItems: "center" },
  input: {
    minHeight: touch.min, borderWidth: 1, borderColor: colors.driftwood, borderRadius: radii.input,
    paddingHorizontal: space.md, fontSize: type.body, color: colors.inkBlack, backgroundColor: colors.pureWhite,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.xs, marginTop: 6 },
  chip: {
    minHeight: touch.min, justifyContent: "center", paddingHorizontal: space.md, borderRadius: radii.badge,
    borderWidth: 1, borderColor: colors.driftwood, backgroundColor: colors.pureWhite,
  },
  chipOn: { backgroundColor: colors.emberOrange, borderColor: colors.emberOrange },
  consent: { flexDirection: "row", gap: space.sm, alignItems: "center", padding: space.md },
});
