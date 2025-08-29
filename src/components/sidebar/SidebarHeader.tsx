import { Box, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Tooltip, Divider } from '@mui/material';
import { Add as AddIcon, DeleteSweep as DeleteSweepIcon } from '@mui/icons-material';
import { UI_MESSAGES } from '../../constants/app';

interface SidebarHeaderProps {
  onNew: () => void;
  onClearHistory: () => void;
  hasConversations: boolean;
  isLoading?: boolean;
}

export const SidebarHeader = ({
  onNew,
  onClearHistory,
  hasConversations,
  isLoading = false,
}: SidebarHeaderProps) => {
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <ListItem disablePadding sx={{ flex: 1 }}>
          <ListItemButton
            onClick={onNew}
            disabled={isLoading}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              '&:hover': {
                borderColor: 'primary.main',
              },
            }}
          >
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary="New Chat" />
          </ListItemButton>
        </ListItem>
        
        {hasConversations && (
          <Tooltip title={UI_MESSAGES.CLEAR_HISTORY_TOOLTIP}>
            <IconButton 
              onClick={onClearHistory}
              disabled={isLoading}
              color="inherit"
              size="large"
              sx={{ ml: 1 }}
            >
              <DeleteSweepIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <Divider />
    </Box>
  );
};
