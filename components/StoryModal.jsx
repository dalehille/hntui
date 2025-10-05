import React, { useContext } from 'react';
import { Box, Text } from 'ink';
import { ThemeContext } from '../index.jsx';

const StoryModal = ({ selectedStory, modalSelectedOption }) => {
  const { colors } = useContext(ThemeContext);

  return (
    <Box
      position="absolute"
      top="50%"
      left="50%"
      width="60%"
      height="40%"
      borderStyle="round"
      borderColor={colors.primary}
      backgroundColor={colors.background}
      padding={2}
      flexDirection="column"
    >
      <Box marginBottom={2}>
        <Text color={colors.primary} bold>Choose URL to open:</Text>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Box
          backgroundColor={modalSelectedOption === 0 ? colors.accent : undefined}
          paddingX={1}
          paddingY={0.5}
        >
          <Text color={modalSelectedOption === 0 ? colors.foreground : undefined}>
            1. Open comments
          </Text>
        </Box>

        <Box
          backgroundColor={modalSelectedOption === 1 ? colors.accent : undefined}
          paddingX={1}
          paddingY={0.5}
          flexDirection="column"
        >
          <Text color={modalSelectedOption === 1 ? colors.foreground : undefined}>
            {selectedStory.url ? '2. Open article URL' : '2. No external URL available'}
          </Text>
          {selectedStory.url && modalSelectedOption === 1 && (
            <Text color={colors.foreground} dimColor={colors.dim}>
              {selectedStory.url}
            </Text>
          )}
        </Box>

        <Box
          backgroundColor={modalSelectedOption === 2 ? colors.accent : undefined}
          paddingX={1}
          paddingY={0.5}
        >
          <Text color={modalSelectedOption === 2 ? colors.foreground : undefined}>
            3. Remove from list
          </Text>
        </Box>
      </Box>

      <Box>
        <Text dimColor={colors.dim}>
          Use j/k to navigate • Enter to select • Escape to cancel
        </Text>
      </Box>
    </Box>
  );
};

export default StoryModal;