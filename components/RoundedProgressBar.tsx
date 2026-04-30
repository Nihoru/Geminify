import React from "react";
import { StyleSheet, View } from "react-native";

interface RoundedProgressBarProps {
    progress: number;
    color: string;
    trackColor: string;
}

export const RoundedProgressBar = ({
    progress,
    color,
    trackColor,
}: RoundedProgressBarProps) => {
    // Гарантируем, что прогресс не выйдет за пределы 0-1 (0% - 100%)
    const safeProgress = Math.min(Math.max(progress, 0), 1);

    return (
        <View
            style={[
                styles.macroBar,
                { backgroundColor: trackColor, overflow: "hidden" },
            ]}
        >
            <View
                style={{
                    height: "100%",
                    width: `${safeProgress * 100}%`,
                    backgroundColor: color,
                    borderRadius: 4,
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    macroBar: {
        height: 6,
        borderRadius: 4,
    },
});
