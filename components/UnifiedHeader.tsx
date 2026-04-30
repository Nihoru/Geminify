import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Text, useTheme } from "react-native-paper";
import { EdgeInsets } from "react-native-safe-area-context";
import { CustomSegmentedControl } from "./CustomSegmentedControl";
import { MaterialSymbol } from "./MaterialSymbol";

interface UnifiedHeaderProps {
    period: string;
    onPeriodChange: (period: string) => void;
    insets: EdgeInsets;
}

const TOP_ROW_HEIGHT = 64;
const HEADER_PADDING_BOTTOM = 20;

export const UnifiedHeader = ({
    period,
    onPeriodChange,
    insets,
}: UnifiedHeaderProps) => {
    const theme = useTheme();
    const router = useRouter();

    return (
        <View
            style={[
                styles.unifiedHeader,
                {
                    paddingTop: insets.top,
                    backgroundColor: theme.colors.elevation.level2,
                },
            ]}
        >
            <View style={[styles.headerTopRow, { height: TOP_ROW_HEIGHT }]}>
                <Text
                    variant="headlineMedium"
                    style={{
                        color: theme.colors.onSurface,
                        fontWeight: "700",
                    }}
                >
                    Сегодня, 26 апр.
                </Text>
                <IconButton
                    icon={(props: any) => (
                        <MaterialSymbol name="settings" {...props} />
                    )}
                    iconColor={theme.colors.onSurface}
                    onPress={() => router.push({ pathname: "/settings" })}
                />
            </View>

            <View
                style={[
                    styles.headerBottomRow,
                    { paddingBottom: HEADER_PADDING_BOTTOM },
                ]}
            >
                <CustomSegmentedControl
                    period={period}
                    onPeriodChange={onPeriodChange}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
    },
    headerBottomRow: {
        paddingHorizontal: 16,
    },
});
