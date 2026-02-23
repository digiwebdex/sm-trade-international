

# Add Sample Products to Hero Carousel

## Problem
The hero carousel appears empty or shows a loading spinner because product images from the database take time to load, and the carousel doesn't display anything until the query resolves.

## Solution
Make the carousel **always show fallback products immediately** while the DB query loads in the background, and ensure the fallback items use reliable local images that render instantly.

## Changes

### File: `src/components/HeroSection.tsx`

1. **Use fallback items as initial display** -- Change the `carouselItems` logic so it starts with the 8 local fallback products instantly, then swaps to DB products once loaded. This eliminates the empty state.

2. **Add `initialData` to the query** -- Provide the fallback items as `initialData` so React Query treats them as available from the start, preventing any flash of empty content.

3. **Ensure carousel renders even during loading** -- Remove the dependency on `dbProducts` having 4+ items before showing the carousel. Always render the fallback items first.

---

## Technical Details

- In the `useQuery` call, add `initialData` returning an empty array and keep `placeholderData` for seamless transitions
- Change the `carouselItems` logic: if `dbProducts` has 4+ items, use those; otherwise use the existing 8-item `fallbackItems` array (already defined with local imports)
- The 8 fallback products (Crystal Awards, Premium Ties, Custom Glassware, Gift Sets, Premium Souvenirs, Model Replicas, Tunnel Souvenirs, Executive Pens) will display instantly on every page load, then seamlessly swap to DB products once fetched
- No new files or dependencies needed -- single file change to `src/components/HeroSection.tsx`

