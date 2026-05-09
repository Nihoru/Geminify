import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, Platform, StyleSheet, TextInput, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import {
    Button,
    Menu,
    Text,
    TouchableRipple,
    useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MaterialSymbol } from "@/components/MaterialSymbol";
import { CustomSegmentedControl } from "../../components/CustomSegmentedControl";

const GOAL_OPTIONS = [
    {
        id: "lose",
        label: "Сброс",
        fullLabel: "Сброс веса",
        icon: "trending_down",
    },
    { id: "maintain", label: "Баланс", fullLabel: "Поддержание", icon: "sync" },
    {
        id: "gain",
        label: "Набор",
        fullLabel: "Набор массы",
        icon: "trending_up",
    },
] as const;

type GoalId = (typeof GOAL_OPTIONS)[number]["id"];

const getAgeSuffix = (ageString: string): string => {
    const age = parseInt(ageString, 10);
    if (isNaN(age)) return "лет";

    const lastTwoDigits = Math.abs(age) % 100;
    const lastDigit = Math.abs(age) % 10;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return "лет";
    }
    if (lastDigit === 1) {
        return "год";
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
        return "года";
    }
    return "лет";
};

export default function GoalScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const [statPeriod, setStatPeriod] = useState("day");
    const [goalMenuVisible, setGoalMenuVisible] = useState(false);

    // Стейт для ручного отслеживания высоты клавиатуры
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const [userData, setUserData] = useState({
        weight: "62",
        height: "172",
        age: "20",
        gender: "male",
        goal: "lose" as GoalId,
    });

    const [editData, setEditData] = useState(userData);

    const bottomSheetRef = useRef<BottomSheetModal>(null);

    // Слушатель событий клавиатуры
    useEffect(() => {
        // Для Android иногда лучше работает keyboardDidShow, для iOS - keyboardWillShow
        const showEvent =
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent =
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const openSheet = useCallback(() => {
        setEditData(userData);
        bottomSheetRef.current?.present();
    }, [userData]);

    const closeSheet = useCallback(() => {
        Keyboard.dismiss();
        bottomSheetRef.current?.dismiss();
    }, []);

    const handleSaveParams = () => {
        setUserData({ ...userData, ...editData });
        closeSheet();
    };

    const handleGoalChange = (newGoal: GoalId) => {
        setUserData({ ...userData, goal: newGoal });
        setGoalMenuVisible(false); // Закрываем меню после выбора
    };

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.4}
                pressBehavior="close"
            />
        ),
        [],
    );

    const currentGoalInfo = GOAL_OPTIONS.find((g) => g.id === userData.goal)!;
    const headerHeight = insets.top + 72;

    const renderParamSquare = (
        label: string,
        value: string,
        onChange: (t: string) => void,
        suffix: string,
    ) => (
        <View
            style={[
                styles.paramSquare,
                { backgroundColor: theme.colors.elevation.level1 },
            ]}
        >
            <Text
                variant="labelMedium"
                style={{
                    color: theme.colors.onSurfaceVariant,
                    marginBottom: 8,
                }}
            >
                {label}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                <TextInput
                    style={[
                        styles.nativeInput,
                        {
                            color: theme.colors.onSurface,
                            ...theme.fonts.headlineMedium,
                            fontWeight: "800",
                        },
                    ]}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    cursorColor={theme.colors.primary}
                    maxLength={3}
                />
                <Text
                    variant="titleMedium"
                    style={{
                        color: theme.colors.onSurfaceVariant,
                        marginLeft: 4,
                        fontWeight: "600",
                    }}
                >
                    {suffix}
                </Text>
            </View>
        </View>
    );

    const renderSegmentedControl = (
        options: { id: string; label: string }[],
        currentValue: string,
        onChange: (val: any) => void,
    ) => (
        <View
            style={[
                styles.segContainer,
                { backgroundColor: theme.colors.secondaryContainer },
            ]}
        >
            {options.map((opt) => {
                const isActive = currentValue === opt.id;
                return (
                    <TouchableRipple
                        key={opt.id}
                        onPress={() => onChange(opt.id)}
                        style={[
                            styles.segButton,
                            {
                                backgroundColor: isActive
                                    ? theme.colors.primary
                                    : "transparent",
                            },
                        ]}
                        borderless
                    >
                        <Text
                            style={[
                                styles.segText,
                                {
                                    color: isActive
                                        ? theme.colors.onPrimary
                                        : theme.colors.onSecondaryContainer,
                                },
                            ]}
                        >
                            {opt.label}
                        </Text>
                    </TouchableRipple>
                );
            })}
        </View>
    );

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.colors.surface },
            ]}
        >
            <View
                style={[
                    styles.unifiedHeader,
                    {
                        paddingTop: insets.top,
                        backgroundColor: theme.colors.elevation.level2,
                    },
                ]}
            >
                <View style={styles.headerTopRow}>
                    <Text variant="headlineMedium" style={styles.boldText}>
                        Моя цель
                    </Text>

                    <Menu
                        visible={goalMenuVisible}
                        onDismiss={() => setGoalMenuVisible(false)}
                        anchorPosition="bottom"
                        contentStyle={{
                            backgroundColor: theme.colors.elevation.level3,
                            borderRadius: 20,
                        }}
                        anchor={
                            <TouchableRipple
                                onPress={() => setGoalMenuVisible(true)}
                                style={[
                                    styles.headerGoalChip,
                                    {
                                        backgroundColor:
                                            theme.colors.secondaryContainer,
                                    },
                                ]}
                                borderless
                            >
                                <View style={styles.goalChipContent}>
                                    <MaterialSymbol
                                        name={currentGoalInfo.icon}
                                        size={18}
                                        color={
                                            theme.colors.onSecondaryContainer
                                        }
                                    />
                                    <Text
                                        variant="labelLarge"
                                        style={{
                                            color: theme.colors
                                                .onSecondaryContainer,
                                            marginLeft: 8,
                                            marginRight: 4,
                                            fontWeight: "700",
                                        }}
                                    >
                                        {currentGoalInfo.label}
                                    </Text>
                                    <MaterialSymbol
                                        name="arrow_drop_down"
                                        size={20}
                                        color={
                                            theme.colors.onSecondaryContainer
                                        }
                                    />
                                </View>
                            </TouchableRipple>
                        }
                    >
                        {GOAL_OPTIONS.map((option) => (
                            <Menu.Item
                                key={option.id}
                                onPress={() => handleGoalChange(option.id)}
                                title={option.fullLabel}
                                leadingIcon={(props) => (
                                    <MaterialSymbol
                                        name={option.icon}
                                        size={24}
                                        color={props.color}
                                    />
                                )}
                                style={{ maxWidth: 200 }}
                            />
                        ))}
                    </Menu>
                </View>
            </View>

            <ScrollView
                scrollEventThrottle={16}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: headerHeight + 16 },
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View
                    style={[
                        styles.section,
                        { backgroundColor: theme.colors.elevation.level1 },
                    ]}
                >
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                        Статистика
                    </Text>
                    <CustomSegmentedControl
                        period={statPeriod}
                        onPeriodChange={setStatPeriod}
                    />
                    <View
                        style={[
                            styles.statChartPlaceholder,
                            { backgroundColor: theme.colors.surfaceVariant },
                        ]}
                    >
                        <MaterialSymbol
                            name="bar_chart"
                            size={32}
                            color={theme.colors.onSurfaceVariant}
                        />
                        <Text
                            variant="labelLarge"
                            style={{
                                color: theme.colors.onSurfaceVariant,
                                marginTop: 8,
                            }}
                        >
                            Данные за{" "}
                            {statPeriod === "day"
                                ? "день"
                                : statPeriod === "week"
                                  ? "неделю"
                                  : "месяц"}
                        </Text>
                    </View>
                </View>

                <View
                    style={[
                        styles.section,
                        { backgroundColor: theme.colors.elevation.level1 },
                    ]}
                >
                    <View style={styles.paramsHeader}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            Мои параметры
                        </Text>
                        <TouchableRipple
                            onPress={openSheet}
                            style={[
                                styles.editIconButton,
                                {
                                    backgroundColor:
                                        theme.colors.surfaceVariant,
                                },
                            ]}
                            borderless
                        >
                            <MaterialSymbol
                                name="edit"
                                size={20}
                                color={theme.colors.onSurfaceVariant}
                            />
                        </TouchableRipple>
                    </View>
                    <View style={styles.macrosContainer}>
                        {renderParamChip(
                            theme.colors.secondaryContainer,
                            theme.colors.onSecondaryContainer,
                            "Вес",
                            `${userData.weight} кг`,
                        )}
                        {renderParamChip(
                            theme.colors.tertiaryContainer,
                            theme.colors.onTertiaryContainer,
                            "Рост",
                            `${userData.height} см`,
                        )}
                        {/* Обновленный блок возраста */}
                        {renderParamChip(
                            theme.colors.primaryContainer,
                            theme.colors.onPrimaryContainer,
                            "Возраст",
                            `${userData.age} ${getAgeSuffix(userData.age)}`,
                        )}
                    </View>
                </View>
            </ScrollView>

            <BottomSheetModal
                ref={bottomSheetRef}
                enableDynamicSizing={true}
                backdropComponent={renderBackdrop}
                topInset={insets.top}
                backgroundStyle={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 36,
                }}
                handleIndicatorStyle={{
                    backgroundColor: theme.colors.onSurfaceVariant,
                    width: 32,
                    height: 4,
                }}
            >
                <BottomSheetView
                    style={[
                        styles.sheetContent,
                        // Наш главный хак: увеличиваем отступ снизу на высоту клавиатуры
                        {
                            paddingBottom:
                                keyboardHeight > 0 ? keyboardHeight + 20 : 40,
                        },
                    ]}
                >
                    <View style={styles.inputGrid}>
                        {renderParamSquare(
                            "Вес",
                            editData.weight,
                            (t) => setEditData({ ...editData, weight: t }),
                            "кг",
                        )}
                        {renderParamSquare(
                            "Рост",
                            editData.height,
                            (t) => setEditData({ ...editData, height: t }),
                            "см",
                        )}
                        {renderParamSquare(
                            "Возраст",
                            editData.age,
                            (t) => setEditData({ ...editData, age: t }),
                            "лет",
                        )}
                    </View>

                    <View style={{ marginBottom: 24, marginTop: 16 }}>
                        {renderSegmentedControl(
                            [
                                { id: "male", label: "Мужчина" },
                                { id: "female", label: "Женщина" },
                            ],
                            editData.gender,
                            (val) => setEditData({ ...editData, gender: val }),
                        )}
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleSaveParams}
                        style={styles.saveButton}
                        contentStyle={{ height: 56 }}
                        labelStyle={{ fontSize: 16, fontWeight: "700" }}
                    >
                        Сохранить
                    </Button>
                </BottomSheetView>
            </BottomSheetModal>
        </View>
    );
}

