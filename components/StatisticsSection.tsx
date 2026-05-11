import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Text, useTheme, Menu, TouchableRipple } from "react-native-paper";
import { MaterialSymbol } from "./MaterialSymbol";
import { MealRealmContext, Meal } from "../src/shared/store/models";
import { storage, STORAGE_KEYS } from "../src/shared/store/storage";
import { MacroLimits } from "../src/utils/userMath";
import {
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    formatPeriodLabel,
} from "../src/utils/statisticsHelpers";
import { DailyStats } from "./DailyStats";
import { WeeklyStats } from "./WeeklyStats";
import { MonthlyStats } from "./MonthlyStats";

interface StatisticsSectionProps {
    period: string; // "day" | "week" | "month"
    limits?: MacroLimits;
}

type MetricKey = "calories" | "protein" | "fat" | "carbs";

interface MetricInfo {
    id: MetricKey;
    label: string;
    unit: string;
    icon: string;
    mainColor: string;
    contColor: string;
    onMainColor: string;
    onContColor: string;
}

export const StatisticsSection = ({ period, limits: limitsProp }: StatisticsSectionProps) => {
    const theme = useTheme();
    const { useQuery } = MealRealmContext;
    const meals = useQuery(Meal);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [internalLimits, setInternalLimits] = useState<MacroLimits>({
        calories: 2500,
        protein: 120,
        fat: 80,
        carbs: 300,
    });

    const limits = limitsProp || internalLimits;

    const [selectedMetric, setSelectedMetric] = useState<MetricKey>("calories");
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        const loadLimits = async () => {
            if (limitsProp) return; // Don't load if prop is provided
            const savedLimits = await storage.getObject<MacroLimits>(
                STORAGE_KEYS.MACRO_LIMITS,
            );
            if (savedLimits) setInternalLimits(savedLimits);
        };
        loadLimits();
    }, [limitsProp]);

    const stats = useMemo(() => {
        const mealsArray = Array.from(meals);
        if (period === "day") return [getDailyStats(mealsArray, currentDate)];
        if (period === "week") return getWeeklyStats(mealsArray, currentDate);
        if (period === "month")
            return getMonthlyStats(mealsArray, currentDate);
        return [];
    }, [meals, currentDate, period]);

    const isFuture = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const d = new Date(currentDate);
        d.setHours(0, 0, 0, 0);

        if (period === "day") {
            return d >= now;
        }
        if (period === "week") {
            const getMonday = (date: Date) => {
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                const m = new Date(date);
                m.setDate(diff);
                m.setHours(0, 0, 0, 0);
                return m;
            };
            return getMonday(d) >= getMonday(now);
        }
        if (period === "month") {
            return (
                d.getFullYear() > now.getFullYear() ||
                (d.getFullYear() === now.getFullYear() &&
                    d.getMonth() >= now.getMonth())
            );
        }
        return false;
    }, [currentDate, period]);

    const changeDate = (offset: number) => {
        if (offset > 0 && isFuture) return;
        const newDate = new Date(currentDate);
        if (period === "day") newDate.setDate(newDate.getDate() + offset);
        if (period === "week") newDate.setDate(newDate.getDate() + offset * 7);
        if (period === "month") newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const metricOptions: MetricInfo[] = [
        {
            id: "calories",
            label: "Калории",
            unit: "ккал",
            icon: "bolt",
            mainColor: theme.colors.onSurface,
            contColor: theme.colors.surfaceVariant,
            onMainColor: theme.colors.surface,
            onContColor: theme.colors.onSurfaceVariant,
        },
        {
            id: "protein",
            label: "Белки",
            unit: "г",
            icon: "fitness_center",
            mainColor: theme.colors.primary,
            contColor: theme.colors.primaryContainer,
            onMainColor: theme.colors.onPrimary,
            onContColor: theme.colors.onPrimaryContainer,
        },
        {
            id: "fat",
            label: "Жиры",
            unit: "г",
            icon: "water_drop",
            mainColor: theme.colors.secondary,
            contColor: theme.colors.secondaryContainer,
            onMainColor: theme.colors.onSecondary,
            onContColor: theme.colors.onSecondaryContainer,
        },
        {
            id: "carbs",
            label: "Углеводы",
            unit: "г",
            icon: "cookie",
            mainColor: theme.colors.tertiary,
            contColor: theme.colors.tertiaryContainer,
            onMainColor: theme.colors.onTertiary,
            onContColor: theme.colors.onTertiaryContainer,
        },
    ];

    const currentMetricInfo =
        metricOptions.find((m) => m.id === selectedMetric) || metricOptions[0];

    const renderMetricSelector = () => (
        <View style={styles.selectorContainer}>
            <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchorPosition="bottom"
                contentStyle={{
                    backgroundColor: theme.colors.elevation.level3,
                    borderRadius: 20,
                    marginTop: 4,
                }}
                anchor={
                    <TouchableRipple
                        onPress={() => setMenuVisible(true)}
                        style={[
                            styles.metricChip,
                            { backgroundColor: theme.colors.secondaryContainer },
                        ]}
                        borderless
                    >
                        <View style={styles.metricChipContent}>
                            <MaterialSymbol
                                name={currentMetricInfo.icon}
                                size={18}
                                color={theme.colors.onSecondaryContainer}
                            />
                            <Text
                                variant="labelLarge"
                                style={{
                                    color: theme.colors.onSecondaryContainer,
                                    marginLeft: 8,
                                    marginRight: 4,
                                    fontWeight: "700",
                                }}
                            >
                                {currentMetricInfo.label}
                            </Text>
                            <MaterialSymbol
                                name="arrow_drop_down"
                                size={20}
                                color={theme.colors.onSecondaryContainer}
                            />
                        </View>
                    </TouchableRipple>
                }
            >
                {metricOptions.map((option) => {
                    const isSelected = selectedMetric === option.id;
                    return (
                        <Menu.Item
                            key={option.id}
                            onPress={() => {
                                setSelectedMetric(option.id);
                                setMenuVisible(false);
                            }}
                            title={option.label}
                            leadingIcon={(props) => (
                                <MaterialSymbol
                                    name={option.icon}
                                    size={24}
                                    color={
                                        isSelected
                                            ? theme.colors.onSecondaryContainer
                                            : props.color
                                    }
                                />
                            )}
                            style={{
                                backgroundColor: isSelected
                                    ? theme.colors.secondaryContainer
                                    : undefined,
                                borderRadius: 12,
                                marginHorizontal: 8,
                                marginVertical: 2,
                                minWidth: 160,
                            }}
                            titleStyle={{
                                color: isSelected
                                    ? theme.colors.onSecondaryContainer
                                    : theme.colors.onSurface,
                                fontWeight: isSelected ? "700" : "400",
                            }}
                        />
                    );
                })}
            </Menu>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => changeDate(-1)}
                    style={[
                        styles.navButton,
                        { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                >
                    <MaterialSymbol
                        name="chevron_left"
                        size={24}
                        color={theme.colors.onSurfaceVariant}
                    />
                </TouchableOpacity>
                <Text variant="titleMedium" style={styles.dateLabel}>
                    {formatPeriodLabel(period, currentDate)}
                </Text>
                <TouchableOpacity
                    onPress={() => changeDate(1)}
                    disabled={isFuture}
                    style={[
                        styles.navButton,
                        { 
                            backgroundColor: theme.colors.surfaceVariant,
                            opacity: isFuture ? 0.3 : 1 
                        },
                    ]}
                >
                    <MaterialSymbol
                        name="chevron_right"
                        size={24}
                        color={theme.colors.onSurfaceVariant}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {period === "day" && (
                    <DailyStats
                        stats={stats}
                        limits={limits}
                        metricOptions={metricOptions}
                    />
                )}
                {period === "week" && (
                    <WeeklyStats
                        stats={stats}
                        selectedMetric={selectedMetric}
                        limits={limits}
                        barColor={currentMetricInfo.mainColor}
                        renderMetricSelector={renderMetricSelector}
                    />
                )}
                {period === "month" && (
                    <MonthlyStats
                        stats={stats}
                        selectedMetric={selectedMetric}
                        limits={limits}
                        mainColor={currentMetricInfo.mainColor}
                        contColor={currentMetricInfo.contColor}
                        renderMetricSelector={renderMetricSelector}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginTop: 16 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    navButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    dateLabel: {
        fontWeight: "800",
        textAlign: "center",
        flex: 1,
    },
    content: { minHeight: 220 },
    selectorContainer: {
        marginTop: 24,
        alignItems: "center",
    },
    metricChip: {
        borderRadius: 100,
        height: 44,
        justifyContent: "center",
        overflow: "hidden",
    },
    metricChipContent: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
    },
});
