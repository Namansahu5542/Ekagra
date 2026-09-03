import { useCallback, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { AppText, BigButton, Card, Header, Screen } from "@/components/UI";
import { useSession } from "@/lib/session";
import { store } from "@/lib/storage";
import { nowIso, uuid } from "@/lib/ids";
import { colors, radii, space, touch, type } from "@/theme";

export default function Notes() {
  const { t } = useTranslation();
  const { device, syncNow } = useSession();
  const [notes, setNotes] = useState<any[]>([]);
  const [text, setText] = useState("");

  const load = useCallback(async () => {
    const all = await store.getAll("sticky_notes");
    setNotes(all.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function addNote() {
    if (!device || !text.trim()) return;
    const rec = {
      note_id: uuid(),
      patient_id: device.patientId,
      text: text.trim(),
      created_at: nowIso(),
      synced: false,
    };
    await store.upsert("sticky_notes", rec.note_id, rec);
    setText("");
    await load();
    syncNow();
  }

  return (
    <Screen testID="notes-screen" showSos>
      <Header title={t("notes.title")} />
      <Card>
        <TextInput
          testID="note-input"
          value={text}
          onChangeText={setText}
          placeholder={t("notes.placeholder")}
          placeholderTextColor={colors.stone}
          multiline
          style={styles.input}
        />
        <BigButton testID="note-save" label={t("notes.save")} icon="save" onPress={addNote} disabled={!text.trim()} />
      </Card>

      {notes.length === 0 && (
        <AppText size={type.body} color={colors.pewter}>{t("notes.empty")}</AppText>
      )}
      {notes.map((n) => (
        <Card key={n.note_id} testID="note-item">
          <View style={styles.noteRow}>
            <Ionicons name="reader" size={26} color={colors.emberOrange} />
            <AppText size={type.body} style={{ flex: 1 }}>{n.text}</AppText>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.gunmetal,
    borderRadius: radii.input,
    padding: space.md,
    fontSize: type.body,
    color: colors.inkBlack,
    marginBottom: space.md,
    textAlignVertical: "top",
    backgroundColor: colors.pureWhite,
  },
  noteRow: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
});
