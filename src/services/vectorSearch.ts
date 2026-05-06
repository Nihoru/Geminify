import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import metadataLossesRaw from "../assets/metadataLosses.json";
import skurikhinLossDBRaw from "../assets/skurihin_db.json";
import { RawFoodMacros, SkurikhinCoefficients } from "../utils/nutritionMath";

// --- Импорты для энергетической ценности (Сырье) ---
import energyTable1 from "../assets/energyTables/table-1.json";
import energyTable5 from "../assets/energyTables/table-5.json";
import energyTable6 from "../assets/energyTables/table-6.json";
import energyTable7 from "../assets/energyTables/table-7.json";
import energyTable8 from "../assets/energyTables/table-8.json";
import energyTable9 from "../assets/energyTables/table-9.json";
import metadataEnergyRaw from "../assets/metadataEnergy.json";

// Мапа для быстрого доступа к нужной таблице по её номеру
const energyTablesMap: Record<number, any[]> = {
    1: energyTable1,
    5: energyTable5,
    6: energyTable6,
    7: energyTable7,
    8: energyTable8,
    9: energyTable9,
};

// Типизация
export interface FoodMetadataLosses {
    category: string;
    name: string;
}

export interface FoodMetadataEnergy {
    table: number;
    category: string;
    name: string;
}

const metadataLosses = metadataLossesRaw as FoodMetadataLosses[];
const metadataEnergy = metadataEnergyRaw as FoodMetadataEnergy[];

// Состояния баз
let vectorsLossesFloat32: Float32Array | null = null;
let lossesVectorSize: number = 0;

let vectorsEnergyFloat32: Float32Array | null = null;
let energyVectorSize: number = 0;

export async function initVectorDB(): Promise<void> {
    console.log("[VectorDB] Инициализация баз данных...");

    // 1. Загрузка базы Потерь
    const assetLosses = Asset.fromModule(
        require("../assets/vectorsLosses.bin"),
    );
    await assetLosses.downloadAsync();
    if (!assetLosses.localUri)
        throw new Error("Не удалось загрузить vectorsLosses.bin");
    const fileLosses = new File(assetLosses.localUri);
    const uint8ArrayLosses = await fileLosses.bytes();
    vectorsLossesFloat32 = new Float32Array(uint8ArrayLosses.buffer);
    lossesVectorSize = vectorsLossesFloat32.length / metadataLosses.length;

    // 2. Загрузка базы Энергетической ценности (Сырье)
    const assetEnergy = Asset.fromModule(
        require("../assets/vectorsEnergy.bin"),
    );
    await assetEnergy.downloadAsync();
    if (!assetEnergy.localUri)
        throw new Error("Не удалось загрузить vectorsEnergy.bin");
    const fileEnergy = new File(assetEnergy.localUri);
    const uint8ArrayEnergy = await fileEnergy.bytes();
    vectorsEnergyFloat32 = new Float32Array(uint8ArrayEnergy.buffer);
    energyVectorSize = vectorsEnergyFloat32.length / metadataEnergy.length;

    console.log(
        `[VectorDB] ✅ Загружено. Losses Size: ${lossesVectorSize}, Energy Size: ${energyVectorSize}`,
    );
}

// Универсальная функция косинусного сходства
function cosineSimilarity(
    vecA: number[] | Float32Array,
    vecBOffset: number,
    dbVectors: Float32Array,
    vSize: number,
): number {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vSize; i++) {
        const valA = vecA[i];
        const valB = dbVectors[vecBOffset + i];
        dotProduct += valA * valB;
        normA += valA * valA;
        normB += valB * valB;
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Универсальный поиск
function searchInDB<T>(
    queryVector: number[] | Float32Array,
    dbVectors: Float32Array,
    metadata: T[],
    vSize: number,
) {
    let bestMatchIndex = -1;
    let maxSimilarity = -1;

    for (let i = 0; i < metadata.length; i++) {
        const offset = i * vSize;
        const similarity = cosineSimilarity(
            queryVector,
            offset,
            dbVectors,
            vSize,
        );
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            bestMatchIndex = i;
        }
    }

    if (bestMatchIndex === -1) return null;
    return { item: metadata[bestMatchIndex], score: maxSimilarity };
}

// Экспортируемые методы поиска
export function searchLosses(vector: number[] | Float32Array) {
    if (!vectorsLossesFloat32)
        throw new Error("База Losses не инициализирована");
    return searchInDB<FoodMetadataLosses>(
        vector,
        vectorsLossesFloat32,
        metadataLosses,
        lossesVectorSize,
    );
}

export function searchEnergy(vector: number[] | Float32Array) {
    if (!vectorsEnergyFloat32)
        throw new Error("База Energy не инициализирована");
    return searchInDB<FoodMetadataEnergy>(
        vector,
        vectorsEnergyFloat32,
        metadataEnergy,
        energyVectorSize,
    );
}

// Получение данных о потерях
export function getSkurikhinCoefficients(
    category: string,
    name: string,
): SkurikhinCoefficients | null {
    const cat = (skurikhinLossDBRaw as any[]).find(
        (c) => c.category === category,
    );
    if (!cat) return null;
    const item = cat.items.find((i: any) => i.name === name);
    if (!item) return null;

    const carbsLoss =
        typeof item.carbohydrates_loss_percent === "object"
            ? item.carbohydrates_loss_percent.mono_and_disaccharides || 0
            : item.carbohydrates_loss_percent || 0;

    return {
        mass_loss_percent: Number(item.mass_loss_percent) || 0,
        proteins_loss_percent: Number(item.proteins_loss_percent) || 0,
        fats_loss_percent: Number(item.fats_loss_percent) || 0,
        carbohydrates_loss_percent: Number(carbsLoss) || 0,
        energy_value_loss_percent: Number(item.energy_value_loss_percent) || 0,
    };
}

// НОВАЯ ФУНКЦИЯ: Получение макросов из таблиц энергии
export function getSkurikhinEnergyMacros(
    metadata: FoodMetadataEnergy,
): RawFoodMacros | null {
    const tableData = energyTablesMap[metadata.table];
    if (!tableData) return null;

    // Рекурсивная функция для поиска продукта с учетом вложенных subcategories
    function findItem(nodes: any[], currentPath: string): any {
        for (const node of nodes) {
            // Собираем путь аналогично тому, как он лежит в metadata
            const nodePath = currentPath
                ? `${currentPath} -> ${node.category}`
                : node.category;

            // Если в текущем узле есть массив items и путь совпадает с искомым
            if (node.items && nodePath === metadata.category) {
                const found = node.items.find(
                    (i: any) => i.name === metadata.name,
                );
                if (found) return found;
            }

            // Если есть вложенные подкатегории, проваливаемся глубже
            if (node.subcategories) {
                const foundInSub = findItem(node.subcategories, nodePath);
                if (foundInSub) return foundInSub;
            }
        }
        return null;
    }

    // Запускаем поиск по корневому массиву таблицы
    const item = findItem(tableData, "");

    if (!item) return null;

    // Обрабатываем углеводы: они могут быть объектом (крахмал + сахара) или числом
    let totalCarbs = 0;
    if (typeof item.carbohydrates === "object" && item.carbohydrates !== null) {
        totalCarbs =
            (item.carbohydrates.mono_and_disaccharides || 0) +
            (item.carbohydrates.starch || 0);
    } else {
        totalCarbs = Number(item.carbohydrates) || 0;
    }

    return {
        calories: Number(item.energy_value) || 0,
        protein: Number(item.proteins) || 0,
        fat: Number(item.fats) || 0,
        carbs: totalCarbs,
    };
}
