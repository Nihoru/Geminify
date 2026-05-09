import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);

    const { inputRange, outputRange } = useMemo(() => {
        return {
            inputRange: dates.map((_, i) => i * pagingWidth),
            outputRange: dates.map((_, i) => -i * DATE_ITEM_WIDTH),
        };
    }, [dates, pagingWidth]);

    const translateX = scrollX.interpolate({
        inputRange,
        outputRange,
        extrapolate: "clamp",
    });

    const onConfirmDate = (params: any) => {
        setDatePickerVisible(false);
        if (params.date) {
            onDateChange(params.date);
        }
    };

    // Возврат на сегодняшний день при клике на окошко
    const handleGoToToday = () => {
        onDateChange(new Date());
    };

    return (
        <View
            style={[
                styles.unifiedHeader,
                {
                    paddingTop: insets.top,
                    // Хедер выступает как "верхний" слой
                    backgroundColor: theme.colors.elevation.level2,
                    paddingBottom: 16,
                },
            ]}
        >
            <View style={[styles.headerTopRow, { height: TOP_ROW_HEIGHT }]}>
                {/* МАСКА (ОКНО) */}
                <View
                    style={[
                        styles.dateWindow,
                        {
                            // Для создания эффекта "выреза" (дыры) используем более глубокий/тёмный цвет
                            // Если surfaceVariant кажется недостаточно глубоким, можно попробовать theme.colors.background
                            backgroundColor: theme.colors.surfaceVariant,
                        },
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.dateTape,
                            { transform: [{ translateX }] },
                        ]}
                    >
                        {dates.map((date, index) => {
                            const isToday =
                                new Date().toDateString() ===
                                date.toDateString();

                            const dayNum = date
                                .getDate()
                                .toString()
                                .padStart(2, "0");
                            const monthName = date
                                .toLocaleDateString("ru-RU", { month: "short" })
                                .replace(".", "");
                            const weekdayName = date.toLocaleDateString(
                                "ru-RU",
                                {
                                    weekday: "short",
                                },
                            );

                            return (
                                <View
                                    key={index}
                                    style={styles.dateItemContainer}
                                >
                                    <TouchableRipple
                                        // Теперь при клике перебрасывает на "Сегодня"
                                        onPress={handleGoToToday}
                                        style={styles.titleTouchable}
                                    >
                                        <View style={styles.dateContentRow}>
                                            <Text
                                                style={[
                                                    styles.tapeDayNum,
                                                    {
                                                        color: isToday
                                                            ? theme.colors
                                                                  .primary
                                                            : theme.colors
                                                                  .onSurfaceVariant,
                                                    },
                                                ]}
                                            >
                                                {dayNum}
                                            </Text>
                                            <View
                                                style={
                                                    styles.tapeMonthWeekColumn
                                                }
                                            >
                                                <Text
                                                    style={[
                                                        styles.tapeMonth,
                                                        {
                                                            color: isToday
                                                                ? theme.colors
                                                                      .primary
                                                                : theme.colors
                                                                      .onSurfaceVariant,
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
                                                                ? theme.colors
                                                                      .primary
                                                                : theme.colors
                                                                      .outline,
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
                        })}
                    </Animated.View>
                </View>

                {/* БЛОК КНОПОК */}
                <View style={styles.actionButtonsGroup}>
                    <IconButton
                        icon={(props: any) => (
                            <MaterialSymbol name="calendar_month" {...props} />
                        )}
                        iconColor={theme.colors.onSurfaceVariant}
                        containerColor={theme.colors.surfaceVariant}
                        size={24} // Немного уменьшили иконки для аккуратности
                        onPress={() => setDatePickerVisible(true)}
                    />
                    <IconButton
                        icon={(props: any) => (
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
                onConfirm={onConfirmDate}
                validRange={{ endDate: new Date() }} // Запрет выбора дат из будущего, если требуется
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
        justifyContent: "center",
    },
    dateTape: {
        flexDirection: "row",
        alignItems: "center",
        height: "100%",
    },
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
    dateContentRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    tapeDayNum: {
        fontSize: 28,
        fontWeight: "900",
        marginRight: 6,
        lineHeight: 28,
    },
    tapeMonthWeekColumn: {
        justifyContent: "center",
    },
    tapeMonth: {
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
        marginBottom: -2,
    },
    tapeWeekday: {
        fontSize: 10,
        fontWeight: "500",
    },
    // Новый класс для группировки кнопок
    actionButtonsGroup: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4, // Отступ между кнопками
    },
});
