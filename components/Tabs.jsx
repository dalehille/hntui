import React, { useContext } from 'react';
import { Box, Text } from 'ink';
import { ThemeContext } from '../index.jsx';

const Tabs = ({ tabs, activeTabIndex }) => {
    const { colors } = useContext(ThemeContext);

    return (
        <Box marginBottom={1}>
            {tabs.map((tab, index) => {
                const isActive = index === activeTabIndex;

                return (
                    <Box key={tab.id} marginRight={1}>
                        <Box
                            paddingX={2}
                            paddingY={0}
                            borderStyle={isActive ? "double" : "single"}
                            borderColor={isActive ? colors.primary : colors.dim}
                        >
                            <Text
                                color={isActive ? colors.primary : colors.dim}
                                bold={isActive}
                            >
                                {tab.title}
                            </Text>
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
};

export default Tabs;

