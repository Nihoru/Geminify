import React from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface UnifiedHeaderProps {
    leftNode?: React.ReactNode;
    rightNode?: React.ReactNode;
    bottomNode?: React.ReactNode;
    // Новый проп для передачи рассчитанной высоты
    onHeightChange?: (height: number) => void;
}

export const UnifiedHeader = ({
    leftNode,
    rightNode,
    bottomNode,
    onHeightChange, // Не забываем достать проп
}: UnifiedHeaderProps) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <View
            // Считываем реальные размеры при рендере
            onLayout={(event: LayoutChangeEvent) => {
                const { height } = event.nativeEvent.layout;
                onHeightChange?.(height);
            }}
            style={[
                styles.container,
                {
                    paddingTop: insets.top,
                    backgroundColor: theme.colors.elevation.level2,
                },
            ]}
        >
            <View style={styles.topRow}>
                <View style={styles.leftContent}>{leftNode}</View>
                <View style={styles.rightContent}>{rightNode}</View>
            </View>

            {bottomNode && <View style={styles.bottomRow}>{bottomNode}</View>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        // Оставляем базовый отступ снизу, чтобы скругления смотрелись гармонично
        paddingBottom: 16,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16, // Синхронизировано с bottomRow (было 20)
        //minHeight: 64,
        paddingTop: 8, // Добавлено для мягкости, если элементы внутри станут слишком большими
    },
    leftContent: {
        flex: 1,
        alignItems: "flex-start",
    },
    rightContent: {
        alignItems: "flex-end",
    },
    bottomRow: {
        paddingHorizontal: 16,
        marginTop: 8, // Увеличено с 4 до 8 для лучшего визуального разделения строк
    },
});
