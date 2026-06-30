import { createContext, useContext } from "react";

// Whether the notebook is in reading mode (chrome stripped, cells collapsed to
// their output). Provided by NotebookView from App-level state; consumed by the
// cell NodeViews. Defaults to false (edit mode).
export const ReadingModeContext = createContext(false);

export const useReadingMode = (): boolean => useContext(ReadingModeContext);
