import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Menu, Text, TouchableRipple, useTheme } from "react-native-paper";
import { MaterialSymbol } from "./MaterialSymbol";
import { GoalId } from "@/src/utils/userMath";

interface GoalMenuProps {
    currentGoal: GoalId;
    onGoalChange: (goal: GoalId) => void;
}

const GOAL_OPTIONS = [
    {
        id: "lose" as GoalId,
        label: "Сброс",
        fullLabel: "Сброс веса",
        icon: "trending_down",
    },
    {
        id: "maintain" as GoalId,
        label: "Баланс",
        fullLabel: "Поддержание",
        icon: "sync",
    },
    {
        id: "gain" as GoalId,
        label: "Набор",
        fullLabel: "Набор массы",
        icon: "trending_up",
    },
];

export const GoalMenu: React.FC<GoalMenuProps> = ({
    currentGoal,
    onGoalChange,
}) => {
    const theme = useTheme();
    const [visible, setVisible] = useState(false);

    const currentGoalInfo = GOAL_OPTIONS.find((g) => g.id === currentGoal)!;

    return (
        <Menu
            visible={visible}
            onDismiss={() => setVisible(false)}
            anchorPosition="bottom"
            contentStyle={{
                backgroundColor: theme.colors.elevation.level3,
                borderRadius: 20,
                marginTop: 4,
            }}
            anchor={
                <TouchableRipple
                    onPress={() => setVisible(true)}
                    style={[
                        styles.chip,
                        { backgroundColor: theme.colors.secondaryContainer },
                    ]}
                    borderless
                >
                    <View style={styles.chipContent}>
                        <MaterialSymbol
                            name={currentGoalInfo.icon}
                            size={18}
                            color={theme.colors.onSecondaryContainer}
                        />
                        <Text
                            variant="labelLarge"
                            style={{
                                color: theme.colors.onSecondaryContainer,
                                marginLeft: 8,
                                marginRight: 4,
                                fontWeight: "700",
                            }}
                        >
                            {currentGoalInfo.label}
                        </Text>
                        <MaterialSymbol
                            name="arrow_drop_down"
                            size={20}
                            color={theme.colors.onSecondaryContainer}
                        />
                    </View>
                </TouchableRipple>
            }
        >
            {GOAL_OPTIONS.map((option) => {
                const isSelected = currentGoal === option.id;
                return (
                    <Menu.Item
                        key={option.id}
                        onPress={() => {
                            onGoalChange(option.id);
                            setVisible(false);
                        }}
                        title={option.fullLabel}
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
                            maxWidth: 220,
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
    );
};

const styles = StyleSheet.create({
    chip: {
        borderRadius: 100,
        height: 44,
        justifyContent: "center",
        overflow: "hidden",
    },
    chipContent: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
    },
});
