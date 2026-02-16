

# Hero Section Enhancement Plan

The current hero has a solid foundation but can be made significantly more attractive with these visual upgrades:

## What Changes

### 1. Animated Gold Decorative Elements
- Add a thin animated gold line on the left side of the text content as a vertical accent bar
- Add a gold diamond/dot divider between subtitle and CTA buttons (matching the pattern used in other sections)

### 2. Bigger, Bolder Typography with Gold Accent
- Add a gold gradient highlight on a key word in the title (e.g., "Premium" or "Corporate") using `text-gradient`
- Increase heading size slightly on large screens (`xl:text-7xl`)

### 3. Floating Stats/Trust Badges
- Add a frosted-glass stats strip at the bottom of the hero showing key numbers (e.g., "500+ Clients", "10+ Years", "1000+ Products") with gold icons
- Uses `backdrop-blur` and semi-transparent background for a premium glassmorphism look

### 4. Subtle Parallax Shimmer Overlay
- Add a subtle animated shimmer/gradient overlay that slowly shifts across the hero for visual depth (using the existing `heroGradientShift` keyframe already defined in `index.css`)

### 5. Improved CTA Buttons
- Add a subtle pulse/glow animation to the primary gold CTA button to draw attention
- Add an arrow icon to the secondary button as well for visual balance

### 6. Bottom Fade Transition
- Add a smooth gradient fade at the bottom of the hero that transitions into the next section's background color, eliminating the hard edge

## Technical Details

### Files to modify:
- **`src/components/HeroSection.tsx`** -- All visual changes above
- **`src/index.css`** -- Add a `@keyframes shimmer` for the gold shimmer overlay and a subtle `pulse-gold` glow animation for the CTA button

### No new dependencies required. All changes use existing Tailwind utilities, CSS custom properties, and inline styles.

