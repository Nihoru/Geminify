import {
    GoogleGenerativeAI,
    SchemaType,
    type Schema,
} from "@google/generative-ai";
import Fuse from "fuse.js";
import localFoodDB from "../assets/food_db.json";
import { storage, STORAGE_KEYS } from "../shared/store/storage";

const fuse = new Fuse(localFoodDB, {
    keys: ["name"],
    includeScore: true,
    threshold: 0.35, // Базовый жесткий порог для отсечения мусора
    ignoreLocation: true,
    useExtendedSearch: true,
    ignoreFieldNorm: true, // 💊 ОТКЛЮЧАЕМ ШТРАФ ЗА ДЛИНУ СТРОКИ
});

const extractionSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        mealName: { type: SchemaType.STRING },
        dishes: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    dishName: { type: SchemaType.STRING },
                    ingredients: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                name: { type: SchemaType.STRING },
                                searchQueries: {
                                    type: SchemaType.ARRAY,
                                    items: { type: SchemaType.STRING },
                                    description:
                                        "Array of exactly 3 search queries ordered from specific to broad.",
                                },
                                weight: { type: SchemaType.INTEGER },
                                calories_per_100g: { type: SchemaType.INTEGER },
                                protein_per_100g: { type: SchemaType.INTEGER },
                                fat_per_100g: { type: SchemaType.INTEGER },
                                carbs_per_100g: { type: SchemaType.INTEGER },
                            },
                            required: [
                                "name",
                                "searchQueries", // Требуем массив запросов
                                "weight",
                                "calories_per_100g",
                                "protein_per_100g",
                                "fat_per_100g",
                                "carbs_per_100g",
                            ],
                        },
                    },
                },
                required: ["dishName", "ingredients"],
            },
        },
    },
    required: ["mealName", "dishes"],
};

