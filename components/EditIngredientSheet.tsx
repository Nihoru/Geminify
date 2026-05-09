import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface EditIngredientSheetProps {
    visible: boolean;
    onDismiss: () => void;
    ingredient: any | null;
    onSave: (updatedIngredient: any) => void;
}

export const EditIngredientSheet = ({
    visible,
    onDismiss,
    ingredient,
    onSave,
}: EditIngredientSheetProps) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    // Локальный стейт для формы
    const [brand, setBrand] = useState("");
    const [baseName, setBaseName] = useState("");
    const [specs, setSpecs] = useState("");
    const [calories, setCalories] = useState("");
    const [protein, setProtein] = useState("");
    const [fat, setFat] = useState("");
    const [carbs, setCarbs] = useState("");

    const snapPoints = useMemo(() => ["85%"], []);

    // 1. Управление видимостью шторки
    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [visible]);

    // 2. Загрузка данных при открытии
    useEffect(() => {
        if (visible && ingredient) {
            setBrand(ingredient.brand || "");
            setBaseName(ingredient.baseName || "");
            setSpecs(ingredient.specs || "");
            setCalories(String(ingredient.calories || "0"));
            setProtein(String(ingredient.protein || "0"));
            setFat(String(ingredient.fat || "0"));
            setCarbs(String(ingredient.carbs || "0"));
        }
    }, [visible, ingredient]);

    // 3. Сохранение данных
    const handleSave = () => {
        onSave({
            ...ingredient,
            brand,
            base_name: baseName,
            specs,
            // Переводим строки обратно в числа
            calories: Number(calories.replace(",", ".")),
            protein: Number(protein.replace(",", ".")),
            fat: Number(fat.replace(",", ".")),
            carbs: Number(carbs.replace(",", ".")),
        });
        onDismiss();
    };

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.4}
                pressBehavior="close"
            />
        ),
        [],
    );

    const inputTheme = {
        roundness: 16,
        colors: {
            background: theme.colors.elevation.level2,
        },
    };

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            onDismiss={onDismiss}
            enablePanDownToClose
            backgroundStyle={{
                backgroundColor: theme.colors.surface,
                borderRadius: 36,
            }}
            handleIndicatorStyle={{
                backgroundColor: theme.colors.onSurfaceVariant,
                width: 32,
            }}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
        >
            <BottomSheetScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: insets.bottom + 20 },
                ]}
            >
                <View style={styles.header}>
                    <Text variant="headlineSmall" style={styles.boldText}>
                        Изменить продукт
                    </Text>
                    <Text
                        variant="bodyMedium"
                        style={{ color: theme.colors.onSurfaceVariant }}
                    >
                        Данные указаны на 100 г продукта
                    </Text>
                </View>

                <View style={styles.form}>
                    {/* РАЗДЕЛИЛИ ОДИН ИНПУТ НА ТРИ */}
                    <TextInput
                        label="Бренд (опционально)"
                        value={brand}
                        onChangeText={setBrand}
                        mode="flat"
                        underlineColor="transparent"
                        activeUnderlineColor={theme.colors.primary}
                        style={styles.input}
                        theme={inputTheme}
                    />

                    <TextInput
                        label="Базовое название (яблоко, йогурт)"
                        value={baseName}
                        onChangeText={setBaseName}
                        mode="flat"
                        underlineColor="transparent"
                        activeUnderlineColor={theme.colors.primary}
                        style={styles.input}
                        theme={inputTheme}
                    />

                    <TextInput
                        label="Спецификация (зеленое, 5%)"
                        value={specs}
                        onChangeText={setSpecs}
                        mode="flat"
                        underlineColor="transparent"
                        activeUnderlineColor={theme.colors.primary}
                        style={styles.input}
                        theme={inputTheme}
                    />

                    <View style={styles.grid}>
                        <View style={styles.gridItem}>
                            <TextInput
                                label="Ккал"
                                value={calories}
                                onChangeText={setCalories}
                                keyboardType="numeric"
                                mode="flat"
                                underlineColor="transparent"
                                style={styles.input}
                                theme={inputTheme}
                            />
                        </View>
                        <View style={styles.gridItem}>
                            <TextInput
                                label="Белки (г)"
                                value={protein}
                                onChangeText={setProtein}
                                keyboardType="numeric"
                                mode="flat"
                                underlineColor="transparent"
                                style={styles.input}
                                theme={inputTheme}
                            />
                        </View>
                        <View style={styles.gridItem}>
                            <TextInput
                                label="Жиры (г)"
                                value={fat}
                                onChangeText={setFat}
                                keyboardType="numeric"
                                mode="flat"
                                underlineColor="transparent"
                                style={styles.input}
                                theme={inputTheme}
                            />
                        </View>
                        <View style={styles.gridItem}>
                            <TextInput
                                label="Углеводы (г)"
                                value={carbs}
                                onChangeText={setCarbs}
                                keyboardType="numeric"
                                mode="flat"
                                underlineColor="transparent"
                                style={styles.input}
                                theme={inputTheme}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.actions}>
                    <Button
                        mode="contained"
                        onPress={handleSave}
                        contentStyle={styles.mainButtonContent}
                        style={styles.mainButton}
                    >
                        Сохранить изменения
                    </Button>
                    <Button
                        mode="text"
                        onPress={onDismiss}
                        textColor={theme.colors.error}
                        style={styles.secondaryButton}
                    >
                        Отмена
                    </Button>
                </View>
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 24,
        paddingTop: 12,
    },
    header: {
        marginBottom: 24,
    },
    boldText: {
        fontWeight: "700",
        marginBottom: 4,
    },
    form: {
        gap: 16,
    },
    input: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderRadius: 16,
        height: 60,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    gridItem: {
        width: "48%",
    },
    actions: {
        marginTop: 32,
        gap: 8,
    },
    mainButton: {
        borderRadius: 16,
    },
    mainButtonContent: {
        height: 56,
    },
    secondaryButton: {
        borderRadius: 16,
    },
});
