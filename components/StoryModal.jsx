import React from 'react';
import { Box, Text } from 'ink';

const StoryModal = ({ selectedStory, modalSelectedOption }) => {
  return (
    <Box
      position="absolute"
      top="50%"
      left="50%"
      width="60%"
      height="40%"
      borderStyle="round"
      borderColor="cyan"
      backgroundColor="black"
      padding={2}
      flexDirection="column"
    >
      <Box marginBottom={2}>
        <Text color="cyan" bold>Choose URL to open:</Text>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Box
          backgroundColor={modalSelectedOption === 0 ? 'blue' : undefined}
          paddingX={1}
          paddingY={0.5}
        >
          <Text color={modalSelectedOption === 0 ? 'white' : undefined}>
            1. Open Hacker News comments
          </Text>
        </Box>

        <Box
          backgroundColor={modalSelectedOption === 1 ? 'blue' : undefined}
          paddingX={1}
          paddingY={0.5}
          flexDirection="column"
        >
          <Text color={modalSelectedOption === 1 ? 'white' : undefined}>
            {selectedStory.url ? '2. Open article URL' : '2. No external URL available'}
          </Text>
          {selectedStory.url && modalSelectedOption === 1 && (
            <Text color="white" dimColor>
              {selectedStory.url}
            </Text>
          )}
        </Box>

        <Box
          backgroundColor={modalSelectedOption === 2 ? 'blue' : undefined}
          paddingX={1}
          paddingY={0.5}
        >
          <Text color={modalSelectedOption === 2 ? 'white' : undefined}>
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

export default StoryModal;