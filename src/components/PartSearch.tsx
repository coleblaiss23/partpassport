"use client";

import React, { useState } from "react";

export default function PartSearch() {
  const [query, setQuery] = useState("");

  return (
    <div className="w-full max-w-md space-y-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search part number or serial..."
        className="w-full px-4 py-2 border rounded-md"
      />
    </div>
  );
}
