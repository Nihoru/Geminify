import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { InfoChip } from "./InfoChip";

interface NutrientChipsProps {
    protein: number;
    fat: number;
    carbs: number;
    /** If true, shows /100g label at the end */
    showPer100g?: boolean;
}

export const NutrientChips = ({
    protein,
    fat,
    carbs,
    showPer100g = false,
}: NutrientChipsProps) => {
    const theme = useTheme();

    const formatMacro = (val: number) => {
        if (!val && val !== 0) return "0";
        return Number.isInteger(val) ? val : val.toFixed(1);
    };

    return (
        <View style={styles.container}>
            <InfoChip
                isMini
                bg={theme.colors.secondaryContainer}
                fg={theme.colors.onSecondaryContainer}
                label="Б"
                value={formatMacro(protein)}
            />
            <InfoChip
                isMini
                bg={theme.colors.tertiaryContainer}
                fg={theme.colors.onTertiaryContainer}
                label="Ж"
                value={formatMacro(fat)}
            />
            <InfoChip
                isMini
                bg={theme.colors.primaryContainer}
                fg={theme.colors.onPrimaryContainer}
                label="У"
                value={formatMacro(carbs)}
            />
            {showPer100g && (
                <Text
                    variant="labelSmall"
                    style={{
                        color: theme.colors.onSurfaceVariant,
                        marginLeft: 4,
                    }}
                >
                    / 100г
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
});
