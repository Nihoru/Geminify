import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { AnimatedFAB, Searchbar, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AiAdviceCard } from "@/components/AiAdviceCard";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { MealDetailSheet } from "@/components/MealDetailSheet";
import { MealFeedItem } from "@/components/MealFeedItem";
import { SortChip } from "@/components/SortChip";
import { UnifiedHeader } from "@/components/UnifiedHeader";
import { LAYOUT } from "@/src/constants/layout";
import { SortOption, sortItems } from "@/src/utils/searchHelpers";

// Моковые данные рецептов
const MOCK_RECIPES = [
    {
        id: "r1",
        title: "Овсянка с ягодами и орехами",
        calories: 345,
        macros: { p: 12, f: 14, c: 42 },
        time: "15 мин",
        typeCode: "breakfast",
        isRecipe: true,
        instructions:
            "1. Вскипятите молоко в небольшой кастрюле.\n2. Добавьте овсяные хлопья и щепотку соли.\n3. Варите на медленном огне 5-7 минут, постоянно помешивая.\n4. Выложите в тарелку, добавьте свежие ягоды и измельченные орехи.",
        dishes: [
            {
                name: "Овсяная каша на молоке",
                totalWeight: 350,
                totalCalories: 345,
                totalProtein: 12,
                totalFat: 14,
                totalCarbs: 42,
                ingredients: [
                    {
                        name: "Овсяные хлопья",
                        cookedWeight: 50,
                        calories: 180,
                        protein: 6,
                        fat: 3,
                        carbs: 32,
                    },
                    {
                        name: "Молоко 2.5%",
                        cookedWeight: 200,
                        calories: 104,
                        protein: 6,
                        fat: 5,
                        carbs: 9,
                    },
                    {
                        name: "Грецкий орех",
                        cookedWeight: 15,
                        calories: 100,
                        protein: 2,
                        fat: 10,
                        carbs: 2,
                    },
                    {
                        name: "Черника",
                        cookedWeight: 30,
                        calories: 16,
                        protein: 0.2,
                        fat: 0.1,
                        carbs: 4,
                    },
                ],
            },
        ],
    },
    {
        id: "r2",
        title: "Куриная грудка с брокколи",
        calories: 420,
        macros: { p: 45, f: 12, c: 35 },
        time: "30 мин",
        typeCode: "lunch",
        isRecipe: true,
        instructions:
            "1. Промойте куриное филе и нарежьте порционными кусками.\n2. Приправьте солью и специями по вкусу.\n3. Обжарьте на оливковом масле до золотистой корочки или запеките в духовке.\n4. Брокколи отварите в кипящей воде 3-5 минут.",
        dishes: [
            {
                name: "Запеченная грудка с овощами",
                totalWeight: 450,
                totalCalories: 420,
                totalProtein: 45,
                totalFat: 12,
                totalCarbs: 35,
                ingredients: [
                    {
                        name: "Куриное филе",
                        cookedWeight: 200,
                        calories: 330,
                        protein: 40,
                        fat: 8,
                        carbs: 0,
                    },
                    {
                        name: "Брокколи",
                        cookedWeight: 150,
                        calories: 50,
                        protein: 4,
                        fat: 1,
                        carbs: 10,
                    },
                    {
                        name: "Оливковое масло",
                        cookedWeight: 5,
                        calories: 40,
                        protein: 0,
                        fat: 5,
                        carbs: 0,
                    },
                ],
            },
        ],
    },
    {
        id: "r3",
        title: "Протеиновые панкейки",
        calories: 280,
        macros: { p: 25, f: 8, c: 28 },
        time: "20 мин",
        typeCode: "snack_1",
        isRecipe: true,
        instructions:
            "1. Взбейте яйцо с измельченным бананом до однородности.\n2. Добавьте порцию протеина и тщательно перемешайте.\n3. Разогрейте сковороду с антипригарным покрытием.\n4. Выпекайте небольшие панкейки по 1-2 минуты с каждой стороны.",
        dishes: [
            {
                name: "Панкейки без сахара",
                totalWeight: 200,
                totalCalories: 280,
                totalProtein: 25,
                totalFat: 8,
                totalCarbs: 28,
                ingredients: [
                    {
                        name: "Яйцо куриное",
                        cookedWeight: 50,
                        calories: 75,
                        protein: 6,
                        fat: 5,
                        carbs: 1,
                    },
                    {
                        name: "Протеин сывороточный",
                        cookedWeight: 30,
                        calories: 110,
                        protein: 22,
                        fat: 1,
                        carbs: 3,
                    },
                    {
                        name: "Банан",
                        cookedWeight: 80,
                        calories: 75,
                        protein: 1,
                        fat: 0.5,
                        carbs: 18,
                    },
                ],
            },
        ],
    },
    {
        id: "r4",
        title: "Лосось на гриле с диким рисом",
        calories: 520,
        macros: { p: 38, f: 22, c: 45 },
        time: "40 мин",
        typeCode: "dinner",
        isRecipe: true,
        instructions:
            "1. Промойте дикий рис и поставьте вариться (обычно 30-40 мин).\n2. Стейк лосося сбрызните лимоном и слегка посолите.\n3. Обжарьте рыбу на гриле или сковороде по 4-5 минут с каждой стороны.\n4. Спаржу приготовьте на пару или обжарьте вместе с рыбой в последние 3 минуты.",
        dishes: [
            {
                name: "Лосось с гарниром",
                totalWeight: 400,
                totalCalories: 520,
                totalProtein: 38,
                totalFat: 22,
                totalCarbs: 45,
                ingredients: [
                    {
                        name: "Стейк лосося",
                        cookedWeight: 150,
                        calories: 300,
                        protein: 30,
                        fat: 20,
                        carbs: 0,
                    },
                    {
                        name: "Рис дикий отварной",
                        cookedWeight: 150,
                        calories: 180,
                        protein: 6,
                        fat: 1,
                        carbs: 38,
                    },
                    {
                        name: "Спаржа",
                        cookedWeight: 100,
                        calories: 40,
                        protein: 2,
                        fat: 1,
                        carbs: 7,
                    },
                ],
            },
        ],
    },
];

