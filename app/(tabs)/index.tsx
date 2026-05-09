import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
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

import { foodAnalysisService } from "../../src/services/foodAnalysis";
import { MealRealmContext } from "../../src/shared/store/models";
import { getMealTypeFromDate } from "../../src/utils/mealHelpers";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DAYS_RANGE = 365;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const DayContent = React.memo(
    ({
        date,
        paddingTop,
        onMealPress,
        onScroll,
    }: {
        date: Date;
        paddingTop: number;
        onMealPress: (meal: any) => void;
        onScroll: (e: any) => void;
    }) => {
        const { useQuery } = MealRealmContext;

        const { startOfDay, endOfDay } = useMemo(() => {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            return { startOfDay: start, endOfDay: end };
        }, [date]);

        const meals = useQuery("Meal")
            .filtered(
                "createdAt >= $0 AND createdAt <= $1",
                startOfDay,
                endOfDay,
            )
            .sorted("createdAt", true);

        const dailyStats = useMemo(() => {
            return meals.reduce(
                (acc, meal: any) => {
                    acc.calories += meal.totalCalories || 0;
                    acc.protein += meal.totalProtein || 0;
                    acc.fat += meal.totalFat || 0;
                    acc.carbs += meal.totalCarbs || 0;
                    return acc;
                },
                { calories: 0, protein: 0, fat: 0, carbs: 0 },
            );
        }, [meals]);

        const mappedMeals = useMemo(() => {
            return meals.map((meal: any) => ({
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
                dishes: meal.dishes.map((dish: any) => ({
                    name: dish.name,
                    totalWeight: dish.totalWeight,
                    totalCalories: dish.totalCalories,
                    totalProtein: dish.totalProtein,
                    totalFat: dish.totalFat,
                    totalCarbs: dish.totalCarbs,
                    ingredients: dish.ingredients.map((ing: any) => ({
                        name: ing.name,
                        cookedWeight: ing.cookedWeight,
                        calories: ing.calories,
                        protein: ing.protein,
                        fat: ing.fat,
                        carbs: ing.carbs,
                    })),
                })),
            }));
        }, [meals]);

        return (
            <ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: paddingTop,
                    paddingBottom: LAYOUT.BOTTOM_NAV_THRESHOLD + 12,
                }}
                style={{ width: SCREEN_WIDTH }}
            >
                <DailyMacrosCard
                    currentCalories={dailyStats.calories}
                    currentProtein={dailyStats.protein}
                    currentFat={dailyStats.fat}
                    currentCarbs={dailyStats.carbs}
                />

                <AiAdviceCard adviceText="Белок и жиры уже набраны! До конца дня старайся налегать на сложные углеводы: добавь к ужину порцию гречки или цельнозерновой хлеб." />

                <View style={styles.feed}>
                    {mappedMeals.length === 0 && (
                        <Text style={styles.emptyText}>
                            Список приёмов пищи пуст. Добавьте первую запись!
                        </Text>
                    )}

                    {mappedMeals.map((mappedMeal: any) => (
                        <MealFeedItem
                            key={mappedMeal.id}
                            meal={mappedMeal}
                            onPress={() => onMealPress(mappedMeal)}
                        />
                    ))}
                </View>
            </ScrollView>
        );
    },
);

