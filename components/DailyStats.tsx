import MaskedView from "@react-native-masked-view/masked-view";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

interface MetricInfo {
    id: string;
    label: string;
    unit: string;
    icon: string;
    mainColor: string;
    contColor: string;
    onMainColor: string;
    onContColor: string;
}

interface DailyStatsProps {
    stats: any[];
    limits: {
        calories: number;
        protein: number;
        fat: number;
        carbs: number;
    };
    metricOptions: MetricInfo[];
}

export const DailyStats = ({
    stats,
    limits,
    metricOptions,
}: DailyStatsProps) => {
    const data = stats[0];
    const dailyItems = [
        {
            ...metricOptions[0],
            val: data.calories,
            limit: limits.calories,
            isLarge: true,
        },
        {
            ...metricOptions[1],
            val: data.protein,
            limit: limits.protein,
            isLarge: false,
        },
        {
            ...metricOptions[2],
            val: data.fat,
            limit: limits.fat,
            isLarge: false,
        },
        {
            ...metricOptions[3],
            val: data.carbs,
            limit: limits.carbs,
            isLarge: false,
        },
    ];

    return (
        <View style={styles.dailyGrid}>
            {dailyItems.map((item) => {
                const isOver = item.val > item.limit;
                const progress = isOver
                    ? (item.val - item.limit) / item.limit
                    : item.val / item.limit;

                const safeProgress = Math.min(Math.max(progress, 0), 1);
                const activeColor = isOver ? item.contColor : item.mainColor;
                const trackColor = isOver ? item.mainColor : item.contColor;

                const textOnActiveColor = isOver
                    ? item.onContColor
                    : item.onMainColor;
                const textOnTrackColor = isOver
                    ? item.onMainColor
                    : item.onContColor;

                const renderCardContent = (textColor: string) => (
                    <View style={styles.dailyCardContent}>
                        <Text
                            variant="labelMedium"
                            style={{
                                color: textColor,
                                fontWeight: "700",
                            }}
                        >
                            {item.label}
                        </Text>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "baseline",
                            }}
                        >
                            <Text
                                variant={
                                    item.isLarge
                                        ? "headlineSmall"
                                        : "titleMedium"
                                }
                                style={{
                                    fontWeight: "900",
                                    color: textColor,
                                }}
                            >
                                {item.val}
                            </Text>
                            <Text
                                variant="labelSmall"
                                style={{
                                    marginLeft: 4,
                                    color: textColor,
                                    fontWeight: "600",
                                }}
                            >
                                / {item.limit} {item.unit}
                            </Text>
                        </View>
                    </View>
                );

                return (
                    <View
                        key={item.id}
                        style={[
                            styles.dailyCard,
                            // Убрали backgroundColor отсюда, перенесли в фоновый слой ниже
                            item.isLarge && styles.dailyCardLarge,
                        ]}
                    >
                        {/* 1. Фоновый слой (отрисовка пустой части трекера и текста на ней) */}
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                { backgroundColor: trackColor },
                            ]}
                        >
                            {renderCardContent(textOnTrackColor)}
                        </View>

                        {/* 2. Слой поверх (отрисовка заполненной части прогресса) */}
                        <MaskedView
                            style={StyleSheet.absoluteFill}
                            maskElement={
                                // ОБЯЗАТЕЛЬНО задаем transparent фон обертке маски
                                <View
                                    style={[
                                        StyleSheet.absoluteFill,
                                        { backgroundColor: "transparent" },
                                    ]}
                                >
                                    <View
                                        style={{
                                            width: `${safeProgress * 100}%`,
                                            height: "100%",
                                            backgroundColor: "black",
                                        }}
                                    />
                                </View>
                            }
                        >
                            <View
                                style={[
                                    StyleSheet.absoluteFill,
                                    { backgroundColor: activeColor },
                                ]}
                            >
                                {renderCardContent(textOnActiveColor)}
                            </View>
                        </MaskedView>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    dailyGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    dailyCard: {
        flex: 1,
        minWidth: "45%",
        height: 80,
        borderRadius: 24,
        overflow: "hidden",
        position: "relative",
    },
    dailyCardLarge: {
        minWidth: "100%",
        height: 100,
    },
    dailyCardContent: {
        flex: 1,
        padding: 16,
        justifyContent: "center",
        // Убрано: zIndex: 1 — именно он прятал фоновый текст на Android
    },
});
