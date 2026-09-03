import { ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Screen } from "@/components/UI";
import { useSession } from "@/lib/session";
import { recommendLevel } from "@/games/coach";
import { GameId } from "@/games/engine";
import { colors } from "@/theme";

/** Resolves the adaptive difficulty for a game, then renders it. */
export function AdaptiveGame({
  gameId,
  render,
}: {
  gameId: GameId;
  render: (level: number) => ReactNode;
}) {
  const { device } = useSession();
  const [level, setLevel] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const lv = device ? await recommendLevel(device.patientId, gameId) : 1;
      if (mounted) setLevel(lv);
    })();
    return () => {
      mounted = false;
    };
  }, [device, gameId]);

  if (level === null) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.emberOrange} />
        </View>
      </Screen>
    );
  }
  return <>{render(level)}</>;
}