const renderParamChip = (
    bg: string,
    fg: string,
    label: string,
    val: string | number,
) => (
    <View style={[styles.macroChip, { backgroundColor: bg }]}>
        <Text variant="labelSmall" style={{ color: fg, opacity: 0.7 }}>
            {label}
        </Text>
        <Text variant="titleMedium" style={{ color: fg, fontWeight: "700" }}>
            {val}
        </Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
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
        paddingBottom: 16,
        minHeight: 72,
    },
    headerBottomRow: {
        paddingHorizontal: 16,
        paddingBottom: 24, // Даем пространство снизу перед концом шапки
    },
    headerGoalChip: {
        borderRadius: 16,
        overflow: "hidden",
    },
    goalChipContent: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    boldText: { fontWeight: "700" },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
    section: { borderRadius: 24, padding: 16 },
    sectionTitle: { fontWeight: "700", marginBottom: 12 },
    statChartPlaceholder: {
        height: 140,
        marginTop: 12,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    paramsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    editIconButton: {
        width: 40,
        height: 40,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    macrosContainer: { flexDirection: "row", gap: 6 },
    macroChip: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 16,
    },

    sheetContent: { paddingHorizontal: 20, paddingBottom: 40 },

    segContainer: {
        flexDirection: "row",
        height: 52,
        borderRadius: 100,
        padding: 6,
        gap: 6,
    },
    segButton: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 100,
    },
    segText: { fontSize: 14, fontWeight: "700" },

    inputGrid: { flexDirection: "row", gap: 8 },
    paramSquare: {
        flex: 1,
        borderRadius: 24,
        padding: 16,
        justifyContent: "center",
    },
    nativeInput: { padding: 0, minWidth: 40 },

    saveButton: { borderRadius: 20 },
});
