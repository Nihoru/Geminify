import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";

interface CustomSegmentedControlProps {
    period: string;
    onPeriodChange: (period: string) => void;
}

export const CustomSegmentedControl = ({
    period,
    onPeriodChange,
}: CustomSegmentedControlProps) => {
    const theme = useTheme();

    const options = [
        { id: "day", label: "День" },
        { id: "week", label: "Неделя" },
        { id: "month", label: "Месяц" },
    ];

    return (
        <View
            style={[
                styles.segContainer,
                { backgroundColor: theme.colors.secondaryContainer },
            ]}
        >
            {options.map((opt) => {
                const isActive = period === opt.id;
                return (
                    <TouchableRipple
                        key={opt.id}
                        onPress={() => onPeriodChange(opt.id)}
                        style={[
                            styles.segButton,
                            {
                                backgroundColor: isActive
                                    ? theme.colors.primary
                                    : theme.colors.secondaryContainer,
                            },
                        ]}
                        borderless
                    >
                        <Text
                            style={[
                                styles.segText,
                                {
                                    color: isActive
                                        ? theme.colors.onPrimary
                                        : theme.colors.onSecondaryContainer,
                                },
                            ]}
                        >
                            {opt.label}
                        </Text>
                    </TouchableRipple>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    segContainer: {
        flexDirection: "row",
        height: 52,
        borderRadius: 100,
        padding: 6,
        gap: 6,
    },
    segButton: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 100,
    },
    segText: {
        fontSize: 14,
        fontWeight: "700",
    },
});
