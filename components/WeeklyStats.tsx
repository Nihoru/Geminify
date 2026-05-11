import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

interface WeeklyStatsProps {
    stats: any[];
    selectedMetric: string;
    limits: Record<string, number>;
    barColor: string;
    renderMetricSelector: () => React.ReactNode;
}

export const WeeklyStats = ({
    stats,
    selectedMetric,
    limits,
    barColor,
    renderMetricSelector,
}: WeeklyStatsProps) => {
    const theme = useTheme();
    const limit = limits[selectedMetric];
    const maxValInStats = Math.max(
        ...stats.map((s) => s[selectedMetric] || 0),
        0,
    );
    const maxVal = Math.max(maxValInStats, limit * 1.2);

    return (
        <View style={styles.chartContainer}>
            <View style={styles.barChart}>
                {stats.map((s, i) => {
                    const val = s[selectedMetric] || 0;
                    const height = (val / maxVal) * 160;
                    const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
                    return (
                        <View key={i} style={styles.barWrapper}>
                            <View
                                style={[
                                    styles.bar,
                                    {
                                        height: Math.max(height, 4),
                                        backgroundColor: barColor,
                                    },
                                ]}
                            />
                            <Text
                                variant="labelSmall"
                                style={[
                                    styles.barLabel,
                                    { color: theme.colors.onSurfaceVariant },
                                ]}
                            >
                                {days[i]}
                            </Text>
                        </View>
                    );
                })}
                {/* Limit Line */}
                <View
                    style={[
                        styles.limitLine,
                        {
                            bottom: (limit / maxVal) * 160 + 24,
                            borderTopColor: theme.colors.error,
                            opacity: 0.6,
                        },
                    ]}
                >
                    <Text
                        variant="labelSmall"
                        style={{
                            position: "absolute",
                            right: 0,
                            top: -18,
                            color: theme.colors.error,
                            fontWeight: "700",
                        }}
                    >
                        Цель
                    </Text>
                </View>
            </View>
            {renderMetricSelector()}
        </View>
    );
};

const styles = StyleSheet.create({
    chartContainer: {
        paddingTop: 10,
    },
    barChart: {
        flexDirection: "row",
        height: 200,
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: 4,
        position: "relative",
    },
    barWrapper: {
        alignItems: "center",
        flex: 1,
    },
    bar: {
        width: 24,
        borderRadius: 12,
    },
    barLabel: {
        marginTop: 12,
        fontWeight: "700",
    },
    limitLine: {
        position: "absolute",
        left: 0,
        right: 0,
        borderTopWidth: 2,
        borderStyle: "dashed",
        zIndex: 0,
    },
});
