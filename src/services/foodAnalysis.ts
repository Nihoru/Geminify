import Realm from "realm";
import {
    calculateCookedNutrients,
    SkurikhinCoefficients,
} from "../utils/nutritionMath";
import { foodSearchService } from "./foodSearch";
import { llmService } from "./llmService";
import {
    getSkurikhinCoefficients,
    getSkurikhinEnergyMacros,
    searchEnergy,
    searchLosses,
} from "./vectorSearch";

const VECTOR_MATCH_THRESHOLD_DISH = 0.85; // Порог для целого блюда (потери)
const VECTOR_MATCH_THRESHOLD_ING = 0.8; // Порог для отдельного ингредиента

export class FoodAnalysisService {
    public async analyzeText(textPrompt: string, realm: Realm) {
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

            // 2. Глобальный векторный поиск ПОТЕРЬ (Блюдо целиком)
            let appliedDishLosses: SkurikhinCoefficients | null = null;

            if (
                dishData.preparationMethod &&
                dishData.preparationMethod.toLowerCase() !== "без обработки"
            ) {
                const dishQuery = `Категория: ${dishData.dishCategory}; Блюдо: ${dishData.dishName}, ${dishData.preparationMethod}`;
                const dishVector =
                    await llmService.generateEmbedding(dishQuery);
                const dishMatch = searchLosses(dishVector);

                if (
                    dishMatch &&
                    dishMatch.score >= VECTOR_MATCH_THRESHOLD_DISH
                ) {
                    console.log(
                        `[Orchestrator] ✅ Найдены потери для целого блюда (Скурихин): "${dishMatch.item.name}" (score: ${dishMatch.score.toFixed(2)})`,
                    );
                    appliedDishLosses = getSkurikhinCoefficients(
                        dishMatch.item.category,
                        dishMatch.item.name,
                    );
                } else {
                    console.log(
                        `[Orchestrator] ⚠️ Потери для целого блюда не найдены (лучший score: ${dishMatch?.score?.toFixed(2)}). Переход к ингредиентам.`,
                    );
                }
            }

            // 3. Обработка ингредиентов
            for (const item of dishData.ingredients) {
                console.log(
                    `  - Ингредиент: "${item.name}" (${item.weight}г готового, метод: ${item.preparationMethod}, Target: ${item.searchTarget})`,
                );

                let rawMacros = null;

                // А. МАРШРУТИЗАЦИЯ ПОИСКА СЫРЬЯ
                if (item.searchTarget === "openfood") {
                    // ПУТЬ 1: Готовая коммерческая еда (Fuse.js)
                    const { match: rawProduct } =
                        foodSearchService.findBestMatch(
                            realm,
                            item.name,
                            item.searchQueries,
                        );

                    if (rawProduct) {
                        console.log(
                            `    🔍 Найдено в OpenFood: ${rawProduct.base_name}`,
                        );
                        rawMacros = {
                            calories: rawProduct.calories,
                            protein: rawProduct.protein,
                            fat: rawProduct.fat,
                            carbs: rawProduct.carbs,
                        };
                    }
                } else {
                    // ПУТЬ 2: Монопродукты и сырье (Скурихин Векторный Поиск)
                    // Используем категорию ингредиента, если есть, иначе категорию блюда
                    const categoryContext =
                        item.category || dishData.dishCategory;
                    const energyQuery = `Категория: ${categoryContext}; Продукт: ${item.name}`;

                    const energyVector =
                        await llmService.generateEmbedding(energyQuery);
                    const energyMatch = searchEnergy(energyVector);

                    if (
                        energyMatch &&
                        energyMatch.score >= VECTOR_MATCH_THRESHOLD_ING
                    ) {
                        console.log(
                            `    ✅ Найдено сырье в Скурихине: "${energyMatch.item.name}" (score: ${energyMatch.score.toFixed(2)})`,
                        );
                        rawMacros = getSkurikhinEnergyMacros(energyMatch.item);
                    } else {
                        console.log(
                            `    ⚠️ Сырье в Скурихине не найдено (лучший score: ${energyMatch?.score?.toFixed(2)}).`,
                        );
                    }
                }

                // Fallback: Если нигде не нашли, используем предсказания ИИ
                if (!rawMacros) {
                    console.log(
                        `    🤖 Продукт не найден в базах, используем ИИ-макросы.`,
                    );
                    rawMacros = {
                        calories: item.calories_per_100g,
                        protein: item.protein_per_100g,
                        fat: item.fat_per_100g,
                        carbs: item.carbs_per_100g,
                    };
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
                    const categoryContext =
                        item.category || dishData.dishCategory;
                    const ingQuery = `Категория: ${categoryContext}; Блюдо: ${item.name}, ${item.preparationMethod}`;
                    const ingVector =
                        await llmService.generateEmbedding(ingQuery);
                    const ingMatch = searchLosses(ingVector);

                    if (
                        ingMatch &&
                        ingMatch.score >= VECTOR_MATCH_THRESHOLD_ING
                    ) {
                        console.log(
                            `    ✅ Найден метод потерь у Скурихина для ингредиента: "${ingMatch.item.name}"`,
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
                        `    🤖 Используем Fallback коэффициенты потерь от ИИ`,
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
