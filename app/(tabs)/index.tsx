import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { AnimatedFAB, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LAYOUT } from "@/src/constants/layout";
import { AddMealModal } from "../../components/AddMealModal";
import { AiAdviceCard } from "../../components/AiAdviceCard";
import { DailyMacrosCard } from "../../components/DailyMacrosCard";
import { MaterialSymbol } from "../../components/MaterialSymbol";
import { MealDetailSheet } from "../../components/MealDetailSheet";
import { MealFeedItem } from "../../components/MealFeedItem";
import { UnifiedHeader } from "../../components/UnifiedHeader";

import { analyzeFoodText } from "../../src/core/gemini";
import { MealRealmContext } from "../../src/shared/store/models";
import { getMealTypeFromDate } from "../../src/utils/mealHelpers";

export default function HomeScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const { useRealm, useQuery } = MealRealmContext;
    const realm = useRealm();
    const meals = useQuery("Meal").sorted("createdAt", true);

    const [isExtended, setIsExtended] = useState(true);
    const [period, setPeriod] = useState("day");
    const [selectedMeal, setSelectedMeal] = useState<any>(null);

    const [isModalVisible, setModalVisible] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const onScroll = ({ nativeEvent }: any) => {
        const y = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
        setIsExtended(y <= 20);
    };

    const paddingTop = insets.top + 64 + 56 + 20 + 24;

    const handleSaveMeal = async (textPrompt: string) => {
        setIsAnalyzing(true);

        try {
            const analysisResult = await analyzeFoodText(textPrompt);

            realm.write(() => {
                realm.create("Meal", {
                    mealName: analysisResult.mealName || textPrompt,
                    totalCalories: analysisResult.totalCalories,
                    totalProtein: analysisResult.totalProtein,
                    totalFat: analysisResult.totalFat,
                    totalCarbs: analysisResult.totalCarbs,
                    dishes: analysisResult.dishes,
                });
            });

            setModalVisible(false);
        } catch (error: any) {
            console.error("Ошибка при сохранении:", error);
            Alert.alert(
                "Ошибка анализа",
                "Не удалось распознать еду. Проверьте API ключ в настройках и подключение к интернету.",
            );
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.colors.surface },
            ]}
        >
            <ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: paddingTop,
                    paddingBottom: LAYOUT.BOTTOM_NAV_THRESHOLD + 12,
                }}
            >
                <DailyMacrosCard />

                <AiAdviceCard adviceText="Белок и жиры уже набраны! До конца дня старайся налегать на сложные углеводы: добавь к ужину порцию гречки или цельнозерновой хлеб." />

                <View style={styles.feed}>
                    {meals.length === 0 && (
                        <Text style={styles.emptyText}>
                            Список приёмов пищи пуст. Добавьте первую запись!
                        </Text>
                    )}

                    {meals.map((meal: any) => {
                        const mappedMeal = {
                            id: meal._id.toHexString(),
                            typeCode: getMealTypeFromDate(meal.createdAt),
                            time: meal.createdAt.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            }),
                            title: meal.mealName,
                            calories: meal.totalCalories,
                            macros: {
                                p: meal.totalProtein,
                                f: meal.totalFat,
                                c: meal.totalCarbs,
                            },
                            // Извлекаем двухуровневую иерархию из Realm
                            dishes: meal.dishes.map((dish: any) => ({
                                name: dish.name,
                                totalWeight: dish.totalWeight,
                                totalCalories: dish.totalCalories,
                                totalProtein: dish.totalProtein,
                                totalFat: dish.totalFat,
                                totalCarbs: dish.totalCarbs,
                                ingredients: dish.ingredients.map(
                                    (ing: any) => ({
                                        name: ing.name,
                                        weight: ing.weight,
                                        calories: ing.calories,
                                        protein: ing.protein,
                                        fat: ing.fat,
                                        carbs: ing.carbs,
                                    }),
                                ),
                            })),
                        };
                        return (
                            <MealFeedItem
                                key={mappedMeal.id}
                                meal={mappedMeal}
                                onPress={() => setSelectedMeal(mappedMeal)}
                            />
                        );
                    })}
                </View>
            </ScrollView>

            <UnifiedHeader
                period={period}
                onPeriodChange={setPeriod}
                insets={insets}
            />

            <AnimatedFAB
                icon={(props: any) => <MaterialSymbol name="add" {...props} />}
                label="Добавить"
                extended={isExtended}
                onPress={() => setModalVisible(true)}
                color={theme.colors.onPrimary}
                style={[
                    styles.fabStyle,
                    {
                        bottom: LAYOUT.BOTTOM_NAV_THRESHOLD + 16,
                        backgroundColor: theme.colors.primary,
                    },
                ]}
            />

            <AddMealModal
                visible={isModalVisible}
                onDismiss={() => setModalVisible(false)}
                onSave={handleSaveMeal}
                isAnalyzing={isAnalyzing}
            />
            <MealDetailSheet
                visible={!!selectedMeal}
                meal={selectedMeal}
                onDismiss={() => setSelectedMeal(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    feed: { paddingHorizontal: 16, gap: 12 },
    fabStyle: { position: "absolute", right: 16, zIndex: 20 },
    emptyText: { textAlign: "center", marginTop: 20, opacity: 0.5 },
});
