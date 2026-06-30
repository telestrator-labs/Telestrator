import { useEffect, useState } from "react";
import { NotebookView } from "./editor/NotebookView";
import { AppSidebar } from "./chrome/AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { EditorTopBar, type NotebookLayout } from "./chrome/EditorTopBar";
import { TracePanel } from "./chrome/TracePanel";
import { ShareModal } from "./chrome/ShareModal";
import { Dashboard } from "./dashboard/Dashboard";
import {
  setPendingTemplate,
  clearPendingTemplate,
  type NotebookTemplate,
} from "./templates";
import {
  createNotebook,
  list,
  removeNotebook,
  subscribe,
  whenReady,
  type NotebookEntry,
} from "./editor/docIndex";
import "./editor/app.css";

// Subscribe to the document index (a dedicated Yjs doc in IndexedDB). Selection
// and the dashboard↔editor view are now explicit (no auto-create / auto-select):
// the dashboard is the landing screen and is where notebooks get created.
function useDocIndex() {
  const [docs, setDocs] = useState<NotebookEntry[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};
    void whenReady.then(() => {
      if (cancelled) return;
      setDocs(list());
      unsubscribe = subscribe(() => setDocs(list()));
      setReady(true);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
  return { ready, docs };
}

export default function App() {
  const { ready, docs } = useDocIndex();
  const [view, setView] = useState<"dashboard" | "editor">("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [layout, setLayout] = useState<NotebookLayout>("document");

  const openNotebook = (id: string) => {
    setSelectedId(id);
    setReading(false);
    setView("editor");
  };
  const createBlank = () => openNotebook(createNotebook().id);
  const createFromTemplate = (template: NotebookTemplate) => {
    const { id } = createNotebook(template.title);
    setPendingTemplate(id, template); // consumed by NotebookEditor's seed effect
    openNotebook(id);
  };
  const goHome = () => {
    setShareOpen(false);
    setView("dashboard");
  };
  const deleteNotebook = (id: string) => {
    clearPendingTemplate(id); // in case it never got seeded
    removeNotebook(id);
    if (selectedId === id) {
      setSelectedId(null);
      setView("dashboard");
    }
  };

  if (!ready) return <div className="app-loading">Loading…</div>;

  const selected = docs.find((d) => d.id === selectedId);
  const inEditor = view === "editor" && selected;

  return (
    <SidebarProvider className="bg-surface-sunken font-sans text-text">
      {!reading && (
        <AppSidebar
          docs={docs}
          selectedId={selectedId}
          onOpen={openNotebook}
          onNewBlank={createBlank}
          onHome={goHome}
        />
      )}
      <SidebarInset className="h-screen overflow-hidden">
        {inEditor ? (
          <>
            <EditorTopBar
              title={selected.title}
              reading={reading}
              onToggleReading={setReading}
              onHome={goHome}
              traceOpen={traceOpen}
              onToggleTrace={() => setTraceOpen((o) => !o)}
              onShare={() => setShareOpen(true)}
              layout={layout}
              onLayoutChange={setLayout}
            />
            <div className="flex min-h-0 flex-1">
              <div className="min-w-0 flex-1 overflow-auto">
                <NotebookView
                  key={selected.id}
                  reading={reading}
                  wide={layout === "studio"}
                  docId={selected.id}
                  title={selected.title}
                />
              </div>
              {traceOpen && !reading && <TracePanel />}
            </div>
          </>
        ) : (
          <>
            {/* Dashboard needs its own header so the sidebar trigger is always
                reachable (not only in the editor). */}
            <header className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-[26px] py-3">
              <SidebarTrigger className="-ml-1" />
              <span className="text-[13px] font-medium text-text">Home</span>
            </header>
            <div className="min-h-0 flex-1 overflow-auto">
              <Dashboard
                docs={docs}
                onOpen={openNotebook}
                onCreateBlank={createBlank}
                onCreateFromTemplate={createFromTemplate}
                onDelete={deleteNotebook}
              />
            </div>
          </>
        )}
      </SidebarInset>
      {shareOpen && selected && (
        <ShareModal
          title={selected.title}
          onClose={() => setShareOpen(false)}
        />
      )}
    </SidebarProvider>
  );
}
