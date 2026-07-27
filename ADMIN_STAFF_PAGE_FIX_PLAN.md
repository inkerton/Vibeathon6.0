# Admin Staff Page - JSX Tag Structure & Issues Fix Plan

## Problem Analysis

After analyzing `/frontend/app/admin/staff/page.tsx`, I've identified multiple critical issues:

### 1. **Mixed Component Libraries (MUI + Custom Components)**
- **Issue**: File imports and uses both Material-UI (MUI) components AND custom components
- **Problem**: MUI components like `TableHead`, `TableRow`, `TableCell`, `TableSortLabel`, `Box`, `TextField`, `FormControl`, `Select`, `MenuItem`, `Paper`, `TableContainer`, `Table`, `TableBody`, `TablePagination` are used but NOT imported
- **Impact**: Will cause runtime errors - "X is not defined"

### 2. **Inconsistent Table Cell Tags (Lines 519-530)**
- **Location**: Inside the table body mapping
- **Issue**: Mix of `<TableCell>` (MUI) and `<td>` (HTML) tags
- **Current Structure**:
  ```tsx
  <TableCell>{member.name}</TableCell>
  <TableCell>{member.email}</TableCell>
  <TableCell>{member.phone}</TableCell>
  <TableCell>
    <Badge variant={getRoleBadgeVariant(member.role)}>
      {member.role.toUpperCase()}
    </Badge>
  </TableCell>  // ❌ Missing closing tag here!
  <td>  // ❌ Should be TableCell
    <Badge variant={member.is_active ? 'success' : 'gray'}>
      {member.is_active ? 'Active' : 'Inactive'}
    </Badge>
  </td>
  <td>{new Date(member.created_at).toLocaleDateString()}</td>
  <td>
    <Button ... />
  </TableCell>  // ❌ Opening was <td>, closing is </TableCell>
  ```

### 3. **Missing Closing Tag (Line 524)**
- **Location**: After the role Badge
- **Issue**: `<TableCell>` opened but never closed before next `<td>` tag
- **Impact**: Invalid JSX structure

### 4. **Syntax Error in fetchStaff Function (Line 253)**
- **Location**: End of fetchStaff function
- **Issue**: Stray `}, 500);` that doesn't belong to any function call
- **Code**:
  ```tsx
  } finally {
    setLoading(false);
  }, 500);  // ❌ Invalid syntax - orphaned closing
  ```

### 5. **Wrong Property Names in Table Rendering (Lines 525-530)**
- **Issue**: Using snake_case backend properties instead of camelCase frontend properties
- **Examples**:
  - `member.is_active` should be `member.isActive`
  - `member.created_at` should be `member.createdAt`
- **Impact**: Will display undefined values

### 6. **Missing MUI Imports**
The following MUI components are used but not imported:
- `TableHead`
- `TableRow`
- `TableCell`
- `TableSortLabel`
- `Box`
- `TextField`
- `FormControl`
- `InputLabel`
- `Select`
- `MenuItem`
- `Paper`
- `TableContainer`
- `Table`
- `TableBody`
- `TablePagination`
- `visuallyHidden` (utility)

## Detailed Issues

### Issue #1: Missing MUI Imports
```tsx
// Current imports (incomplete)
import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { Toast } from '@/components/Toast';
import { apiClient } from '@/lib/api-client';

// Missing MUI imports needed:
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
```

### Issue #2: Inconsistent Table Tags (Lines 519-530)
```tsx
// BROKEN CODE
<TableRow hover key={member.id}>
  <TableCell>{member.name}</TableCell>
  <TableCell>{member.email}</TableCell>
  <TableCell>{member.phone}</TableCell>
  <TableCell>
    <Badge variant={getRoleBadgeVariant(member.role)}>
      {member.role.toUpperCase()}
    </Badge>
  </td>  // ❌ Wrong closing tag
  <td>   // ❌ Should be TableCell
    <Badge variant={member.is_active ? 'success' : 'gray'}>
      {member.is_active ? 'Active' : 'Inactive'}
    </Badge>
  </td>
  <td>{new Date(member.created_at).toLocaleDateString()}</td>
  <td>
    <Button ... />
  </TableCell>  // ❌ Wrong closing tag
</TableRow>
```

### Issue #3: Syntax Error in fetchStaff (Line 253)
```tsx
// BROKEN CODE
const fetchStaff = async () => {
  try {
    setLoading(true);
    setError('');
    const response = await apiClient.get('/staff');
    
    const staffData = response.data?.data || [];
    
    if (Array.isArray(staffData)) {
      setStaff(staffData.map(transformStaffResponse));
    } else {
      console.error('Staff data is not an array:', staffData);
      setStaff([]);
    }
  } catch (err: any) {
    console.error('Failed to fetch staff:', err);
    setError(err.response?.data?.message || err.message || 'Failed to load staff');
  } finally {
    setLoading(false);
  }, 500);  // ❌ Invalid syntax
};
```

