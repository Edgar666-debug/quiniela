const config = {
  deadCode: false,
  rules: {
    // Next.js App Router: page.tsx / route.ts / colocated clients are entry points the graph misses.
    "deslop/unused-file": "off",
    "react-doctor/nextjs-missing-metadata": "off",
  },
};

export default config;
