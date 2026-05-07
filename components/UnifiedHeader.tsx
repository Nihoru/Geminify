import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
    IconButton,
    Text,
    TouchableRipple,
    useTheme,
} from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates"; // <-- Новый импорт календаря M3
import { EdgeInsets } from "react-native-safe-area-context";
import { CustomSegmentedControl } from "./CustomSegmentedControl";
import { MaterialSymbol } from "./MaterialSymbol";

interface UnifiedHeaderProps {
    period: string;
    onPeriodChange: (period: string) => void;
    insets: EdgeInsets;
    selectedDate: Date; // <-- Получаем выбранную дату
    onDateChange: (date: Date) => void; // <-- Функция для изменения даты
}

const TOP_ROW_HEIGHT = 64;
const HEADER_PADDING_BOTTOM = 20;

export const UnifiedHeader = ({
    period,
    onPeriodChange,
    insets,
    selectedDate,
    onDateChange,
}: UnifiedHeaderProps) => {
    const theme = useTheme();
    const router = useRouter();
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);

    // Форматируем дату в стиле "Сегодня, 26 апр." или просто "25 апр."
    const isToday = new Date().toDateString() === selectedDate.toDateString();
    const dateStr = selectedDate.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
    });
    const titleText = isToday ? `Сегодня, ${dateStr}` : dateStr;

    const onConfirmDate = (params: any) => {
        setDatePickerVisible(false);
        if (params.date) {
            onDateChange(params.date);
        }
    };

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
                {/* Оборачиваем заголовок в TouchableRipple для эффекта нажатия */}
                <TouchableRipple
                    onPress={() => setDatePickerVisible(true)}
                    borderless
                    style={styles.titleTouchable}
                >
                    <Text
                        variant="headlineMedium"
                        style={{
                            color: theme.colors.onSurface,
                            fontWeight: "700",
                            textTransform: "capitalize",
                        }}
                    >
                        {titleText}
                    </Text>
                </TouchableRipple>

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

            {/* Сам M3 Календарь */}
            <DatePickerModal
                locale="ru"
                mode="single"
                visible={isDatePickerVisible}
                onDismiss={() => setDatePickerVisible(false)}
                date={selectedDate}
                onConfirm={onConfirmDate}
                validRange={{ endDate: new Date() }} // Опционально: запрещаем выбирать дни в будущем
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
        paddingHorizontal: 24,
    },
    titleTouchable: {
        borderRadius: 8,
        paddingHorizontal: 4,
        paddingVertical: 2,
        marginLeft: -4, // Компенсация паддинга для ровного выравнивания
    },
    headerBottomRow: {
        paddingHorizontal: 16,
    },
});