export const analyzeFoodText = async (textPrompt: string) => {
    console.log(`[Analyze] 🚀 Запуск анализа еды. Запрос: "${textPrompt}"`);

    const apiKey = await storage.getString(STORAGE_KEYS.GEMINI_API_KEY);
    const modelName =
        (await storage.getString(STORAGE_KEYS.GEMINI_MODEL)) ||
        "gemini-2.5-flash";

    console.log(`[Analyze] 🔑 Используемая модель: ${modelName}`);

    if (!apiKey) {
        console.error("[Analyze] ❌ Ошибка: API ключ не найден.");
        throw new Error("API ключ не найден. Перейдите в настройки.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: extractionSchema,
        },
    });

    const prompt = `You are an expert culinary analyzer. Group the input into distinct dishes, and break down each home-cooked dish into raw ingredients.

Analyzed text: "${textPrompt}"

Strict Instructions:
1. Hierarchy: First, identify the distinct dishes (e.g., "Борщ", "Салат Цезарь", "Сникерс"). 
2. Deconstruction: 
   - For home-cooked meals, provide the list of atomic ingredients inside that dish.
   - For standard commercial products, complex pastries, or fast-food (e.g., "тульский пряник", "чизбургер", "сникерс"), treat the dish itself as a single ingredient. Put the commercial name in 'dishName' and duplicate it in the single 'ingredient' name. DO NOT break it down into flour, sugar, etc.
3. Naming Rule: For ingredient names, output the base product followed by its specific type in Russian (e.g., "курица грудка", "рис бурый").
4. Cascade Search Rule: Provide a 'searchQueries' array with EXACTLY 3 descending levels of detail in Russian.
   - [0] Highly Specific: Brand + Core product + Flavor (e.g., "ясная поляна тульский пряник сгущенка").
   - [1] Generic: Core product + Flavor (e.g., "тульский пряник сгущенка").
   - [2] Base: Core product (e.g., "пряник").
   CRITICAL FOR PLAIN FOODS: If the item is plain/unflavored (like plain cottage cheese, plain tea, plain milk), YOU MUST include the word "классический" or "заваренный без сахара" in ALL THREE levels (e.g., [0] "творог мягкий вкусвилл классический", [1] "творог мягкий классический", [2] "творог классический"). NEVER leave a level as just "творог" or "чай", because a short query will accidentally match heavily flavored/sugary junk in the database!
5. Liquid Meal Rule: If the user logs a PORTION of a liquid or semi-liquid dish (like soup, stew, or porridge) without giving the exact whole-pot recipe, you MUST automatically include 'вода' or 'бульон' as an ingredient. Distribute the total portion weight using standard culinary ratios (e.g., standard soups are 70-80% water, porridges are 60-70% water).Example: User says "300g chicken potato soup". You output: Вода (220g), Курица (40g), Картофель (40g).
6. AI Fallback Macros: Estimate realistic nutritional values per 100 grams for each ingredient.

Return data strictly matching the JSON schema.`;

    try {
        console.log("[Analyze] ⏳ Отправка запроса в Gemini API...");
        const result = await model.generateContent(prompt);
        console.log("[Analyze] ✅ Ответ от Gemini получен. Парсинг JSON...");

        const extractionResult = JSON.parse(result.response.text());
        console.log(
            `[Analyze] 📋 Извлечено название приема пищи: "${extractionResult.mealName}", количество блюд: ${extractionResult.dishes?.length || 0}`,
        );

        const finalAnalysis = {
            mealName: extractionResult.mealName,
            totalCalories: 0,
            totalProtein: 0,
            totalFat: 0,
            totalCarbs: 0,
            dishes: [] as any[],
        };

        const PENALTY_WEIGHTS = [0.0, 0.15, 0.3];
        const BASE_THRESHOLD = 0.35;

        for (const dishData of extractionResult.dishes) {
            console.log(
                `\n[Analyze] 🍲 Обработка блюда: "${dishData.dishName}"`,
            );

            const dish = {
                name: dishData.dishName,
                totalWeight: 0,
                totalCalories: 0,
                totalProtein: 0,
                totalFat: 0,
                totalCarbs: 0,
                ingredients: [] as any[],
            };

            for (const item of dishData.ingredients) {
                console.log(
                    `  - Ингредиент от ИИ: "${item.name}" (${item.weight}г). Запуск каскадного поиска...`,
                );

                let bestGlobalMatch: any = null;
                let bestGlobalScore = 1.0;

                const queries = Array.isArray(item.searchQueries)
                    ? item.searchQueries
                    : [item.name];

                for (let i = 0; i < queries.length; i++) {
                    const query = queries[i];
                    const cascadePenalty =
                        PENALTY_WEIGHTS[i] !== undefined
                            ? PENALTY_WEIGHTS[i]
                            : 0.4;

                    const searchResults = fuse.search(query);

                    if (searchResults.length > 0) {
                        const match = searchResults[0];
                        const rawScore = match.score!;

                        if (rawScore <= BASE_THRESHOLD) {
                            // Больше никаких штрафов за длину! Только штраф уровня каскада.
                            const penalizedScore = rawScore + cascadePenalty;

                            console.log(
                                `      🔍 Уровень [${i}] ("${query}"): найден "${match.item.base_name}". Raw: ${rawScore.toFixed(3)}, Итог: ${penalizedScore.toFixed(3)}`,
                            );

                            if (penalizedScore < bestGlobalScore) {
                                bestGlobalScore = penalizedScore;
                                bestGlobalMatch = match.item;
                            }
                        }
                    } else {
                        console.log(
                            `      ❌ Уровень [${i}] ("${query}"): ничего не найдено.`,
                        );
                    }
                }

                let macros = {
                    calories: item.calories_per_100g,
                    protein: item.protein_per_100g,
                    fat: item.fat_per_100g,
                    carbs: item.carbs_per_100g,
                };

                if (bestGlobalMatch) {
                    console.log(
                        `    ✅ ПОБЕДИТЕЛЬ: "${bestGlobalMatch.name}" (Итоговый score: ${bestGlobalScore.toFixed(3)}). Берем из БД.`,
                    );
                    macros = {
                        calories: bestGlobalMatch.calories,
                        protein: bestGlobalMatch.protein,
                        fat: bestGlobalMatch.fat,
                        carbs: bestGlobalMatch.carbs,
                    };
                } else {
                    console.log(
                        `    ⚠️ В БД ничего не подошло. Используем AI Fallback: ${macros.calories} ккал/100г.`,
                    );
                }

                const ratio = item.weight / 100;
                const calculatedItem = {
                    name: item.name,
                    weight: item.weight,
                    calories: Math.round(macros.calories * ratio),
                    protein: Math.round(macros.protein * ratio),
                    fat: Math.round(macros.fat * ratio),
                    carbs: Math.round(macros.carbs * ratio),
                };

                dish.totalWeight += calculatedItem.weight;
                dish.totalCalories += calculatedItem.calories;
                dish.totalProtein += calculatedItem.protein;
                dish.totalFat += calculatedItem.fat;
                dish.totalCarbs += calculatedItem.carbs;

                dish.ingredients.push(calculatedItem);
            }

            console.log(
                `[Analyze] 📊 Итоги по блюду "${dish.name}": ${dish.totalCalories} ккал, вес: ${dish.totalWeight}г.`,
            );

            finalAnalysis.totalCalories += dish.totalCalories;
            finalAnalysis.totalProtein += dish.totalProtein;
            finalAnalysis.totalFat += dish.totalFat;
            finalAnalysis.totalCarbs += dish.totalCarbs;

            finalAnalysis.dishes.push(dish);
        }

        console.log(
            `\n[Analyze] 🎉 Анализ завершен! Итоговые калории: ${finalAnalysis.totalCalories} ккал.`,
        );
        return finalAnalysis;
    } catch (error) {
        console.error(
            "[Analyze] ❌ Критическая ошибка при работе Gemini API:",
            error,
        );
        throw error;
    }
};

