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
    const [name, setName] = useState("");
    const [calories, setCalories] = useState("");
    const [protein, setProtein] = useState("");
    const [fat, setFat] = useState("");
    const [carbs, setCarbs] = useState("");

    const snapPoints = useMemo(() => ["85%"], []);

    useEffect(() => {
        if (visible && ingredient) {
            setName(ingredient.name || "");
            setCalories(String(ingredient.calories || ""));
            setProtein(String(ingredient.protein || ""));
            setFat(String(ingredient.fat || ""));
            setCarbs(String(ingredient.carbs || ""));
            bottomSheetRef.current?.present();
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [visible, ingredient]);

    const handleSave = () => {
        onSave({
            ...ingredient,
            name,
            calories: Number(calories),
            protein: Number(protein),
            fat: Number(fat),
            carbs: Number(carbs),
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
            // Важно для работы клавиатуры
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
                    <TextInput
                        label="Название"
                        value={name}
                        onChangeText={setName}
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
                        Удалить из базы
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
        width: "48%", // Почти половина с учетом gap
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
