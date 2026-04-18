import React, { useState } from "react";

export default function ExpandableText({ text, limit = 120 }) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const isLong = text.length > limit;
  const displayText = expanded ? text : text.slice(0, limit);

  return (
    <p className="text-base sm:text-lg text-gray-800 whitespace-pre-wrap">
      {displayText}
      {isLong && !expanded && (
        <>
          ...{" "}
          <button
            onClick={() => setExpanded(true)}
            className="text-blue-600 font-semibold hover:underline"
          >
            more
          </button>
        </>
      )}
      {isLong && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="ml-2 text-blue-600 font-semibold hover:underline"
        >
          show less
        </button>
      )}
    </p>
  );
}