export const fetchAvailableModels = async (apiKey: string) => {
    console.log(
        "[Models] 🔍 Запрос списка доступных моделей Google Generative AI...",
    );
    try {
        let baseUrl = "https://generativelanguage.googleapis.com";

        const response = await fetch(`${baseUrl}/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error(
                "[Models] ❌ Ошибка API при получении моделей:",
                data.error.message,
            );
            throw new Error(data.error.message);
        }

        console.log(
            `[Models] 📥 Получено моделей от API: ${data.models?.length || 0}. Начинаем фильтрацию...`,
        );

        const filteredAndSortedModels = data.models
            .filter((m: any) => {
                const name = m.name.toLowerCase();
                if (!m.supportedGenerationMethods.includes("generateContent"))
                    return false;

                const isIrrelevant =
                    name.includes("gemma") ||
                    name.includes("veo") ||
                    name.includes("lyria") ||
                    name.includes("imagen") ||
                    name.includes("embedding") ||
                    name.includes("aqa") ||
                    name.includes("tts") ||
                    name.includes("audio") ||
                    name.includes("robotics") ||
                    name.includes("computer-use") ||
                    name.includes("deep-research");

                return !isIrrelevant;
            })
            .map((m: any) => ({
                name: m.name.replace("models/", ""),
                displayName: m.displayName,
            }))
            .sort((a: any, b: any) => {
                const getVersion = (name: string) => {
                    const match = name.match(/(\d+\.\d+)|(\d+)/);
                    return match ? parseFloat(match[0]) : 0;
                };

                const vA = getVersion(a.name);
                const vB = getVersion(b.name);

                if (vB !== vA) return vB - vA;

                const weightA = a.name.includes("pro")
                    ? 2
                    : a.name.includes("flash")
                      ? 1
                      : 0;
                const weightB = b.name.includes("pro")
                    ? 2
                    : b.name.includes("flash")
                      ? 1
                      : 0;

                return weightB - weightA;
            });

        console.log(
            `[Models] ✅ Фильтрация завершена. Оставлено моделей: ${filteredAndSortedModels.length}.`,
        );
        return filteredAndSortedModels;
    } catch (error) {
        console.error(
            "[Models] ❌ Ошибка в функции fetchAvailableModels:",
            error,
        );
        throw error;
    }
};
