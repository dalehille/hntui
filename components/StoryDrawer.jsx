import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { useAnimation } from '../hooks/useAnimation.js';

const StoryDrawer = ({ selectedStory, drawerSelectedOption, isOpen = true }) => {
    const { progress, isVisible } = useAnimation(isOpen, 250, 'easeOut');
    const { stdout } = useStdout();

    // Don't render if not visible
    if (!isVisible) {
        return null;
    }

    // Calculate animated width anchored to the right edge in terminal columns
    // When progress = 0: width = 0 (hidden)
    // When progress = 1: width = half of terminal columns
    const columns = stdout?.columns ?? 80;
    const targetWidth = Math.max(20, Math.floor(columns / 2));
    const animatedWidth = Math.max(0, Math.floor(targetWidth * progress));

    return (
        <Box
            position="absolute"
            top={0}
            right={0}
            width={animatedWidth}
            height="100%"
            backgroundColor="black"
            padding={2}
            flexDirection="column"
            borderStyle="round"
            borderColor="cyan"
            borderLeft={true}
        >
            <Box marginBottom={2}>
                <Text color="cyan" bold>Choose URL to open:</Text>
            </Box>

            <Box flexDirection="column" marginBottom={2}>
                <Box
                    backgroundColor={drawerSelectedOption === 0 ? 'blue' : undefined}
                    paddingX={1}
                    paddingY={0.5}
                >
                    <Text color={drawerSelectedOption === 0 ? 'white' : undefined}>
                        1. Open Hacker News comments
                    </Text>
                </Box>

                <Box
                    backgroundColor={drawerSelectedOption === 1 ? 'blue' : undefined}
                    paddingX={1}
                    paddingY={0.5}
                    flexDirection="column"
                >
                    <Text color={drawerSelectedOption === 1 ? 'white' : undefined}>
                        {selectedStory.url ? '2. Open article URL' : '2. No external URL available'}
                    </Text>
                    {selectedStory.url && drawerSelectedOption === 1 && (
                        <Text color="white" dimColor>
                            {selectedStory.url}
                        </Text>
                    )}
                </Box>

                <Box
                    backgroundColor={drawerSelectedOption === 2 ? 'blue' : undefined}
                    paddingX={1}
                    paddingY={0.5}
                >
                    <Text color={drawerSelectedOption === 2 ? 'white' : undefined}>
                        3. Remove from list
                    </Text>
                </Box>
            </Box>

            <Box>
                <Text dimColor>
                    Use j/k to navigate • Enter to select • Escape to cancel
                </Text>
            </Box>
        </Box>
    );
};

export default StoryDrawer;
