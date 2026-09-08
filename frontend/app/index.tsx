import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "@/lib/session";
import { colors } from "@/theme";

export default function Index() {
  const { ready, device, caregiver, unlocked } = useSession();
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.warmCanvas }}>
        <ActivityIndicator size="large" color={colors.emberOrange} />
      </View>
    );
  }
  if (device) return <Redirect href={unlocked ? "/home" : "/lock"} />;
  if (caregiver) return <Redirect href="/patient-setup" />;
  return <Redirect href="/auth" />;
}
