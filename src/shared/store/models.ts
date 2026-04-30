import { Realm, createRealmContext } from "@realm/react";

// 1. Самый нижний уровень - атомарный ингредиент
export class Ingredient extends Realm.Object<Ingredient> {
    name!: string;
    weight!: number;
    calories!: number;
    protein!: number;
    fat!: number;
    carbs!: number;

    static schema: Realm.ObjectSchema = {
        name: "Ingredient",
        embedded: true,
        properties: {
            name: "string",
            weight: "int",
            calories: "int",
            protein: "int",
            fat: "int",
            carbs: "int",
        },
    };
}

// 2. Средний уровень - блюдо (состоит из ингредиентов, либо это готовый продукт)
export class Dish extends Realm.Object<Dish> {
    name!: string; // Например, "Борщ" или "Сникерс"
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
            totalWeight: "int",
            totalCalories: "int",
            totalProtein: "int",
            totalFat: "int",
            totalCarbs: "int",
            ingredients: "Ingredient[]", // Связь один-ко-многим
        },
    };
}

// 3. Верхний уровень - весь прием пищи (Завтрак, Обед и т.д.)
export class Meal extends Realm.Object<Meal> {
    _id!: Realm.BSON.ObjectId;
    mealName!: string;
    createdAt!: Date;
    totalCalories!: number;
    totalProtein!: number;
    totalFat!: number;
    totalCarbs!: number;
    dishes!: Realm.List<Dish>; // Список блюд вместо сырых ингредиентов

    static schema: Realm.ObjectSchema = {
        name: "Meal",
        primaryKey: "_id",
        properties: {
            _id: { type: "objectId", default: () => new Realm.BSON.ObjectId() },
            mealName: "string",
            createdAt: { type: "date", default: () => new Date() },
            totalCalories: "int",
            totalProtein: "int",
            totalFat: "int",
            totalCarbs: "int",
            dishes: "Dish[]",
        },
    };
}

export const MealRealmContext = createRealmContext({
    schema: [Meal, Dish, Ingredient],
    schemaVersion: 2,
});
