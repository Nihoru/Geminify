import {
    GoogleGenerativeAI,
    SchemaType,
    type Schema,
} from "@google/generative-ai";
import Fuse from "fuse.js";
import localFoodDB from "../assets/food_db_merged.json";
import { storage, STORAGE_KEYS } from "../shared/store/storage";

const fuse = new Fuse(localFoodDB, {
    keys: ["name"],
    includeScore: true,
    threshold: 0.4, // Допускаем небольшие опечатки, но отсекаем откровенный мусор
    ignoreLocation: true, // Ищем совпадения в любом месте строки
});

const extractionSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        mealName: { type: SchemaType.STRING },
        ingredients: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    name: { type: SchemaType.STRING },
                    weight: { type: SchemaType.INTEGER },
                    calories_per_100g: { type: SchemaType.INTEGER },
                    protein_per_100g: { type: SchemaType.INTEGER },
                    fat_per_100g: { type: SchemaType.INTEGER },
                    carbs_per_100g: { type: SchemaType.INTEGER },
                },
                required: [
                    "name",
                    "weight",
                    "calories_per_100g",
                    "protein_per_100g",
                    "fat_per_100g",
                    "carbs_per_100g",
                ],
            },
        },
    },
    required: ["mealName", "ingredients"],
};

export const analyzeFoodText = async (textPrompt: string) => {
    const apiKey = await storage.getString(STORAGE_KEYS.GEMINI_API_KEY);
    const modelName =
        (await storage.getString(STORAGE_KEYS.GEMINI_MODEL)) ||
        "gemini-2.5-flash";

    if (!apiKey) throw new Error("API ключ не найден. Перейдите в настройки.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: extractionSchema,
        },
    });

    // Умный промпт с правилами нормализации и фоллбэка
    const prompt = `You are an expert culinary analyzer. Break down the meal into raw ingredients and estimate weights.

Analyzed meal: "${textPrompt}"

Strict Instructions:
1. Deconstruction: Break down the meal into atomic ingredients. Include hidden elements (oils, butter).
2. Weight Estimation: Estimate realistic weights in grams based on standard portion sizes.
3. Naming Rule (CRITICAL): For the ingredient 'name', output the base product followed by its specific type or cut in Russian (e.g., "курица грудка", "орех миндаль", "рис бурый"). If no specific type exists, output just the base noun (e.g., "огурец", "яйцо"). Drop cooking methods and brands.
4. AI Fallback Macros: For each ingredient, estimate realistic nutritional values (calories, protein, fat, carbs) per 100 grams. If exact values are unknown, provide an average.
Return data strictly matching the JSON schema.`;

    try {
        const result = await model.generateContent(prompt);
        const extractionResult = JSON.parse(result.response.text());

        const finalAnalysis = {
            mealName: extractionResult.mealName,
            totalCalories: 0,
            totalProtein: 0,
            totalFat: 0,
            totalCarbs: 0,
            ingredients: [] as any[],
        };

        // 4. Магия: Гибридный подсчет
        for (const item of extractionResult.ingredients) {
            // Ищем то, что выдала нейросеть, в нашей локальной БД
            const searchResults = fuse.search(item.name);

            // Базово - доверяем ИИ
            let macros = {
                calories: item.calories_per_100g,
                protein: item.protein_per_100g,
                fat: item.fat_per_100g,
                carbs: item.carbs_per_100g,
            };

            // Если нашли в базе уверенное совпадение — перезаписываем точными данными!
            if (searchResults.length > 0 && searchResults[0].score! < 0.4) {
                const bestMatch = searchResults[0].item;
                console.log(
                    `✅ Найдено в БД: ${bestMatch.name} (вместо догадки ИИ: ${item.name})`,
                );
                macros = {
                    calories: bestMatch.calories,
                    protein: bestMatch.protein,
                    fat: bestMatch.fat,
                    carbs: bestMatch.carbs,
                };
            } else {
                console.log(`🤖 Фоллбэк ИИ: ${item.name} (в БД не найдено)`);
            }

            // Рассчитываем итоговый вес
            const ratio = item.weight / 100;
            const calculatedItem = {
                name: item.name,
                weight: item.weight,
                calories: Math.round(macros.calories * ratio),
                protein: Math.round(macros.protein * ratio),
                fat: Math.round(macros.fat * ratio),
                carbs: Math.round(macros.carbs * ratio),
            };

            finalAnalysis.totalCalories += calculatedItem.calories;
            finalAnalysis.totalProtein += calculatedItem.protein;
            finalAnalysis.totalFat += calculatedItem.fat;
            finalAnalysis.totalCarbs += calculatedItem.carbs;

            finalAnalysis.ingredients.push(calculatedItem);
        }

        return finalAnalysis;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};

export const fetchAvailableModels = async (apiKey: string) => {
    try {
        let baseUrl = "https://generativelanguage.googleapis.com";

        const response = await fetch(`${baseUrl}/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return data.models
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
    } catch (error) {
        console.error("Fetch Models Error:", error);
        throw error;
    }
};
