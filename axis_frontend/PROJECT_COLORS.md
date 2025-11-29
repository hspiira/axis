# Project Color Palette Reference

This document defines the official color palette used throughout the AXIS frontend application. All components should use these colors to maintain visual consistency.

## Primary Brand Colors

### Emerald (Primary Action Color)
- **Primary**: `emerald-500` - Main brand color for primary actions
- **Light**: `emerald-300` - Hover states, active text
- **Medium**: `emerald-400` - Icons, secondary emphasis
- **Background (20% opacity)**: `emerald-500/20` - Active states, selected items
- **Background (10% opacity)**: `emerald-500/10` - Hover states
- **Border (30% opacity)**: `emerald-500/30` - Active item borders

**Usage Examples:**
- Primary buttons: `bg-emerald-600 hover:bg-emerald-700 text-white`
- Active navigation items: `bg-emerald-500/20 text-emerald-300 border border-emerald-500/30`
- Hover states: `hover:text-emerald-300 hover:bg-emerald-500/10`
- Icons: `text-emerald-400`

## Background Colors

### Main Background
- **Page Background**: `bg-[#100f0a]` - Dark brown/black base color
- **Sidebar Background**: `bg-gray-900/50` - Semi-transparent dark gray
- **Header Background**: `bg-black/50` - Semi-transparent black with backdrop blur
- **Card/Container Background**: `bg-white/5` - Very subtle white overlay
- **Modal/Dropdown Background**: `bg-gray-900` or `bg-gray-900/95` - Solid dark background

## Text Colors

### Primary Text
- **Main Text**: `text-white` - Primary content text
- **Secondary Text**: `text-gray-300` - Secondary content, descriptions
- **Tertiary Text**: `text-gray-400` - Less important text, labels
- **Muted Text**: `text-gray-500` - Very subtle text, placeholders
- **Disabled Text**: `text-gray-600` - Disabled or inactive text

## Border Colors

- **Default Border**: `border-white/10` - Standard borders
- **Hover Border**: `border-white/20` - Hover state borders
- **Active Border**: `border-emerald-500/30` - Active/selected item borders

## Status Colors

### Success/Active
- **Text**: `text-emerald-400`
- **Background**: `bg-emerald-500/20`
- **Border**: `border-emerald-500/30`

### Warning
- **Text**: `text-yellow-400`
- **Background**: `bg-yellow-500/20`
- **Border**: `border-yellow-500/30`

### Error/Danger
- **Text**: `text-red-400`
- **Background**: `bg-red-500/20`
- **Border**: `border-red-500/30`
- **Hover**: `hover:bg-red-500/10 hover:text-red-300`

### Info/Neutral
- **Text**: `text-gray-400`
- **Background**: `bg-gray-500/20`
- **Border**: `border-gray-500/30`

### Archived/Inactive
- **Text**: `text-slate-400` or `text-gray-400`
- **Background**: `bg-slate-500/20` or `bg-gray-500/20`

## Accent Colors

### Purple (Secondary Accent)
- **Text**: `text-purple-400`
- **Background**: `bg-purple-500/20` or `bg-purple-500/10`
- **Border**: `border-purple-500/20` or `border-purple-500/30`

### Yellow/Amber (Warning/Attention)
- **Text**: `text-yellow-400` or `text-amber-400`
- **Background**: `bg-yellow-500/20` or `bg-amber-500/20`
- **Border**: `border-yellow-500/30` or `border-amber-500/20`

## Component-Specific Patterns

### Buttons
- **Primary Button**: `bg-emerald-600 hover:bg-emerald-700 text-white`
- **Secondary Button**: `bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10`
- **Icon Button**: Same as above but with `p-2` or `px-2.5 py-1.5` padding

### Navigation Items
- **Active**: `bg-emerald-500/20 text-emerald-300 border border-emerald-500/30`
- **Inactive**: `text-gray-400 hover:text-emerald-300 hover:bg-emerald-500/10`

### Cards/Containers
- **Background**: `bg-white/5`
- **Border**: `border border-white/10`
- **Hover**: `hover:bg-white/10` (optional)

### Badges/Status Indicators
- Use status colors above with: `px-2 py-1 rounded-full text-xs font-medium`

## Opacity Guidelines

- **20% opacity** (`/20`): Active states, selected items, status backgrounds
- **10% opacity** (`/10`): Hover states, subtle backgrounds
- **30% opacity** (`/30`): Borders, stronger emphasis
- **50% opacity** (`/50`): Semi-transparent overlays
- **95% opacity** (`/95`): Almost opaque backgrounds (modals, tooltips)

## Important Notes

1. **Never use blue colors** - The project uses emerald/green as the primary color, not blue
2. **Always use opacity variants** - Colors should use opacity modifiers (`/10`, `/20`, `/30`) for backgrounds and borders
3. **Consistent hover states** - Hover states should transition to emerald colors when appropriate
4. **Dark theme only** - All colors are designed for dark theme (`bg-[#100f0a]` base)

## Quick Reference

```css
/* Primary Actions */
Primary Button: bg-emerald-600 hover:bg-emerald-700 text-white
Active Nav Item: bg-emerald-500/20 text-emerald-300 border-emerald-500/30
Hover State: hover:text-emerald-300 hover:bg-emerald-500/10

/* Text Hierarchy */
Primary: text-white
Secondary: text-gray-300
Tertiary: text-gray-400
Muted: text-gray-500

/* Backgrounds */
Page: bg-[#100f0a]
Card: bg-white/5
Modal: bg-gray-900/95

/* Borders */
Default: border-white/10
Hover: border-white/20
Active: border-emerald-500/30
```