### Issue #4: Wrong Property Names (Lines 525-530)
```tsx
// BROKEN CODE - using backend snake_case
<Badge variant={member.is_active ? 'success' : 'gray'}>
  {member.is_active ? 'Active' : 'Inactive'}
</Badge>
// ...
<td>{new Date(member.created_at).toLocaleDateString()}</td>

// SHOULD BE - using frontend camelCase
<Badge variant={member.isActive ? 'success' : 'gray'}>
  {member.isActive ? 'Active' : 'Inactive'}
</Badge>
// ...
<TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
```

## Fix Plan

### Step 1: Add Missing MUI Imports ✅
**Action**: Add all required MUI component imports at the top of the file

**Add after line 11**:
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
```

### Step 2: Fix fetchStaff Syntax Error ✅
**Action**: Remove the orphaned `}, 500);` at line 253

**Before** (lines 248-254):
```tsx
  } catch (err: any) {
    console.error('Failed to fetch staff:', err);
    setError(err.response?.data?.message || err.message || 'Failed to load staff');
  } finally {
    setLoading(false);
  }, 500);
};
```

**After**:
```tsx
  } catch (err: any) {
    console.error('Failed to fetch staff:', err);
    setError(err.response?.data?.message || err.message || 'Failed to load staff');
  } finally {
    setLoading(false);
  }
};
```

### Step 3: Fix Table Cell Tags and Property Names ✅
**Action**: Replace lines 519-530 with consistent TableCell tags and correct property names

**Before** (lines 519-530):
```tsx
<TableRow hover key={member.id}>
  <TableCell>{member.name}</TableCell>
  <TableCell>{member.email}</TableCell>
  <TableCell>{member.phone}</TableCell>
  <TableCell>
    <Badge variant={getRoleBadgeVariant(member.role)}>
      {member.role.toUpperCase()}
    </Badge>
  </td>
  <td>
    <Badge variant={member.is_active ? 'success' : 'gray'}>
      {member.is_active ? 'Active' : 'Inactive'}
    </Badge>
  </td>
  <td>{new Date(member.created_at).toLocaleDateString()}</td>
  <td>
    <Button
      size="sm"
      variant={member.is_active ? 'danger' : 'success'}
      onClick={() => handleToggleActive(member.id, member.is_active)}
    >
      {member.is_active ? 'Deactivate' : 'Activate'}
    </Button>
  </TableCell>
</TableRow>
```

**After**:
```tsx
<TableRow hover key={member.id}>
  <TableCell>{member.name}</TableCell>
  <TableCell>{member.email}</TableCell>
  <TableCell>{member.phone}</TableCell>
  <TableCell>
    <Badge variant={getRoleBadgeVariant(member.role)}>
      {member.role.toUpperCase()}
    </Badge>
  </TableCell>
  <TableCell>
    <Badge variant={member.isActive ? 'success' : 'gray'}>
      {member.isActive ? 'Active' : 'Inactive'}
    </Badge>
  </TableCell>
  <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
  <TableCell>
    <Button
      size="sm"
      variant={member.isActive ? 'danger' : 'success'}
      onClick={() => handleToggleActive(member.id, member.isActive)}
    >
      {member.isActive ? 'Deactivate' : 'Activate'}
    </Button>
  </TableCell>
</TableRow>
```

**Changes**:
- All `<td>` tags changed to `<TableCell>`
- All `</td>` tags changed to `</TableCell>`
- `member.is_active` changed to `member.isActive` (3 occurrences)
- `member.created_at` changed to `member.createdAt`

## Implementation Order

1. ✅ **Add MUI imports** (after line 11)
2. ✅ **Fix fetchStaff syntax error** (line 253)
3. ✅ **Fix table cell tags and property names** (lines 519-530)
4. ✅ **Test compilation** to ensure no errors

## Expected Outcome

After fixes:
- **All MUI components properly imported**
- **Consistent use of TableCell throughout the table**
- **No syntax errors in fetchStaff function**
- **Correct property names (camelCase) used**
- **All JSX tags properly matched and closed**
- **Page compiles and renders without errors**

## Testing Checklist

- [ ] Page renders without React errors
- [ ] Table displays staff data correctly
- [ ] Sorting functionality works
- [ ] Filtering by role and status works
- [ ] Search functionality works
- [ ] Pagination works correctly
- [ ] Create staff modal opens and submits
- [ ] Toggle active/inactive status works
- [ ] All badges display with correct colors
- [ ] No console errors related to undefined properties

## Files to Modify

1. `/frontend/app/admin/staff/page.tsx` - Main fix location

## Additional Notes

### Why MUI Components?
The file uses MUI's advanced table features:
- `TableSortLabel` for sortable columns
- `TablePagination` for pagination
- `TableHead`, `TableBody` for semantic structure
- MUI's styling system

### Alternative Approach
If you want to avoid MUI dependency, you would need to:
1. Replace all MUI table components with HTML `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`
2. Implement custom sorting UI
3. Implement custom pagination component
4. Replace `Box`, `TextField`, `FormControl`, `Select` with custom/Tailwind components

However, since the code already uses MUI patterns, it's better to complete the MUI implementation.

## Switch to Code Mode

Once this plan is approved, switch to **code mode** to implement the fixes.
