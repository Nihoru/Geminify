import { useFocusEffect, useRouter } from "expo-router";
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
import { AnimatedFAB, IconButton, Text, useTheme } from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LAYOUT } from "@/src/constants/layout";
import { AddMealModal } from "../../components/AddMealModal";
import { AiAdviceCard } from "../../components/AiAdviceCard";
import { DailyMacrosCard } from "../../components/DailyMacrosCard";
import { DateSlider } from "../../components/DateSlider";
import { MaterialSymbol } from "../../components/MaterialSymbol";
import { MealDetailSheet } from "../../components/MealDetailSheet";
import { MealFeedItem } from "../../components/MealFeedItem";
import { UnifiedHeader } from "../../components/UnifiedHeader";

import { foodAnalysisService } from "../../src/services/foodAnalysis";
import { llmService } from "../../src/services/llmService";
import { MealRealmContext } from "../../src/shared/store/models";
import { storage, STORAGE_KEYS } from "../../src/shared/store/storage";
import { getMealTypeFromDate } from "../../src/utils/mealHelpers";
import { MacroLimits } from "../../src/utils/userMath";

import { ErrorModal } from "../../components/ErrorModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DAYS_RANGE = 365;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const DayContent = React.memo(
    ({
        date,
        paddingTop,
        dailyLimits,
        adviceText,
        onMealPress,
        onScroll,
    }: {
        date: Date;
        paddingTop: number;
        dailyLimits: MacroLimits;
        adviceText: string;
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
                    targetCalories={dailyLimits.calories}
                    currentProtein={dailyStats.protein}
                    targetProtein={dailyLimits.protein}
                    currentFat={dailyStats.fat}
                    targetFat={dailyLimits.fat}
                    currentCarbs={dailyStats.carbs}
                    targetCarbs={dailyLimits.carbs}
                />

                <AiAdviceCard adviceText={adviceText} />

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
    const [headerHeight, setHeaderHeight] = useState(insets.top + 80);
    const paddingTop = headerHeight + 16;

    const { useRealm } = MealRealmContext;
    const realm = useRealm();
    const router = useRouter();

    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [anchorDate, setAnchorDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });

    const dates = useMemo(() => {
        const arr = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = -DAYS_RANGE; i <= DAYS_RANGE; i++) {
            const d = new Date(anchorDate);
            d.setDate(anchorDate.getDate() + i);
            d.setHours(0, 0, 0, 0);

            if (d.getTime() > today.getTime()) break;
            arr.push(d);
        }
        return arr;
    }, [anchorDate]);

    const [selectedDate, setSelectedDate] = useState(dates[DAYS_RANGE]);
    const [isExtended, setIsExtended] = useState(true);
    const [selectedMeal, setSelectedMeal] = useState<any>(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [advices, setAdvices] = useState<Record<string, string>>({});
    const [error, setError] = useState<Error | string | null>(null);

    // --- Лимиты пользователя ---
    const [dailyLimits, setDailyLimits] = useState<MacroLimits>({
        calories: 2000,
        protein: 150,
        fat: 70,
        carbs: 200,
    });

    // Загружаем актуальные лимиты и советы при каждом показе экрана
    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            const loadData = async () => {
                const limits = await storage.getObject<MacroLimits>(
                    STORAGE_KEYS.MACRO_LIMITS,
                );
                const storedAdvices = await storage.getObject<
                    Record<string, string>
                >(STORAGE_KEYS.AI_ADVICE);

                if (isActive) {
                    if (limits) setDailyLimits(limits);
                    if (storedAdvices) setAdvices(storedAdvices);
                }
            };
            loadData();
            return () => {
                isActive = false;
            };
        }, []),
    );

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
    }).current;

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

            // --- Генерация совета после сохранения ---
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            const meals = realm
                .objects("Meal")
                .filtered("createdAt >= $0 AND createdAt <= $1", startOfDay, endOfDay);

            const stats = meals.reduce(
                (acc, meal: any) => {
                    acc.calories += meal.totalCalories || 0;
                    acc.protein += meal.totalProtein || 0;
                    acc.fat += meal.totalFat || 0;
                    acc.carbs += meal.totalCarbs || 0;
                    return acc;
                },
                { calories: 0, protein: 0, fat: 0, carbs: 0 },
            );

            const advice = await llmService.generateAdvice(
                stats,
                dailyLimits,
                meals.length,
            );

            const newAdvices = {
                ...advices,
                [selectedDate.toDateString()]: advice,
            };
            setAdvices(newAdvices);
            await storage.setObject(STORAGE_KEYS.AI_ADVICE, newAdvices);
        } catch (err: any) {
            console.error("Ошибка при сохранении:", err);
            setError(err);
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
                        dailyLimits={dailyLimits}
                        adviceText={
                            advices[item.toDateString()] ||
                            "Добавьте приём пищи, чтобы получить совет!"
                        }
                        onMealPress={setSelectedMeal}
                        onScroll={handleScrollVertical}
                    />
                )}
            />

            <UnifiedHeader
                onHeightChange={setHeaderHeight}
                leftNode={
                    <DateSlider
                        dates={dates}
                        selectedDate={selectedDate}
                        onDateChange={handleDateChangeFromHeader}
                        scrollX={scrollX}
                        pagingWidth={SCREEN_WIDTH}
                    />
                }
                rightNode={
                    <View
                        style={{
                            flexDirection: "row",
                            backgroundColor: theme.colors.surfaceVariant,
                            borderRadius: 26,
                            height: 52,
                            alignItems: "center",
                            paddingHorizontal: 4,
                        }}
                    >
                        <IconButton
                            icon={(props) => (
                                <MaterialSymbol
                                    name="calendar_month"
                                    {...props}
                                />
                            )}
                            iconColor={theme.colors.onSurfaceVariant}
                            size={24}
                            style={{ margin: 0, padding: 0 }}
                            onPress={() => setDatePickerVisible(true)}
                        />
                        <IconButton
                            icon={(props) => (
                                <MaterialSymbol name="settings" {...props} />
                            )}
                            iconColor={theme.colors.onSurfaceVariant}
                            size={24}
                            style={{ margin: 0, padding: 0 }}
                            onPress={() =>
                                router.push({ pathname: "/settings" })
                            }
                        />
                    </View>
                }
            />

            <DatePickerModal
                locale="ru"
                mode="single"
                visible={isDatePickerVisible}
                onDismiss={() => setDatePickerVisible(false)}
                date={selectedDate}
                onConfirm={(params) => {
                    setDatePickerVisible(false);
                    if (params.date) handleDateChangeFromHeader(params.date);
                }}
                validRange={{ endDate: new Date() }}
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
            <ErrorModal
                visible={!!error}
                error={error}
                onDismiss={() => setError(null)}
            />
            <MealDetailSheet
                visible={!!selectedMeal}
                meal={selectedMeal}
                onDismiss={() => setSelectedMeal(null)}
                topOffset={paddingTop}
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
