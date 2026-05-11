import React from "react";
import { StyleSheet, View } from "react-native";
import { Modal, Portal, Surface, Text, Button, useTheme } from "react-native-paper";
import { MaterialSymbol } from "./MaterialSymbol";

interface SuccessModalProps {
    visible: boolean;
    title?: string;
    message: string;
    onDismiss: () => void;
}

export const SuccessModal = ({ visible, title = "Успешно!", message, onDismiss }: SuccessModalProps) => {
    const theme = useTheme();

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={styles.modalContainer}
            >
                <Surface
                    style={[
                        styles.modalSurface,
                        { backgroundColor: theme.colors.elevation.level3 },
                    ]}
                >
                    <View style={styles.header}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                            <MaterialSymbol 
                                name="check_circle" 
                                size={28} 
                                color={theme.colors.primary} 
                            />
                        </View>
                        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
                            {title}
                        </Text>
                    </View>

                    <Text variant="bodyLarge" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
                        {message}
                    </Text>

                    <View style={styles.actions}>
                        <Button
                            mode="contained"
                            onPress={onDismiss}
                            style={styles.button}
                            buttonColor={theme.colors.primary}
                            textColor={theme.colors.onPrimary}
                            labelStyle={{ fontWeight: "700" }}
                        >
                            Отлично
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
    actions: {
        marginTop: 16,
    },
    button: {
        borderRadius: 16,
    },
});
