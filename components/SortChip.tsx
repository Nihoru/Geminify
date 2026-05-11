import { SortOption } from "@/src/utils/searchHelpers";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Menu, TouchableRipple, useTheme } from "react-native-paper";
import { MaterialSymbol } from "./MaterialSymbol";

interface SortChipProps {
    sortBy: SortOption;
    onSortChange: (option: SortOption) => void;
    isDescending: boolean;
    onDirectionChange: (desc: boolean) => void;
}

const SORT_OPTIONS: { id: SortOption; label: string; icon: string }[] = [
    { id: "relevance", label: "Точность совпадения", icon: "sort_by_alpha" },
    { id: "calories", label: "Калорийность", icon: "bolt" },
    { id: "protein", label: "Белки", icon: "fitness_center" },
    { id: "fat", label: "Жиры", icon: "water_drop" },
    { id: "carbs", label: "Углеводы", icon: "cookie" },
];

export const SortChip: React.FC<SortChipProps> = ({
    sortBy,
    onSortChange,
    isDescending,
    onDirectionChange,
}) => {
    const theme = useTheme();
    const [visible, setVisible] = useState(false);

    const currentOption = SORT_OPTIONS.find((o) => o.id === sortBy)!;

    return (
        <View style={styles.container}>
            <Menu
                visible={visible}
                onDismiss={() => setVisible(false)}
                anchorPosition="bottom"
                contentStyle={{
                    backgroundColor: theme.colors.elevation.level3,
                    borderRadius: 20,
                    marginTop: 4, // Небольшой отступ, чтобы не перекрывать кнопку
                }}
                anchor={
                    <TouchableRipple
                        onPress={() => setVisible(true)}
                        style={[
                            styles.chip,
                            { backgroundColor: theme.colors.surfaceVariant },
                        ]}
                        borderless
                    >
                        <View style={styles.chipContent}>
                            <MaterialSymbol
                                name={currentOption.icon}
                                size={22}
                                color={theme.colors.onSurfaceVariant}
                            />
                            <MaterialSymbol
                                name="arrow_drop_down"
                                size={20}
                                color={theme.colors.onSurfaceVariant}
                                style={{ marginLeft: 4 }}
                            />
                        </View>
                    </TouchableRipple>
                }
            >
                {SORT_OPTIONS.map((option) => {
                    const isSelected = sortBy === option.id;
                    return (
                        <Menu.Item
                            key={option.id}
                            onPress={() => {
                                onSortChange(option.id);
                                setVisible(false);
                            }}
                            title={option.label}
                            leadingIcon={(props) => (
                                <MaterialSymbol
                                    name={option.icon}
                                    size={24}
                                    color={
                                        isSelected
                                            ? theme.colors.onSecondaryContainer
                                            : props.color
                                    }
                                />
                            )}
                            style={{
                                backgroundColor: isSelected
                                    ? theme.colors.secondaryContainer
                                    : undefined,
                                borderRadius: 12,
                                marginHorizontal: 8,
                                marginVertical: 2,
                            }}
                            titleStyle={{
                                color: isSelected
                                    ? theme.colors.onSecondaryContainer
                                    : theme.colors.onSurface,
                                fontWeight: isSelected ? "700" : "400",
                            }}
                        />
                    );
                })}
            </Menu>

            {sortBy !== "relevance" && (
                <TouchableRipple
                    onPress={() => onDirectionChange(!isDescending)}
                    style={[
                        styles.directionButton,
                        { backgroundColor: theme.colors.primaryContainer },
                    ]}
                    borderless
                >
                    <MaterialSymbol
                        name={isDescending ? "south" : "north"}
                        size={20}
                        color={theme.colors.onPrimaryContainer}
                    />
                </TouchableRipple>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    chip: {
        borderRadius: 20,
        height: 40,
        width: 64, // Фиксированная ширина для иконки и стрелочки
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    chipContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    directionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
});
