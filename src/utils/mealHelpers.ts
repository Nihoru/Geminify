import { MD3Theme } from "react-native-paper";

// Новая функция: определяем тип приема пищи по времени
export const getMealTypeFromDate = (date: Date): string => {
    const hour = date.getHours();

    if (hour >= 4 && hour < 7) return "early_breakfast"; // 04:00 - 06:59
    if (hour >= 7 && hour < 11) return "breakfast"; // 07:00 - 10:59
    if (hour >= 11 && hour < 13) return "snack_1"; // 11:00 - 12:59
    if (hour >= 13 && hour < 16) return "lunch"; // 13:00 - 15:59
    if (hour >= 16 && hour < 18) return "snack_2"; // 16:00 - 17:59
    if (hour >= 18 && hour < 22) return "dinner"; // 18:00 - 21:59

    // С 22:00 вечера до 4:00 утра — поздний ужин / ночной жор
    return "late_dinner";
};

// Твоя функция остается без изменений
export const getMealAppearance = (type: string, theme: MD3Theme) => {
    switch (type.toLowerCase()) {
        // --- УТРО (Primary) ---
        case "early_breakfast":
            return {
                iconName: "coffee",
                tagColor: theme.colors.onPrimary,
                tagTextColor: theme.colors.primary,
            };
        case "breakfast":
            return {
                iconName: "bakery_dining",
                tagColor: theme.colors.primaryContainer,
                tagTextColor: theme.colors.onPrimaryContainer,
            };

        // --- ДЕНЬ (Secondary) ---
        case "snack_1":
            return {
                iconName: "nutrition",
                tagColor: theme.colors.onSecondary,
                tagTextColor: theme.colors.secondary,
            };
        case "lunch":
            return {
                iconName: "soup_kitchen",
                tagColor: theme.colors.secondaryContainer,
                tagTextColor: theme.colors.onSecondaryContainer,
            };

        // --- ВЕЧЕР (Tertiary) ---
        case "snack_2":
            return {
                iconName: "cookie",
                tagColor: theme.colors.onTertiary,
                tagTextColor: theme.colors.tertiary,
            };
        case "dinner":
            return {
                iconName: "room_service",
                tagColor: theme.colors.tertiaryContainer,
                tagTextColor: theme.colors.onTertiaryContainer,
            };
        case "late_dinner":
            return {
                iconName: "meal_dinner",
                tagColor: theme.colors.surfaceVariant,
                tagTextColor: theme.colors.onSurfaceVariant,
            };

        // --- НЕИЗВЕСТНО (Neutral) ---
        default:
            return {
                iconName: "restaurant",
                tagColor: theme.colors.surfaceVariant,
                tagTextColor: theme.colors.onSurfaceVariant,
            };
    }
};