export default function HomeScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const paddingTop = insets.top + 64 + 20 + 24;

    const { useRealm } = MealRealmContext;
    const realm = useRealm();

    // Якорь для центрирования массива дат
    const [anchorDate, setAnchorDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });

    // === ИЗМЕНЕНИЕ 1: Привязываем генерацию массива к anchorDate ===
    const dates = useMemo(() => {
        const arr = [];

        // Фиксируем сегодняшний день для проверки
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = -DAYS_RANGE; i <= DAYS_RANGE; i++) {
            const d = new Date(anchorDate);
            d.setDate(anchorDate.getDate() + i);
            d.setHours(0, 0, 0, 0);

            // БЛОКИРОВКА БУДУЩЕГО:
            // Если дата, которую мы пытаемся добавить, больше сегодняшней,
            // мы просто прерываем цикл.
            if (d.getTime() > today.getTime()) {
                break;
            }

            arr.push(d);
        }
        return arr;
    }, [anchorDate]);

    // Инициализируем выбранную дату центром массива
    const [selectedDate, setSelectedDate] = useState(dates[DAYS_RANGE]);
    const [isExtended, setIsExtended] = useState(true);
    const [selectedMeal, setSelectedMeal] = useState<any>(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(
        new Animated.Value(DAYS_RANGE * SCREEN_WIDTH),
    ).current;

    const handleScrollVertical = useCallback(({ nativeEvent }: any) => {
        const y = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
        setIsExtended(y <= 20);
    }, []);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setSelectedDate(viewableItems[0].item);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
        // minimumViewTime: 250,
    }).current;

    // === ИЗМЕНЕНИЕ 2: Обработка далеких прыжков ===
    const handleDateChangeFromHeader = (newDate: Date) => {
        newDate.setHours(0, 0, 0, 0);

        const newIndex = dates.findIndex(
            (d) => d.getTime() === newDate.getTime(),
        );

        if (newIndex !== -1) {
            const currentIndex = dates.findIndex(
                (d) => d.getTime() === selectedDate.getTime(),
            );
            const isLongJump = Math.abs(newIndex - currentIndex) > 2;

            flatListRef.current?.scrollToIndex({
                index: newIndex,
                animated: !isLongJump,
            });
            setSelectedDate(newDate);
        } else {
            // ДАЛЕКИЙ ПРЫЖОК: Даты нет в текущем массиве
            // Меняем якорь, что спровоцирует полный перерендер FlatList на нужной дате
            setAnchorDate(newDate);
            setSelectedDate(newDate);
            scrollX.setValue(DAYS_RANGE * SCREEN_WIDTH);
        }
    };

    const handleSaveMeal = async (textPrompt: string) => {
        setIsAnalyzing(true);
        try {
            const analysisResult = await foodAnalysisService.analyzeText(
                textPrompt,
                realm,
            );
            realm.write(() => {
                const mealDate = new Date(selectedDate);
                const now = new Date();
                mealDate.setHours(
                    now.getHours(),
                    now.getMinutes(),
                    now.getSeconds(),
                );

                realm.create("Meal", {
                    mealName: analysisResult.mealName || textPrompt,
                    totalCalories: analysisResult.totalCalories,
                    totalProtein: analysisResult.totalProtein,
                    totalFat: analysisResult.totalFat,
                    totalCarbs: analysisResult.totalCarbs,
                    dishes: analysisResult.dishes,
                    createdAt: mealDate,
                });
            });
            setModalVisible(false);
        } catch (error: any) {
            console.error("Ошибка при сохранении:", error);
            Alert.alert("Ошибка", "Не удалось распознать еду.");
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
            <AnimatedFlatList
                // === ИЗМЕНЕНИЕ 3: Привязываем ключ к якорю ===
                // При смене якоря (далекий прыжок), React убивает старый список
                // и мгновенно создает новый, уже отцентрированный на нужной дате
                key={anchorDate.getTime()}
                ref={flatListRef}
                data={dates}
                keyExtractor={(item: any) => item.toISOString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={SCREEN_WIDTH}
                decelerationRate="fast"
                disableIntervalMomentum={true}
                initialScrollIndex={DAYS_RANGE}
                getItemLayout={(data, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                })}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true },
                )}
                scrollEventThrottle={8}
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                updateCellsBatchingPeriod={100}
                windowSize={5}
                removeClippedSubviews={true}
                renderItem={({ item }: any) => (
                    <DayContent
                        date={item}
                        paddingTop={paddingTop}
                        onMealPress={setSelectedMeal}
                        onScroll={handleScrollVertical}
                    />
                )}
            />

            <UnifiedHeader
                insets={insets}
                selectedDate={selectedDate}
                onDateChange={handleDateChangeFromHeader}
                dates={dates}
                scrollX={scrollX}
                pagingWidth={SCREEN_WIDTH}
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
