import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, Text, TouchableRipple, useTheme } from "react-native-paper";
import { getMealAppearance } from "../src/utils/mealHelpers";
import { MaterialSymbol } from "./MaterialSymbol";

interface Meal {
    id: string;
    typeCode: string;
    time: string;
    title: string;
    calories: number;
    macros: { p: number; f: number; c: number };
    dishes?: any[];
}

interface MealFeedItemProps {
    meal: Meal;
    onPress?: () => void;
}

export const MealFeedItem = ({ meal, onPress }: MealFeedItemProps) => {
    const theme = useTheme();
    const appearance = getMealAppearance(meal.typeCode, theme);

    // Формируем подзаголовок: список блюд или дефолтные макросы
    const subtitleText =
        meal.dishes && meal.dishes.length > 0
            ? meal.dishes.map((d) => d.name).join(", ")
            : `Б: ${meal.macros.p}г • Ж: ${meal.macros.f}г • У: ${meal.macros.c}г`;

    return (
        <TouchableRipple
            onPress={onPress}
            style={{ borderRadius: 24 }}
            borderless
        >
            <View
                style={[
                    styles.compactCard,
                    { backgroundColor: theme.colors.elevation.level1 },
                ]}
            >
                <View style={styles.compactCardLeft}>
                    <View
                        style={[
                            styles.smallTag,
                            { backgroundColor: appearance.tagColor },
                        ]}
                    >
                        <Icon
                            source={(props: any) => (
                                <MaterialSymbol
                                    name={appearance.iconName}
                                    {...props}
                                />
                            )}
                            size={22}
                            color={appearance.tagTextColor}
                        />
                    </View>
                </View>

                <View style={styles.compactCardCenter}>
                    <Text
                        variant="titleSmall"
                        style={{
                            fontWeight: "700",
                            color: theme.colors.onSurface,
                        }}
                        numberOfLines={1}
                    >
                        {meal.title}
                    </Text>
                    <Text
                        variant="labelSmall"
                        style={{
                            color: theme.colors.onSurfaceVariant,
                            marginTop: 2,
                        }}
                        numberOfLines={1} // Включаем эллипсис, если список блюд слишком длинный
                    >
                        {subtitleText}
                    </Text>
                </View>

                <View style={styles.compactCardRight}>
                    <Text
                        variant="labelSmall"
                        style={{
                            fontWeight: "600",
                            marginBottom: 4,
                            color: theme.colors.onSurfaceVariant,
                        }}
                    >
                        {meal.time}
                    </Text>
                    <View
                        style={[
                            styles.smallCaloriePill,
                            { backgroundColor: appearance.tagColor },
                        ]}
                    >
                        <Text
                            variant="labelSmall"
                            style={{
                                color: appearance.tagTextColor,
                                fontWeight: "700",
                            }}
                        >
                            {meal.calories}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableRipple>
    );
};

const styles = StyleSheet.create({
    compactCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 24,
    },
    compactCardLeft: { marginRight: 12 },
    smallTag: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    compactCardCenter: { flex: 1, justifyContent: "center", paddingRight: 8 },
    compactCardRight: { alignItems: "flex-end", marginLeft: 8 },
    smallCaloriePill: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
});
