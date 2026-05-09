import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";
import {
    IconButton,
    Text,
    TouchableRipple,
    useTheme,
} from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";
import { EdgeInsets } from "react-native-safe-area-context";
import { MaterialSymbol } from "./MaterialSymbol";

interface UnifiedHeaderProps {
    insets: EdgeInsets;
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    dates: Date[];
    scrollX: Animated.Value;
    pagingWidth: number;
}

const TOP_ROW_HEIGHT = 64;
const DATE_ITEM_WIDTH = 100;

const DateItem = React.memo(({ date, isToday, theme, onPress }: any) => {
    const dayNum = date.getDate().toString().padStart(2, "0");
    const monthName = date
        .toLocaleDateString("ru-RU", { month: "short" })
        .replace(".", "");
    const weekdayName = date.toLocaleDateString("ru-RU", { weekday: "short" });

    return (
        <View
            style={[
                styles.dateItemContainer,
                // Добавляем заливку контейнера для сегодняшнего дня
                isToday && {
                    backgroundColor: theme.colors.primaryContainer,
                    borderRadius: 26,
                },
            ]}
        >
            <TouchableRipple onPress={onPress} style={styles.titleTouchable}>
                <View style={styles.dateContentRow}>
                    <Text
                        style={[
                            styles.tapeDayNum,
                            {
                                // Используем onPrimaryContainer для идеального контраста M3
                                color: isToday
                                    ? theme.colors.onPrimaryContainer
                                    : theme.colors.onSurfaceVariant,
                            },
                        ]}
                    >
                        {dayNum}
                    </Text>
                    <View style={styles.tapeMonthWeekColumn}>
                        <Text
                            style={[
                                styles.tapeMonth,
                                {
                                    color: isToday
                                        ? theme.colors.onPrimaryContainer
                                        : theme.colors.onSurfaceVariant,
                                },
                            ]}
                        >
                            {monthName}
                        </Text>
                        <Text
                            style={[
                                styles.tapeWeekday,
                                {
                                    color: isToday
                                        ? theme.colors.onPrimaryContainer
                                        : theme.colors.outline,
                                },
                            ]}
                        >
                            {weekdayName}
                        </Text>
                    </View>
                </View>
            </TouchableRipple>
        </View>
    );
});

export const UnifiedHeader = ({
    insets,
    selectedDate,
    onDateChange,
    dates,
    scrollX,
    pagingWidth,
}: UnifiedHeaderProps) => {
    const theme = useTheme();
    const router = useRouter();
    const [isDatePickerVisible, setDatePickerVisible] = React.useState(false);

    const translateX = scrollX.interpolate({
        inputRange: [0, pagingWidth],
        outputRange: [0, -DATE_ITEM_WIDTH],
    });

    // --- МАГИЯ СКОЛЬЗЯЩЕГО ОКНА ---
    // 1. Находим, где мы сейчас находимся в большом массиве
    const currentIndex = useMemo(() => {
        const idx = dates.findIndex(
            (d) => d.getTime() === selectedDate.getTime(),
        );
        return idx !== -1 ? idx : Math.floor(dates.length / 2);
    }, [dates, selectedDate]);

    // 2. Вырезаем только 30 дат (15 до и 15 после текущей)
    const RENDER_WINDOW = 15;

    const windowData = useMemo(() => {
        const start = Math.max(0, currentIndex - RENDER_WINDOW);
        const end = Math.min(dates.length - 1, currentIndex + RENDER_WINDOW);
        return {
            // Чтобы вырезанный кусок встал на свое законное место в ленте,
            // добавляем ему отступ слева, равный количеству "невидимых" дат
            paddingLeft: start * DATE_ITEM_WIDTH,
            slicedDates: dates.slice(start, end + 1),
            startIndex: start,
        };
    }, [dates, currentIndex]);

    return (
        <View
            style={[
                styles.unifiedHeader,
                {
                    paddingTop: insets.top,
                    backgroundColor: theme.colors.elevation.level2,
                    paddingBottom: 16,
                },
            ]}
        >
            <View style={[styles.headerTopRow, { height: TOP_ROW_HEIGHT }]}>
                <View
                    style={[
                        styles.dateWindow,
                        { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.dateTape,
                            {
                                transform: [{ translateX }],
                                paddingLeft: windowData.paddingLeft, // Сдвигаем рендер-окно
                            },
                        ]}
                    >
                        {/* Рендерим всего 31 элемент вместо 730! */}
                        {windowData.slicedDates.map((date, idx) => (
                            <DateItem
                                key={(windowData.startIndex + idx).toString()}
                                date={date}
                                theme={theme}
                                isToday={
                                    new Date().toDateString() ===
                                    date.toDateString()
                                }
                                onPress={() => onDateChange(new Date())}
                            />
                        ))}
                    </Animated.View>
                </View>

                <View style={styles.actionButtonsGroup}>
                    <IconButton
                        icon={(props) => (
                            <MaterialSymbol name="calendar_month" {...props} />
                        )}
                        iconColor={theme.colors.onSurfaceVariant}
                        containerColor={theme.colors.surfaceVariant}
                        size={24}
                        onPress={() => setDatePickerVisible(true)}
                    />
                    <IconButton
                        icon={(props) => (
                            <MaterialSymbol name="settings" {...props} />
                        )}
                        iconColor={theme.colors.onSurfaceVariant}
                        containerColor={theme.colors.surfaceVariant}
                        size={24}
                        onPress={() => router.push({ pathname: "/settings" })}
                    />
                </View>
            </View>

            <DatePickerModal
                locale="ru"
                mode="single"
                visible={isDatePickerVisible}
                onDismiss={() => setDatePickerVisible(false)}
                date={selectedDate}
                onConfirm={(params) => {
                    setDatePickerVisible(false);
                    if (params.date) onDateChange(params.date);
                }}
                validRange={{ endDate: new Date() }}
            />
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
        paddingHorizontal: 20,
    },
    dateWindow: {
        width: DATE_ITEM_WIDTH,
        height: 52,
        borderRadius: 26,
        overflow: "hidden",
    },
    dateTape: { flexDirection: "row", alignItems: "center", height: "100%" },
    dateItemContainer: {
        width: DATE_ITEM_WIDTH,
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    titleTouchable: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    dateContentRow: { flexDirection: "row", alignItems: "center" },
    tapeDayNum: {
        fontSize: 28,
        fontWeight: "900",
        marginRight: 6,
        lineHeight: 28,
    },
    tapeMonthWeekColumn: { justifyContent: "center" },
    tapeMonth: {
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
        marginBottom: -2,
    },
    tapeWeekday: { fontSize: 10, fontWeight: "500" },
    actionButtonsGroup: { flexDirection: "row", alignItems: "center", gap: 4 },
});
