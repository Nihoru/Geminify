// Описываем интерфейсы для строгой типизации
export interface RawFoodMacros {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
}

export interface SkurikhinCoefficients {
    mass_loss_percent: number;
    proteins_loss_percent: number;
    fats_loss_percent: number;
    carbohydrates_loss_percent: number;
    energy_value_loss_percent: number;
}

export interface CalculatedIngredient {
    name: string;
    rawWeightEstimated: number; // Изменено на camelCase
    cookedWeight: number; // Изменено на camelCase
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
}

/**
 * Главная функция расчета: от готового веса к сырому и обратно с учетом потерь
 */
export function calculateCookedNutrients(
    itemName: string,
    cookedWeight: number,
    rawMacrosPer100g: RawFoodMacros,
    losses: SkurikhinCoefficients,
): CalculatedIngredient {
    // 1. Извлекаем коэффициенты (если переданы null/undefined, ставим 0)
    const lossMass = losses?.mass_loss_percent || 0;
    const lossProtein = losses?.proteins_loss_percent || 0;
    const lossFat = losses?.fats_loss_percent || 0;
    const lossCarbs = losses?.carbohydrates_loss_percent || 0;
    const lossCalories = losses?.energy_value_loss_percent || 0;

    // 2. Восстанавливаем сырой вес (Reverse Mass)
    // Защита от деления на ноль: ограничиваем максимальную потерю массы до 95%
    const safeLossMass = Math.min(lossMass, 95);
    const massRetentionFactor = 1 - safeLossMass / 100;
    const rawWeight = cookedWeight / massRetentionFactor;

    // 3. Считаем абсолютные нутриенты сырого продукта
    const ratioRaw = rawWeight / 100;
    const rawCalories = rawMacrosPer100g.calories * ratioRaw;
    const rawProtein = rawMacrosPer100g.protein * ratioRaw;
    const rawFat = rawMacrosPer100g.fat * ratioRaw;
    const rawCarbs = rawMacrosPer100g.carbs * ratioRaw;

    // 4. Применяем термические потери нутриентов (Forward Calculation)
    const finalCalories = rawCalories * (1 - lossCalories / 100);
    const finalProtein = rawProtein * (1 - lossProtein / 100);
    const finalFat = rawFat * (1 - lossFat / 100);
    const finalCarbs = rawCarbs * (1 - lossCarbs / 100);

    // Возвращаем объект, ключи которого строго соответствуют схеме Realm
    return {
        name: itemName,
        rawWeightEstimated: Math.round(rawWeight), // Приведено к camelCase
        cookedWeight: cookedWeight, // Приведено к camelCase
        calories: Math.round(finalCalories),
        protein: Math.round(finalProtein),
        fat: Math.round(finalFat),
        carbs: Math.round(finalCarbs),
    };
}
