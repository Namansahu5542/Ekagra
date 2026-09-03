import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { AppText, Screen } from "@/components/UI";
import { useSession } from "@/lib/session";
import { colors, radii, space, touch, type } from "@/theme";

export default function Lock() {
  const { t } = useTranslation();
  const router = useRouter();
  const { device, tryUnlock } = useSession();
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);

  function press(d: string) {
    setWrong(false);
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (tryUnlock(next)) router.replace("/home");
        else {
          setWrong(true);
          setPin("");
        }
      }, 120);
    }
  }

  function del() {
    setWrong(false);
    setPin((p) => p.slice(0, -1));
  }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <Screen scroll={false} testID="lock-screen">
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={44} color={colors.emberOrange} />
        </View>
        <AppText size={type.title} weight="700" style={{ textAlign: "center" }}>
          {device?.profile?.name ? `${device.profile.name}` : t("appName")}
        </AppText>
        <AppText size={type.body} color={colors.pewter} style={{ textAlign: "center" }}>
          {t("lock.title")}
        </AppText>
      </View>

      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: i < pin.length ? colors.emberOrange : colors.driftwood }]}
          />
        ))}
      </View>

      {wrong && (
        <AppText testID="lock-wrong" size={type.helper} color={colors.danger} style={{ textAlign: "center" }}>
          {t("lock.wrong")}
        </AppText>
      )}

      <View style={styles.pad}>
        {keys.map((k, idx) =>
          k === "" ? (
            <View key={idx} style={styles.key} />
          ) : k === "del" ? (
            <Pressable key={idx} testID="pin-del" onPress={del} style={styles.key}>
              <Ionicons name="backspace-outline" size={34} color={colors.inkBlack} />
            </Pressable>
          ) : (
            <Pressable
              key={idx}
              testID={`pin-${k}`}
              onPress={() => press(k)}
              style={({ pressed }) => [styles.key, styles.keyFill, pressed && { backgroundColor: colors.sand }]}
            >
              <AppText size={type.title} weight="600">{k}</AppText>
            </Pressable>
          )
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: "center", gap: space.xs, marginTop: space.xl },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.peachBlush,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: space.sm,
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: space.md, marginVertical: space.lg },
  dot: { width: 22, height: 22, borderRadius: 11 },
  pad: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: space.md, marginTop: space.sm },
  key: {
    width: "28%",
    minWidth: touch.primary,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radii.card,
  },
  keyFill: {
    backgroundColor: colors.pureWhite,
    borderWidth: 1,
    borderColor: colors.sand,
  },
});
