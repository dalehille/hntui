import React from 'react';
import { Box, Text } from 'ink';

const HelpMenu = () => {
    return (
        <Box
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="70%"
            borderStyle="round"
            borderColor="green"
            backgroundColor="black"
            padding={0}
            flexDirection="column"
        >
            <Box flexDirection="column" marginBottom={1}>
                <Box marginBottom={1}>
                    <Text color="yellow" bold>Navigation:</Text>
                </Box>

                <Box flexDirection="column" marginLeft={2}>
                    <Box marginBottom={0}>
                        <Text color="white">↑/↓ arrows or j/k</Text>
                        <Text dimColor> - Navigate stories</Text>
                    </Box>

                    <Box marginBottom={0}>
                        <Text color="white">gg</Text>
                        <Text dimColor> - Go to top</Text>
                    </Box>

                    <Box marginBottom={0}>
                        <Text color="white">G</Text>
                        <Text dimColor> - Go to bottom</Text>
                    </Box>
                </Box>

                <Box marginBottom={0} marginTop={1}>
                    <Text color="yellow" bold>Actions:</Text>
                </Box>

                <Box flexDirection="column" marginLeft={2}>
                    <Box marginBottom={0}>
                        <Text color="white">Enter</Text>
                        <Text dimColor> - Open story modal</Text>
                    </Box>

                    <Box marginBottom={0}>
                        <Text color="white">Space</Text>
                        <Text dimColor> - Open HN comments directly</Text>
                    </Box>

                    <Box marginBottom={0}>
                        <Text color="white">d</Text>
                        <Text dimColor> - Remove story from list</Text>
                    </Box>
                </Box>

                <Box marginBottom={0} marginTop={1}>
                    <Text color="yellow" bold>Search & Sort:</Text>
                </Box>

                <Box flexDirection="column" marginLeft={2}>
                    <Box marginBottom={0}>
                        <Text color="white">/</Text>
                        <Text dimColor> - Enter search mode</Text>
                    </Box>

                    <Box marginBottom={0}>
                        <Text color="white">s</Text>
                        <Text dimColor> - Toggle sort (comments/date)</Text>
                    </Box>

                    <Box marginBottom={0}>
                        <Text color="white">r</Text>
                        <Text dimColor> - Refresh stories</Text>
                    </Box>
                </Box>

                <Box marginBottom={0} marginTop={1}>
                    <Text color="yellow" bold>System:</Text>
                </Box>

                <Box flexDirection="column" marginLeft={2}>
                    <Box marginBottom={0}>
                        <Text color="white">?</Text>
                        <Text dimColor> - Show this help menu</Text>
                    </Box>

                    <Box marginBottom={0}>
                        <Text color="white">q or Ctrl+C</Text>
                        <Text dimColor> - Quit application</Text>
                    </Box>
                </Box>
            </Box>

            <Box>
                <Text dimColor>
                    Press Escape to close this help menu
                </Text>
            </Box>
        </Box>
    );
};

export default HelpMenu;
