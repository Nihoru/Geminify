import React, { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Text, TouchableRipple, useTheme } from "react-native-paper";

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

interface DateSliderProps {
    dates: Date[];
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    scrollX: Animated.Value;
    pagingWidth: number;
}

export const DateSlider = ({
    dates,
    selectedDate,
    onDateChange,
    scrollX,
    pagingWidth,
}: DateSliderProps) => {
    const theme = useTheme();

    const translateX = scrollX.interpolate({
        inputRange: [0, pagingWidth],
        outputRange: [0, -DATE_ITEM_WIDTH],
    });

    const currentIndex = useMemo(() => {
        const idx = dates.findIndex(
            (d) => d.getTime() === selectedDate.getTime(),
        );
        return idx !== -1 ? idx : Math.floor(dates.length / 2);
    }, [dates, selectedDate]);

    const RENDER_WINDOW = 15;

    const windowData = useMemo(() => {
        const start = Math.max(0, currentIndex - RENDER_WINDOW);
        const end = Math.min(dates.length - 1, currentIndex + RENDER_WINDOW);
        return {
            paddingLeft: start * DATE_ITEM_WIDTH,
            slicedDates: dates.slice(start, end + 1),
            startIndex: start,
        };
    }, [dates, currentIndex]);

    return (
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
                        paddingLeft: windowData.paddingLeft,
                    },
                ]}
            >
                {windowData.slicedDates.map((date, idx) => (
                    <DateItem
                        key={(windowData.startIndex + idx).toString()}
                        date={date}
                        theme={theme}
                        isToday={
                            new Date().toDateString() === date.toDateString()
                        }
                        onPress={() => onDateChange(new Date())}
                    />
                ))}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
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
});
