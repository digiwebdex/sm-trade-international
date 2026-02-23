

# Navbar Cleanup and Layout Adjustments

Three changes to the public navigation bar in `src/components/Navbar.tsx`:

---

## 1. Remove "Admin" Login Link from Navbar

The "Admin" link with the LogIn icon on the right side of Row 1 (desktop) will be removed entirely. The admin panel remains accessible by navigating directly to `/admin/login` -- it just won't be advertised in the public navbar. The mobile menu admin link (if any) will also be removed.

## 2. Make the Search Box Smaller but Flexible

Currently the search bar uses `flex-1` and fills all available space between the logo and the (soon-removed) Admin link. It will be updated to:
- Use `max-w-md` (max 28rem / ~448px) instead of unlimited flex growth
- Keep `flex-1` so it still adapts to available space on smaller screens
- Center it visually in the remaining space using `mx-auto`

This gives a compact, Google-style search bar that doesn't stretch across the entire row.

## 3. Right-Align Row 2 Navigation Links

The second row (nav links + Categories dropdown) currently sits left-aligned. It will be changed to `justify-end` so all menu items align to the right side of the container, matching common e-commerce navbar patterns.

---

## Technical Details

**File:** `src/components/Navbar.tsx`

Changes:
- **Lines 193-200**: Delete the Admin `<Link>` block entirely. Remove the `LogIn` icon from the import on line 2.
- **Lines 138-141**: Update the search `<form>` classes -- add `max-w-md mx-auto` to constrain width while keeping it centered and flexible.
- **Line 211**: Change the Row 2 flex container from `flex items-center gap-0` to `flex items-center gap-0 justify-end` to push nav links to the right.

No other files need changes. The `/admin/login` route and all admin functionality remain fully intact -- only the visible link in the public navbar is removed.

