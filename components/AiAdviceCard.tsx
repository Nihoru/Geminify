import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialSymbol } from "./MaterialSymbol";

interface AiAdviceCardProps {
    adviceText: string;
}

export const AiAdviceCard = ({ adviceText }: AiAdviceCardProps) => {
    const theme = useTheme();

    return (
        <View
            style={[
                styles.aiCard,
                { backgroundColor: theme.colors.tertiaryContainer },
            ]}
        >
            <View style={styles.aiHeader}>
                <MaterialSymbol
                    name="auto_awesome"
                    size={20}
                    color={theme.colors.onTertiaryContainer}
                />
                <Text
                    variant="titleSmall"
                    style={{
                        color: theme.colors.onTertiaryContainer,
                        marginLeft: 8,
                        fontWeight: "600",
                    }}
                >
                    Geminify
                </Text>
            </View>
            <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onTertiaryContainer }}
            >
                {adviceText}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    aiCard: {
        marginHorizontal: 16,
        marginBottom: 24,
        padding: 16,
        borderRadius: 24,
    },
    aiHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
});
