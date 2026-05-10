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
import { InfoChip } from "../../components/InfoChip";
import { UnifiedHeader } from "../../components/UnifiedHeader";

import { storage, STORAGE_KEYS } from "../../src/shared/store/storage";
import { calculateMacroLimits, GoalId } from "../../src/utils/userMath";

// Опции активности
const ACTIVITY_OPTIONS = [
    {
        id: "low",
        label: "Низкая",
        multiplier: 1.2,
        icon: "self_improvement",
        desc: "Сидячий образ жизни",
    },
    {
        id: "med",
        label: "Средняя",
        multiplier: 1.375,
        icon: "directions_walk",
        desc: "1-3 тренировки в неделю",
    },
    {
        id: "high",
        label: "Высокая",
        multiplier: 1.55,
        icon: "fitness_center",
        desc: "Интенсивные нагрузки",
    },
] as const;

type ActivityId = (typeof ACTIVITY_OPTIONS)[number]["id"];

const GOAL_OPTIONS = [
    {
        id: "lose" as GoalId,
        label: "Сброс",
        fullLabel: "Сброс веса",
        icon: "trending_down",
    },
    {
        id: "maintain" as GoalId,
        label: "Баланс",
        fullLabel: "Поддержание",
        icon: "sync",
    },
    {
        id: "gain" as GoalId,
        label: "Набор",
        fullLabel: "Набор массы",
        icon: "trending_up",
    },
];

const getAgeSuffix = (ageString: string): string => {
    const age = parseInt(ageString, 10);
    if (isNaN(age)) return "лет";
    const lastTwoDigits = Math.abs(age) % 100;
    const lastDigit = Math.abs(age) % 10;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "лет";
    if (lastDigit === 1) return "год";
    if (lastDigit >= 2 && lastDigit <= 4) return "года";
    return "лет";
};

