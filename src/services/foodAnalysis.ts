import {
    calculateCookedNutrients,
    SkurikhinCoefficients,
} from "../utils/nutritionMath";
import { foodSearchService } from "./foodSearch";
import { llmService } from "./llmService";
import { getSkurikhinCoefficients, searchSimilarFood } from "./vectorSearch";

// Импортируем тяжелую базу для извлечения коэффициентов
import skurikhinDBRaw from "../assets/skurihin_db.json";
const skurikhinDB = skurikhinDBRaw as any[];

const VECTOR_MATCH_THRESHOLD_DISH = 0.85; // Порог для целого блюда
const VECTOR_MATCH_THRESHOLD_ING = 0.8; // Порог для отдельного ингредиента

export class FoodAnalysisService {
    public async analyzeText(textPrompt: string) {
        console.log(`[Orchestrator] 🚀 Запуск анализа: "${textPrompt}"`);

        // 1. Экстракция данных через LLM
        const extractionResult = await llmService.extractFoodData(textPrompt);

        const finalAnalysis = {
            mealName: extractionResult.mealName,
            totalCalories: 0,
            totalProtein: 0,
            totalFat: 0,
            totalCarbs: 0,
            totalWeight: 0,
            dishes: [] as any[],
        };

        // Обработка каждого блюда
        for (const dishData of extractionResult.dishes) {
            console.log(
                `\n[Orchestrator] 🍲 Обработка блюда: "${dishData.dishName}" (${dishData.preparationMethod})`,
            );

            const dish = {
                name: dishData.dishName,
                preparationMethod: dishData.preparationMethod,
                totalWeight: 0,
                totalCalories: 0,
                totalProtein: 0,
                totalFat: 0,
                totalCarbs: 0,
                ingredients: [] as any[],
            };

            // 2. Глобальный векторный поиск (Блюдо целиком)
            let appliedDishLosses: SkurikhinCoefficients | null = null;

            if (
                dishData.preparationMethod &&
                dishData.preparationMethod.toLowerCase() !== "без обработки"
            ) {
                const dishQuery = `Категория: ${dishData.dishCategory}; Блюдо: ${dishData.dishName}, ${dishData.preparationMethod}`;
                const dishVector =
                    await llmService.generateEmbedding(dishQuery);
                const dishMatch = searchSimilarFood(dishVector);

                if (
                    dishMatch &&
                    dishMatch.score >= VECTOR_MATCH_THRESHOLD_DISH
                ) {
                    console.log(
                        `[Orchestrator] ✅ Найдено целое блюдо у Скурихина: "${dishMatch.item.name}" (score: ${dishMatch.score.toFixed(2)})`,
                    );
                    appliedDishLosses = getSkurikhinCoefficients(
                        dishMatch.item.category,
                        dishMatch.item.name,
                    );
                } else {
                    console.log(
                        `[Orchestrator] ⚠️ Целое блюдо не найдено (лучший score: ${dishMatch?.score?.toFixed(2)}). Переход к ингредиентам.`,
                    );
                }
            }

            // 3. Обработка ингредиентов
            for (const item of dishData.ingredients) {
                console.log(
                    `  - Ингредиент: "${item.name}" (${item.weight}г готового, метод: ${item.preparationMethod})`,
                );

                // А. Поиск сырья в OpenFood (Fuse.js)
                const { match: rawProduct } = foodSearchService.findBestMatch(
                    item.name,
                    item.searchQueries,
                );

                const rawMacros = rawProduct
                    ? {
                          calories: rawProduct.calories,
                          protein: rawProduct.protein,
                          fat: rawProduct.fat,
                          carbs: rawProduct.carbs,
                      }
                    : {
                          calories: item.calories_per_100g,
                          protein: item.protein_per_100g,
                          fat: item.fat_per_100g,
                          carbs: item.carbs_per_100g,
                      };

                if (rawProduct) {
                    console.log(
                        `    🔍 Найдено сырье: ${rawProduct.base_name}`,
                    );
                } else {
                    console.log(
                        `    ⚠️ Сырье не найдено, используем ИИ-макросы.`,
                    );
                }

                // B. Каскад коэффициентов (Блюдо -> Ингредиент -> Fallback ИИ)
                let currentLosses = appliedDishLosses;

                // Если блюдо целиком не подошло, ищем коэффициенты локально для ингредиента
                if (
                    !currentLosses &&
                    item.preparationMethod &&
                    item.preparationMethod.toLowerCase() !== "без обработки" &&
                    item.preparationMethod.toLowerCase() !== "сырой"
                ) {
                    const ingQuery = `Категория: ${dishData.category}; Блюдо: ${item.name}, ${item.preparationMethod}`;
                    const ingVector =
                        await llmService.generateEmbedding(ingQuery);
                    const ingMatch = searchSimilarFood(ingVector);

                    if (
                        ingMatch &&
                        ingMatch.score >= VECTOR_MATCH_THRESHOLD_ING
                    ) {
                        console.log(
                            `    ✅ Найден метод у Скурихина для ингредиента: "${ingMatch.item.name}"`,
                        );
                        currentLosses = getSkurikhinCoefficients(
                            ingMatch.item.category,
                            ingMatch.item.name,
                        );
                    }
                }

                // Если и ингредиент не нашли, используем то, что предсказал ИИ для блюда в целом
                if (!currentLosses) {
                    console.log(
                        `    🤖 Используем Fallback коэффициенты от ИИ`,
                    );
                    currentLosses = {
                        mass_loss_percent:
                            dishData.estimated_dish_loss.mass_loss_percent,
                        proteins_loss_percent:
                            dishData.estimated_dish_loss.proteins_loss_percent,
                        fats_loss_percent:
                            dishData.estimated_dish_loss.fats_loss_percent,
                        carbohydrates_loss_percent:
                            dishData.estimated_dish_loss
                                .carbohydrates_loss_percent,
                        energy_value_loss_percent:
                            dishData.estimated_dish_loss
                                .energy_value_loss_percent,
                    };
                }

                // C. Математический расчет (Reverse Mass + Потери)
                const calculatedItem = calculateCookedNutrients(
                    item.name,
                    item.weight, // Вес готового блюда от ИИ
                    rawMacros,
                    currentLosses,
                );

                console.log(
                    `    📊 Расчет: ${calculatedItem.rawWeightEstimated}г сырого -> ${calculatedItem.cookedWeight}г готового. Ккал: ${calculatedItem.calories}`,
                );

                // Суммирование макросов по блюду
                dish.totalWeight += calculatedItem.cookedWeight;
                dish.totalCalories += calculatedItem.calories;
                dish.totalProtein += calculatedItem.protein;
                dish.totalFat += calculatedItem.fat;
                dish.totalCarbs += calculatedItem.carbs;
                dish.ingredients.push(calculatedItem);
            }

            // Суммирование по всему приему пищи
            finalAnalysis.totalWeight += dish.totalWeight;
            finalAnalysis.totalCalories += dish.totalCalories;
            finalAnalysis.totalProtein += dish.totalProtein;
            finalAnalysis.totalFat += dish.totalFat;
            finalAnalysis.totalCarbs += dish.totalCarbs;
            finalAnalysis.dishes.push(dish);
        }

        console.log(
            `[Orchestrator] 🎉 Анализ завершен! Итого: ${finalAnalysis.totalWeight}г, ${finalAnalysis.totalCalories} ккал.`,
        );
        return finalAnalysis;
    }
}

export const foodAnalysisService = new FoodAnalysisService();
