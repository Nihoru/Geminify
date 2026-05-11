import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
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
import { IngredientListItem } from "@/components/IngredientListItem";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { SortChip } from "@/components/SortChip";
import { LAYOUT } from "@/src/constants/layout";
import { SortOption, sortItems } from "@/src/utils/searchHelpers";
import { UnifiedHeader } from "../../components/UnifiedHeader";
import { FoodProduct, MealRealmContext } from "../../src/shared/store/models";

// Утилита для заглавной буквы
const capitalize = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
};

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
    const [sortBy, setSortBy] = useState<SortOption>("relevance");
    const [isDescending, setIsDescending] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [displayData, setDisplayData] = useState<any[]>([]);

    const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
    const [isEditVisible, setEditVisible] = useState(false);

    const onScroll = ({ nativeEvent }: any) => {
        const y = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
        setIsExtended(y <= 20);
    };

    // ОБРАБОТКА ПОИСКА И СОРТИРОВКИ С ИНДИКАТОРОМ ЗАГРУЗКИ
    React.useEffect(() => {
        setIsLoading(true);

        const timer = setTimeout(() => {
            const query = searchQuery.trim().toLowerCase();
            let filtered = allProducts;

            if (query !== "" || sortBy !== "relevance") {
                if (query !== "") {
                    const words = query.split(/\s+/);
                    const queryConditions = words.map(
                        (_, index) =>
                            `(brand CONTAINS[c] $${index} OR baseName CONTAINS[c] $${index} OR specs CONTAINS[c] $${index})`,
                    );
                    const finalQueryString = queryConditions.join(" AND ");
                    filtered = allProducts.filtered(finalQueryString, ...words);
                }
                const sorted = sortItems(filtered, query, sortBy, isDescending);
                setDisplayData(sorted);
            } else {
                setDisplayData(Array.from(allProducts));
            }
            setIsLoading(false);
        }, 0);

        return () => clearTimeout(timer);
    }, [searchQuery, allProducts, sortBy, isDescending]);

    const renderItem = ({ item }: { item: any }) => {
        const fullName = [item.brand, item.baseName, item.specs]
            .filter(Boolean)
            .join(" ");

        return (
            <IngredientListItem
                title={capitalize(fullName)}
                calories={item.calories}
                protein={item.protein}
                fat={item.fat}
                carbs={item.carbs}
                showPer100g
                style={{ marginBottom: 12 }}
                trailing={
                    <TouchableRipple
                        onPress={() => {
                            setSelectedIngredient(item);
                            setEditVisible(true);
                        }}
                        style={[
                            styles.editButton,
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
                }
            />
        );
    };

    const [headerHeight, setHeaderHeight] = useState(insets.top + 80);
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
                        Кухня
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
                    keyExtractor={(item) =>
                        item._id ? item._id.toHexString() : Math.random().toString()
                    }
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
            )}

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
                                realm.create("FoodProduct", {
                                    _id: new Realm.BSON.ObjectId(),
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
    editButton: {
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