export default function GoalScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const [statPeriod, setStatPeriod] = useState("day");
    const [goalMenuVisible, setGoalMenuVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const [userData, setUserData] = useState({
        weight: "62",
        height: "172",
        age: "20",
        gender: "male",
        goal: "lose" as GoalId,
        activity: "med" as ActivityId, // Новое поле
    });

    const [editData, setEditData] = useState(userData);
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    useEffect(() => {
        const loadProfile = async () => {
            const savedProfile = await storage.getObject<typeof userData>(
                STORAGE_KEYS.USER_PROFILE,
            );
            if (savedProfile) {
                setUserData(savedProfile);
                setEditData(savedProfile);
            }
        };
        loadProfile();
    }, []);

    useEffect(() => {
        const showEvent =
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent =
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
        const showSub = Keyboard.addListener(showEvent, (e) =>
            setKeyboardHeight(e.endCoordinates.height),
        );
        const hideSub = Keyboard.addListener(hideEvent, () =>
            setKeyboardHeight(0),
        );
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

    const recalculateAndSave = async (newData: typeof userData) => {
        setUserData(newData);

        // Находим множитель активности
        const activityMultiplier =
            ACTIVITY_OPTIONS.find((a) => a.id === newData.activity)
                ?.multiplier || 1.375;

        const limits = calculateMacroLimits({
            weight: parseFloat(newData.weight) || 0,
            height: parseFloat(newData.height) || 0,
            age: parseInt(newData.age, 10) || 0,
            gender: newData.gender as "male" | "female",
            goal: newData.goal,
            activityMultiplier, // Передаем его в утилиту
        });

        await storage.setObject(STORAGE_KEYS.USER_PROFILE, newData);
        await storage.setObject(STORAGE_KEYS.MACRO_LIMITS, limits);
    };

    const handleSaveParams = () => {
        const newData = { ...userData, ...editData };
        recalculateAndSave(newData);
        closeSheet();
    };

    const handleGoalChange = (newGoal: GoalId) => {
        const newData = { ...userData, goal: newGoal };
        recalculateAndSave(newData);
        setGoalMenuVisible(false);
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
    const currentActivity =
        ACTIVITY_OPTIONS.find((a) => a.id === userData.activity) ||
        ACTIVITY_OPTIONS[1];
    const [headerHeight, setHeaderHeight] = useState(insets.top + 72);

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

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.colors.surface },
            ]}
        >
            <UnifiedHeader
                onHeightChange={setHeaderHeight}
                leftNode={
                    <Text variant="headlineMedium" style={styles.boldText}>
                        Моя цель
                    </Text>
                }
                rightNode={
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
                }
            />

            <ScrollView
                scrollEventThrottle={16}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: headerHeight + 16 },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Секция статистики */}
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
                        value={statPeriod}
                        options={[
                            { id: "day", label: "День" },
                            { id: "week", label: "Неделя" },
                            { id: "month", label: "Месяц" },
                        ]}
                        onChange={setStatPeriod}
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

                {/* Секция параметров */}
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

                    <View style={styles.paramsGrid}>
                        <View style={styles.macrosContainer}>
                            <InfoChip
                                bg={theme.colors.secondaryContainer}
                                fg={theme.colors.onSecondaryContainer}
                                label="Вес"
                                value={`${userData.weight} кг`}
                            />
                            <InfoChip
                                bg={theme.colors.tertiaryContainer}
                                fg={theme.colors.onTertiaryContainer}
                                label="Рост"
                                value={`${userData.height} см`}
                            />
                            <InfoChip
                                bg={theme.colors.primaryContainer}
                                fg={theme.colors.onPrimaryContainer}
                                label="Возраст"
                                value={`${userData.age} ${getAgeSuffix(userData.age)}`}
                            />
                        </View>

                        {/* НОВАЯ ТАБЛЕТКА АКТИВНОСТИ */}
                        <View
                            style={[
                                styles.activityPill,
                                {
                                    backgroundColor:
                                        theme.colors.surfaceVariant,
                                },
                            ]}
                        >
                            <View style={styles.activityPillLeft}>
                                <View
                                    style={[
                                        styles.activityIconCircle,
                                        {
                                            backgroundColor:
                                                theme.colors.surface,
                                        },
                                    ]}
                                >
                                    <MaterialSymbol
                                        name={currentActivity.icon}
                                        size={20}
                                        color={theme.colors.primary}
                                    />
                                </View>
                                <View style={{ marginLeft: 12 }}>
                                    <Text
                                        variant="labelLarge"
                                        style={{
                                            fontWeight: "800",
                                            color: theme.colors.onSurface,
                                        }}
                                    >
                                        {currentActivity.label} активность
                                    </Text>
                                    <Text
                                        variant="labelSmall"
                                        style={{
                                            color: theme.colors
                                                .onSurfaceVariant,
                                        }}
                                    >
                                        {currentActivity.desc}
                                    </Text>
                                </View>
                            </View>
                            <Text
                                variant="titleMedium"
                                style={{
                                    fontWeight: "900",
                                    color: theme.colors.primary,
                                }}
                            >
                                x{currentActivity.multiplier}
                            </Text>
                        </View>
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

                    <View style={{ gap: 12, marginTop: 16, marginBottom: 24 }}>
                        <CustomSegmentedControl
                            value={editData.gender}
                            options={[
                                { id: "male", label: "Мужчина" },
                                { id: "female", label: "Женщина" },
                            ]}
                            onChange={(val) =>
                                setEditData({ ...editData, gender: val })
                            }
                        />

                        {/* ВЫБОР АКТИВНОСТИ В РЕДАКТОРЕ */}
                        <Text
                            variant="labelLarge"
                            style={{
                                marginLeft: 8,
                                fontWeight: "700",
                                color: theme.colors.onSurfaceVariant,
                            }}
                        >
                            Активность
                        </Text>
                        <CustomSegmentedControl
                            value={editData.activity}
                            options={ACTIVITY_OPTIONS.map((a) => ({
                                id: a.id,
                                label: a.label,
                            }))}
                            onChange={(val) =>
                                setEditData({
                                    ...editData,
                                    activity: val as ActivityId,
                                })
                            }
                        />
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

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerGoalChip: {
        borderRadius: 100,
        height: 44,
        justifyContent: "center",
        overflow: "hidden",
    },
    goalChipContent: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
    },
    boldText: { fontWeight: "700", paddingHorizontal: 8 },
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
    paramsGrid: { gap: 8 },
    macrosContainer: { flexDirection: "row", gap: 6 },
    activityPill: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        borderRadius: 20,
        marginTop: 2,
    },
    activityPillLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    activityIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    sheetContent: { paddingHorizontal: 20, paddingBottom: 40 },
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
