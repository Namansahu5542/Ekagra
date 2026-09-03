import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, fontFamily, radii, space, touch, type } from "@/theme";

export function AppText(
  props: TextProps & { size?: number; weight?: "400" | "500" | "600" | "700"; color?: string }
) {
  const { size = type.body, weight = "500", color = colors.inkBlack, style, ...rest } = props;
  return (
    <Text
      {...rest}
      style={[
        { fontFamily, fontSize: size, fontWeight: weight, color, lineHeight: Math.round(size * 1.4) },
        style,
      ]}
    />
  );
}

export function Screen({
  children,
  scroll = true,
  testID,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  testID?: string;
}) {
  const body = (
    <View style={styles.screenInner} testID={testID}>
      {children}
    </View>
  );
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

export function Header({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      {onBack !== undefined || router ? (
        <Pressable
          testID="back-button"
          onPress={onBack ? onBack : () => router.back()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={30} color={colors.inkBlack} />
        </Pressable>
      ) : (
        <View style={styles.backBtn} />
      )}
      <AppText size={type.heading} weight="700" style={styles.headerTitle} numberOfLines={1}>
        {title}
      </AppText>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export function Card(props: ViewProps & { pad?: number }) {
  const { style, pad = space.lg, ...rest } = props;
  return <View {...rest} style={[styles.card, { padding: pad }, style]} />;
}

export function BigButton({
  label,
  onPress,
  testID,
  icon,
  variant = "primary",
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "primary" | "secondary" | "danger" | "success";
  disabled?: boolean;
  loading?: boolean;
}) {
  const bg =
    variant === "primary"
      ? colors.emberOrange
      : variant === "danger"
      ? colors.danger
      : variant === "success"
      ? colors.success
      : colors.pureWhite;
  const fg = variant === "secondary" ? colors.inkBlack : colors.pureWhite;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.bigBtn,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.88 : 1 },
        variant === "secondary" && styles.bigBtnOutline,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.bigBtnRow}>
          {icon ? <Ionicons name={icon} size={26} color={fg} style={{ marginRight: 10 }} /> : null}
          <AppText size={type.action} weight="700" color={fg}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

export function Tile({
  label,
  icon,
  onPress,
  testID,
  bg = colors.pureWhite,
  iconColor = colors.emberOrange,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  testID?: string;
  bg?: string;
  iconColor?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { backgroundColor: bg, opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={[styles.tileIcon, { backgroundColor: colors.warmCanvas }]}>
        <Ionicons name={icon} size={40} color={iconColor} />
      </View>
      <AppText size={type.action} weight="700" style={{ textAlign: "center" }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function StatusPill({ online }: { online: boolean }) {
  return (
    <View
      testID="status-pill"
      style={[styles.pill, { backgroundColor: online ? colors.successBg : colors.fog }]}
    >
      <View
        style={[styles.dot, { backgroundColor: online ? colors.success : colors.stone }]}
      />
      <AppText size={type.helper} weight="600" color={online ? colors.success : colors.pewter}>
        {online ? "Online" : "Offline"}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.warmCanvas },
  scroll: { flexGrow: 1 },
  screenInner: { padding: space.lg, gap: space.md, flexGrow: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: space.sm,
    minHeight: touch.min,
  },
  backBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "flex-start" },
  headerTitle: { flex: 1 },
  headerRight: { minWidth: 44, alignItems: "flex-end" },
  card: {
    backgroundColor: colors.pureWhite,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  bigBtn: {
    minHeight: touch.primary,
    borderRadius: radii.button,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: space.lg,
  },
  bigBtnOutline: { borderWidth: 2, borderColor: colors.charcoal },
  bigBtnRow: { flexDirection: "row", alignItems: "center" },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.sand,
    padding: space.lg,
    alignItems: "center",
    gap: space.sm,
    minHeight: 150,
    justifyContent: "center",
  },
  tileIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.badge,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
