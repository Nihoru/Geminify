import React from "react";
import { StyleSheet, View } from "react-native";

interface MonthlyStatsProps {
    stats: any[];
    selectedMetric: string;
    limits: Record<string, number>;
    mainColor: string;
    contColor: string;
    renderMetricSelector: () => React.ReactNode;
}

export const MonthlyStats = ({
    stats,
    selectedMetric,
    limits,
    mainColor,
    contColor,
    renderMetricSelector,
}: MonthlyStatsProps) => {
    const limit = limits[selectedMetric];

    return (
        <View style={styles.heatmapContainer}>
            <View style={styles.heatmapGrid}>
                {stats.map((s, i) => {
                    const val = s[selectedMetric] || 0;
                    const ratio = val / limit;
                    const isOver = val > limit;

                    let opacity = Math.min(ratio, 1);
                    if (val > 0 && opacity < 0.2) opacity = 0.2;
                    if (val === 0) opacity = 0.05;

                    return (
                        <View
                            key={i}
                            style={[
                                styles.heatmapCell,
                                {
                                    backgroundColor: isOver
                                        ? mainColor
                                        : contColor,
                                    borderRadius: 6,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.heatmapInner,
                                    {
                                        backgroundColor: isOver
                                            ? contColor
                                            : mainColor,
                                        opacity: isOver ? 1 : opacity,
                                        width: isOver ? "50%" : "100%",
                                        height: isOver ? "50%" : "100%",
                                        borderRadius: isOver ? 4 : 6,
                                    },
                                ]}
                            />
                        </View>
                    );
                })}
            </View>
            {renderMetricSelector()}
        </View>
    );
};

const styles = StyleSheet.create({
    heatmapContainer: {
        paddingTop: 10,
    },
    heatmapGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        justifyContent: "center",
    },
    heatmapCell: {
        width: 34,
        height: 34,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    heatmapInner: {
        // Controlled by component logic
    },
});
