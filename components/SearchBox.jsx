import React from 'react';
import { Box, Text } from 'ink';

const SearchBox = ({ searchQuery }) => {
  return (
    <Box marginBottom={1} backgroundColor="blue" paddingX={1}>
      <Text color="white" bold>Search: /{searchQuery}</Text>
      <Text color="gray" dimColor> • Press Enter to confirm or Escape to clear</Text>
    </Box>
  );
};

export default SearchBox;