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

// Импортируем компоненты и контекст базы данных
import { EditIngredientSheet } from "@/components/EditIngredientSheet";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { LAYOUT } from "@/src/constants/layout";
import { FoodProduct, MealRealmContext } from "../../src/shared/store/models";

// Утилита для заглавной буквы
const capitalize = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Вспомогательный компонент для мини-макросов
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

    // ПОДКЛЮЧАЕМ REALM
    const { useRealm, useQuery } = MealRealmContext;
    const realm = useRealm();

    // Получаем все продукты из базы
    const allProducts = useQuery<FoodProduct>("FoodProduct");

    const [searchQuery, setSearchQuery] = useState("");
    const [isExtended, setIsExtended] = useState(true);

    const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
    const [isEditVisible, setEditVisible] = useState(false);

    const onScroll = ({ nativeEvent }: any) => {
        const y = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
        setIsExtended(y <= 20);
    };

    // ВСТРОЕННЫЙ МЕХАНИЗМ ПОИСКА REALM (вместо Fuse.js)
    // ВСТРОЕННЫЙ УМНЫЙ ПОИСК REALM
    const displayData = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (query === "") {
            return allProducts;
        }

        // 1. Разбиваем запрос на слова (по пробелам)
        const words = query.split(/\s+/);

        // 2. Для каждого слова создаем условие: "искать это слово хоть в одном из трех полей"
        const queryConditions = words.map(
            (_, index) =>
                `(brand CONTAINS[c] $${index} OR baseName CONTAINS[c] $${index} OR specs CONTAINS[c] $${index})`,
        );

        // 3. Склеиваем условия через AND.
        // Если юзер ввел "йогурт клубника", Realm найдет продукт, где есть ОБА слова (неважно в каких полях и в каком порядке)
        const finalQueryString = queryConditions.join(" AND ");

        // 4. Передаем саму строку запроса и развернутый массив слов как аргументы
        return allProducts.filtered(finalQueryString, ...words);
    }, [searchQuery, allProducts]);

    const renderItem = ({ item }: { item: any }) => {
        // ОБРАТИ ВНИМАНИЕ: используем item.baseName (camelCase), так как это схема Realm
        const fullName = [item.brand, item.baseName, item.specs]
            .filter(Boolean)
            .join(" ");

        return (
            <View
                style={[
                    styles.itemCard,
                    { backgroundColor: theme.colors.elevation.level1 },
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
                        {item.calories}
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
                        {capitalize(fullName)}
                    </Text>
                    <View
                        style={[styles.ingMacrosRow, { alignItems: "center" }]}
                    >
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
                            size={20}
                            color={theme.colors.onSurfaceVariant}
                        />
                    </TouchableRipple>
                </View>
            </View>
        );
    };

    const paddingTop = insets.top + 64 + 60 + 20 + 16;

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.colors.surface },
            ]}
        >
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
                        elevation={0}
                    />
                </View>
            </View>

            <FlatList
                onScroll={onScroll}
                scrollEventThrottle={16}
                data={displayData}
                // Используем _id как уникальный ключ
                keyExtractor={(item) => item._id.toHexString()}
                renderItem={renderItem}
                initialNumToRender={15}
                maxToRenderPerBatch={20}
                windowSize={5}
                removeClippedSubviews={true}
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
                elevation={0}
                style={[
                    styles.fabStyle,
                    { backgroundColor: theme.colors.primary },
                    { bottom: LAYOUT.BOTTOM_NAV_THRESHOLD + 16 },
                ]}
                color={theme.colors.onPrimary}
                onPress={() => {
                    // Очищаем выбранный ингредиент и открываем шторку
                    setSelectedIngredient(null);
                    setEditVisible(true);
                }}
            />

            <EditIngredientSheet
                visible={isEditVisible}
                ingredient={selectedIngredient}
                onDismiss={() => {
                    setEditVisible(false);
                    setSelectedIngredient(null);
                }}
                onSave={(data) => {
                    try {
                        realm.write(() => {
                            if (data._id) {
                                // РЕЖИМ РЕДАКТИРОВАНИЯ
                                const productToUpdate =
                                    realm.objectForPrimaryKey<any>(
                                        "FoodProduct",
                                        data._id,
                                    );

                                if (productToUpdate) {
                                    productToUpdate.brand = data.brand;
                                    productToUpdate.baseName = data.base_name;
                                    productToUpdate.specs = data.specs;
                                    productToUpdate.calories = data.calories;
                                    productToUpdate.protein = data.protein;
                                    productToUpdate.fat = data.fat;
                                    productToUpdate.carbs = data.carbs;
                                }
                            } else {
                                // РЕЖИМ ДОБАВЛЕНИЯ НОВОЙ ЗАПИСИ
                                realm.create("FoodProduct", {
                                    _id: new Realm.BSON.ObjectId(), // Генерируем новый ID
                                    brand: data.brand,
                                    baseName: data.base_name,
                                    specs: data.specs,
                                    calories: data.calories,
                                    protein: data.protein,
                                    fat: data.fat,
                                    carbs: data.carbs,
                                });
                            }
                        });
                        console.log("Успешно сохранено в базу Realm!");
                    } catch (error) {
                        console.error("Ошибка при сохранении:", error);
                    }
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
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
    listContent: {
        paddingHorizontal: 16,
    },
    itemCard: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 24,
        padding: 12,
        marginBottom: 12,
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
        marginLeft: 8,
        justifyContent: "center",
    },
    editButtonFull: {
        width: 40,
        height: 48,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    fabStyle: { position: "absolute", right: 16, zIndex: 20 },
    emptyState: {
        alignItems: "center",
        marginTop: 40,
    },
});
