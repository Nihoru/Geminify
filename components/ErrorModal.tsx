import React, { useState, useMemo } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { Modal, Portal, Surface, Text, Button, useTheme } from "react-native-paper";
import { MaterialSymbol } from "./MaterialSymbol";

interface ErrorModalProps {
    visible: boolean;
    error: Error | string | null;
    onDismiss: () => void;
}

const ERROR_MAPPING: Record<string, string> = {
    "API ключ не найден. Перейдите в настройки.": 
        "Упс! Кажется, вы забыли указать API ключ. Пожалуйста, зайдите в настройки и добавьте его, чтобы ИИ мог работать.",
    "Network request failed": 
        "Ой! Похоже, возникли проблемы с интернет-соединением. Проверьте подключение и попробуйте снова.",
    "model not found": 
        "Выбранная модель ИИ недоступна. Попробуйте выбрать другую модель в настройках.",
    "quota exceeded": 
        "Похоже, лимит запросов к ИИ исчерпан. Попробуйте позже или проверьте настройки ключа.",
};

const getFriendlyMessage = (error: Error | string | null): string => {
    if (!error) return "Произошла неизвестная ошибка.";
    
    const message = typeof error === "string" ? error : error.message;
    
    // Прямой поиск по маппингу
    if (ERROR_MAPPING[message]) return ERROR_MAPPING[message];
    
    // Поиск по вхождению подстроки
    for (const [key, value] of Object.entries(ERROR_MAPPING)) {
        if (message.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }
    
    // Если это строка, которую мы пробросили вручную, выводим её как есть
    if (typeof error === "string") return error;
    
    return "Произошла непредвиденная ошибка при работе с ИИ. Попробуйте еще раз или проверьте настройки.";
};

export const ErrorModal = ({ visible, error, onDismiss }: ErrorModalProps) => {
    const theme = useTheme();
    const [showLog, setShowLog] = useState(false);

    const friendlyMessage = useMemo(() => getFriendlyMessage(error), [error]);
    const rawLog = useMemo(() => {
        if (!error) return "";
        if (typeof error === "string") return error;
        return `${error.name}: ${error.message}\n${error.stack || ""}`;
    }, [error]);

    const handleDismiss = () => {
        setShowLog(false);
        onDismiss();
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={handleDismiss}
                contentContainerStyle={styles.modalContainer}
            >
                <Surface
                    style={[
                        styles.modalSurface,
                        { backgroundColor: theme.colors.elevation.level3 },
                    ]}
                >
                    <View style={styles.header}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.errorContainer }]}>
                            <MaterialSymbol 
                                name="warning" 
                                size={28} 
                                color={theme.colors.error} 
                            />
                        </View>
                        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
                            Что-то пошло не так
                        </Text>
                    </View>

                    <Text variant="bodyLarge" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
                        {friendlyMessage}
                    </Text>

                    <TouchableOpacity 
                        style={styles.detailsToggle} 
                        onPress={() => setShowLog(!showLog)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.detailsLabel, { color: theme.colors.primary }]}>
                            Подробнее
                        </Text>
                        <MaterialSymbol 
                            name={showLog ? "expand_less" : "expand_more"} 
                            size={20} 
                            color={theme.colors.primary} 
                        />
                    </TouchableOpacity>

                    {showLog && (
                        <View style={[styles.logWrapper, { backgroundColor: theme.colors.surfaceVariant }]}>
                            <ScrollView style={styles.logScroll} nestedScrollEnabled>
                                <Text style={[styles.logText, { color: theme.colors.onSurfaceVariant }]}>
                                    {rawLog}
                                </Text>
                            </ScrollView>
                        </View>
                    )}

                    <View style={styles.actions}>
                        <Button
                            mode="contained"
                            onPress={handleDismiss}
                            style={styles.closeButton}
                            buttonColor={theme.colors.error}
                            textColor={theme.colors.onError}
                            labelStyle={{ fontWeight: "700" }}
                        >
                            Хорошо
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
        padding: 24,
        borderRadius: 32,
        overflow: "hidden",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontWeight: "700",
        flex: 1,
    },
    message: {
        lineHeight: 24,
        marginBottom: 8,
    },
    detailsToggle: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        gap: 4,
    },
    detailsLabel: {
        fontSize: 14,
        fontWeight: "600",
    },
    logWrapper: {
        borderRadius: 16,
        marginVertical: 8,
        maxHeight: 200,
    },
    logScroll: {
        padding: 12,
    },
    logText: {
        fontFamily: "monospace",
        fontSize: 12,
    },
    actions: {
        marginTop: 16,
    },
    closeButton: {
        borderRadius: 16,
    },
});
