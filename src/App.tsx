import { useMemo } from "react";
import { createNotebook, serialize, deserialize } from "./core/notebook";

export default function App() {
  const { json, roundTrips } = useMemo(() => {
    const doc = createNotebook("My first reactive notebook");
    const json = serialize(doc);
    const roundTrips = serialize(deserialize(json)) === json; // M0 "done when"
    return { json, roundTrips };
  }, []);

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 720 }}>
      <h1>Reactive notebook — M0</h1>
      <p>
        Cell model round-trips through JSON:{" "}
        <strong>{roundTrips ? "✅ yes" : "❌ no"}</strong>
      </p>
      <pre
        style={{
          background: "#111",
          color: "#eee",
          padding: 16,
          borderRadius: 8,
          overflow: "auto",
        }}
      >
        {json}
      </pre>
    </main>
  );
}
