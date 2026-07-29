"use client";

import { useState } from "react";

export default function ControlliPage() {
  const [fileName, setFileName] = useState("");

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      setFileName(file.name);
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">📋 Controlli Mezzi</h1>

      <p className="mt-2 text-gray-600">
        Importa il file Excel esportato da Microsoft Teams.
      </p>

      <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <p className="text-lg font-medium">
          Trascina qui il file Excel
        </p>

        <p className="mt-2 text-sm text-gray-500">
          oppure selezionalo dal computer
        </p>

        <label className="mt-6 inline-block cursor-pointer rounded bg-pink-600 px-6 py-2 text-white">
          Seleziona file

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {fileName && (
          <p className="mt-4 font-medium text-green-600">
            File selezionato: {fileName}
          </p>
        )}
      </div>
    </main>
  );
}
