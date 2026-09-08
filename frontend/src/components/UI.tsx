import React from "react";
import {
  ActivityIndicator,
  Animated,
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
import { colors, elevation, fontFamily, lineHeight, radii, space, touch, type } from "@/theme";
import { useEntrance, usePressScale } from "@/lib/motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Max readable measure on wide screens — long lines are hard to track. */
const CONTENT_MAX_WIDTH = 720;

export function AppText(
  props: TextProps & { size?: number; weight?: "400" | "500" | "600" | "700"; color?: string }
) {
  const { size = type.body, weight = "500", color = colors.text, style, ...rest } = props;
  const ratio = size >= type.cardTitle ? lineHeight.heading : lineHeight.body;
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily,
          fontSize: size,
          fontWeight: weight,
          color,
          lineHeight: Math.round(size * ratio),
        },
        style,
      ]}
    />
  );
}

/** Large, quiet page title with an optional one-line reassurance underneath. */
export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ gap: 6, marginBottom: space.xs }}>
      <AppText size={type.title} weight="700" color={colors.textStrong}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText size={type.body} color={colors.textMuted}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

/** Quiet grouping label so a long screen still reads as a few simple parts. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <AppText
      size={type.helper}
      weight="700"
      color={colors.textMuted}
      style={{ marginTop: space.sm }}
    >
      {children}
    </AppText>
  );
}

/** Reassuring helper line. Plain language, never a warning tone. */
export function Reassurance({
  children,
  icon = "heart",
  tone = "calm",
}: {
  children: React.ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: "calm" | "warm" | "good";
}) {
  const bg =
    tone === "warm" ? colors.surfaceWarm : tone === "good" ? colors.successBg : colors.surfaceMuted;
  const fg =
    tone === "warm" ? colors.onWarm : tone === "good" ? colors.success : colors.primaryDeep;
  return (
    <View style={[styles.reassurance, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={24} color={fg} />
      <AppText size={type.helper} weight="600" color={fg} style={{ flex: 1 }}>
        {children}
      </AppText>
    </View>
  );
}

export function Screen({
  children,
  scroll = true,
  testID,
  showSos = false,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  testID?: string;
  showSos?: boolean;
}) {
  const router = useRouter();
  const entrance = useEntrance();
  const sos = usePressScale();

  const body = (
    <Animated.View style={[styles.screenInner, entrance]} testID={testID}>
      {children}
      {showSos ? <View style={{ height: touch.large }} /> : null}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}

      {showSos ? (
        <AnimatedPressable
          testID="sos-fab"
          accessibilityRole="button"
          accessibilityLabel="Get help now"
          onPress={() => router.push("/sos")}
          onPressIn={sos.onPressIn}
          onPressOut={sos.onPressOut}
          style={[styles.sosFab, { transform: [{ scale: sos.scale }] }]}
        >
          <Ionicons name="call" size={28} color={colors.onPrimary} />
          <AppText size={type.action} weight="700" color={colors.onPrimary}>
            Get help
          </AppText>
        </AnimatedPressable>
      ) : null}
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
  const back = usePressScale();
  return (
    <View style={styles.header}>
      <AnimatedPressable
        testID="back-button"
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack ? onBack : () => router.back()}
        onPressIn={back.onPressIn}
        onPressOut={back.onPressOut}
        hitSlop={12}
        style={[styles.backBtn, { transform: [{ scale: back.scale }] }]}
      >
        <Ionicons name="chevron-back" size={30} color={colors.primaryDeep} />
        <AppText size={type.helper} weight="700" color={colors.primaryDeep}>
          Back
        </AppText>
      </AnimatedPressable>

      <View style={styles.headerRight}>{right}</View>

      <AppText
        size={type.heading}
        weight="700"
        color={colors.textStrong}
        style={styles.headerTitle}
      >
        {title}
      </AppText>
    </View>
  );
}

export function Card(props: ViewProps & { pad?: number; tone?: "plain" | "soft" | "warm" | "good" }) {
  const { style, pad = space.lg, tone = "plain", ...rest } = props;
  const toneStyle =
    tone === "soft"
      ? { backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceLavender }
      : tone === "warm"
      ? { backgroundColor: colors.surfaceWarm, borderColor: colors.surfaceWarm }
      : tone === "good"
      ? { backgroundColor: colors.successBg, borderColor: colors.successBorder }
      : null;
  return <View {...rest} style={[styles.card, { padding: pad }, toneStyle, style]} />;
}

export function BigButton({
  label,
  onPress,
  testID,
  icon,
  variant = "primary",
  disabled,
  loading,
  hint,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "primary" | "secondary" | "danger" | "success";
  disabled?: boolean;
  loading?: boolean;
  hint?: string;
}) {
  const press = usePressScale();
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
      ? colors.danger
      : variant === "success"
      ? colors.success
      : colors.surface;
  const fg = variant === "secondary" ? colors.primaryDeep : colors.onPrimary;

  return (
    <View style={{ gap: 6 }}>
      <AnimatedPressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityState={{ disabled: !!disabled || !!loading }}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        disabled={disabled || loading}
        style={[
          styles.bigBtn,
          variant !== "secondary" && elevation.card,
          { backgroundColor: bg, opacity: disabled ? 0.45 : 1, transform: [{ scale: press.scale }] },
          variant === "secondary" && styles.bigBtnOutline,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <View style={styles.bigBtnRow}>
            {icon ? <Ionicons name={icon} size={28} color={fg} style={{ marginRight: 12 }} /> : null}
            <AppText size={type.action} weight="700" color={fg}>
              {label}
            </AppText>
          </View>
        )}
      </AnimatedPressable>
      {hint ? (
        <AppText size={type.helper} color={colors.textMuted} style={{ textAlign: "center" }}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

export function Tile({
  label,
  icon,
  onPress,
  testID,
  bg = colors.surface,
  iconColor = colors.primary,
  hint,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  testID?: string;
  bg?: string;
  iconColor?: string;
  hint?: string;
}) {
  const press = usePressScale();
  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[
        styles.tile,
        elevation.card,
        { backgroundColor: bg, transform: [{ scale: press.scale }] },
      ]}
    >
      <View style={styles.tileIcon}>
        <Ionicons name={icon} size={44} color={iconColor} />
      </View>
      <AppText size={type.action} weight="700" color={colors.textStrong} style={{ textAlign: "center" }}>
        {label}
      </AppText>
      {hint ? (
        <AppText size={type.helper} color={colors.textMuted} style={{ textAlign: "center" }}>
          {hint}
        </AppText>
      ) : null}
    </AnimatedPressable>
  );
}

export function StatusPill({ online }: { online: boolean }) {
  return (
    <View
      testID="status-pill"
      accessibilityLabel={online ? "Connected" : "Working offline"}
      style={[
        styles.pill,
        {
          backgroundColor: online ? colors.successBg : colors.surfaceMuted,
          borderColor: online ? colors.successBorder : colors.border,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: online ? colors.success : colors.textMuted }]} />
      <AppText size={type.helper} weight="700" color={online ? colors.success : colors.textMuted}>
        {online ? "Connected" : "Offline"}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flexGrow: 1, alignItems: "center" },
  screenInner: {
    padding: space.lg,
    gap: space.md,
    flexGrow: 1,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    rowGap: space.sm,
    marginBottom: space.xs,
    minHeight: touch.min,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    minHeight: touch.min,
    paddingRight: space.sm,
  },
  headerTitle: { width: "100%" },
  headerRight: { minHeight: touch.min, justifyContent: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...elevation.card,
  },
  reassurance: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    padding: space.md,
    borderRadius: radii.card,
  },
  bigBtn: {
    minHeight: touch.primary,
    borderRadius: radii.button,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  bigBtnOutline: { borderWidth: 2, borderColor: colors.borderStrong },
  bigBtnRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  tile: {
    flexBasis: "46%",
    flexGrow: 1,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: space.md,
    alignItems: "center",
    gap: space.sm,
    minHeight: 176,
    justifyContent: "center",
  },
  tileIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surfaceMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.badge,
    borderWidth: 1,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  sosFab: {
    position: "absolute",
    right: space.md,
    bottom: space.md,
    backgroundColor: colors.danger,
    borderRadius: radii.badge,
    minHeight: touch.primary,
    paddingHorizontal: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    ...elevation.raised,
  },
});
