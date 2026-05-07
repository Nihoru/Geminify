import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { RoundedProgressBar } from "./RoundedProgressBar";

// Добавляем интерфейс для входящих данных
interface DailyMacrosCardProps {
    currentCalories: number;
    targetCalories?: number;
    currentProtein: number;
    targetProtein?: number;
    currentFat: number;
    targetFat?: number;
    currentCarbs: number;
    targetCarbs?: number;
}

export const DailyMacrosCard = ({
    currentCalories = 0,
    targetCalories = 2500, // Цели пока оставим по умолчанию
    currentProtein = 0,
    targetProtein = 120,
    currentFat = 0,
    targetFat = 80,
    currentCarbs = 0,
    targetCarbs = 300,
}: DailyMacrosCardProps) => {
    const theme = useTheme();

    const macrosData = [
        {
            id: "protein",
            label: "Белки",
            current: Math.round(currentProtein),
            target: targetProtein,
            mainColor: theme.colors.primary,
            containerColor: theme.colors.primaryContainer,
        },
        {
            id: "fat",
            label: "Жиры",
            current: Math.round(currentFat),
            target: targetFat,
            mainColor: theme.colors.secondary,
            containerColor: theme.colors.secondaryContainer,
        },
        {
            id: "carbs",
            label: "Углев.",
            current: Math.round(currentCarbs),
            target: targetCarbs,
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
                    {Math.round(currentCalories)}
                </Text>
                <Text
                    variant="titleLarge"
                    style={{
                        color: theme.colors.onSurfaceVariant,
                        marginLeft: 8,
                        marginBottom: 4,
                    }}
                >
                    / {targetCalories} ккал
                </Text>
            </View>

            <View style={styles.macrosContainer}>
                {macrosData.map((macro) => {
                    const isOver = macro.current > macro.target;

                    const barProgress = isOver
                        ? (macro.current - macro.target) / macro.target
                        : macro.current / macro.target;

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
