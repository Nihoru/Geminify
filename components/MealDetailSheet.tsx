import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { List, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getMealAppearance } from "../src/utils/mealHelpers";
import { IngredientListItem } from "./IngredientListItem";

const capitalize = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
};

interface IngredientInfo {
    name: string;
    cookedWeight: number;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
}

interface DishInfo {
    name: string;
    totalWeight: number;
    totalCalories: number;
    totalProtein: number;
    totalFat: number;
    totalCarbs: number;
    ingredients: IngredientInfo[];
}

interface MealDetailSheetProps {
    visible: boolean;
    onDismiss: () => void;
    meal: {
        title: string;
        time: string;
        calories: number;
        typeCode: string;
        macros: { p: number; f: number; c: number };
        dishes: DishInfo[];
        isRecipe?: boolean;
        instructions?: string;
    } | null;
    topOffset: number;
}

export const MealDetailSheet = ({
    visible,
    onDismiss,
    meal,
    topOffset,
}: MealDetailSheetProps) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { height: screenHeight } = useWindowDimensions();
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    const maxSnapPoint = screenHeight - topOffset;
    const snapPoints = useMemo(() => ["60%", maxSnapPoint], [maxSnapPoint]);

    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [visible]);

    const handleSheetChanges = useCallback(
        (index: number) => {
            if (index === -1) onDismiss();
        },
        [onDismiss],
    );

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.32}
                pressBehavior="close"
            />
        ),
        [],
    );

    if (!meal) return null;

    const appearance = getMealAppearance(meal.typeCode, theme);

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            snapPoints={snapPoints}
            enableDynamicSizing={false}
            enablePanDownToClose={true}
            onChange={handleSheetChanges}
            backdropComponent={renderBackdrop}
            topInset={insets.top}
            backgroundStyle={{
                backgroundColor: theme.colors.surface,
                borderRadius: 36,
            }}
            handleIndicatorStyle={{
                backgroundColor: theme.colors.onSurfaceVariant,
                width: 32,
                height: 4,
            }}
        >
            {/* --- СТАТИЧНЫЙ ХЕДЕР (КОМПАКТНЫЙ) --- */}
            <View
                style={[
                    styles.staticHeader,
                    { backgroundColor: theme.colors.surface }, // Обязательно фон, чтобы маскировать скролл
                ]}
            >
                <View style={styles.headerBlock}>
                    <Text variant="headlineSmall" style={styles.boldText}>
                        {capitalize(meal.title)}
                    </Text>
                </View>

                <View
                    style={[
                        styles.statsWrapper,
                        { backgroundColor: theme.colors.elevation.level2 },
                    ]}
                >
                    <View style={styles.statsHeader}>
                        <View style={styles.caloriesContainer}>
                            <Text
                                variant="headlineLarge"
                                style={{
                                    color: appearance.tagTextColor,
                                    fontWeight: "800",
                                }}
                            >
                                {meal.calories}
                            </Text>
                            <Text
                                variant="titleSmall"
                                style={[
                                    styles.kcalLabel,
                                    { color: appearance.tagTextColor },
                                ]}
                            >
                                ккал
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.timeChip,
                                {
                                    backgroundColor:
                                        theme.colors.surfaceVariant,
                                },
                            ]}
                        >
                            <Text
                                variant="labelLarge"
                                style={{
                                    color: theme.colors.onSurfaceVariant,
                                    fontWeight: "700",
                                }}
                            >
                                {meal.time}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.macrosContainer}>
                        {renderMacro(
                            theme.colors.secondaryContainer,
                            theme.colors.onSecondaryContainer,
                            "Белки",
                            meal.macros.p,
                        )}
                        {renderMacro(
                            theme.colors.tertiaryContainer,
                            theme.colors.onTertiaryContainer,
                            "Жиры",
                            meal.macros.f,
                        )}
                        {renderMacro(
                            theme.colors.primaryContainer,
                            theme.colors.onPrimaryContainer,
                            "Углеводы",
                            meal.macros.c,
                        )}
                    </View>
                </View>
            </View>

            {/* --- СПИСОК ИНГРЕДИЕНТОВ (КАРТОЧКАМИ) --- */}
            <BottomSheetScrollView
                style={{ marginTop: -24, zIndex: 1 }}
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingBottom: insets.bottom + 32,
                        paddingTop: 24 + 16, // 24 компенсирует сдвиг вверх, 16 - стандартный отступ
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.ingredientsList}>
                    {meal.dishes.map((dish, dishIndex) => (
                        <List.Accordion
                            key={dishIndex}
                            title={capitalize(dish.name)}
                            description={`${dish.totalCalories} ккал • ${dish.totalWeight}г`}
                            titleStyle={{
                                fontWeight: "700",
                                color: theme.colors.onSurface,
                            }}
                            descriptionStyle={{
                                color: theme.colors.onSurfaceVariant,
                                marginTop: 2,
                            }}
                            style={{
                                backgroundColor: theme.colors.elevation.level1,
                                borderRadius: 24,
                                marginBottom: 8,
                            }}
                            theme={{ colors: { background: "transparent" } }}
                        >
                            {dish.ingredients.map((ing, ingIndex) => (
                                <IngredientListItem
                                    key={ingIndex}
                                    title={capitalize(ing.name)}
                                    calories={ing.calories}
                                    protein={ing.protein}
                                    fat={ing.fat}
                                    carbs={ing.carbs}
                                    style={{
                                        backgroundColor: "transparent",
                                        paddingLeft: meal.isRecipe ? 8 : 24,
                                        paddingRight: meal.isRecipe ? 8 : 16,
                                        paddingBottom:
                                            ingIndex ===
                                            dish.ingredients.length - 1
                                                ? 16
                                                : 4,
                                    }}
                                    trailing={
                                        <Text
                                            variant="labelMedium"
                                            style={{
                                                color: theme.colors
                                                    .onSurfaceVariant,
                                                fontWeight: "700",
                                            }}
                                        >
                                            {ing.cookedWeight}г
                                        </Text>
                                    }
                                />
                            ))}
                        </List.Accordion>
                    ))}
                </View>

                {/* Способ приготовления (для рецептов) */}
                {meal.instructions && (
                    <View
                        style={[
                            styles.instructionsWrapper,
                            {
                                backgroundColor: theme.colors.elevation.level1,
                                marginTop: 16,
                            },
                        ]}
                    >
                        <Text
                            variant="titleMedium"
                            style={[styles.boldText, { marginBottom: 8 }]}
                        >
                            Способ приготовления
                        </Text>
                        <Text
                            variant="bodyMedium"
                            style={{
                                color: theme.colors.onSurfaceVariant,
                                lineHeight: 22,
                            }}
                        >
                            {meal.instructions}
                        </Text>
                    </View>
                )}
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
};