export default function RecipesScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const [searchQuery, setSearchQuery] = useState("");
    const [isExtended, setIsExtended] = useState(true);
    const [sortBy, setSortBy] = useState<SortOption>("relevance");
    const [isDescending, setIsDescending] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [displayData, setDisplayData] = useState<any[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
    const [headerHeight, setHeaderHeight] = useState(insets.top + 80);

    const onScroll = ({ nativeEvent }: any) => {
        const y = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
        setIsExtended(y <= 20);
    };

    React.useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            const query = searchQuery.trim().toLowerCase();
            let filtered = MOCK_RECIPES;

            if (query !== "") {
                const words = query.split(/\s+/);
                filtered = MOCK_RECIPES.filter((r) => {
                    const title = r.title.toLowerCase();
                    return words.every((word) => title.includes(word));
                });
            }

            const sorted = sortItems(filtered, query, sortBy, isDescending);
            setDisplayData(sorted);
            setIsLoading(false);
        }, 0);

        return () => clearTimeout(timer);
    }, [searchQuery, sortBy, isDescending]);

    const paddingTop = headerHeight + 16;

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.colors.surface },
            ]}
        >
            <UnifiedHeader
                onHeightChange={setHeaderHeight}
                leftNode={
                    <Text
                        variant="headlineMedium"
                        style={{
                            color: theme.colors.onSurface,
                            fontWeight: "700",
                            paddingHorizontal: 8,
                        }}
                    >
                        Идеи
                    </Text>
                }
                rightNode={
                    <SortChip
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                        isDescending={isDescending}
                        onDirectionChange={setIsDescending}
                    />
                }
                bottomNode={
                    <Searchbar
                        placeholder="Поиск рецепта..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={[
                            styles.searchBar,
                            {
                                backgroundColor:
                                    theme.colors.secondaryContainer,
                            },
                        ]}
                        inputStyle={[
                            styles.searchInput,
                            { color: theme.colors.onSecondaryContainer },
                        ]}
                        iconColor={theme.colors.onSecondaryContainer}
                        elevation={0}
                    />
                }
            />

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        animating={true}
                        color={theme.colors.primary}
                        size="large"
                    />
                    <Text
                        variant="bodyMedium"
                        style={{
                            marginTop: 12,
                            color: theme.colors.onSurfaceVariant,
                        }}
                    >
                        Сортировка...
                    </Text>
                </View>
            ) : (
                <FlatList
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    data={displayData}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={{ paddingHorizontal: 16 }}>
                            <MealFeedItem
                                meal={item}
                                onPress={() => setSelectedRecipe(item)}
                            />
                        </View>
                    )}
                    contentContainerStyle={{
                        paddingTop: paddingTop,
                        paddingBottom: LAYOUT.BOTTOM_NAV_THRESHOLD + 12,
                    }}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <AiAdviceCard adviceText="Хотите что-то новенькое? Попробуйте наши протеиновые панкейки — они отлично подходят для завтрака или перекуса после тренировки!" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text
                                variant="bodyLarge"
                                style={{ color: theme.colors.onSurfaceVariant }}
                            >
                                Рецепты не найдены :(
                            </Text>
                        </View>
                    }
                />
            )}

            <AnimatedFAB
                icon={(props: any) => <MaterialSymbol name="add" {...props} />}
                label="Рецепт"
                extended={isExtended}
                elevation={0}
                style={[
                    styles.fabStyle,
                    {
                        backgroundColor: theme.colors.primary,
                        bottom: LAYOUT.BOTTOM_NAV_THRESHOLD + 16,
                    },
                ]}
                color={theme.colors.onPrimary}
                onPress={() => {
                    // В будущем тут будет открытие создания рецепта
                    console.log("Добавить новый рецепт");
                }}
            />

            <MealDetailSheet
                visible={!!selectedRecipe}
                meal={selectedRecipe}
                onDismiss={() => setSelectedRecipe(null)}
                topOffset={paddingTop}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchBar: {
        borderRadius: 26,
        height: 52,
    },
    searchInput: {
        fontSize: 16,
    },
    fabStyle: {
        position: "absolute",
        right: 16,
        zIndex: 20,
    },
    emptyState: {
        alignItems: "center",
        marginTop: 40,
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
