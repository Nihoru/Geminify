import { Meal } from "../shared/store/models";

export interface AggregatedStats {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    date: Date;
}

export function getDailyStats(meals: Meal[], targetDate: Date): AggregatedStats {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dayMeals = meals.filter((m) => {
        const d = new Date(m.createdAt);
        return d >= startOfDay && d <= endOfDay;
    });

    return dayMeals.reduce(
        (acc, m) => ({
            ...acc,
            calories: acc.calories + (m.totalCalories || 0),
            protein: acc.protein + (m.totalProtein || 0),
            fat: acc.fat + (m.totalFat || 0),
            carbs: acc.carbs + (m.totalCarbs || 0),
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0, date: startOfDay },
    );
}

export function getWeeklyStats(
    meals: Meal[],
    targetDate: Date,
): AggregatedStats[] {
    // Get Monday of the current week
    const day = targetDate.getDay();
    const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(targetDate);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const weekStats: AggregatedStats[] = [];

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        weekStats.push(getDailyStats(meals, d));
    }

    return weekStats;
}

export function getMonthlyStats(
    meals: Meal[],
    targetDate: Date,
): AggregatedStats[] {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const monthStats: AggregatedStats[] = [];

    for (let i = 1; i <= lastDay.getDate(); i++) {
        const d = new Date(year, month, i);
        monthStats.push(getDailyStats(meals, d));
    }

    return monthStats;
}

export function formatPeriodLabel(
    period: string,
    date: Date,
    locale: string = "ru-RU",
): string {
    if (period === "day") {
        return date.toLocaleDateString(locale, {
            day: "numeric",
            month: "long",
        });
    } else if (period === "week") {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const start = monday.toLocaleDateString(locale, {
            day: "numeric",
            month: "short",
        });
        const end = sunday.toLocaleDateString(locale, {
            day: "numeric",
            month: "short",
        });
        return `${start} - ${end}`;
    } else {
        return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
    }
}
