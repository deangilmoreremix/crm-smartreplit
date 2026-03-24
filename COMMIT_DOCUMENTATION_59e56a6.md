# Commit: 59e56a6 - fix: Use CSS variables for consistent theming in Auth pages

## Summary

Replaced hardcoded background color classes with CSS variables in authentication pages to ensure consistent theming support for white-label customization.

## Changes Made

### 1. SignInPage.tsx
- Replaced `${isDark ? 'bg-gray-900' : 'bg-gray-50'}` with `bg-background`
- Applied consistent theming approach using the CSS variable system

### 2. SignUpPage.tsx  
- Replaced `${isDark ? 'bg-gray-900' : 'bg-gray-50'}` with `bg-background`
- Applied consistent theming approach using the CSS variable system

## Technical Details

### CSS Variable System

The project uses CSS custom properties for theming:
- `--background`: Primary background color (adapts to light/dark mode)
- `--foreground`: Primary text color
- `--primary`: Primary brand color
- `--primary-foreground`: Text color on primary background

These variables are defined in `client/src/index.css` and support white-label theme customization through the theme manager system.

## Files Modified

- `client/src/pages/SignInPage.tsx`
- `client/src/pages/SignUpPage.tsx`

## Related Commits

- Previous commits 322e255 and 5a000c2 also updated WhiteLabel pages to use CSS variables for design consistency
