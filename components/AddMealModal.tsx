import React, { useEffect, useState } from "react";
import { TextInput as RNTextInput, StyleSheet, View } from "react-native";
import { Button, Modal, Portal, Surface, useTheme } from "react-native-paper";

interface AddMealModalProps {
    visible: boolean;
    onDismiss: () => void;
    onSave: (text: string) => void;
    isAnalyzing: boolean;
}

export const AddMealModal = ({
    visible,
    onDismiss,
    onSave,
    isAnalyzing,
}: AddMealModalProps) => {
    const [foodText, setFoodText] = useState("");
    const theme = useTheme();

    useEffect(() => {
        if (visible) {
            setFoodText("");
        }
    }, [visible]);

    const handleSave = () => {
        if (foodText.trim()) {
            onSave(foodText);
        }
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={() => {
                    if (!isAnalyzing) onDismiss();
                }}
                contentContainerStyle={styles.modalContainer}
            >
                <Surface
                    style={[
                        styles.modalSurface,
                        { backgroundColor: theme.colors.elevation.level3 },
                    ]}
                >
                    <View
                        style={[
                            styles.inputWrapper,
                            { backgroundColor: theme.colors.elevation.level1 },
                        ]}
                    >
                        <RNTextInput
                            style={[
                                styles.nativeInput,
                                {
                                    ...theme.fonts.bodyLarge,
                                    color: theme.colors.onSurface,
                                    fontSize: 16,
                                },
                            ]}
                            placeholder="Просто опишите блюдо, а ИИ рассчитает КБЖУ. Например: порция роллов Калифорния и шоколадный милкшейк"
                            placeholderTextColor={
                                theme.colors.onSurfaceVariant + "99"
                            }
                            value={foodText}
                            onChangeText={setFoodText}
                            multiline
                            textAlignVertical="top"
                            autoFocus
                            editable={!isAnalyzing}
                            cursorColor={theme.colors.primary}
                        />
                    </View>

                    <View style={styles.modalActions}>
                        <Button
                            mode="text"
                            onPress={onDismiss}
                            disabled={isAnalyzing}
                            textColor={theme.colors.primary}
                        >
                            Отмена
                        </Button>
                        <Button
                            mode="contained-tonal"
                            onPress={handleSave}
                            disabled={!foodText.trim() || isAnalyzing}
                            loading={isAnalyzing}
                            labelStyle={{ fontWeight: "700" }}
                        >
                            Готово
                        </Button>
                    </View>
                </Surface>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        paddingHorizontal: 24,
    },
    modalSurface: {
        padding: 16,
        borderRadius: 32,
    },
    inputWrapper: {
        borderRadius: 24,
        padding: 16,
        minHeight: 140, // Стартовая высота (когда текста нет или его мало)
        maxHeight: 260, // Максимальная высота, до которой окно будет растягиваться
    },
    nativeInput: {
        // Убрали flex: 1, чтобы инпут "обтягивал" текст и заставлял родителя расти
        padding: 0,
        lineHeight: 24,
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 16,
        gap: 8,
    },
});
