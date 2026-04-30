import Fuse from "fuse.js";
import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
    AnimatedFAB,
    Searchbar,
    Text,
    TouchableRipple,
    useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Импортируем нашу объединенную базу
import { EditIngredientSheet } from "@/components/EditIngredientSheet";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { LAYOUT } from "@/src/constants/layout";
import localFoodDB from "../../src/assets/food_db_ru_optimized.json";

// Утилита для заглавной буквы
const capitalize = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Вспомогательный компонент для мини-макросов (как в MealDetailSheet)
const renderMiniMacro = (
    bg: string,
    fg: string,
    label: string,
    val: number,
) => (
    <View style={[styles.miniMacroChip, { backgroundColor: bg }]}>
        <Text variant="labelSmall" style={{ color: fg, opacity: 0.9 }}>
            {label} <Text style={{ fontWeight: "700" }}>{val}</Text>
        </Text>
    </View>
);

export default function KitchenScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const [searchQuery, setSearchQuery] = useState("");

    const [isExtended, setIsExtended] = useState(true);

    const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
    const [isEditVisible, setEditVisible] = useState(false);

    const onScroll = ({ nativeEvent }: any) => {
        const y = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
        setIsExtended(y <= 20);
    };

    // Инициализируем Fuse.js для поиска
    const fuse = useMemo(
        () =>
            new Fuse(localFoodDB, {
                keys: ["name"],
                threshold: 0.3,
                distance: 100,
            }),
        [],
    );

    const displayData = useMemo(() => {
        if (searchQuery.trim() === "") {
            return localFoodDB;
        }
        return fuse.search(searchQuery).map((result) => result.item);
    }, [searchQuery, fuse]);

    const renderItem = ({ item }: { item: any }) => (
        <View
            style={[
                styles.itemCard,
                { backgroundColor: theme.colors.elevation.level1 },
            ]}
        >
            {/* Левая часть: Компактный бейдж с калориями (48x48) */}
            <View
                style={[
                    styles.ingLeadingBadge,
                    { backgroundColor: theme.colors.primaryContainer },
                ]}
            >
                <Text
                    variant="titleMedium" // Уменьшили с titleLarge
                    style={{
                        color: theme.colors.onPrimaryContainer,
                        fontWeight: "800",
                        lineHeight: 20, // Поджали высоту строки для компактности
                    }}
                >
                    {item.calories}
                </Text>
                <Text
                    variant="labelSmall"
                    style={{
                        color: theme.colors.onPrimaryContainer,
                        opacity: 0.8,
                        fontSize: 9, // Слегка уменьшили базовый labelSmall для гармонии в маленьком квадрате
                        lineHeight: 12,
                    }}
                >
                    ккал
                </Text>
            </View>

            {/* Центральная часть: Название и компактные БЖУ + "/ 100г" */}
            <View style={styles.ingMainContent}>
                <Text
                    variant="titleSmall" // Уменьшили с titleMedium, как в MealFeedItem
                    style={{
                        color: theme.colors.onSurface,
                        fontWeight: "700",
                        marginBottom: 4, // Немного уменьшили отступ
                    }}
                    numberOfLines={1}
                >
                    {capitalize(item.name)}
                </Text>
                <View style={[styles.ingMacrosRow, { alignItems: "center" }]}>
                    {renderMiniMacro(
                        theme.colors.secondaryContainer,
                        theme.colors.onSecondaryContainer,
                        "Б",
                        item.protein,
                    )}
                    {renderMiniMacro(
                        theme.colors.tertiaryContainer,
                        theme.colors.onTertiaryContainer,
                        "Ж",
                        item.fat,
                    )}
                    {renderMiniMacro(
                        theme.colors.primaryContainer,
                        theme.colors.onPrimaryContainer,
                        "У",
                        item.carbs,
                    )}
                    <Text
                        variant="labelSmall"
                        style={{
                            color: theme.colors.onSurfaceVariant,
                            marginLeft: 4,
                        }}
                    >
                        / 100г
                    </Text>
                </View>
            </View>

            {/* Правая часть: Компактная кнопка (высота 48) */}
            <View style={styles.ingTrailing}>
                <TouchableRipple
                    onPress={() => {
                        setSelectedIngredient(item);
                        setEditVisible(true);
                    }}
                    style={[
                        styles.editButtonFull,
                        { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                    borderless
                >
                    <MaterialSymbol
                        name="edit"
                        size={20} // Чуть уменьшили иконку
                        color={theme.colors.onSurfaceVariant}
                    />
                </TouchableRipple>
            </View>
        </View>
    );

    // Высчитываем отступ для FlatList, так как шапка у нас absolute
    const paddingTop = insets.top + 64 + 60 + 20 + 16;

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.colors.surface },
            ]}
        >
            {/* Единый Хедер (как UnifiedHeader) */}
            <View
                style={[
                    styles.unifiedHeader,
                    {
                        paddingTop: insets.top,
                        backgroundColor: theme.colors.elevation.level2,
                    },
                ]}
            >
                <View style={styles.headerTopRow}>
                    <Text
                        variant="headlineMedium"
                        style={{
                            color: theme.colors.onSurface,
                            fontWeight: "700",
                        }}
                    >
                        Кухня
                    </Text>
                </View>

                <View style={styles.headerBottomRow}>
                    <Searchbar
                        placeholder="Поиск ингредиента..."
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
                        elevation={0} // Строгое соблюдение M3: убираем тень
                    />
                </View>
            </View>

            <FlatList
                onScroll={onScroll}
                scrollEventThrottle={16}
                data={displayData}
                keyExtractor={(item, index) => item.name + index}
                renderItem={renderItem}
                initialNumToRender={15} // Сколько элементов рендерить при первой загрузке экрана
                maxToRenderPerBatch={20} // Сколько элементов дорендеривать за один кадр при скролле
                windowSize={5} // Сколько "экранов" держать в памяти (по умолчанию 21, для 6000 лучше уменьшить, чтобы не забивать ОЗУ)
                removeClippedSubviews={true} // Выгружает из памяти элементы, которые ушли далеко за экран
                contentContainerStyle={[
                    styles.listContent,
                    {
                        paddingTop: paddingTop,
                        paddingBottom: LAYOUT.BOTTOM_NAV_THRESHOLD + 12,
                    },
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text
                            variant="bodyLarge"
                            style={{ color: theme.colors.onSurfaceVariant }}
                        >
                            Ничего не найдено :(
                        </Text>
                    </View>
                }
            />

            <AnimatedFAB
                icon={(props: any) => <MaterialSymbol name="add" {...props} />}
                label="Продукт"
                extended={isExtended}
                elevation={0} // Убираем тень FAB по правилам нашего дизайна
                style={[
                    styles.fabStyle,
                    { backgroundColor: theme.colors.primary },
                    { bottom: LAYOUT.BOTTOM_NAV_THRESHOLD + 16 },
                ]}
                color={theme.colors.onPrimary}
                onPress={() => console.log("Add new product")}
            />
            <EditIngredientSheet
                visible={isEditVisible}
                ingredient={selectedIngredient}
                onDismiss={() => {
                    setEditVisible(false);
                    setSelectedIngredient(null);
                }}
                onSave={(data) => {
                    console.log("Сохраняем в БД:", data);
                    // Тут твоя логика обновления Realm или JSON
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // --- Стили Хедера ---
    unifiedHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
    },
    headerTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        height: 64,
    },
    headerBottomRow: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    searchBar: {
        borderRadius: 26,
        height: 52,
    },
    searchInput: {
        fontSize: 16,
    },
    // --- Стили Списка и Карточек ---
    listContent: {
        paddingHorizontal: 16,
    },
    itemCard: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 24, // Как в MealFeedItem
        padding: 12, // Как в MealFeedItem
        marginBottom: 12, // Соответствует gap: 12 из индекса
    },
    ingLeadingBadge: {
        width: 48,
        height: 48,
        borderRadius: 16, // Как у smallTag в MealFeedItem
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12, // Как у compactCardLeft в MealFeedItem
    },
    ingMainContent: {
        flex: 1,
        justifyContent: "center",
    },
    ingMacrosRow: {
        flexDirection: "row",
        gap: 4,
    },
    miniMacroChip: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    ingTrailing: {
        marginLeft: 8, // Как у compactCardRight в MealFeedItem
        justifyContent: "center",
    },
    editButtonFull: {
        width: 40,
        height: 48, // Высота совпадает с левым бейджем
        borderRadius: 16, // Оставляем 16 для гармонии с левым квадратом
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    // --- Остальное ---
    fabStyle: { position: "absolute", right: 16, zIndex: 20 },
    emptyState: {
        alignItems: "center",
        marginTop: 40,
    },
});
