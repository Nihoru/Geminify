import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { RoundedProgressBar } from "./RoundedProgressBar";

export const DailyMacrosCard = () => {
    const theme = useTheme();

    // В реальном приложении эти данные придут из пропсов или стейта (например, после ответа Gemini API)
    const macrosData = [
        {
            id: "protein",
            label: "Белки",
            current: 140,
            target: 120,
            mainColor: theme.colors.primary,
            containerColor: theme.colors.primaryContainer,
        },
        {
            id: "fat",
            label: "Жиры",
            current: 80,
            target: 80,
            mainColor: theme.colors.secondary,
            containerColor: theme.colors.secondaryContainer,
        },
        {
            id: "carbs",
            label: "Углев.",
            current: 172,
            target: 300,
            mainColor: theme.colors.tertiary,
            containerColor: theme.colors.tertiaryContainer,
        },
    ];

    return (
        <View style={styles.summaryContainer}>
            <View style={styles.caloriesRow}>
                <Text
                    variant="displaySmall"
                    style={{
                        color: theme.colors.onSurface,
                        fontWeight: "700",
                    }}
                >
                    1985
                </Text>
                <Text
                    variant="titleLarge"
                    style={{
                        color: theme.colors.onSurfaceVariant,
                        marginLeft: 8,
                        marginBottom: 4,
                    }}
                >
                    / 2500 ккал
                </Text>
            </View>

            <View style={styles.macrosContainer}>
                {macrosData.map((macro) => {
                    const isOver = macro.current > macro.target;

                    // Если перебор, считаем процент переполнения (например, 20 лишних из 120 = 16%)
                    // Если норма - просто текущий прогресс
                    const barProgress = isOver
                        ? (macro.current - macro.target) / macro.target
                        : macro.current / macro.target;

                    // Инвертируем цвета при переборе
                    const activeColor = isOver
                        ? macro.containerColor
                        : macro.mainColor;
                    const trackBgColor = isOver
                        ? macro.mainColor
                        : macro.containerColor;

                    return (
                        <View key={macro.id} style={styles.macroItem}>
                            <View style={styles.macroHeader}>
                                <Text
                                    variant="labelSmall"
                                    style={{
                                        color: theme.colors.onSurfaceVariant,
                                    }}
                                >
                                    {macro.label}
                                </Text>
                                <Text
                                    variant="labelSmall"
                                    style={{
                                        fontWeight: "600",
                                        color: theme.colors.onSurfaceVariant,
                                    }}
                                >
                                    {macro.current} / {macro.target}г
                                </Text>
                            </View>
                            <RoundedProgressBar
                                progress={barProgress}
                                color={activeColor}
                                trackColor={trackBgColor}
                            />
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    summaryContainer: { paddingHorizontal: 24, marginBottom: 24 },
    caloriesRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: 16,
    },
    macrosContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 16,
    },
    macroItem: { flex: 1 },
    macroHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
});