const renderMacro = (bg: string, fg: string, label: string, val: number) => (
    <View style={[styles.macroChip, { backgroundColor: bg }]}>
        <Text variant="labelSmall" style={{ color: fg, opacity: 0.7 }}>
            {label}
        </Text>
        <Text variant="titleSmall" style={{ color: fg, fontWeight: "700" }}>
            {val}г
        </Text>
    </View>
);

const styles = StyleSheet.create({
    staticHeader: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 20, // Даем больше "воздуха" снизу
        borderBottomLeftRadius: 32, // Скругляем левый нижний угол
        borderBottomRightRadius: 32, // Скругляем правый нижний угол
        zIndex: 10, // Заставляем шапку рендериться ПОВЕРХ списка
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    boldText: {
        fontWeight: "700",
    },
    headerBlock: {
        marginBottom: 12,
    },
    statsWrapper: {
        borderRadius: 24,
        padding: 12,
        marginBottom: 0,
    },
    statsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12, // Уменьшили с 20
    },
    caloriesContainer: {
        flexDirection: "row",
        alignItems: "baseline",
    },
    kcalLabel: {
        opacity: 0.8,
        marginLeft: 4,
    },
    timeChip: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    macrosContainer: {
        flexDirection: "row",
        gap: 6,
    },
    macroChip: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    ingredientsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    ingredientsList: {
        gap: 8, // Плотный список карточек
    },
    instructionsWrapper: {
        borderRadius: 24,
        padding: 16,
        marginBottom: 24,
    },
});
