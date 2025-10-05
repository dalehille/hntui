import React, { useContext } from 'react';
import { Box, Text } from 'ink';
import { ThemeContext } from '../index.jsx';

const HelpMenu = () => {
    const { colors } = useContext(ThemeContext);

    return (
        <Box
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="90%"
            borderStyle="round"
            borderColor="green"
            backgroundColor={colors.background}
            padding={0}
            flexDirection="column"
        >
            <Box flexDirection="column" marginBottom={1}>
                <Box marginBottom={1}>
                    <Text color={colors.secondary} bold>Navigation:</Text>
                </Box>

                <Box flexDirection="column" marginLeft={2}>
                    <Box marginBottom={0}>
                        <Text color={colors.foreground}>↑/↓ arrows or j/k</Text>
                        <Text dimColor={colors.dim}> - Navigate stories</Text>
                    </Box>

                    <Box marginBottom={0}>
                        <Text color={colors.foreground}>gg</Text>
                        <Text dimColor={colors.dim}> - Go to top</Text>
                    </Box>

                    <Box marginBottom={0}>
                        <Text color={colors.foreground}>G</Text>
                        <Text dimColor={colors.dim}> - Go to bottom</Text>
                    </Box>

                    <Box marginBottom={0}>
                        <Text color={colors.foreground}>h/l or ←/→</Text>
                        <Text dimColor={colors.dim}> - Switch tabs</Text>
                    </Box>
                </Box>

                <Box marginBottom={0} marginTop={1}>
                    <Text color={colors.secondary} bold>Actions:</Text>
                </Box>

                <Box flexDirection="column" marginLeft={2}>
                    <Box marginBottom={0}>
                        <Text color={colors.foreground}>Enter or Space</Text>
                        <Text dimColor={colors.dim}> - Open the url</Text>
                    </Box>

                    <Box marginBottom={0}>
                        <Text color={colors.foreground}>d</Text>
                        <Text dimColor={colors.dim}> - Remove story from list</Text>
                    </Box>
                </Box>

                <Box marginBottom={0} marginTop={1}>
                    <Text color={colors.secondary} bold>Search & Sort:</Text>
                </Box>

                <Box flexDirection="column" marginLeft={2}>
                    <Box marginBottom={0}>
                        <Text color={colors.foreground}>/</Text>
                        <Text dimColor={colors.dim}> - Enter search mode</Text>
                    </Box>

                    <Box marginBottom={0}>
                        <Text color={colors.foreground}>s</Text>
                        <Text dimColor={colors.dim}> - Toggle sort (comments/date)</Text>
                    </Box>

                    <Box marginBottom={0}>
                        <Text color={colors.foreground}>r</Text>
                        <Text dimColor={colors.dim}> - Refresh stories</Text>
                    </Box>
                </Box>

                <Box marginBottom={0} marginTop={1}>
                    <Text color={colors.secondary} bold>System:</Text>
                </Box>

                <Box flexDirection="column" marginLeft={2}>
                    <Box marginBottom={0}>
                        <Text color={colors.foreground}>?</Text>
                        <Text dimColor={colors.dim}> - Show this help menu</Text>
                    </Box>

                    <Box marginBottom={0}>
                        <Text color={colors.foreground}>t</Text>
                        <Text dimColor={colors.dim}> - Toggle dark/light theme</Text>
                    </Box>

                    <Box marginBottom={0}>
                        <Text color={colors.foreground}>q or Ctrl+C</Text>
                        <Text dimColor={colors.dim}> - Quit application</Text>
                    </Box>
                </Box>
            </Box>

            <Box>
                <Text dimColor={colors.dim}>
                    Press Escape to close this help menu
                </Text>
            </Box>
        </Box>
    );
};

export default HelpMenu;
