// Sanctuary lives at app/sanctuary.tsx (root-level fullScreenModal).
// Deep-links that land on /(tabs)/sanctuary render the workspace in-place
// instead of redirecting — a redirect to "/sanctuary" from inside the tabs
// navigator resolves back to this same file, causing an infinite loop.
export { default } from '../sanctuary';
