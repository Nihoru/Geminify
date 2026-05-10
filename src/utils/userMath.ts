export type GoalId = "lose" | "maintain" | "gain";
export type GenderId = "male" | "female";

export interface UserParams {
    weight: number;
    height: number;
    age: number;
    gender: GenderId;
    goal: GoalId;
    activityMultiplier?: number; // Коэффициент активности (по умолчанию берём низкую активность 1.2 или 1.375)
}

export interface MacroLimits {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
}

export const calculateMacroLimits = (params: UserParams): MacroLimits => {
    const {
        weight,
        height,
        age,
        gender,
        goal,
        activityMultiplier = 1.375,
    } = params;

    // 1. Базовый обмен веществ (BMR) по формуле Миффлина-Сан Жеора
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += gender === "male" ? 5 : -161;

    // 2. Суточная норма калорий (TDEE)
    let tdee = bmr * activityMultiplier;

    // 3. Корректировка калорий в зависимости от цели
    let targetCalories = tdee;
    if (goal === "lose") {
        targetCalories -= 500; // Дефицит для плавного похудения
    } else if (goal === "gain") {
        targetCalories += 500; // Профицит для набора массы
    }

    // 4. Расчёт макронутриентов (БЖУ)
    // Белок: ~1.8г на кг веса (при похудении или наборе можно поднять до 2г)
    const proteinPerKg = goal === "maintain" ? 1.8 : 2.0;
    const protein = Math.round(weight * proteinPerKg);

    // Жиры: ~1г на кг веса
    const fat = Math.round(weight * 1.0);

    // Углеводы: всё, что осталось от калорийности
    const proteinCalories = protein * 4;
    const fatCalories = fat * 9;
    const remainingCalories = targetCalories - proteinCalories - fatCalories;

    // Защита от отрицательных углеводов при экстремально низком весе/росте
    const carbs = Math.max(0, Math.round(remainingCalories / 4));

    return {
        calories: Math.round(targetCalories),
        protein,
        fat,
        carbs,
    };
};
