import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

interface InfoChipProps {
    bg: string;
    fg: string;
    label: string;
    value: string | number;
    /** Если true - используется компактный горизонтальный стиль (как в БЖУ на Кухне) */
    isMini?: boolean;
}

export const InfoChip = ({
    bg,
    fg,
    label,
    value,
    isMini = false,
}: InfoChipProps) => {
    if (isMini) {
        return (
            <View style={[styles.miniChip, { backgroundColor: bg }]}>
                <Text variant="labelSmall" style={{ color: fg, opacity: 0.9 }}>
                    {label} <Text style={{ fontWeight: "700" }}>{value}</Text>
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.normalChip, { backgroundColor: bg }]}>
            <Text variant="labelSmall" style={{ color: fg, opacity: 0.7 }}>
                {label}
            </Text>
            <Text
                variant="titleMedium"
                style={{ color: fg, fontWeight: "700" }}
            >
                {value}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    normalChip: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    miniChip: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
});
