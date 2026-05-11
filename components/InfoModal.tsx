import React from "react";
import { StyleSheet, View, Linking } from "react-native";
import { Modal, Portal, Surface, Text, Button, useTheme } from "react-native-paper";
import { MaterialSymbol } from "./MaterialSymbol";

interface InfoModalProps {
    visible: boolean;
    title: string;
    message: string;
    onDismiss: () => void;
    link?: {
        label: string;
        url: string;
    };
}

export const InfoModal = ({ visible, title, message, onDismiss, link }: InfoModalProps) => {
    const theme = useTheme();

    const handleOpenLink = () => {
        if (link?.url) {
            Linking.openURL(link.url);
        }
    };

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
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondaryContainer }]}>
                            <MaterialSymbol 
                                name="help" 
                                size={28} 
                                color={theme.colors.secondary} 
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
                        {link && (
                            <Button
                                mode="text"
                                onPress={handleOpenLink}
                                style={styles.linkButton}
                                labelStyle={{ fontWeight: "600" }}
                            >
                                {link.label}
                            </Button>
                        )}
                        <Button
                            mode="contained"
                            onPress={onDismiss}
                            style={styles.closeButton}
                            labelStyle={{ fontWeight: "700" }}
                        >
                            Понятно
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
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 8,
    },
    closeButton: {
        borderRadius: 16,
    },
    linkButton: {
        borderRadius: 16,
    },
});
