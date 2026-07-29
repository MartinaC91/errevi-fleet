export default function ControlliPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">📋 Controlli Mezzi</h1>

      <p className="mt-2 text-gray-600">
        Importa il file Excel esportato da Microsoft Teams.
      </p>

      <div className="mt-8 rounded-lg border-2 border-dashed p-12 text-center">
        <p className="text-lg font-medium">
          Trascina qui il file Excel
        </p>

        <p className="mt-2 text-sm text-gray-500">
          oppure selezionalo dal computer
        </p>

        <button className="mt-6 rounded bg-pink-600 px-6 py-2 text-white">
          Seleziona file
        </button>
      </div>
    </main>
  );
}
