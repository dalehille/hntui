import React, { useContext } from 'react';
import { Box, Text } from 'ink';
import { ThemeContext } from '../index.jsx';

const StoryModal = ({ selectedStory, modalSelectedOption }) => {
  const { colors } = useContext(ThemeContext);

  // Determine if this source has separate comments (e.g., HN does, blogs don't)
  const hasComments = selectedStory.source === 'hackernews' ||
    (selectedStory.commentsUrl && selectedStory.commentsUrl !== selectedStory.url);

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
        <Text color={colors.primary} bold>Choose action:</Text>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        {hasComments && (
          <Box
            backgroundColor={modalSelectedOption === 0 ? colors.accent : undefined}
            paddingX={1}
            paddingY={0.5}
          >
            <Text color={modalSelectedOption === 0 ? colors.foreground : undefined}>
              1. Open comments
            </Text>
          </Box>
        )}

        <Box
          backgroundColor={modalSelectedOption === (hasComments ? 1 : 0) ? colors.accent : undefined}
          paddingX={1}
          paddingY={0.5}
          flexDirection="column"
        >
          <Text color={modalSelectedOption === (hasComments ? 1 : 0) ? colors.foreground : undefined}>
            {hasComments ? '2. ' : '1. '}
            {selectedStory.url ? 'Open article URL' : 'No external URL available'}
          </Text>
          {selectedStory.url && modalSelectedOption === (hasComments ? 1 : 0) && (
            <Text color={colors.foreground} dimColor={colors.dim}>
              {selectedStory.url}
            </Text>
          )}
        </Box>

        <Box
          backgroundColor={modalSelectedOption === (hasComments ? 2 : 1) ? colors.accent : undefined}
          paddingX={1}
          paddingY={0.5}
        >
          <Text color={modalSelectedOption === (hasComments ? 2 : 1) ? colors.foreground : undefined}>
            {hasComments ? '3. ' : '2. '}Remove from list
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