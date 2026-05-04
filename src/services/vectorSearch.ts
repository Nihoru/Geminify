import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import metadataRaw from "../assets/metadata.json";
import skurikhinDBRaw from "../assets/skurihin_db.json";
import { SkurikhinCoefficients } from "../utils/nutritionMath";
const skurikhinDB = skurikhinDBRaw as any[];

export interface FoodMetadata {
    category: string;
    name: string;
}

const metadata = metadataRaw as FoodMetadata[];

let vectorsFloat32: Float32Array | null = null;
let vectorSize: number = 0;

export async function initVectorDB(): Promise<void> {
    const asset = Asset.fromModule(require("../assets/vectors.bin"));
    await asset.downloadAsync();

    if (!asset.localUri) {
        throw new Error("Не удалось получить локальный URI для vectors.bin");
    }

    const file = new File(asset.localUri);
    const uint8Array = await file.bytes();

    vectorsFloat32 = new Float32Array(uint8Array.buffer);
    const itemsCount = metadata.length;

    if (itemsCount === 0) {
        throw new Error(
            "Файл метаданных пуст. Невозможно вычислить размерность вектора.",
        );
    }

    vectorSize = vectorsFloat32.length / itemsCount;

    if (!Number.isInteger(vectorSize)) {
        throw new Error(
            `Нарушение целостности: общее количество значений (${vectorsFloat32.length}) не кратно количеству элементов (${itemsCount}).`,
        );
    }
}

function cosineSimilarity(
    vecA: number[] | Float32Array,
    vecBOffset: number,
    dbVectors: Float32Array,
): number {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (let i = 0; i < vectorSize; i++) {
        const valA = vecA[i];
        const valB = dbVectors[vecBOffset + i];

        dotProduct += valA * valB;
        normA += valA * valA;
        normB += valB * valB;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface SearchResult {
    item: FoodMetadata;
    score: number;
}

export function searchSimilarFood(
    userQueryVector: number[] | Float32Array,
): SearchResult | null {
    if (!vectorsFloat32 || vectorSize === 0) {
        throw new Error(
            "База не инициализирована! Вызови initVectorDB() перед поиском.",
        );
    }

    if (userQueryVector.length !== vectorSize) {
        throw new Error(
            `Размерность вектора запроса (${userQueryVector.length}) не совпадает с размерностью базы данных (${vectorSize}).`,
        );
    }

    let bestMatchIndex = -1;
    let maxSimilarity = -1;
    const itemsCount = metadata.length;

    for (let i = 0; i < itemsCount; i++) {
        const offset = i * vectorSize;
        const similarity = cosineSimilarity(
            userQueryVector,
            offset,
            vectorsFloat32,
        );

        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            bestMatchIndex = i;
        }
    }

    if (bestMatchIndex === -1) return null;

    return {
        item: metadata[bestMatchIndex],
        score: maxSimilarity,
    };
}

export function getSkurikhinCoefficients(
    category: string,
    name: string,
): SkurikhinCoefficients | null {
    const cat = skurikhinDB.find((c) => c.category === category);
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
