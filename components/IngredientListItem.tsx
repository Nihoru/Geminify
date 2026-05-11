import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { NutrientChips } from "./NutrientChips";

interface IngredientListItemProps {
    title: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    /** Optional trailing component (e.g., Edit button or Weight text) */
    trailing?: React.ReactNode;
    /** Optional style for the container */
    style?: ViewStyle;
    /** Optional flag to show /100g in macros */
    showPer100g?: boolean;
}

export const IngredientListItem = ({
    title,
    calories,
    protein,
    fat,
    carbs,
    trailing,
    style,
    showPer100g = false,
}: IngredientListItemProps) => {
    const theme = useTheme();

    return (
        <View
            style={[
                styles.itemCard,
                { backgroundColor: theme.colors.elevation.level1 },
                style,
            ]}
        >
            <View
                style={[
                    styles.ingLeadingBadge,
                    { backgroundColor: theme.colors.primaryContainer },
                ]}
            >
                <Text
                    variant="titleMedium"
                    style={{
                        color: theme.colors.onPrimaryContainer,
                        fontWeight: "800",
                        lineHeight: 20,
                    }}
                >
                    {calories}
                </Text>
                <Text
                    variant="labelSmall"
                    style={{
                        color: theme.colors.onPrimaryContainer,
                        opacity: 0.8,
                        fontSize: 9,
                        lineHeight: 12,
                    }}
                >
                    ккал
                </Text>
            </View>

            <View style={styles.ingMainContent}>
                <Text
                    variant="titleSmall"
                    style={{
                        color: theme.colors.onSurface,
                        fontWeight: "700",
                        marginBottom: 4,
                    }}
                    numberOfLines={1}
                >
                    {title}
                </Text>
                <NutrientChips
                    protein={protein}
                    fat={fat}
                    carbs={carbs}
                    showPer100g={showPer100g}
                />
            </View>

            {trailing && <View style={styles.ingTrailing}>{trailing}</View>}
        </View>
    );
};

const styles = StyleSheet.create({
    itemCard: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 24,
        padding: 12,
    },
    ingLeadingBadge: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    ingMainContent: {
        flex: 1,
        justifyContent: "center",
    },
    ingTrailing: {
        marginLeft: 8,
        justifyContent: "center",
    },
});
