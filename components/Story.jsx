import React from 'react';
import { Text, Box } from 'ink';

const Story = ({ story, index, isSelected }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  const formatTitle = (title, maxLength = 70) => {
    return title.length > maxLength ? title.slice(0, maxLength) + '...' : title;
  };

  const formatUrl = (url) => {
    if (!url) return '';
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  };

  const bgColor = isSelected ? 'blue' : undefined;
  const textColor = isSelected ? 'white' : undefined;

  return (
    <Box key={story.id} backgroundColor={bgColor} paddingX={1}>
      <Box width={3}>
        <Text color={textColor}>
          {(index + 1).toString().padStart(2, ' ')}.
        </Text>
      </Box>

      <Box flexDirection="column" flexGrow={1}>
        <Box>
          <Text color={isSelected ? "yellow" : textColor} bold={isSelected}>
            {formatTitle(story.title)}
          </Text>
          {story.url && (
            <Text color={isSelected ? textColor : "gray"} dimColor={!isSelected}>
              {' '}({formatUrl(story.url)})
            </Text>
          )}
        </Box>

        <Box>
          <Text color={isSelected ? textColor : "gray"} dimColor={!isSelected}>
            {story.score || 0} points by {story.by} {formatTime(story.time)}
          </Text>
          <Text color={isSelected ? textColor : "red"} dimColor={!isSelected}>
            {' '}| {story.descendants || 0} comments
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default Story;