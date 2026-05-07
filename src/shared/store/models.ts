import { Realm, createRealmContext } from "@realm/react";

// 1. Самый нижний уровень - атомарный ингредиент
export class Ingredient extends Realm.Object<Ingredient> {
    name!: string;
    cookedWeight!: number; // Заменили старый weight
    rawWeightEstimated!: number; // Новое поле (восстановленный сырой вес)
    calories!: number;
    protein!: number;
    fat!: number;
    carbs!: number;

    static schema: Realm.ObjectSchema = {
        name: "Ingredient",
        embedded: true,
        properties: {
            name: "string",
            cookedWeight: "int",
            rawWeightEstimated: "int",
            calories: "int",
            protein: "int",
            fat: "int",
            carbs: "int",
        },
    };
}

// 2. Средний уровень - блюдо
export class Dish extends Realm.Object<Dish> {
    name!: string;
    preparationMethod?: string; // Опциональное поле (со знаком ?)
    totalWeight!: number;
    totalCalories!: number;
    totalProtein!: number;
    totalFat!: number;
    totalCarbs!: number;
    ingredients!: Realm.List<Ingredient>;

    static schema: Realm.ObjectSchema = {
        name: "Dish",
        embedded: true,
        properties: {
            name: "string",
            preparationMethod: "string?", // Знак вопроса означает optional
            totalWeight: "int",
            totalCalories: "int",
            totalProtein: "int",
            totalFat: "int",
            totalCarbs: "int",
            ingredients: "Ingredient[]",
        },
    };
}

// 3. Верхний уровень - весь прием пищи
export class Meal extends Realm.Object<Meal> {
    _id!: Realm.BSON.ObjectId;
    mealName!: string;
    createdAt!: Date;
    totalWeight!: number; // Новое поле для всего приема пищи
    totalCalories!: number;
    totalProtein!: number;
    totalFat!: number;
    totalCarbs!: number;
    dishes!: Realm.List<Dish>;

    static schema: Realm.ObjectSchema = {
        name: "Meal",
        primaryKey: "_id",
        properties: {
            _id: { type: "objectId", default: () => new Realm.BSON.ObjectId() },
            mealName: "string",
            createdAt: { type: "date", default: () => new Date() },
            totalWeight: { type: "int", default: 0 }, // Защита для старых данных
            totalCalories: "int",
            totalProtein: "int",
            totalFat: "int",
            totalCarbs: "int",
            dishes: "Dish[]",
        },
    };
}

export class FoodProduct extends Realm.Object<FoodProduct> {
    _id!: Realm.BSON.ObjectId;
    brand!: string;
    baseName!: string;
    specs!: string;
    calories!: number;
    protein!: number;
    fat!: number;
    carbs!: number;
    barcode!: string;

    static schema: Realm.ObjectSchema = {
        name: "FoodProduct",
        primaryKey: "_id",
        properties: {
            _id: { type: "objectId", default: () => new Realm.BSON.ObjectId() },
            brand: { type: "string", default: "" },
            baseName: { type: "string", default: "" }, // мапим base_name из JSON сюда
            specs: { type: "string", default: "" },
            calories: { type: "double", default: 0 },
            protein: { type: "double", default: 0 },
            fat: { type: "double", default: 0 },
            carbs: { type: "double", default: 0 },
            barcode: { type: "string", default: "" },
        },
    };
}

export const MealRealmContext = createRealmContext({
    // Добавили FoodProduct в массив
    schema: [Meal, Dish, Ingredient, FoodProduct],
    schemaVersion: 4, // Подняли версию базы данных!
    onMigration: (oldRealm, newRealm) => {
        // Твоя предыдущая миграция для версии 3 остается здесь
        if (oldRealm.schemaVersion < 3) {
            const oldMeals = oldRealm.objects("Meal");
            const newMeals = newRealm.objects<Meal>("Meal");

            for (let i = 0; i < oldMeals.length; i++) {
                const oldMeal = oldMeals[i] as any;
                const newMeal = newMeals[i];

                for (let j = 0; j < oldMeal.dishes.length; j++) {
                    const oldDish = oldMeal.dishes[j];
                    const newDish = newMeal.dishes[j];

                    for (let k = 0; k < oldDish.ingredients.length; k++) {
                        const oldIng = oldDish.ingredients[k];
                        const newIng = newDish.ingredients[k];

                        const oldWeight = oldIng.weight || 0;
                        newIng.cookedWeight = oldWeight;
                        newIng.rawWeightEstimated = oldWeight;
                    }
                }
            }
        }
        // Для версии 4 писать миграцию не нужно, так как мы просто создали новую пустую таблицу
    },
});
